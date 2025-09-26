# DeporteMas Platform

> **Transforming Costa Rica's most beloved sports program into an intimate digital community where legendary players and passionate fans experience football together every day.**

## 🏗️ Project Structure

This repository contains the complete **DeporteMas Digital Platform** organized as a simple monorepo:

```
deporte-mas-platform/
├── deporte-mas-landing/        # Landing page with Stripe payments & auth
├── deporte-mas-admin/          # Admin dashboard for user management
├── deporte-mas-mobile/         # Mobile app (React Native)
├── deporte-mas-contracts/      # Smart contracts (Starknet)
├── supabase/                   # Shared backend infrastructure
│   ├── functions/              # Edge functions for payments & webhooks
│   ├── migrations/             # Database schemas
│   └── config.toml            # Supabase configuration
└── docs/                       # Documentation & implementation guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm (any package manager)
- Supabase CLI (for backend deployment)
- Stripe account (for payments)

### 1. Setup Landing Page

```bash
# Navigate to landing page
cd deporte-mas-landing

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase and Stripe keys

# Start development server
npm run dev
# Landing page: http://localhost:8080
```

### 2. Setup Admin Dashboard

```bash
# Navigate to admin dashboard
cd deporte-mas-admin

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase keys

# Start development server
npm run dev
# Admin dashboard: http://localhost:3001
```

### 3. Setup Backend (Supabase)

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login and link to your project
supabase login
supabase link --project-ref your-project-id

# Run database migrations
supabase db push

# Deploy edge functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy facebook-conversion
```

## 🛠️ Environment Variables

### Core Variables (Required)

Create `.env` files in the root and each app directory with these variables:

#### Supabase (Required)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Stripe (Required for payments)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-test-publishable-key
STRIPE_TEST_SECRET_KEY=sk_test_your-test-secret-key
STRIPE_SECRET_KEY=sk_live_your-live-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

#### Development Mode
```bash
VITE_DEV_MODE=true  # Use test keys when true, live keys when false
```

### Optional Variables

#### Meta Conversion API (for Facebook tracking)
```bash
META_ACCESS_TOKEN=your-meta-access-token
META_PIXEL_ID=your-pixel-id
```

#### CRM Integration
```bash
ZAPIER_WEBHOOK_URL=your-zapier-webhook-url
```

## 🏗️ Backend Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

### 2. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy facebook-conversion

# Set environment secrets
supabase secrets set STRIPE_TEST_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
# ... add other secrets as needed
```

## 💳 Stripe Setup

### 1. Create Products

Create test products in your Stripe dashboard:

```bash
# Monthly subscription
stripe products create --name "Deporte+ Club Monthly" --description "Monthly subscription to Deporte+ Club"

# Annual subscription
stripe products create --name "Deporte+ Club Annual" --description "Annual subscription to Deporte+ Club"

# Create prices for each product
stripe prices create --product prod_YOUR_MONTHLY_ID --unit-amount 2000 --currency usd --recurring-interval month
stripe prices create --product prod_YOUR_ANNUAL_ID --unit-amount 18000 --currency usd --recurring-interval year
```

### 2. Configure Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Update Product IDs

Update the product IDs in `supabase/functions/create-checkout-session/index.ts`:

```typescript
const getProductConfig = (plan: string, isDev: boolean) => {
  if (isDev) {
    return plan === 'annual'
      ? { priceId: "price_YOUR_TEST_ANNUAL_ID", productId: "prod_YOUR_TEST_ANNUAL_ID" }
      : { priceId: "price_YOUR_TEST_MONTHLY_ID", productId: "prod_YOUR_TEST_MONTHLY_ID" };
  } else {
    // Live product IDs for production
    return plan === 'annual'
      ? { priceId: "price_YOUR_LIVE_ANNUAL_ID", productId: "prod_YOUR_LIVE_ANNUAL_ID" }
      : { priceId: "price_YOUR_LIVE_MONTHLY_ID", productId: "prod_YOUR_LIVE_MONTHLY_ID" };
  }
};
```

## 📊 Features

### ✅ Implemented

- **Landing Page** - Responsive design with Stripe checkout integration
- **Stripe Payments** - Embedded checkout with subscription management
- **User Authentication** - Complete auth flow with Supabase
- **Admin Dashboard** - User, subscription, and payment management
- **Facebook Tracking** - Meta Conversion API integration
- **Database Schema** - Production-ready with proper relationships
- **Edge Functions** - Secure payment processing and webhooks
- **Clean Architecture** - Standalone projects in simple monorepo

### 🚧 To Be Implemented

- **Mobile App** (React Native)
- **Smart Contracts** (Starknet integration)
- **Video Streaming** (Mux integration)
- **Real-time Chat** functionality
- **Push Notifications**
- **Advanced Analytics**

## 🛠️ Development Commands

### Landing Page
```bash
cd deporte-mas-landing
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run typecheck    # Type checking
```

### Admin Dashboard
```bash
cd deporte-mas-admin
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run typecheck    # Type checking
```

### Backend
```bash
# Generate types from Supabase
supabase gen types typescript --project-id $PROJECT_ID > supabase/types.ts

# Deploy functions
supabase functions deploy

# View logs
supabase functions logs create-checkout-session
```

## 🏗️ Database Schema

The platform uses the following main tables:

- **users** - User profiles and subscription info
- **subscriptions** - Stripe subscription details
- **payments** - Payment history and status

See `supabase/migrations/` for the complete schema.

## 🔐 Security

- All payments processed securely through Stripe
- User authentication via Supabase Auth
- Row Level Security (RLS) enabled on all tables
- Environment variables for sensitive data
- HTTPS enforced in production

## 📝 API Documentation

### Supabase Edge Functions

- **create-checkout-session** - Creates Stripe checkout sessions
- **stripe-webhook** - Handles Stripe webhook events
- **facebook-conversion** - Sends events to Meta Conversion API

### Project Architecture

Each project is standalone and can be developed/deployed independently:

- **deporte-mas-landing** - Landing page with Stripe payments and authentication
- **deporte-mas-admin** - Admin dashboard for user/subscription management
- **supabase/** - Shared backend infrastructure and edge functions

## 🚀 Deployment

### Landing Page
```bash
cd deporte-mas-landing
npm run build
# Deploy dist/ folder to Vercel, Netlify, or any static host
```

### Admin Dashboard
```bash
cd deporte-mas-admin
npm run build
# Deploy dist/ folder to Vercel, Netlify, or any static host
```

### Backend (Supabase)
```bash
# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy facebook-conversion

# Deploy database changes
supabase db push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary to DeporteMas.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in `/docs`

---

**Built with ❤️ for Costa Rican football culture**