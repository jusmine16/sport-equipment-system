import { NextRequest } from 'next/server';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const headerToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const user = await getCurrentUser(headerToken ?? undefined);

    if (!user) {
      return unauthorizedResponse('Not authenticated');
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.userId },
    });

    if (!profile) {
      return successResponse({
        id: user.userId,
        username: user.username,
        role: user.role,
      });
    }

    return successResponse({
      id: profile.id,
      username: profile.username,
      role: profile.role,
    });
  } catch (error) {
    console.error('User profile error:', error);
    return unauthorizedResponse('Internal server error');
  }
}
