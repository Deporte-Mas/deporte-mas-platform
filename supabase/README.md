# DeporteMás Backend Infrastructure

Complete backend setup with Supabase authentication, user management, and Stripe integration.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   External      │
│   (React)       │    │   Backend       │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Auth UI       │◄──►│ • Auth System   │    │ • Stripe API    │
│ • User Profile  │    │ • Edge Functions│◄──►│ • Meta CAPI     │
│ • Checkout      │    │ • Database      │    │ • Zapier        │
│ • Stripe        │    │ • RLS Policies  │    │ • Email Service │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.land/) for edge functions
- Supabase project created (ID: `mvmbwhosxcivnjirbcdn`)

### 2. Setup Local Environment

```bash
# Clone repository
git clone <repository-url>
cd deporte-mas-platform

# Start Supabase local development
supabase start

# Link to your project
supabase link --project-ref mvmbwhosxcivnjirbcdn
```

### 3. Deploy Database Schema

```bash
# Apply unified migration (creates complete platform schema)
supabase db push

# Reset and apply fresh (if needed)
supabase db reset
```

**Note**: We use a single unified migration (`20241229_unified_platform_schema.sql`) that creates the complete platform schema in one operation. This includes all 20 tables, indexes, policies, triggers, and initial data.

### 4. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy user-management
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy facebook-conversion

# Or deploy all at once
supabase functions deploy
```

### 5. Set Environment Variables

```bash
# Set in Supabase Dashboard under Settings > Edge Functions > Secrets
supabase secrets set STRIPE_SECRET_KEY="sk_live_xxx"
supabase secrets set STRIPE_TEST_SECRET_KEY="sk_test_xxx"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxx"
# ... other variables (see Environment Variables section)
```

## 📁 Project Structure

```
supabase/
├── config.toml                 # Supabase configuration
├── migrations/                 # Database migrations
│   └── 20241229_unified_platform_schema.sql  # Complete unified schema
├── functions/                  # Edge functions
│   ├── _shared/
│   │   └── auth.ts            # Authentication middleware
│   ├── user-management/
│   │   └── index.ts           # User CRUD operations
│   ├── create-checkout-session/
│   │   └── index.ts           # Stripe checkout
│   ├── stripe-webhook/
│   │   └── index.ts           # Webhook handler
│   └── facebook-conversion/
│       └── index.ts           # Meta Conversion API
├── tests/
│   └── auth-flow-test.ts      # Test suite
├── API_DOCUMENTATION.md       # Complete API docs
└── README.md                  # This file
```

## 🗄️ Database Schema

### Complete Platform Schema (20 Tables)

Our unified migration creates a comprehensive platform with all necessary tables:

**Core Tables:**
- `users` - Enhanced user profiles with Web3 integration
- `subscriptions` - Stripe subscription management
- `payments` - Payment history and invoices
- `teams` - Sports teams for user badges

**Content & Streaming:**
- `streams` - Live streaming with RTMP/Mux integration
- `content` - Video library (VODs, courses, interviews)
- `content_collections` - Playlists and content organization
- `content_collection_items` - Collection relationships
- `media_assets` - File management with Mux
- `chat_messages` - Real-time stream chat

**Engagement & Rewards:**
- `points_ledger` - Point transaction history (blockchain-ready)
- `engagement_activities` - User activity tracking
- `user_progress` - Content consumption tracking
- `stream_viewers` - Live viewer analytics
- `polls` & `poll_votes` - Community voting system
- `giveaways` & `giveaway_entries` - Prize management

**System:**
- `notifications` - Push/email notifications
- `admin_actions` - Audit trail

All tables include Web3 integration fields (wallet addresses, transaction hashes) while maintaining traditional database fallbacks.

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only access their own data
- Service role can access all data for backend operations
- Automatic user profile creation on auth signup

## 🔧 Edge Functions

### 1. User Management (`/user-management`)

**Endpoints:**
- `GET` - Get user profile with subscription info
- `PUT` - Update user profile (name, phone, country)
- `DELETE` - Delete user account

**Authentication:** Required (Bearer token)

### 2. Create Checkout Session (`/create-checkout-session`)

Creates Stripe embedded checkout sessions for subscriptions.

**Body:**
```json
{
  "returnUrl": "string",
  "planType": "monthly" | "annual",
  "metadata": { "key": "value" }
}
```

### 3. Stripe Webhook (`/stripe-webhook`)

Handles Stripe events:
- `checkout.session.completed`
- `customer.subscription.*`
- `invoice.payment_*`

**Features:**
- Webhook signature verification
- User and subscription management
- Meta Conversion API integration
- Zapier webhook integration

### 4. Facebook Conversion (`/facebook-conversion`)

Sends conversion events to Meta Conversion API for tracking.

## 🔐 Authentication Flow

### 1. User Registration

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: { name: 'John Doe' }
  }
})
```

