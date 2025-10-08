# Subscription Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Subscription Cache Logic](#subscription-cache-logic)
4. [User Lifecycle](#user-lifecycle)
5. [Access Control](#access-control)
6. [Webhook Flow](#webhook-flow)
7. [Handling Changes](#handling-changes)
8. [Best Practices](#best-practices)

---

## Overview

The DeporteMás platform uses a **denormalized subscription cache** architecture for optimal performance and reliability. This eliminates the need for Stripe API calls on every content access request while maintaining accurate subscription status.

### Key Design Principles

- **Performance First**: Local database queries (5ms) instead of Stripe API calls (200-500ms)
- **Webhook-Driven**: Stripe webhooks automatically update local cache
- **Race Condition Safe**: Timestamp-based conflict resolution prevents stale data
- **Database-Enforced**: Row Level Security (RLS) policies use cache for access control

---

## Database Schema

### Core Tables

#### 1. `users` Table
Primary user information linked to Supabase Auth.

```sql
users (
  id UUID PRIMARY KEY,                    -- Supabase auth.users.id
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  country TEXT,

  -- Stripe References
  stripe_customer_id TEXT UNIQUE,         -- Links to Stripe Customer

  -- Audit
  subscription_started_at TIMESTAMPTZ,    -- First subscription date
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Key Points:**
- `stripe_customer_id` is set during `checkout.session.completed` webhook
- One user can have one Stripe customer ID
- User is created BEFORE subscription (during payment)

#### 2. `subscription_cache` Table
Denormalized subscription data for fast access control.

```sql
subscription_cache (
  user_id UUID PRIMARY KEY,               -- One subscription per user
  stripe_subscription_id TEXT UNIQUE,     -- Stripe Subscription ID
  stripe_customer_id TEXT NOT NULL,       -- Stripe Customer ID

  -- Cached Subscription Data
  status TEXT NOT NULL,                   -- active, trialing, past_due, canceled, etc.
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,         -- Key for access expiration
  cancel_at_period_end BOOLEAN,           -- User cancelled but still has access

  -- Sync Metadata
  stripe_updated_at TIMESTAMPTZ,          -- Prevents stale updates
  last_webhook_at TIMESTAMPTZ,            -- Debug webhook timing

  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Key Points:**
- **One-to-one** relationship: `user_id` is PRIMARY KEY
- Updated automatically by Stripe webhooks
- `current_period_end` determines access expiration
- `stripe_updated_at` prevents out-of-order webhook updates

#### 3. `stripe_events` Table
Event log for idempotency and debugging.

```sql
stripe_events (
  id TEXT PRIMARY KEY,                    -- Stripe event ID
  type TEXT NOT NULL,                     -- checkout.session.completed, etc.
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  data JSONB NOT NULL,                    -- Full Stripe event payload
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
)
```

**Key Points:**
- Prevents duplicate webhook processing (idempotency)
- Stores full event payload for debugging
- Tracks retry attempts and failures

---

## Subscription Cache Logic

### How It Works

The `subscription_cache` table is populated and updated by the `update_subscription_cache()` database function, called from Stripe webhooks.

### Database Function

```sql
CREATE FUNCTION update_subscription_cache(
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_cancel_at_period_end BOOLEAN DEFAULT false,
  p_stripe_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Step 1: Find user by stripe_customer_id
  SELECT id INTO target_user_id
  FROM users
  WHERE stripe_customer_id = p_stripe_customer_id;

  -- Step 2: Fail gracefully if user doesn't exist
  IF target_user_id IS NULL THEN
    RAISE WARNING 'User not found for stripe_customer_id: %', p_stripe_customer_id;
    RETURN;
  END IF;

  -- Step 3: Upsert subscription cache with race condition protection
  INSERT INTO subscription_cache (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    stripe_updated_at,
    last_webhook_at
  )
  VALUES (
    target_user_id,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_stripe_updated_at,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    stripe_updated_at = EXCLUDED.stripe_updated_at,
    last_webhook_at = EXCLUDED.last_webhook_at,
    updated_at = NOW()
  -- Only update if incoming data is newer (prevents stale updates)
  WHERE subscription_cache.stripe_updated_at <= EXCLUDED.stripe_updated_at;
END;
$$ LANGUAGE plpgsql;
```

### Race Condition Protection

Webhooks can arrive **out of order**. The function handles this with timestamp comparison:

```sql
WHERE subscription_cache.stripe_updated_at <= EXCLUDED.stripe_updated_at
```

**Example:**
```
Time 10:00 → subscription.updated (newer, stripe_updated_at = 10:00)
Time 09:59 → subscription.created (older, stripe_updated_at = 09:59)

If created webhook arrives AFTER updated webhook:
- Check: 10:00 <= 09:59? NO
- Action: Skip update (keep newer data)
```

---

## User Lifecycle

### Phase 1: Payment & User Creation

**Webhook:** `checkout.session.completed`

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // STEP 1: Create Supabase auth user
  const { data: user } = await supabase.auth.admin.createUser({
    email: session.customer_details.email,
    email_confirm: true // Auto-confirm, they paid
  });

  // STEP 2: Insert into users table
  await supabase.from('users').upsert({
    id: user.id,
    email: session.customer_details.email,
    stripe_customer_id: session.customer // CRITICAL: Links to Stripe
  });

  // STEP 3: Send welcome email with magic link
  // ... (handled by integrations)
}
```

**Result:** User account exists, but NO subscription_cache entry yet

### Phase 2: Subscription Activation

**Webhook:** `customer.subscription.created` (~1-2 seconds after checkout)

```typescript
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await supabase.rpc('update_subscription_cache', {
    p_stripe_subscription_id: subscription.id,
    p_stripe_customer_id: subscription.customer,
    p_status: 'active',
    p_current_period_start: new Date(subscription.current_period_start * 1000),
    p_current_period_end: new Date(subscription.current_period_end * 1000),
    p_cancel_at_period_end: false,
    p_stripe_updated_at: new Date(subscription.created * 1000)
  });
}
```

**Result:**
- Finds user by `stripe_customer_id`
- Creates `subscription_cache` entry
- User now has access to premium content

### Phase 3: Active Subscription

User has full access while:
```sql
status IN ('active', 'trialing')
AND current_period_end > NOW()
```

---

## Access Control

### Row Level Security (RLS)

Premium content uses `subscription_cache` for access control:

```sql
CREATE POLICY "Videos require subscription access" ON videos
  FOR SELECT USING (
    CASE
      -- Public videos
      WHEN is_public = true THEN true

      -- Free videos
      WHEN requires_subscription = false THEN true

      -- Premium videos (check subscription)
      WHEN requires_subscription = true THEN
        EXISTS (
          SELECT 1 FROM subscription_cache
          WHERE user_id = auth.uid()
          AND status IN ('active', 'trialing')
          AND current_period_end > NOW()
        )

      ELSE false
    END
  );
```

### Helper Functions

**Check if user has active subscription:**

```sql
CREATE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscription_cache
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

**Get user subscription status:**

```sql
CREATE FUNCTION get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_subscription BOOLEAN,
  status TEXT,
  period_end TIMESTAMPTZ,
  will_cancel BOOLEAN
) AS $$
  SELECT
    true as has_subscription,
    status,
    current_period_end as period_end,
    cancel_at_period_end as will_cancel
  FROM subscription_cache
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Webhook Flow

### Complete Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Completes Payment in Stripe Checkout               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. checkout.session.completed                               │
│    ├─ Create auth user (supabase.auth.admin.createUser)    │
│    ├─ Upsert users table (with stripe_customer_id)         │
│    ├─ Generate magic link                                   │
│    └─ Send welcome email (Resend)                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ ~1-2 seconds delay
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. customer.subscription.created                            │
│    └─ Call update_subscription_cache()                      │
│       ├─ Find user by stripe_customer_id                    │
│       └─ Insert subscription_cache entry                    │
│          └─ User now has access!                            │
└─────────────────────────────────────────────────────────────┘
```

### Subscription Lifecycle Events

| Stripe Event | Webhook Handler | subscription_cache Update |
|--------------|-----------------|---------------------------|
| `checkout.session.completed` | `handleCheckoutCompleted()` | None (user created, cache comes next) |
| `customer.subscription.created` | `handleSubscriptionCreated()` | Insert new subscription |
| `customer.subscription.updated` | `handleSubscriptionUpdated()` | Update status, period_end, etc. |
| `customer.subscription.deleted` | `handleSubscriptionDeleted()` | Set status='canceled' |

---

## Handling Changes

### User Cancels Subscription

**Webhook:** `customer.subscription.updated`

```typescript
// Stripe sends cancellation update
subscription.cancel_at_period_end = true
subscription.status = 'active' // Still active until period ends!

// Update cache
await supabase.rpc('update_subscription_cache', {
  p_status: 'active',
  p_cancel_at_period_end: true, // Flag set
  p_current_period_end: '2025-02-07T00:00:00Z'
});
```

**Access Control:**
```sql
-- User STILL has access
SELECT * FROM videos WHERE requires_subscription = true;
-- ✅ ALLOWED (status='active', period_end in future)
```

**After Period Ends:**

**Webhook:** `customer.subscription.deleted`

```typescript
await supabase.rpc('update_subscription_cache', {
  p_status: 'canceled',
  p_current_period_end: '2025-02-07T00:00:00Z' // Past date
});
```

**Access Control:**
```sql
-- User now BLOCKED
SELECT * FROM videos WHERE requires_subscription = true;
-- ❌ DENIED (status='canceled')
```

### Checking Cancellation Status

**Frontend Query:**
```typescript
const { data } = await supabase
  .rpc('get_user_subscription_status', { p_user_id: userId });

if (data.will_cancel) {
  // Show: "Your subscription will end on {period_end}"
  // Offer re-subscription option
}
```

**UI Example:**
```typescript
{data.will_cancel && (
  <Alert>
    Your subscription ends on {format(data.period_end, 'MMM d, yyyy')}.
    <Button onClick={handleResubscribe}>Continue Subscription</Button>
  </Alert>
)}
```

### User Upgrades Plan (Monthly → Annual)

**Stripe Behavior:**
- Stripe creates a NEW subscription
- Old subscription is cancelled immediately
- New subscription starts immediately with prorated credit

**Webhook Sequence:**

1. **`customer.subscription.created`** (new annual subscription)
```typescript
await supabase.rpc('update_subscription_cache', {
  p_stripe_subscription_id: 'sub_new_annual',
  p_status: 'active',
  p_current_period_end: '2026-01-07T00:00:00Z' // 1 year
});
```

2. **`customer.subscription.deleted`** (old monthly subscription)
```typescript
// No action needed - already replaced by new subscription
```

**Result:** User seamlessly upgraded, no access interruption

### Detecting Upgrades/Downgrades

**Method 1: Compare subscription IDs**
```typescript
// In handleSubscriptionCreated
const { data: existing } = await supabase
  .from('subscription_cache')
  .select('stripe_subscription_id')
  .eq('user_id', userId)
  .single();

if (existing && existing.stripe_subscription_id !== newSubscriptionId) {
  console.log('User upgraded/downgraded subscription');
  // Send notification email
}
```

**Method 2: Check metadata**
```typescript
// Store plan type in subscription metadata
const oldPlan = subscription.metadata.plan_type; // 'monthly'
const newPlan = newSubscription.metadata.plan_type; // 'annual'

if (oldPlan !== newPlan) {
  // Handle plan change
}
```

### Handling Failed Payments

**Webhook:** `customer.subscription.updated`

```typescript
// Stripe sets status to 'past_due'
subscription.status = 'past_due'

await supabase.rpc('update_subscription_cache', {
  p_status: 'past_due'
});
```

**Access Control:**
```sql
-- By default, past_due users are BLOCKED
status IN ('active', 'trialing') -- past_due NOT included
```

**Grace Period Option:**
```sql
-- Give 3 days grace period for payment issues
CREATE POLICY "Videos require subscription access" ON videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscription_cache
      WHERE user_id = auth.uid()
      AND (
        -- Active or trialing
        (status IN ('active', 'trialing') AND current_period_end > NOW())
        OR
        -- Grace period for past_due (3 days)
        (status = 'past_due' AND current_period_end > NOW() - INTERVAL '3 days')
      )
    )
  );
```

---

## Best Practices

### 1. Never Check Stripe API Directly

❌ **Bad:**
```typescript
// Slow (200-500ms), rate-limited, requires secret key
const subscription = await stripe.subscriptions.retrieve(subId);
if (subscription.status === 'active') { /* allow */ }
```

✅ **Good:**
```typescript
// Fast (5ms), database-enforced, uses RLS
const { data } = await supabase
  .from('videos')
  .select('*')
  .eq('requires_subscription', true);
// Access automatically denied if no active subscription
```

### 2. Trust the Cache

The cache is automatically updated by webhooks. **Don't** try to sync manually:

❌ **Bad:**
```typescript
// Manually syncing on every request
const subscription = await stripe.subscriptions.retrieve(subId);
await supabase.from('subscription_cache').update({
  status: subscription.status
});
```

✅ **Good:**
```typescript
// Let webhooks handle it automatically
// Just query the cache
const { data } = await supabase
  .from('subscription_cache')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### 3. Handle Webhook Delays

Users are created in `checkout.session.completed` but subscription_cache is populated in `customer.subscription.created` (~1-2 seconds later).

**Show temporary "Activating..." state:**
```typescript
const { data: user } = await supabase.auth.getUser();
const { data: subscription } = await supabase
  .from('subscription_cache')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (user && !subscription) {
  return <LoadingSpinner>Activating your subscription...</LoadingSpinner>;
}
```

### 4. Monitor Webhook Failures

Check `stripe_events` table for processing errors:

```sql
-- Find failed webhooks
SELECT id, type, processing_error, retry_count
FROM stripe_events
WHERE processing_error IS NOT NULL
ORDER BY created_at DESC;
```

### 5. User-Facing Subscription Info

Always use `get_user_subscription_status()` helper:

```typescript
const { data } = await supabase
  .rpc('get_user_subscription_status', {
    p_user_id: userId
  });

// Show subscription details
{data && (
  <div>
    <p>Status: {data.status}</p>
    <p>Renews: {format(data.period_end, 'MMM d, yyyy')}</p>
    {data.will_cancel && <p>⚠️ Will cancel on renewal date</p>}
  </div>
)}
```

### 6. Testing Scenarios

**Test these webhook scenarios:**

- ✅ New subscription (checkout → subscription.created)
- ✅ Monthly renewal (subscription.updated with new period_end)
- ✅ Cancellation (subscription.updated with cancel_at_period_end=true)
- ✅ Cancellation takes effect (subscription.deleted)
- ✅ Failed payment (subscription.updated with status=past_due)
- ✅ Payment recovered (subscription.updated with status=active)
- ✅ Plan upgrade (subscription.created + subscription.deleted)

**Use Stripe CLI for testing:**
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

---

## Summary

### Key Relationships

```
auth.users (Supabase Auth)
    ↓ (id)
users table
    ↓ (stripe_customer_id)
Stripe Customer
    ↓ (customer)
Stripe Subscription
    ↓ (webhooks)
subscription_cache
    ↓ (RLS policies)
Content Access
```

### Data Flow

1. **User pays** → `checkout.session.completed` → Create user + send email
2. **Stripe creates subscription** → `subscription.created` → Populate cache
3. **User accesses content** → RLS checks cache → Grant/deny access
4. **Subscription changes** → Webhooks → Update cache automatically
5. **User cancels** → Set `cancel_at_period_end` → Access until period_end
6. **Subscription ends** → `subscription.deleted` → Revoke access

### Performance Benefits

- **100x faster** access checks (5ms vs 500ms)
- **No API rate limits** (all database queries)
- **Database-enforced security** (RLS policies)
- **Automatic updates** (webhook-driven)
- **Race condition safe** (timestamp-based conflicts)

---

**Last Updated:** 2025-01-07
**Migration:** `supabase/migrations/20241230_subscription_architecture.sql`
**Webhook Handler:** `supabase/functions/stripe-webhook/index.ts`
