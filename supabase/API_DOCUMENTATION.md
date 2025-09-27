# DeporteMás Platform API Documentation

## Overview

The DeporteMás platform backend provides a complete authentication and user management system built on Supabase with custom edge functions.

## Base URL

```
https://mvmbwhosxcivnjirbcdn.supabase.co/functions/v1
```

## Authentication

All API endpoints require authentication using Bearer tokens from Supabase Auth.

### Headers Required

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Edge Functions

### 1. User Management (`/user-management`)

Handles user profile operations.

#### Get User Profile

```http
GET /user-management
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "country": "Costa Rica",
    "subscription_status": "active",
    "plan_type": "monthly",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "subscriptions": [...]
  },
  "message": "Profile retrieved successfully"
}
```

#### Update User Profile

```http
PUT /user-management
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "country": "Costa Rica"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "country": "Costa Rica",
    "subscription_status": "active",
    "plan_type": "monthly",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

#### Delete User Account

```http
DELETE /user-management
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "User account deleted successfully"
}
```

### 2. Create Checkout Session (`/create-checkout-session`)

Creates Stripe checkout sessions for subscriptions.

```http
POST /create-checkout-session
```

**Request Body:**
```json
{
  "returnUrl": "https://example.com/success",
  "planType": "monthly",
  "metadata": {
    "_fbp": "fb_browser_id",
    "_fbc": "fb_click_id",
    "source": "landing_page"
  }
}
```

**Response:**
```json
{
  "clientSecret": "cs_test_xxx",
  "sessionId": "cs_test_xxx"
}
```

### 3. Stripe Webhook (`/stripe-webhook`)

Handles Stripe webhook events (internal use only).

**Supported Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 4. Facebook Conversion (`/facebook-conversion`)

Sends conversion events to Meta Conversion API.

```http
POST /facebook-conversion
```

**Request Body:**
```json
{
  "event_name": "Subscribe",
  "event_id": "unique_event_id",
  "user_data": {
    "email": "user@example.com",
    "phone": "+1234567890"
  },
  "custom_data": {
    "value": 20.00,
    "currency": "USD"
  }
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  country TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  plan_type TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Payments Table

```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Authentication Flow

### 1. User Registration

```javascript
import { supabase } from './supabase'

// Register new user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'John Doe'
    }
  }
})
```

**What happens:**
1. User is created in `auth.users`
2. Trigger automatically creates profile in `users` table
3. User receives confirmation email (if enabled)

### 2. User Login

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### 3. Get Current User

```javascript
const { data: { user } } = await supabase.auth.getUser()
```

### 4. Logout

```javascript
await supabase.auth.signOut()
```

## Subscription Flow

### 1. Create Checkout Session

```javascript
const response = await fetch('/functions/v1/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    returnUrl: 'https://example.com/success',
    planType: 'monthly'
  })
})
```

### 2. Stripe Checkout

User completes payment in Stripe's hosted checkout.

### 3. Webhook Processing

Stripe sends webhooks to `/stripe-webhook` which:
1. Verifies webhook signature
2. Updates user subscription status
3. Creates subscription and payment records
4. Sends events to Meta Conversion API
5. Triggers Zapier integrations

## Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Users**: Can only view/update their own profile
- **Subscriptions**: Can only view their own subscriptions
- **Payments**: Can only view their own payments
- **Service Role**: Can manage all data for backend operations

## Error Handling

All APIs return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Invalid or missing authentication
- `VALIDATION_ERROR` - Invalid request data
- `PROFILE_FETCH_ERROR` - Failed to retrieve profile
- `PROFILE_UPDATE_ERROR` - Failed to update profile
- `USER_DELETE_ERROR` - Failed to delete user
- `METHOD_NOT_ALLOWED` - HTTP method not supported

## Rate Limiting

Basic rate limiting is implemented:
- 10 requests per minute per user
- Applied to user-facing endpoints

## Environment Variables

### Required for Edge Functions

```bash
# Supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_TEST_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Product IDs
STRIPE_LIVE_PRICE_MONTHLY=price_xxx
STRIPE_LIVE_PRICE_ANNUAL=price_xxx
STRIPE_LIVE_PRODUCT_MONTHLY=prod_xxx
STRIPE_LIVE_PRODUCT_ANNUAL=prod_xxx

# Test Product IDs
STRIPE_TEST_PRICE_MONTHLY=price_xxx
STRIPE_TEST_PRICE_ANNUAL=price_xxx
STRIPE_TEST_PRODUCT_MONTHLY=prod_xxx
STRIPE_TEST_PRODUCT_ANNUAL=prod_xxx

# Meta Conversion API (optional)
META_ACCESS_TOKEN=xxx
META_PIXEL_ID=xxx

# Zapier (optional)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/xxx

# Environment
VITE_DEV_MODE=false  # true for development
```

## Testing

### Development Setup

1. Start local Supabase:
```bash
supabase start
```

2. Set environment variables for development
3. Deploy functions:
```bash
supabase functions deploy user-management
```

### Test Authentication

```javascript
// Test user registration
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})

// Test profile retrieval
const response = await fetch('/functions/v1/user-management', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
```

## Security Considerations

1. **JWT Validation**: All endpoints verify JWT tokens
2. **RLS Policies**: Database access restricted by user
3. **Webhook Verification**: Stripe webhooks use signature verification
4. **Input Validation**: All inputs validated before processing
5. **Rate Limiting**: Basic protection against abuse
6. **CORS**: Configured for cross-origin requests

## Support

For technical issues:
1. Check Supabase function logs
2. Verify environment variables
3. Test with Stripe test mode
4. Check database RLS policies