**What happens:**
1. User created in `auth.users`
2. Trigger creates profile in `users` table
3. Email confirmation sent (if enabled)

### 2. User Login

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### 3. Profile Management

```javascript
// Get profile (using edge function)
const profile = await users.getProfile()

// Update profile
await users.updateProfile({
  name: 'New Name',
  phone: '+1234567890'
})
```

## 🛠️ Environment Variables

### Required Variables

```bash
# Supabase Core
SUPABASE_URL=https://mvmbwhosxcivnjirbcdn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxx                    # Production
STRIPE_TEST_SECRET_KEY=sk_test_xxx               # Testing
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Product IDs - Production
STRIPE_LIVE_PRICE_MONTHLY=price_xxx
STRIPE_LIVE_PRICE_ANNUAL=price_xxx
STRIPE_LIVE_PRODUCT_MONTHLY=prod_xxx
STRIPE_LIVE_PRODUCT_ANNUAL=prod_xxx

# Stripe Product IDs - Testing
STRIPE_TEST_PRICE_MONTHLY=price_xxx
STRIPE_TEST_PRICE_ANNUAL=price_xxx
STRIPE_TEST_PRODUCT_MONTHLY=prod_xxx
STRIPE_TEST_PRODUCT_ANNUAL=prod_xxx

# Optional Integrations
META_ACCESS_TOKEN=xxx                            # Facebook Conversion API
META_PIXEL_ID=xxx
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/xxx

# Environment Mode
VITE_DEV_MODE=false                              # true for development
```

### Setting Variables

**Local Development:**
```bash
# Set in .env file
echo "STRIPE_SECRET_KEY=sk_test_xxx" >> .env
```

**Production (Supabase):**
```bash
# Using Supabase CLI
supabase secrets set STRIPE_SECRET_KEY="sk_live_xxx"

# Or in Supabase Dashboard:
# Settings > Edge Functions > Secrets
```

## 🧪 Testing

### Run Test Suite

```bash
cd supabase/tests
deno run --allow-net --allow-env auth-flow-test.ts
```

**Tests include:**
- User registration and login
- Profile management
- Checkout session creation
- Password reset
- Error handling

### Manual Testing

```bash
# Test user management endpoint
curl -X GET "https://mvmbwhosxcivnjirbcdn.supabase.co/functions/v1/user-management" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test checkout session
curl -X POST "https://mvmbwhosxcivnjirbcdn.supabase.co/functions/v1/create-checkout-session" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"returnUrl":"https://example.com","planType":"monthly"}'
```

## 🚀 Deployment

### 1. Database Deployment

```bash
# Push schema to production
supabase db push

# Check applied migrations
supabase migration list
```

### 2. Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy user-management

# Check function logs
supabase functions logs user-management
```

### 3. Environment Setup

1. Set all required environment variables in Supabase Dashboard
2. Configure Stripe webhooks to point to your endpoints
3. Test with Stripe test cards
4. Switch to production mode

## 📋 Acceptance Criteria Status

✅ **Backend server runs successfully**
- Edge functions deployed and operational
- Health checks passing

✅ **Database is properly configured and connected**
- Schema deployed with proper relationships
- RLS policies implemented and tested
- Triggers and functions working

✅ **Supabase Auth integration is working**
- User registration/login functional
- JWT token validation implemented
- Auth middleware protecting endpoints

✅ **User registration and login endpoints are functional**
- `/user-management` endpoint operational
- Profile CRUD operations working
- Error handling implemented

✅ **Database schema supports complete platform requirements**
- 20 tables covering all platform features
- Web3 integration ready with blockchain fields
- Content management, streaming, engagement systems
- Comprehensive RLS policies and performance indexes

✅ **Environment configuration is properly documented**
- Complete environment variable list
- Setup instructions provided
- Development and production configs

## 🔍 Monitoring & Debugging

### Check Function Logs

```bash
# View logs for specific function
supabase functions logs user-management

# View all function logs
supabase functions logs

# Real-time log streaming
supabase functions logs --follow
```

### Database Queries

```sql
-- Check user count
SELECT COUNT(*) FROM auth.users;

-- Check user profiles
SELECT id, email, subscription_status FROM users;

-- Check subscriptions
SELECT user_id, status, plan_type FROM subscriptions;
```

### Common Issues

1. **Auth token invalid**: Check JWT expiration and refresh
2. **RLS policies**: Verify user has proper access
3. **Environment variables**: Ensure all required vars are set
4. **Stripe webhooks**: Verify signature and endpoint URL

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Integration Guide](../deporte-mas-landing/STRIPE_CONFIG.md)
- [Test Suite](./tests/auth-flow-test.ts)

## 🤝 Contributing

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit pull request

## 📄 License

Private - DeporteMás Platform