# MarketHub Authentication Guide

MarketHub uses local username/email/password authentication backed by PostgreSQL. Roles are stored on the `User` record and checked by the backend on every protected request.

## Registration Rules

- Registration requires `username`, `email`, `password`, and selected role.
- The first registered account becomes `ADMIN`.
- After an admin exists, no other account can become admin through registration.
- Later registrations can only become `SELLER` or `BUYER`.
- Emails and usernames must be unique.
- Passwords are hashed before storage.

## Login Rules

- Login accepts either username or email.
- Login requires the account password.
- Successful login creates a signed HTTP-only cookie named `marketplace_session`.
- Logout clears the session cookie.
- `/api/auth/me` returns the current authenticated user from PostgreSQL.

## Role Access

```txt
ADMIN
  /admin
  /api/admin/*
  Platform-wide metrics, users, orders, revenue, audit history

SELLER
  /seller
  /api/seller/*
  Product creation, seller dashboard, seller Stripe setup

BUYER
  /
  /cart
  /api/cart/*
  /api/checkout
  Storefront browsing, cart, checkout
```

## API Endpoints

```txt
GET  /api/auth/me
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

Register request:

```json
{
  "username": "seller01",
  "email": "seller@example.com",
  "password": "strong-password",
  "role": "SELLER"
}
```

Login request:

```json
{
  "login": "seller01",
  "password": "strong-password"
}
```

## Database Fields

The PostgreSQL `User` table stores:

- `id`
- `authId`
- `email`
- `username`
- `name`
- `passwordHash`
- `role`
- `stripeCustomerId`
- `stripeAccountId`
- `createdAt`
- `updatedAt`

The `role` value is one of:

```txt
ADMIN
SELLER
BUYER
```

## Fresh Start

To clear local Docker PostgreSQL auth and marketplace data so the next registration becomes admin:

```bash
docker compose exec backend node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); const d=String.fromCharCode(34); const q=(s)=>d+s+d; (async()=>{ await prisma.$executeRawUnsafe('TRUNCATE TABLE '+q('AuditLog')+', '+q('Payment')+', '+q('OrderItem')+', '+q('Order')+', '+q('CartItem')+', '+q('Cart')+', '+q('SellerSubscription')+', '+q('User')+' RESTART IDENTITY CASCADE'); console.log('fresh'); })().finally(()=>prisma.$disconnect());"
```

This does not remove MongoDB products. To refresh products separately:

```bash
docker compose exec backend npm run seed:products
```

## Verification

```bash
cmd /c npm --workspace backend run build
cmd /c npm --workspace frontend run build
docker compose up --build -d
```

Expected:

- Backend build passes.
- Frontend build passes.
- Docker services start.
- First registration becomes admin.
- Later seller and buyer registrations are stored with their selected roles.
