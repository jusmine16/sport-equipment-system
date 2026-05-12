# Quick Start Guide - Next.js Backend

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Set Up Environment
Create `.env.local` in `frontend/` directory:
```env
DATABASE_URL="postgresql://user:password@your-supabase-host/postgres"
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=your_secret_key_here
```

Get these values from:
- **DATABASE_URL**: Supabase Dashboard → Settings → Database → Connection string
- **JWT_SECRET**: Generate any random string (use a secure one in production)

### 3. Initialize Database
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📝 What's Changed

### Migration Complete ✅
- ✅ Django backend → Next.js API routes
- ✅ Django ORM → Prisma
- ✅ Django JWT auth → Next.js auth with cookies
- ✅ All endpoints converted
- ✅ Database schema ready

### Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| Backend | Django on 8000 | Next.js on 3000 |
| API Path | `http://localhost:8000/api/` | `http://localhost:3000/api/` |
| Token Storage | localStorage + header | HTTP-only cookie |
| Database | Django ORM | Prisma |
| Migrations | `manage.py migrate` | `prisma migrate` |

---

## 🔌 API Endpoints Quick Reference

### Auth
```
POST   /api/auth/register    - Create new user
POST   /api/auth/login       - Login user
GET    /api/auth/user        - Get current user
```

### Equipment
```
GET    /api/equipment        - List all equipment
POST   /api/equipment        - Create equipment (admin)
GET    /api/equipment/:id    - Get one
PUT    /api/equipment/:id    - Update (admin)
DELETE /api/equipment/:id    - Delete (admin)
```

### Borrowing
```
GET    /api/borrow           - List requests
POST   /api/borrow           - Create request
GET    /api/borrow/:id       - Get request details
PUT    /api/borrow/:id       - Approve/reject (action in body, admin)
```

### Returns & Transactions
```
POST   /api/return           - Return borrowed equipment
GET    /api/transactions     - List transactions
```

### Admin
```
GET    /api/reports          - System statistics (admin)
```

Full API docs: See `API_DOCUMENTATION.md`

---

## 🔐 Authentication Example

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"pass123"}'
```

Response includes auth token (auto-set in cookie).

### Use Token
```bash
curl http://localhost:3000/api/auth/user \
  -H "Cookie: auth_token=<token>"
```

In JavaScript:
```javascript
// Frontend code automatically includes cookies
const response = await fetch('/api/auth/user', {
  credentials: 'include' // Important!
});
```

---

## 📚 File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/                    # All API routes
│   │   │   ├── auth/               # Authentication
│   │   │   ├── equipment/          # Equipment CRUD
│   │   │   ├── borrow/             # Borrow requests
│   │   │   ├── return/             # Returns
│   │   │   ├── transactions/       # Transaction list
│   │   │   └── reports/            # Admin reports
│   │   ├── dashboard/              # Frontend pages
│   │   ├── equipment/
│   │   ├── admin/
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── prisma.ts               # DB client
│   │   ├── api-response.ts         # Response helpers
│   │   ├── validation.ts           # Input validation (Zod)
│   │   └── api.ts                  # Fetch helpers
│   └── components/                 # Reusable components
├── prisma/
│   └── schema.prisma               # Database schema
└── .env.local                      # Environment variables
```

---

## ⚙️ Common Commands

```bash
# Start dev server
npm run dev

# Build production
npm run build
npm start

# Database explorer
npx prisma studio

# Generate DB client
npx prisma generate

# View logs in development
# Open http://localhost:3000 and check browser console

# Database migrations (if schema changes)
npx prisma migrate dev --name description
```

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npm install
npx prisma generate
```

### "Invalid DATABASE_URL"
- Check Supabase connection string format
- Ensure `.env.local` is in correct location
- Verify password is URL-encoded if special characters

### API returns 401 Unauthorized
- Token might be expired
- Make sure cookies are enabled
- Check `credentials: 'include'` in fetch calls

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Database connection fails
```bash
# Test connection with Prisma
npx prisma db execute --stdin --file test.sql
```

---

## 📖 Documentation

- **API Details**: Read `API_DOCUMENTATION.md`
- **Frontend Migration**: Read `MIGRATION_GUIDE.md`
- **Prisma**: https://www.prisma.io/docs
- **Next.js**: https://nextjs.org/docs

---

## ✨ Next Steps

1. ✅ Backend is ready
2. ⏳ Update frontend components to use new API paths
3. ⏳ Test all features
4. ⏳ Deploy to production

See `MIGRATION_GUIDE.md` for updating frontend code.

---

## 🎯 Features Included

- ✅ User registration & login with JWT
- ✅ Equipment management (CRUD)
- ✅ Borrow request workflow (pending → approved/rejected)
- ✅ Equipment return tracking
- ✅ Transaction history
- ✅ Admin reports & statistics
- ✅ Role-based access control
- ✅ Input validation
- ✅ Error handling
- ✅ Database schema with constraints

---

**Ready to code?** Start the dev server and happy coding! 🚀
