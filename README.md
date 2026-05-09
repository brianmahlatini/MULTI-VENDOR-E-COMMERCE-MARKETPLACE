# MarketHub

MarketHub is a full-stack multi-vendor e-commerce marketplace with separate buyer, seller, and admin experiences. It uses a Next.js frontend, an Express API, PostgreSQL for marketplace accounts and order data, MongoDB for the product catalog, Redis/BullMQ for background work, Stripe for checkout, and Docker Compose for local development.

## Features

- Buyer storefront with product search, category filtering, product details, cart, and Stripe Checkout.
- Seller dashboard with product creation, inventory fields, seller metrics, Stripe Connect onboarding, and seller subscription checkout.
- Admin dashboard with platform-wide users, products, orders, revenue, and order tracking history.
- Local username/email/password authentication stored in PostgreSQL.
- Role-based access for `ADMIN`, `SELLER`, and `BUYER`.
- MongoDB product catalog with seeded marketplace images.
- Redis-backed cache helpers and BullMQ worker infrastructure.
- Dockerized frontend, backend, worker, PostgreSQL, MongoDB, and Redis services.

## Screenshots

### Current Storefront

![Current MarketHub storefront](docs/screenshots/current-home.png)

### Storefront

![MarketHub storefront](docs/screenshots/home.png)

### Product Detail

![MarketHub product detail page](docs/screenshots/product-detail.png)

### Current Account Access

![Current MarketHub account access page](docs/screenshots/current-access.png)

### Buyer Cart

![Current MarketHub buyer cart](docs/screenshots/current-cart.png)

### Stripe Checkout

![Current MarketHub Stripe Checkout page](docs/screenshots/current-stripe-checkout.png)

### Admin Dashboard

![Current MarketHub admin dashboard](docs/screenshots/current-admin-dashboard.png)

### Seller Dashboard

![Current MarketHub seller dashboard](docs/screenshots/current-seller-dashboard.png)

## User Roles

### Admin

- The first registered account becomes the only admin account.
- Admin can access platform-wide dashboards and metrics.
- After the first account exists, new users cannot register as admin.

### Seller

- Sellers can access the seller dashboard.
- Sellers can create products with title, category, price, inventory, image URL, and description.
- Sellers can view seller revenue, orders, product count, and units sold.
- Seller payment setup is handled through Stripe seller endpoints when Stripe keys are configured.

### Buyer

- Buyers can browse the catalog, view products, add items to cart, and checkout.
- Buyer cart and order data is stored in PostgreSQL.
- Checkout is created through Stripe Checkout.

## Authentication Flow

- Registration asks for `username`, `email`, `password`, and the selected access type.
- The first successful registration is assigned `ADMIN`.
- Every later registration must be `SELLER` or `BUYER`.
- Login accepts username or email plus password.
- Passwords are hashed before storage.
- The backend creates a signed HTTP-only cookie named `marketplace_session`.
- Protected routes read the user role from PostgreSQL before granting access.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, Lucide icons
- Backend: Node.js, Express, TypeScript, Zod
- Authentication: HTTP-only cookies, HMAC-signed sessions, Node.js crypto password hashing
- PostgreSQL: Prisma-managed relational data
- MongoDB: Mongoose product catalog
- Redis: caching and BullMQ job infrastructure
- Stripe: checkout, Connect onboarding, seller subscriptions, webhooks
- Docker: local multi-service development

## Project Structure

```txt
MULTI-VENDOR E-COMMERCE MARKETPLACE/
  backend/
    prisma/
      schema.prisma                 PostgreSQL schema for users, carts, orders, payments, subscriptions, logs
    src/
      app.ts                        Express app, middleware, and route mounting
      server.ts                     Backend startup and database connections
      config/
        env.ts                      Required environment variable validation
        logger.ts                   Pino logger setup
      db/
        mongo.ts                    MongoDB connection
        postgres.ts                 Prisma client
        redis.ts                    Redis connection
      jobs/
        queues.ts                   BullMQ queue definitions
        worker.ts                   Background worker entry
      middleware/
        auth.ts                     Cookie session auth, current user lookup, role guards
        error.ts                    Central error handler
        rateLimit.ts                Rate limiting for sensitive endpoints
      models/
        Product.ts                  MongoDB product model
      routes/
        admin.ts                    Admin dashboard metrics and audit activity
        auth.ts                     Register, login, logout, current user
        cart.ts                     Buyer cart read/update APIs
        checkout.ts                 Stripe Checkout session creation
        orders.ts                   Buyer, seller, and admin order APIs
        products.ts                 Public catalog, reviews, seller product CRUD, upload signing
        seller.ts                   Seller dashboard, Stripe Connect, seller subscriptions
        webhooks.ts                 Stripe webhook processing
      scripts/
        seedProducts.ts             Product seed script with refreshed images
      services/
        cache.ts                    Redis cache helpers
        storage.ts                  S3-compatible upload signing
        stripe.ts                   Stripe client
    .env.example
    Dockerfile
    package.json
    tsconfig.json

  frontend/
    app/
      access/page.tsx               Register/login page
      admin/page.tsx                Admin dashboard
      cart/page.tsx                 Buyer cart page
      checkout/success/page.tsx     Checkout success page
      products/[id]/page.tsx        Product detail page
      seller/page.tsx               Seller dashboard and product form
      globals.css                   Global styles
      layout.tsx                    App shell and navigation
      page.tsx                      Storefront catalog
    components/
      AccessEntry.tsx               Register/login UI
      AddToCartButton.tsx           Buyer add-to-cart action
      CheckoutButton.tsx            Buyer checkout action
      LogoutButton.tsx              Logout action
      ProductCard.tsx               Storefront product card
      SellerProductForm.tsx         Seller product creation form
    lib/
      api.ts                        Server-side API helpers
      clientApi.ts                  Browser API URL helper
      types.ts                      Shared frontend types
    .env.example
    .env.local
    Dockerfile
    middleware.ts
    next.config.ts
    package.json
    tailwind.config.ts

  docker-compose.yml                Local frontend, backend, worker, Postgres, Mongo, Redis
  package.json                      Root workspace scripts
  package-lock.json                 Locked dependency versions
  README.md
```

