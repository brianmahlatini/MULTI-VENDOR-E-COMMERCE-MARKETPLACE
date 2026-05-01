# Multi-Vendor E-Commerce Marketplace

MarketHub is a full-stack multi-vendor e-commerce marketplace. It supports separate buyer, seller, and admin experiences with Clerk authentication, Stripe payments, PostgreSQL order data, MongoDB product catalog data, Redis-backed jobs, and Docker Compose local development.

## Overview

The application is split into two workspaces:

- `frontend`: Next.js App Router application for the storefront, access chooser, buyer cart, seller dashboard, and admin dashboard.
- `backend`: Express TypeScript API for authentication, role enforcement, products, cart, checkout, orders, seller tools, admin metrics, webhooks, background jobs, and external services.

The main user flows are:

- Buyers can browse products, add products to cart, checkout, and view order-related pages.
- Sellers can choose seller access, create products, manage inventory, view product metrics, and review seller sales data.
- Admins use the approved admin account to access platform-wide metrics, users, products, orders, and audit activity.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Clerk, Lucide icons
- Backend: Node.js, Express, TypeScript, Zod validation
- Auth: Clerk with public metadata roles
- Payments: Stripe Checkout, Stripe Connect, seller subscription checkout, webhooks
- Databases: PostgreSQL with Prisma, MongoDB with Mongoose
- Cache and jobs: Redis, BullMQ
- Storage: AWS S3 compatible product image upload signing
- Runtime: Docker Compose

## Project Structure

```txt
MULTI-VENDOR E-COMMERCE MARKETPLACE/
|-- backend/
|   |-- prisma/
|   |   `-- schema.prisma              # PostgreSQL schema: users, carts, orders, payments, audit logs
|   |-- src/
|   |   |-- app.ts                     # Express app, middleware, and route mounting
|   |   |-- server.ts                  # Backend startup and database connections
|   |   |-- config/
|   |   |   |-- env.ts                 # Required environment variable validation
|   |   |   `-- logger.ts              # Pino logger setup
|   |   |-- db/
|   |   |   |-- mongo.ts               # MongoDB connection
|   |   |   |-- postgres.ts            # Prisma client
|   |   |   `-- redis.ts               # Redis connection
|   |   |-- jobs/
|   |   |   |-- queues.ts              # BullMQ queue definitions
|   |   |   `-- worker.ts              # Background worker for queued order work
|   |   |-- middleware/
|   |   |   |-- auth.ts                # Clerk auth, role normalization, role guards
|   |   |   |-- error.ts               # Central API error handler
|   |   |   `-- rateLimit.ts           # Checkout/API rate limiting
|   |   |-- models/
|   |   |   `-- Product.ts             # MongoDB product model
|   |   |-- routes/
|   |   |   |-- admin.ts               # Admin dashboard metrics and audit activity
|   |   |   |-- auth.ts                # Current user and role switching
|   |   |   |-- cart.ts                # Buyer cart read/update APIs
|   |   |   |-- checkout.ts            # Stripe Checkout session creation
|   |   |   |-- orders.ts              # Buyer/seller/admin order APIs
|   |   |   |-- products.ts            # Product catalog, seller CRUD, image upload signing
|   |   |   |-- seller.ts              # Seller dashboard, Connect account, subscription
|   |   |   `-- webhooks.ts            # Stripe webhook handlers
|   |   |-- scripts/
|   |   |   `-- seedProducts.ts        # Product seeding helper
|   |   `-- services/
|   |       |-- cache.ts               # Redis cache helpers
|   |       |-- storage.ts             # S3 upload signing
|   |       `-- stripe.ts              # Stripe client
|   |-- .env.example
|   |-- Dockerfile
|   |-- package.json
|   `-- tsconfig.json
|-- frontend/
|   |-- app/
|   |   |-- access/page.tsx            # Role selection and sign-in entry
|   |   |-- admin/page.tsx             # Admin dashboard
|   |   |-- cart/page.tsx              # Buyer cart page
|   |   |-- checkout/success/page.tsx  # Checkout success page
|   |   |-- products/[id]/page.tsx     # Product detail page
|   |   |-- seller/page.tsx            # Seller dashboard and product form
|   |   |-- globals.css                # Global styles
|   |   |-- layout.tsx                 # App shell and Clerk provider
|   |   `-- page.tsx                   # Storefront product catalog
|   |-- components/
|   |   |-- AccessChooser.tsx          # Signed-in role selector
|   |   |-- AccessEntry.tsx            # Signed-out role-first Clerk entry
|   |   |-- AddToCartButton.tsx        # Buyer add-to-cart action
|   |   |-- CheckoutButton.tsx         # Buyer checkout action
|   |   |-- ProductCard.tsx            # Storefront product card
|   |   `-- SellerProductForm.tsx      # Seller product creation form
|   |-- lib/
|   |   |-- api.ts                     # Server-side API fetch helpers
|   |   |-- clientApi.ts               # Browser API URL helper
|   |   `-- types.ts                   # Shared frontend types
|   |-- .env.example
|   |-- Dockerfile
|   |-- middleware.ts                  # Clerk middleware
|   |-- next.config.ts
|   |-- package.json
|   `-- tailwind.config.ts
|-- docker-compose.yml                 # Local services: frontend, backend, worker, Postgres, Mongo, Redis
|-- package.json                       # Root workspace scripts
`-- README.md
```

