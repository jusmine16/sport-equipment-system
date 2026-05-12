# Sport Equipment Borrowing System - Next.js API Documentation

## Overview

The Django backend has been fully converted to a Next.js application with API routes. This document provides complete API documentation and setup instructions.

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@your-supabase-host/postgres?sslmode=require"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Setup Supabase Database

Ensure your Supabase database has the schema by running the SQL migration in `supabase/schema.sql`:

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run"

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication

#### Register User
- **Endpoint:** `POST /api/auth/register`
- **Auth:** None
- **Body:**
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "user_id": "user_123",
      "username": "john_doe",
      "message": "User registered successfully"
    },
    "message": "User registered successfully"
  }
  ```

#### Login
- **Endpoint:** `POST /api/auth/login`
- **Auth:** None
- **Body:**
  ```json
  {
    "username": "john_doe",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "access": "jwt_token",
      "refresh": "jwt_token",
      "user": {
        "id": "user_123",
        "username": "john_doe",
        "role": "user"
      }
    },
    "message": "Login successful"
  }
  ```
- **Note:** Auth token is set in HTTP-only cookie automatically

#### Get Current User Profile
- **Endpoint:** `GET /api/auth/user`
- **Auth:** Bearer Token
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "user_123",
      "username": "john_doe",
      "role": "user"
    }
  }
  ```

---

### Equipment Management

#### List Equipment (with filtering & search)
- **Endpoint:** `GET /api/equipment`
- **Auth:** Bearer Token (required)
- **Query Parameters:**
  - `search` (optional): Search by name or description
  - `category` (optional): Filter by category (balls, rackets, protective, fitness, other)
  - `status` (optional): Filter by status (available, maintenance, retired)
- **Example:** `GET /api/equipment?search=basketball&category=balls`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Basketball",
        "category": "balls",
        "quantity": 10,
        "availableQuantity": 8,
        "condition": "good",
        "status": "available",
        "description": "Official size basketball",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

#### Get Equipment Details
- **Endpoint:** `GET /api/equipment/:id`
- **Auth:** Bearer Token (required)
- **Response:** Single equipment object

#### Create Equipment
- **Endpoint:** `POST /api/equipment`
- **Auth:** Bearer Token (Admin required)
- **Body:**
  ```json
  {
    "name": "Tennis Racket",
    "category": "rackets",
    "quantity": 5,
    "condition": "new",
    "status": "available",
    "description": "Professional tennis racket"
  }
  ```
- **Response:** Created equipment object with 201 status

#### Update Equipment
- **Endpoint:** `PUT /api/equipment/:id`
- **Auth:** Bearer Token (Admin required)
- **Body:** (All fields optional)
  ```json
  {
    "quantity": 10,
    "condition": "good",
    "status": "maintenance"
  }
  ```
- **Response:** Updated equipment object

#### Delete Equipment
- **Endpoint:** `DELETE /api/equipment/:id`
- **Auth:** Bearer Token (Admin required)
- **Response:**
  ```json
  {
    "success": true,
    "data": { "id": 1 },
    "message": "Equipment deleted successfully"
  }
  ```

---

### Borrow Requests

#### Create Borrow Request
- **Endpoint:** `POST /api/borrow`
- **Auth:** Bearer Token (required, for authenticated users)
- **Body:**
  ```json
  {
    "items": [
      {
        "equipment": 1,
        "quantity": 2
      },
      {
        "equipment": 2,
        "quantity": 1
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": 5,
      "userId": "user_123",
      "status": "pending",
      "requestDate": "2024-01-15T10:30:00Z",
      "processedDate": null,
      "notes": null,
      "items": [
        {
          "id": 1,
          "equipment": 1,
          "equipmentName": "Basketball",
          "quantity": 2
        }
      ]
    },
    "message": "Borrow request created successfully"
  }
  ```

#### List Borrow Requests
- **Endpoint:** `GET /api/borrow`
- **Auth:** Bearer Token (required)
- **Query Parameters:**
  - `status` (optional): Filter by status (pending, approved, rejected)
- **Note:** Non-admin users see only their own requests; admins see all
- **Response:** Array of borrow request objects

#### Get Borrow Request Details
- **Endpoint:** `GET /api/borrow/:id`
- **Auth:** Bearer Token (required)
- **Response:** Single borrow request object with full details

