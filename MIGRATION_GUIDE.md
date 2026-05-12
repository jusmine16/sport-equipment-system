# Migration Guide: Django → Next.js

## Overview

The backend has been completely converted from Django REST Framework to Next.js API routes. All frontend code needs to be updated to use local API routes instead of a separate Django server.

## Environment Variables Changes

### Before (Django):
```bash
# Backend was on a separate port
DJANGO_API_URL=http://localhost:8000
```

### After (Next.js):
```bash
# API is now local
NEXT_PUBLIC_API_URL=http://localhost:3000
# or for production
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

## API Endpoint Changes

### Base URL
```javascript
// Before
const API_URL = 'http://localhost:8000/api';

// After
const API_URL = '/api';
```

### Authentication

The authentication flow remains similar:

```javascript
// Before: Using Django JWT
const loginResponse = await fetch('http://localhost:8000/api/login/', {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});

// After: Using Next.js API (token auto-set in cookie)
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});
```

### Equipment Endpoints

```javascript
// Before
GET /api/equipment/
GET /api/equipment/1/
POST /api/equipment/
PUT /api/equipment/1/
DELETE /api/equipment/1/

// After (same structure, local path)
GET /api/equipment
GET /api/equipment/1
POST /api/equipment
PUT /api/equipment/1
DELETE /api/equipment/1
```

### Borrow Requests

```javascript
// Before
GET /api/borrow/
POST /api/borrow/
PUT /api/borrow/1/approve/
PUT /api/borrow/1/reject/

// After
GET /api/borrow
POST /api/borrow
PUT /api/borrow/1 (with action in body)
PUT /api/borrow/1 (with action in body)
```

Approve/Reject now use a single endpoint with action in body:

```javascript
// Old Django way
PUT /api/borrow/1/approve/ { notes: "..." }

// New Next.js way
PUT /api/borrow/1
{
  "action": "approve",
  "notes": "..."
}
```

### Return Equipment

```javascript
// Before
POST /api/return/

// After (same)
POST /api/return
```

## Updated fetch() Examples

### Update lib/api.ts

```typescript
// Before
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const response = await fetch(`${baseURL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  return response.json();
}

// After (simplified since API is local)
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    credentials: 'include', // Important: for cookie-based auth
  });
  return response.json();
}
```

### Login Example

```typescript
// Before
async function login(username: string, password: string) {
  const data = await apiCall<LoginResponse>('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem('access_token', data.access);
  return data;
}

// After (cookies handle token automatically)
async function login(username: string, password: string) {
  const data = await apiCall<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
  // No need to manually store token - it's in HTTP-only cookie
  return data;
}
```

### Get Current User

```typescript
// Before
async function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  const data = await apiCall<User>('/user/', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return data;
}

// After (token automatically sent via cookie)
async function getCurrentUser() {
  const data = await apiCall<User>('/auth/user', {
    credentials: 'include',
  });
  return data;
}
```

### Create Borrow Request

```typescript
// Before
async function createBorrowRequest(items) {
  return apiCall('/borrow/', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// After (same structure, just different endpoint)
async function createBorrowRequest(items) {
  return apiCall('/borrow', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
```

### Approve Borrow Request

```typescript
// Before
async function approveBorrow(id: number, notes?: string) {
  return apiCall(`/borrow/${id}/approve/`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
}

// After (uses action in body)
async function approveBorrow(id: number, notes?: string) {
  return apiCall(`/borrow/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'approve', notes }),
  });
}
```

### Reject Borrow Request

```typescript
// Before
async function rejectBorrow(id: number, notes?: string) {
  return apiCall(`/borrow/${id}/reject/`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
}

// After (uses action in body)
async function rejectBorrow(id: number, notes?: string) {
  return apiCall(`/borrow/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'reject', notes }),
  });
}
```

## Updated lib/api.ts Template

Here's a complete updated API client:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      credentials: 'include', // For cookie-based auth
    });

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: 'API request failed',
    };
  }
}

// Auth
export const authApi = {
  register: (data) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (username: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getUser: () => apiCall('/auth/user'),
};

// Equipment
export const equipmentApi = {
  list: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/equipment${query ? '?' + query : ''}`);
  },
  get: (id: number) => apiCall(`/equipment/${id}`),
  create: (data) => apiCall('/equipment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data) => apiCall(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/equipment/${id}`, {
    method: 'DELETE',
  }),
};

// Borrow Requests
export const borrowApi = {
  list: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/borrow${query ? '?' + query : ''}`);
  },
  get: (id: number) => apiCall(`/borrow/${id}`),
  create: (items) => apiCall('/borrow', {
    method: 'POST',
    body: JSON.stringify({ items }),
  }),
  approve: (id: number, notes?: string) => apiCall(`/borrow/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'approve', notes }),
  }),
  reject: (id: number, notes?: string) => apiCall(`/borrow/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'reject', notes }),
  }),
};

// Returns
export const returnApi = {
  returnEquipment: (transactionId: number, conditionOnReturn: string) =>
    apiCall('/return', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: transactionId,
        condition_on_return: conditionOnReturn,
      }),
    }),
};

// Transactions
export const transactionApi = {
  list: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/transactions${query ? '?' + query : ''}`);
  },
};

// Reports
export const reportsApi = {
  getReports: () => apiCall('/reports'),
};
```

## Context/Hook Updates

If using AuthContext, update it:

```typescript
// Before: Stored token in localStorage
async function login(username: string, password: string) {
  const response = await apiCall('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (response.data?.access) {
    localStorage.setItem('token', response.data.access);
    setUser(response.data.user);
  }
}

// After: Token in cookie, cleaner flow
async function login(username: string, password: string) {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (response.success && response.data?.user) {
    setUser(response.data.user);
  }
}
```

## Database/Migrations

- No more Django migrations
- Use Prisma migrations instead: `npx prisma migrate dev`
- Schema is in `prisma/schema.prisma`

## No More Django Server

You no longer need to run the Django development server:

```bash
# OLD: Run Django server on 8000
python manage.py runserver

# NEW: Run just Next.js
npm run dev
```

## Deployment Changes

- Deploy the entire `frontend` project as your main application
- No need to deploy Django separately
- Environment variables go in `.env.local`
- Supabase connection string is same as before

## Backwards Compatibility

If you need to keep Django running temporarily for data migration:

```bash
# Run both during transition
npm run dev  # Terminal 1: Next.js on 3000
python manage.py runserver  # Terminal 2: Django on 8000
```

Then migrate data, test, and switch to Next.js-only deployment.

---

## Checklist for Migration

- [ ] Update all `fetch()` calls to use `/api` instead of external URL
- [ ] Remove localStorage token handling (use cookies)
- [ ] Update AuthContext to work with cookie-based auth
- [ ] Update form submissions to match new API response format
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Test filtering and search
- [ ] Update any hardcoded API URLs in environment files
- [ ] Remove Django-related dependencies from frontend
- [ ] Update CI/CD pipelines to deploy only Next.js

---

For detailed API documentation, see `API_DOCUMENTATION.md`
