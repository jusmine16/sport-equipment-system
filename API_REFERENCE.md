# API Quick Reference Guide

## Base URL
```
http://localhost:8000/api
```

## Authentication

All endpoints except `/register/` and `/login/` require an Authorization header with a JWT token:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Summary

### 1. Authentication

#### Register a new user
```http
POST /register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepass123"
}

Response: { "access": "...", "refresh": "..." }
```

#### Get Current User Profile
```http
GET /user/
Authorization: Bearer <token>
```

---

### 2. Equipment Management

#### List Equipment
```http
GET /equipment/
GET /equipment/?category=Balls
GET /equipment/?search=Basketball

Query Parameters:
  - category: Filter by category
  - search: Search by name or code
  - page: Pagination
```

#### Create Equipment (Admin Only)
```http
POST /equipment/
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "equipment_code": "BAS001",
  "equipment_name": "Basketball",
  "category": "Balls",
  "total_quantity": 10,
  "available_quantity": 10,
  "condition_status": "Good",
  "remarks": "New stock"
}
```

#### Get Equipment Details
```http
GET /equipment/{id}/
```

#### Update Equipment (Admin Only)
```http
PUT /equipment/{id}/
Authorization: Bearer <admin-token>
Content-Type: application/json
```

#### Update Equipment Quantity (Admin Only)
```http
POST /equipment/{id}/update_quantity/
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "total_quantity": 15
}
```

#### Delete Equipment (Admin Only)
```http
DELETE /equipment/{id}/
Authorization: Bearer <admin-token>
```

---

### 3. Borrower Management

#### List Borrowers
```http
GET /borrowers/
Authorization: Bearer <staff-token>

Query Parameters:
  - search: Search by name or ID number
```

#### Create Borrower (Staff Only)
```http
POST /borrowers/
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "borrower_name": "Juan Dela Cruz",
  "id_number": "2024001",
  "department_course": "BS Computer Science",
  "contact_number": "09171234567"
}
```

#### Get Borrower Details
```http
GET /borrowers/{id}/
```

#### Get Borrower History
```http
GET /borrowers/{id}/borrow_history/
```

#### Update Borrower (Staff Only)
```http
PUT /borrowers/{id}/
Authorization: Bearer <staff-token>
Content-Type: application/json
```

#### Delete Borrower (Staff Only)
```http
DELETE /borrowers/{id}/
Authorization: Bearer <staff-token>
```

---

### 4. Borrow Transactions

#### List Borrow Transactions
```http
GET /borrow-transactions/
Authorization: Bearer <staff-token>

Query Parameters:
  - borrower: Filter by borrower ID
  - equipment: Filter by equipment ID
  - status: Filter by status (Pending, Approved, Borrowed, etc.)
  - search: Search by borrower or equipment name
```

#### Create Borrow Transaction (Staff Only)
```http
POST /borrow-transactions/
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "borrower": 1,
  "equipment": 1,
  "quantity_borrowed": 2,
  "purpose": "Physical Education class",
  "borrow_date": "2024-03-30",
  "expected_return_date": "2024-04-02",
  "condition_before": "Good",
  "remarks_before": "Equipment in excellent condition",
  "agreement_accepted": true,
  "checked_by": "Maria Santos"
}
```

#### Get Borrow Transaction Details
```http
GET /borrow-transactions/{id}/
```

#### Approve Borrow Transaction (Admin Only)
```http
POST /borrow-transactions/{id}/approve/
Authorization: Bearer <admin-token>
Content-Type: application/json
```

#### Confirm Equipment Borrowed (Staff Only)
```http
POST /borrow-transactions/{id}/confirm_borrowed/
Authorization: Bearer <staff-token>
Content-Type: application/json
```

---

### 5. Return Transactions

#### List Return Transactions
```http
GET /return-transactions/
Authorization: Bearer <staff-token>

Query Parameters:
  - borrow_transaction__borrower: Filter by borrower
  - final_status: Filter by status (Returned, Damaged, Lost)
```

