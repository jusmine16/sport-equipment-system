# Sport Equipment Borrowing System

A full-stack application for managing sport equipment borrowing with Django REST Framework (backend) and Tailwind CSS + Alpine.js (frontend).

## Features

- **User Management**: Registration, login (JWT), roles (admin/user)
- **Equipment CRUD**: Add, edit, delete equipment (admin only)
- **Borrow Requests**: Users request equipment; admins approve/reject
- **Returns**: Return equipment with condition tracking
- **Dashboard Stats**: Total equipment, available, borrowed, pending requests
- **Search & Filter**: Search equipment by name, filter by category

## Tech Stack

- **Backend**: Django 4.x, Django REST Framework, Simple JWT, Django CORS Headers
- **Frontend**: Next.js 16, React 19, Tailwind CSS, TypeScript
- **Database**: Supabase (PostgreSQL)

## Quick Start

### 1. Create Virtual Environment (recommended)

```bash
cd "Sport Equipment Borrowing System"
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection details
3. Set environment variables (or create `.env` with `python-dotenv`):
    - `DATABASE_URL` (recommended):
       `postgresql://postgres.<project_ref>:<password>@<pooler_host>:6543/postgres?sslmode=require`
    - Or use individual variables:
       - `DB_HOST` (e.g. `aws-1-ap-northeast-2.pooler.supabase.com`)
       - `DB_PORT` (default: `6543` for Session Pooler)
       - `DB_DATABASE` (default: `postgres`)
       - `DB_USERNAME` (e.g. `postgres.<project_ref>`)
       - `DB_PASSWORD` (your database password)

See `.env.example` for the format.

### 4. Run Migrations

```bash
python manage.py migrate
```

### Troubleshooting Supabase Connection

If `python manage.py migrate` times out, run the built-in connectivity check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-supabase-connectivity.ps1
```

Quick manual checks (Windows PowerShell):

```powershell
Test-NetConnection aws-1-ap-northeast-2.pooler.supabase.com -Port 6543
Test-NetConnection aws-1-ap-northeast-2.pooler.supabase.com -Port 5432
Test-NetConnection google.com -Port 443
```

Interpretation:

- `443=True` but `6543/5432=False`: your network/firewall is blocking outbound database ports or Supabase network allowlist is enabled.
- If multiple Supabase pooler hosts show the same result (`443=True`, `6543/5432=False`), treat it as a network policy block on PostgreSQL ports rather than a wrong Supabase hostname.
- All tests fail: DNS/routing/firewall issue on the current network.
- If Supabase Network Restrictions are enabled, allowlist your current public IP shown by the script.

### 5. Create Admin User

```bash
python manage.py create_admin --username admin --password admin123
```

### One-command Bootstrap (after network is reachable)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-supabase.ps1
```

This command checks DB port reachability first, then runs migrations and creates the admin user.

### 6. (Optional) Create Superuser for Django Admin

```bash
python manage.py createsuperuser
```

### 7. Start the Server

```bash
python manage.py runserver
```

### 8. Start the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

The Next.js app runs at **http://localhost:3000**

### 9. Open the App

1. Go to **http://localhost:3000**
2. Login with `admin` / `admin123` (or register a new user)
3. Admin users can manage equipment and approve borrow requests

**Note:** Ensure Django (port 8000) is running. The frontend connects to `http://localhost:8000/api` by default. Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to override.

## Project Structure

```
Sport Equipment Borrowing System/
├── api/                    # API app
│   ├── models.py          # Equipment, BorrowRequest, BorrowItem, Transaction
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API views & ViewSets
│   ├── urls.py            # API routes
│   └── management/        # create_admin command
├── sports_borrowing_system/
│   ├── settings.py
│   └── urls.py
├── frontend/               # Next.js app
│   ├── src/app/           # Pages (login, register, dashboard, etc.)
│   ├── src/components/
│   ├── src/contexts/
│   ├── src/lib/           # API client
│   └── package.json
├── static/                # (legacy) HTML fallback
│   ├── js/api.js
│   ├── register.html
│   ├── dashboard.html
│   ├── equipment.html
│   ├── transactions.html
│   └── admin.html
├── manage.py
└── requirements.txt
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register/` | User registration |
| POST | `/api/login/` | JWT login |
| GET | `/api/user/` | Current user profile |
| GET | `/api/equipment/` | List equipment (with ?search= & ?category=) |
| POST | `/api/equipment/` | Create equipment (admin) |
| PUT | `/api/equipment/{id}/` | Update equipment (admin) |
| DELETE | `/api/equipment/{id}/` | Delete equipment (admin) |
| POST | `/api/borrow/` | Create borrow request |
| GET | `/api/borrow/` | List borrow requests |
| PUT | `/api/borrow/{id}/approve/` | Approve request (admin) |
| PUT | `/api/borrow/{id}/reject/` | Reject request (admin) |
| POST | `/api/return/` | Return equipment |
| GET | `/api/transactions/` | User's transactions |
| GET | `/api/reports/` | Dashboard stats |

## Default Credentials

- **Admin**: username `admin`, password `admin123` (after running `create_admin`)

## Notes

- JWT tokens are stored in `localStorage`
- CORS is enabled for all origins (restrict in production)
- Use `python manage.py runserver 0.0.0.0:8000` to allow network access
