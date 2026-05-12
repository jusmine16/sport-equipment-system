import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

export function createdResponse<T>(
  data: T,
  message = 'Created successfully'
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201);
}

export function unauthorizedResponse(
  message = 'Unauthorized'
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(
  message = 'Forbidden'
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 403);
}

export function notFoundResponse(
  message = 'Not found'
): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 404);
}

export function validationErrorResponse(
  errors: Record<string, string>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation error',
      data: errors,
    },
    { status: 400 }
  );
}
