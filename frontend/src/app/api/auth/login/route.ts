import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';
import { loginSchema } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@seb.local';
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.flatten().fieldErrors as Record<string, string>
      );
    }

    const { identifier, password } = validation.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse('Supabase configuration is missing', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve identifier to email for Supabase password auth.
    let email = identifier;
    if (!identifier.includes('@')) {
      const profileByUsername = await prisma.profile.findUnique({ where: { username: identifier } });
      if (!profileByUsername?.email) {
        return errorResponse('Invalid credentials', 401);
      }
      email = profileByUsername.email;
    }

    const signInResult = await supabase.auth.signInWithPassword({ email, password });
    if (signInResult.error || !signInResult.data.user) {
      return errorResponse('Invalid credentials', 401);
    }

    const authUser = signInResult.data.user;

    const metadataDisplayName = (authUser.user_metadata?.display_name as string | undefined)?.trim()
      || (authUser.user_metadata?.name as string | undefined)?.trim()
      || (authUser.user_metadata?.full_name as string | undefined)?.trim();
    const fallbackUsername = metadataDisplayName
      || (authUser.user_metadata?.username as string | undefined)?.trim()
      || authUser.email?.split('@')[0]
      || 'user';
    const emailForProfile = authUser.email || email;

    let user = await prisma.profile.findFirst({
      where: {
        OR: [
          { id: authUser.id },
          { email: emailForProfile },
          { username: fallbackUsername },
        ],
      },
    });

    // Local dev bootstrap: first admin login can create local admin profile mirror.
    if (!user && (identifier === DEFAULT_ADMIN_EMAIL || identifier === DEFAULT_ADMIN_USERNAME)) {
      user = await prisma.profile.create({
        data: {
          id: authUser.id,
          username: DEFAULT_ADMIN_USERNAME,
          email: authUser.email || DEFAULT_ADMIN_EMAIL,
          password: 'supabase-managed',
          role: 'admin',
        },
      });
    }

    if (!user) {
      user = await prisma.profile.create({
        data: {
          id: authUser.id,
          username: fallbackUsername,
          email: emailForProfile,
          password: 'supabase-managed',
          role: 'user',
        },
      });
    } else {
      const shouldSyncProfile =
        user.id !== authUser.id ||
        user.email !== emailForProfile ||
        user.username !== fallbackUsername;

      if (shouldSyncProfile) {
        try {
          user = await prisma.profile.update({
            where: { id: user.id },
            data: {
              id: authUser.id,
              username: fallbackUsername,
              email: emailForProfile,
              role: user.role || 'user',
              password: user.password || 'supabase-managed',
            },
          });
        } catch (syncError) {
          console.warn('Local profile sync failed during login:', syncError);
        }
      }
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Best-effort mirror into Supabase public.profiles table used by dashboard tables.
    const { error: profileMirrorError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      { onConflict: 'id' }
    );
    if (profileMirrorError) {
      console.warn('Profile mirror to public.profiles failed:', profileMirrorError.message);
    }

    // Set auth token in cookies
    const response = successResponse(
      {
        access: token,
        refresh: token, // In production, implement separate refresh tokens
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
      'Login successful'
    );

    // Set cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
