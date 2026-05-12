# Sports Equipment Borrowing System - Implementation Guide

## System Overview

This document outlines the complete implementation of the Sports Equipment Borrowing System with all modules, database schema, API endpoints, and frontend components.

## Architecture

- **Backend**: Django REST Framework (Python)
- **Frontend**: Next.js with TypeScript (React)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
Sport Equipment Borrowing System/
├── api/                           # Django backend
│   ├── models.py                 # Database models
│   ├── serializers.py            # API serializers
│   ├── views.py                  # API views/endpoints
│   ├── permissions.py            # Custom permissions
│   ├── urls.py                   # API routing
│   ├── signals.py                # Django signals
│   └── migrations/               # Database migrations
├── frontend/                      # Next.js frontend
│   ├── src/
│   │   ├── app/                  # Pages
│   │   │   ├── dashboard/
│   │   │   ├── equipment/
│   │   │   ├── borrow/
│   │   │   ├── return/
│   │   │   └── transactions/
│   │   ├── components/
│   │   │   ├── BorrowingChecklistForm.tsx
│   │   │   ├── ReturnChecklistForm.tsx
│   │   │   └── Notification.tsx
│   │   ├── lib/                  # Utilities
│   │   └── contexts/             # Context providers
│   └── prisma/                   # Database schema
├── static/                        # Static files
└── db.sqlite3                     # SQLite database
```

---

## Database Schema

### Users & Authentication
- **profiles**: User roles and metadata
  - Roles: admin, staff, user

### Equipment Management
- **equipment**: Available sports equipment
  - Fields: equipment_code, equipment_name, category, total_quantity, available_quantity, condition_status, remarks

### Borrower Management
- **borrowers**: Borrower information
  - Fields: borrower_name, id_number, department_course, contact_number

### Transaction Management
- **borrow_transactions**: Borrowing records
  - Fields: borrower_id, equipment_id, quantity_borrowed, purpose, borrow_date, expected_return_date, status, condition_before, remarks_before, agreement_accepted, approved_by, checked_by

- **return_transactions**: Return records
  - Fields: borrow_transaction_id, return_date, returned_quantity, condition_after, remarks_after, is_late, penalty_amount, final_status, checked_by

- **condition_logs**: Equipment condition history
  - Fields: equipment_id, transaction_type, condition_status, notes, checked_by

---

## API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - JWT login
- `POST /api/token/refresh/` - Refresh JWT token
- `GET /api/user/` - Get current user profile

### Equipment Management (Admin/Staff)
- `GET /api/equipment/` - List all equipment
- `POST /api/equipment/` - Create equipment
- `GET /api/equipment/{id}/` - Get equipment details
- `PUT /api/equipment/{id}/` - Update equipment
- `DELETE /api/equipment/{id}/` - Delete equipment
- `POST /api/equipment/{id}/update_quantity/` - Update equipment quantity

### Borrower Management (Staff)
- `GET /api/borrowers/` - List all borrowers
- `POST /api/borrowers/` - Create borrower
- `GET /api/borrowers/{id}/` - Get borrower details
- `PUT /api/borrowers/{id}/` - Update borrower
- `DELETE /api/borrowers/{id}/` - Delete borrower
- `GET /api/borrowers/{id}/borrow_history/` - Get borrower's borrow history

### Borrow Transactions (Staff)
- `GET /api/borrow-transactions/` - List all borrowings
- `POST /api/borrow-transactions/` - Create borrowing
- `GET /api/borrow-transactions/{id}/` - Get borrowing details
- `PUT /api/borrow-transactions/{id}/` - Update borrowing
- `POST /api/borrow-transactions/{id}/approve/` - Approve borrowing (Admin)
- `POST /api/borrow-transactions/{id}/confirm_borrowed/` - Confirm borrowed (Staff)

### Return Transactions (Staff)
- `GET /api/return-transactions/` - List all returns
- `POST /api/return-transactions/` - Create return
- `GET /api/return-transactions/{id}/` - Get return details
- `GET /api/return-transactions/overdue_items/` - List overdue items

### Condition Logs (Staff)
- `GET /api/condition-logs/` - List all condition logs
- `GET /api/condition-logs/by_equipment/` - Get logs for specific equipment

### Dashboard & Reports (Staff)
- `GET /api/dashboard/stats/` - Get dashboard statistics
- `GET /api/reports/overdue/` - Get overdue report
- `GET /api/reports/damaged/` - Get damaged items report
- `GET /api/reports/summary/` - Get borrowing summary

---

## Frontend Pages

### Authentication Pages
- `/login` - User login
- `/register` - User registration

### Dashboard
- `/dashboard` - Main dashboard with statistics

### Equipment Management
- `/equipment` - List all equipment
- `/equipment/add` - Add new equipment
- `/equipment/{id}/edit` - Edit equipment

### Borrowing
- `/borrow` - Create new borrow request (contains checklist form)
- `/transactions` - View all borrow transactions

### Returns
- `/return` - Process equipment return (contains return checklist form)

---

## Key Features

### 1. Equipment Management
- Add, edit, delete sports equipment
- Track total and available quantities
- Monitor equipment condition
- Categorize equipment by type

### 2. Borrower Management
- Register and manage borrowers
- Store borrower information (name, ID, department, contact)
- View borrowing history

### 3. Borrowing Process
- Create borrow requests with checklist
- Record equipment condition before borrowing
- Track borrow dates and expected return dates
- Accept borrower agreements
- Admin approval required
- Automatic stock deduction

### 4. Return Process
- Process equipment returns with checklist
- Record condition after borrowing
- Detect late returns automatically
- Calculate penalties based on days late
- Update available stock
- Log condition changes

### 5. Condition Tracking
- Log equipment condition at borrow and return
- Track maintenance status
- Identify damaged or lost items

### 6. Reporting & Analytics
- Dashboard with key statistics
- Overdue items report
- Damaged/lost items report
- Borrowing summary by equipment and borrower
- System health metrics (completion rate, damage rate, loss rate)

---

## Business Logic

### Status Workflow
```
Pending → Approved → Borrowed → Returned (or Damaged/Lost)
                              → Overdue
                              → Cancelled