## Data Storage

PostgreSQL stores relational marketplace data:

- Users and roles
- Carts and cart items
- Orders and order items
- Payments
- Seller subscriptions
- Audit logs

MongoDB stores catalog data:

- Product title, description, category
- Price and inventory
- Seller ownership
- Image URLs
- Reviews
- Active/inactive state

Redis supports:

- Product cache helpers
- Queue connections
- Background order work

## Product Catalog

The seed script creates 15 products with direct Unsplash image URLs:

- Electronics: headphones, smart watch, Bluetooth speaker
- Fashion: leather sneakers, leather tote, denim jacket
- Home: ceramic lamp, linen bedding, stoneware mugs
- Beauty: skin care set, lip color collection, perfume
- Sports: yoga mat, dumbbells, insulated training bottle

Refresh seeded products:

```bash
docker compose exec backend npm run seed:products
```

The seed removes old `seed-seller-*` products before inserting the refreshed catalog and clears the product cache after seeding.

## Environment Setup

Create environment files:

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
AUTH_SECRET=replace-with-a-long-random-secret

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
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Docker Compose sets internal service URLs for containers:

- `DATABASE_URL` points backend and worker to `postgres`.
- `MONGODB_URI` points backend to `mongo`.
- `REDIS_URL` points backend and worker to `redis`.
- `INTERNAL_API_URL` points frontend server-side requests to `http://backend:4000/api`.

## Run With Docker

Install dependencies:

```bash
npm install
```

Start the full stack:

```bash
docker compose up --build
```

Open:

```txt
Frontend: http://localhost:3000
Backend health: http://localhost:4000/health
```

Run in the background:

```bash
docker compose up --build -d
```

Check services:

```bash
docker compose ps
```

## Useful Commands

Root commands:

```bash
npm run build
npm run lint
```

Backend commands:

```bash
cmd /c npm --workspace backend run build
cmd /c npm --workspace backend run dev
cmd /c npm --workspace backend run prisma:generate
cmd /c npm --workspace backend run prisma:migrate
cmd /c npm --workspace backend run seed:products
cmd /c npm --workspace backend run worker
```

Frontend commands:

```bash
cmd /c npm --workspace frontend run build
cmd /c npm --workspace frontend run dev
cmd /c npm --workspace frontend run start
cmd /c npm --workspace frontend run lint
```

Docker commands:

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 backend
docker compose exec backend npm run seed:products
```

## Main Pages

```txt
/                       Storefront product catalog
/access                 Register/login page
/products/[id]          Product detail
/cart                   Buyer cart
/checkout/success       Stripe checkout success
/seller                 Seller dashboard and product creation
/admin                  Admin dashboard
```

## API Routes

```txt
GET    /health

/api/auth
GET    /me
POST   /register
POST   /login
POST   /logout

/api/products
GET    /
GET    /:id
POST   /
PATCH  /:id
DELETE /:id
POST   /:id/reviews
POST   /uploads/sign

/api/cart
GET    /
POST   /items
PATCH  /items/:id
DELETE /items/:id

/api/checkout
POST   /

/api/orders
GET    /mine
GET    /seller
GET    /:id

/api/seller
GET    /dashboard
POST   /connect-account
POST   /subscription

/api/admin
GET    /dashboard

/api/webhooks
POST   /stripe
```

## Stripe Setup

Stripe is used for buyer checkout, seller subscriptions, seller Connect onboarding, and webhook updates.

For local webhook testing:

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Put the returned webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

## Fresh Start

To clear PostgreSQL marketplace data in Docker and make the next registration become the admin account:

```bash
docker compose exec backend node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); const d=String.fromCharCode(34); const q=(s)=>d+s+d; (async()=>{ await prisma.$executeRawUnsafe('TRUNCATE TABLE '+q('AuditLog')+', '+q('Payment')+', '+q('OrderItem')+', '+q('Order')+', '+q('CartItem')+', '+q('Cart')+', '+q('SellerSubscription')+', '+q('User')+' RESTART IDENTITY CASCADE'); console.log('fresh'); })().finally(()=>prisma.$disconnect());"
```

This clears users, carts, orders, payments, audit logs, and seller subscriptions. It does not remove MongoDB products.

## Verification

Before handing off changes, verify:

```bash
cmd /c npm --workspace backend run build
cmd /c npm --workspace frontend run build
docker compose up --build -d
docker compose exec backend npm run seed:products
```

Expected result:

- Backend TypeScript compiles.
- Frontend Next.js build compiles.
- Docker services start successfully.
- Storefront shows the refreshed seeded product images.