## Architecture

The frontend talks to the backend through REST endpoints under `/api`. Browser components use `NEXT_PUBLIC_API_URL`, while server-rendered Next.js pages use `INTERNAL_API_URL` when running inside Docker so requests can go directly to the backend service.

```txt
Browser
  `-- Next.js frontend
        |-- Clerk session/token
        `-- Express backend API
              |-- Clerk user lookup and role enforcement
              |-- PostgreSQL/Prisma for users, carts, orders, payments, logs
              |-- MongoDB/Mongoose for products
              |-- Redis/BullMQ for jobs
              |-- Stripe for checkout, Connect, subscriptions, webhooks
              `-- S3 compatible storage for image upload signing
```

## Roles and Access

Roles are stored in Clerk public metadata using the key `role`.

Allowed roles:

- `BUYER`
- `SELLER`
- `ADMIN`

Example Clerk public metadata:

```json
{
  "role": "ADMIN"
}
```

Access behavior:

- Buyer is the default role and can shop, manage cart, and checkout.
- Seller can create products, manage inventory, and view seller dashboard metrics.
- Admin has platform-wide access and can also open buyer and seller areas without losing admin permission.

Admin protection:

- Add the approved admin email to `ADMIN_EMAILS` in `backend/.env`.
- The current approved admin email is `mahlatinibrian@gmail.com`.
- If the Clerk dashboard has `publicMetadata.role` set to `ADMIN`, the backend treats that account as admin.

## API Routes

Backend routes are mounted in `backend/src/app.ts`.

```txt
GET    /health                         # Backend health check

/api/auth
GET    /me                             # Current Clerk user mapped to marketplace role
POST   /role                           # Set BUYER, SELLER, or ADMIN role

/api/products
GET    /                               # Public product listing and search
GET    /:id                            # Public product detail
POST   /                               # Seller/admin create product
PATCH  /:id                            # Seller/admin update product
DELETE /:id                            # Seller/admin deactivate/delete product
POST   /uploads/sign                   # Seller/admin S3 upload signing

/api/cart
GET    /                               # Get or create current buyer cart
POST   /items                          # Add item to cart
PATCH  /items/:id                      # Update cart item quantity
DELETE /items/:id                      # Remove cart item

/api/checkout
POST   /                               # Create Stripe Checkout session

/api/orders
GET    /                               # Buyer/admin order access
GET    /seller                         # Seller/admin order access

/api/seller
GET    /dashboard                      # Seller dashboard metrics and products
POST   /connect-account                # Create Stripe Connect onboarding link
POST   /subscription                   # Create seller subscription checkout

/api/admin
GET    /dashboard                      # Platform metrics and audit logs

/api/webhooks
POST   /                               # Stripe webhook processing
```

## Environment Variables

Copy the example files before running locally:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend variables:

```txt
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://marketplace:marketplace@localhost:5432/marketplace?schema=public
MONGODB_URI=mongodb://localhost:27017/marketplace
REDIS_URL=redis://localhost:6379

CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
ADMIN_EMAILS=mahlatinibrian@gmail.com

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SELLER_SUBSCRIPTION_PRICE_ID=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

Frontend variables:

```txt
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Docker Compose overrides the internal service URLs for containers:

- `DATABASE_URL`: points backend/worker to the `postgres` service.
- `MONGODB_URI`: points backend to the `mongo` service.
- `REDIS_URL`: points backend/worker to the `redis` service.
- `INTERNAL_API_URL`: points frontend server-side requests to `http://backend:4000/api`.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create and fill environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Start the full stack:

```bash
docker compose up --build
```

4. Run Prisma migrations inside the backend container:

```bash
docker compose exec backend npm run prisma:migrate
```

5. Open the app:

```txt
Frontend: http://localhost:3000
Backend health: http://localhost:4000/health
```

## Useful Scripts

Run from the project root:

```bash
npm run dev              # Start Docker Compose stack
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build frontend and backend
npm run lint             # Lint frontend and backend
```

Run backend workspace scripts:

```bash
npm --workspace backend run build
npm --workspace backend run dev
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:deploy
npm --workspace backend run seed:products
npm --workspace backend run worker
```

Run frontend workspace scripts:

```bash
npm --workspace frontend run dev
npm --workspace frontend run build
npm --workspace frontend run start
npm --workspace frontend run lint
```

On Windows PowerShell, if `npm.ps1` is blocked by execution policy, use:

```bash
cmd /c npm --workspace frontend run build
cmd /c npm --workspace backend run build
```

## Main Pages

```txt
/                       Storefront product catalog
/access                 Role selection and Clerk sign-in/sign-up entry
/products/[id]          Product detail
/cart                   Buyer cart
/checkout/success       Stripe checkout success
/seller                 Seller dashboard and product creation
/admin                  Admin dashboard
```

## Data Model Summary

PostgreSQL stores relational marketplace data:

- Users
- Carts and cart items
- Orders and order items
- Payments
- Seller subscriptions/accounts
- Audit logs

MongoDB stores product catalog data:

- Product title, description, category
- Price and inventory
- Seller Clerk ID
- Image URLs
- Active/inactive state

Redis supports:

- Queue infrastructure
- Background order work
- Cache helpers

## Buyer Flow

1. Visit `/access`.
2. Choose Buyer and sign in or sign up.
3. Browse the storefront at `/`.
4. Open a product detail page.
5. Add items to the cart.
6. Visit `/cart`.
7. Start checkout through Stripe.
8. Return to `/checkout/success`.

## Seller Flow

1. Visit `/access`.
2. Choose Seller and sign in or sign up.
3. Open `/seller`.
4. Create products using title, category, price, inventory, image URL, and description.
5. View seller metrics and product list.
6. Use seller Stripe account/subscription endpoints when payment setup is configured.

## Admin Flow

1. Set the admin user's Clerk public metadata:

```json
{
  "role": "ADMIN"
}
```

2. Add the admin email to `ADMIN_EMAILS` in `backend/.env`.
3. Sign in with the approved admin account.
4. Open `/admin`.
5. View platform metrics and audit activity.
6. Admin users can also open buyer and seller areas while keeping admin permissions.

## Stripe Notes

The app uses Stripe for:

- Buyer checkout sessions
- Seller subscriptions
- Seller Connect onboarding
- Payment confirmation webhooks

For local webhook testing, use the Stripe CLI and forward events to the backend webhook route:

```bash
stripe listen --forward-to localhost:4000/api/webhooks
```

Put the returned webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

## Product Images

The seller form currently accepts an image URL directly. The backend also includes an upload signing endpoint under `/api/products/uploads/sign` for S3 compatible uploads. To use signed uploads in the UI, wire the frontend image input to request a signed upload URL, upload the file to S3, then save the resulting public image URL on the product.

## Development Notes

- Backend environment variables are validated at startup in `backend/src/config/env.ts`.
- Protected backend routes use Clerk middleware plus `requireAuth`.
- Role-specific routes use `requireRole`.
- Product catalog reads are public, while product creation and editing require seller or admin access.
- Checkout requires an authenticated user and a non-empty cart.
- Admin dashboard requires `ADMIN`.
- Seller dashboard requires `SELLER` or `ADMIN`.

## Build Verification

Use these commands before submitting changes:

```bash
cmd /c npm --workspace backend run build
cmd /c npm --workspace frontend run build
```

Expected result:

- Backend TypeScript compiles successfully.
- Frontend Next.js production build compiles successfully.

## Deployment

The project is container-ready. A typical deployment needs:

- Frontend service running the Next.js app
- Backend service running the Express API
- Worker service running `npm run worker`
- PostgreSQL database
- MongoDB database
- Redis instance
- Clerk application
- Stripe account and webhook
- S3 compatible bucket

Set production environment variables for each service, run Prisma migrations against production PostgreSQL, and configure Clerk/Stripe callback URLs to match the deployed frontend and backend domains.