#### Create Return Transaction (Staff Only)
```http
POST /return-transactions/
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "borrow_transaction": 1,
  "return_date": "2024-04-02",
  "returned_quantity": 2,
  "condition_after": "Good",
  "remarks_after": "No damage observed",
  "checked_by": "Ana Reyes"
}
```

#### Get Return Transaction Details
```http
GET /return-transactions/{id}/
```

#### Get Overdue Items
```http
GET /return-transactions/overdue_items/
Authorization: Bearer <staff-token>
```

---

### 6. Condition Logs

#### List Condition Logs
```http
GET /condition-logs/
Authorization: Bearer <staff-token>

Query Parameters:
  - equipment: Filter by equipment ID
  - transaction_type: Filter by type (Borrow, Return)
```

#### Get Condition Logs by Equipment
```http
GET /condition-logs/by_equipment/?equipment_id=1
Authorization: Bearer <staff-token>
```

---

### 7. Dashboard & Reports

#### Get Dashboard Statistics
```http
GET /dashboard/stats/
Authorization: Bearer <staff-token>

Response:
{
  "total_equipment": 10,
  "total_borrowers": 25,
  "total_borrowed_items": 5,
  "total_returned_items": 45,
  "total_overdue_items": 2,
  "total_damaged_items": 1,
  "total_lost_items": 0
}
```

#### Get Overdue Report
```http
GET /reports/overdue/
Authorization: Bearer <staff-token>

Response: [
  {
    "id": 1,
    "borrower_name": "Juan Dela Cruz",
    "equipment_name": "Basketball",
    "borrow_date": "2024-03-25",
    "expected_return_date": "2024-03-28",
    "days_overdue": 2,
    "quantity": 2
  }
]
```

#### Get Damaged Equipment Report
```http
GET /reports/damaged/
Authorization: Bearer <staff-token>

Response: {
  "damaged": [...],
  "lost": [...]
}
```

#### Get Borrowing Summary
```http
GET /reports/summary/
Authorization: Bearer <staff-token>

Response: {
  "equipment": [
    {
      "equipment_code": "BAS001",
      "equipment_name": "Basketball",
      "total_quantity": 10,
      "available_quantity": 8,
      "total_borrowed": 2
    }
  ],
  "borrowers": [
    {
      "borrower_name": "Juan Dela Cruz",
      "id_number": "2024001",
      "total_borrows": 3
    }
  ]
}
```

---

## Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Common Errors

### Insufficient Stock
```json
{
  "error": "Insufficient stock. Available: 5"
}
```

### Invalid Data
```json
{
  "field_name": ["Error message"]
}
```

### Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Permission Denied
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## Example Workflows

### Complete Borrowing Workflow

1. **Create a Borrower**
   ```
   POST /borrowers/
   ```

2. **Create a Borrow Transaction**
   ```
   POST /borrow-transactions/
   // System automatically deducts available_quantity
   ```

3. **Approve the Request (Admin)**
   ```
   POST /borrow-transactions/{id}/approve/
   ```

4. **Confirm Borrowing (Staff)**
   ```
   POST /borrow-transactions/{id}/confirm_borrowed/
   // Transaction status changes to "Borrowed"
   ```

5. **Process Return**
   ```
   POST /return-transactions/
   // System checks if late, calculates penalty, updates available_quantity
   ```

### Checking for Overdue Items

```
GET /return-transactions/overdue_items/
```

This returns all items that are currently borrowed and past their expected return date.

---

## Authentication Example (cURL)

```bash
# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"pass123"}'

# Save the access token from response

# Use token for requests
curl -X GET http://localhost:8000/api/equipment/ \
  -H "Authorization: Bearer <access-token>"
```

---

## Rate Limiting

Currently, there is no rate limiting configured. Contact your administrator for enterprise deployments.

---

## Support

For API issues or questions, contact the development team or create an issue in the repository.
