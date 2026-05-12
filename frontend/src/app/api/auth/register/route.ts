import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { registerSchema } from '@/lib/validation';
import { isCompromisedPassword } from '@/lib/password-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.flatten().fieldErrors as Record<string, string>
      );
    }

    const { username, email, password, first_name, last_name } = validation.data;

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    // Check if username or email already exists
    const existingUser = await prisma.profile.findUnique({
      where: { username },
    });
    if (existingUser) {
      return errorResponse('Username already taken', 400);
    }

    const existingEmail = await prisma.profile.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return errorResponse('Email already in use', 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse('Supabase configuration is missing', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      const compromised = await isCompromisedPassword(password);
      if (compromised) {
        return errorResponse(
          'This password has appeared in a data breach. Please choose a different, stronger password.',
          400
        );
      }
    } catch (hibpError) {
      console.warn('HIBP password check unavailable:', hibpError);
    }

    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: `${first_name || username}${last_name ? ` ${last_name}` : ''}`.trim(),
          name: `${first_name || username}${last_name ? ` ${last_name}` : ''}`.trim(),
          first_name: first_name || null,
          last_name: last_name || null,
        },
      },
    });

    if (signUpResult.error) {
      return errorResponse(signUpResult.error.message, 400);
    }

    if (!signUpResult.data.user) {
      return errorResponse('Supabase did not return a user record', 500);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Keep a local profile mirror so existing app APIs continue to work.
    const profile = await prisma.profile.create({
      data: {
        id: signUpResult.data.user.id,
        username,
        email,
        password: hashedPassword,
        role: 'user',
      },
    });

    return createdResponse(
      {
        user_id: profile.id,
        username: profile.username,
        message: 'User registered successfully',
      },
      'User registered successfully'
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Internal server error', 500);
  }
}