#### Approve Borrow Request
- **Endpoint:** `PUT /api/borrow/:id`
- **Auth:** Bearer Token (Admin required)
- **Body:**
  ```json
  {
    "action": "approve",
    "notes": "Approved - ready for pickup"
  }
  ```
- **Response:** Updated borrow request with status "approved"
- **Side Effects:** Creates transactions, reduces available equipment quantities

#### Reject Borrow Request
- **Endpoint:** `PUT /api/borrow/:id`
- **Auth:** Bearer Token (Admin required)
- **Body:**
  ```json
  {
    "action": "reject",
    "notes": "Insufficient stock"
  }
  ```
- **Response:** Updated borrow request with status "rejected"

---

### Equipment Returns

#### Return Equipment
- **Endpoint:** `POST /api/return`
- **Auth:** Bearer Token (required)
- **Body:**
  ```json
  {
    "transaction_id": 10,
    "condition_on_return": "good"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": 10,
      "userId": "user_123",
      "equipmentId": 1,
      "quantity": 2,
      "borrowDate": "2024-01-15T10:30:00Z",
      "returnDate": "2024-01-20T14:00:00Z",
      "conditionOnReturn": "good"
    },
    "message": "Equipment returned successfully"
  }
  ```
- **Side Effects:** Increases available equipment quantity

---

### Transactions

#### List Transactions
- **Endpoint:** `GET /api/transactions`
- **Auth:** Bearer Token (required)
- **Query Parameters:**
  - `active` (optional): Set to "true" to see only active (non-returned) transactions
  - `returned` (optional): Set to "true" to see only returned transactions
- **Note:** Non-admin users see only their own transactions
- **Response:** Array of transaction objects

---

### Reports & Analytics

#### Get System Reports
- **Endpoint:** `GET /api/reports`
- **Auth:** Bearer Token (Admin required)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "equipment": {
        "total": 15,
        "totalQuantity": 50,
        "availableQuantity": 42,
        "categoryBreakdown": [
          {
            "category": "balls",
            "count": 5,
            "_sum": {
              "quantity": 20,
              "availableQuantity": 18
            }
          }
        ]
      },
      "borrowing": {
        "totalBorrowed": 8,
        "totalReturned": 42
      },
      "requests": {
        "pending": 3,
        "approved": 15,
        "rejected": 2
      },
      "users": {
        "total": 24
      }
    }
  }
  ```

---

## Authentication

### Token-Based Authentication

The API uses JWT tokens for authentication. After login:

1. Token is returned in the response
2. Token is automatically set in an HTTP-only cookie
3. Include token in `Authorization: Bearer <token>` header for subsequent requests

Example:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:3000/api/user
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing or invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Internal Server Error

### Validation Errors

```json
{
  "success": false,
  "error": "Validation error",
  "data": {
    "username": "Username must be at least 3 characters",
    "email": "Invalid email address"
  }
}
```

---

## Database Schema

### Models

1. **Profile** - User profile with role
2. **Equipment** - Sport equipment inventory
3. **BorrowRequest** - User requests to borrow items
4. **BorrowItem** - Specific items in a borrow request
5. **Transaction** - Loan/return records

See `prisma/schema.prisma` for full schema details.

---

## Development

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# View database explorer
npx prisma studio

# Create migration (after schema changes)
npx prisma migrate dev --name description_of_changes

# Apply pending migrations
npx prisma migrate deploy
```

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
npm start
```

---

## Migration from Django

The following Django components have been migrated:

| Django | Next.js |
|--------|---------|
| User/UserProfile Models | Prisma Profile Model |
| Equipment Model | Prisma Equipment Model |
| BorrowRequest/BorrowItem Models | Prisma BorrowRequest/BorrowItem Models |
| Transaction Model | Prisma Transaction Model |
| Auth Views | `/api/auth/*` Routes |
| EquipmentViewSet | `/api/equipment*` Routes |
| BorrowRequestViewSet | `/api/borrow*` Routes |
| ReturnEquipmentView | `/api/return` Route |
| TransactionListView | `/api/transactions` Route |
| ReportsView | `/api/reports` Route |

---

## Notes

- The Django backend is no longer needed; all functionality is in Next.js
- Database migrations should be managed via Prisma, not Django
- Frontend can now call local API routes instead of a separate backend server
- Consider implementing rate limiting in production
- Ensure `JWT_SECRET` is changed in production environment

---

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