```

### Penalty Calculation
- 1 day late: ₱20
- 2-3 days late: ₱50
- 4+ days late: ₱100
- Damaged item: Custom fee (determined during return)
- Lost item: Replacement cost

### Stock Management
- Available quantity decreases when item is borrowed
- Available quantity increases when item is returned
- Cannot borrow more than available quantity
- Cannot return more than borrowed quantity

---

## User Roles & Permissions

### Admin
- Manage all equipment
- Manage all borrowers
- Create and approve borrow transactions
- Process returns
- View all reports
- Manage other users

### Staff
- View all equipment
- Manage borrowers
- Create and process borrow transactions
- Process returns
- View all reports

### User
- View own borrow history
- Create borrow requests (if enabled)
- View own information

---

## Validation Rules

1. Cannot borrow more than available quantity
2. Cannot return more than borrowed quantity
3. Borrow date must be valid
4. Expected return date must be after borrow date
5. Borrower agreement must be accepted
6. Required fields must be completed
7. Duplicate equipment codes not allowed
8. Duplicate borrower ID numbers not allowed

---

## Setup Instructions

### 1. Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Admin User
```bash
python manage.py create_admin
```

### 3. Run Django Server
```bash
python manage.py runserver
```

### 4. Run Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Initialize Supabase (if using Supabase instead of SQLite)
Run the SQL schema from `frontend/supabase/schema.sql` in Supabase SQL Editor

---

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=your-database-url
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_JWT_TOKEN=your-jwt-token
```

---

## Integration with Supabase

The system supports Supabase with the following features:
- RLS (Row Level Security) for data isolation
- Real-time updates for borrowing status
- Automatic backups
- Scalable infrastructure

---

## Testing

### Key Test Cases

**Borrowing Flow**:
1. Create borrower
2. Create borrow transaction with equipment
3. Verify available quantity decreased
4. Create return transaction
5. Verify available quantity increased

**Penalty Calculation**:
1. Create borrow transaction
2. Return after expected date
3. Verify penalty amount calculated correctly

**Permission Testing**:
1. Admin can approve borrowings
2. Staff can process returns
3. User cannot delete equipment

---

## Troubleshooting

### Migrations Won't Apply
- Drop all tables: `python manage.py flush`
- Re-run migrations: `python manage.py migrate`

### CORS Issues
- Update `CORS_ALLOWED_ORIGINS` in Django settings
- Ensure frontend URL is whitelisted

### Authentication Issues
- Check JWT token expiration
- Refresh token if endpoint returns 401

---

## Future Enhancements

1. Email notifications for overdue returns
2. SMS alerts for borrowers
3. QR code scanning for equipment
4. Automated penalty payment processing
5. Equipment maintenance scheduling
6. Mobile app for borrowing
7. AI-based demand forecasting
