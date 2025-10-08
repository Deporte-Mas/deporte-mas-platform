# Webhook Flows & Scenarios

Complete guide to all subscription scenarios and how they're handled.

## Stripe Events We Handle

### Core Events (Required)

| Event | Handler | Purpose |
|-------|---------|---------|
| `checkout.session.completed` | `handleCheckoutCompleted()` | Create user account + send welcome email |
| `customer.subscription.created` | `handleSubscriptionCreated()` | Populate subscription_cache |
| `customer.subscription.updated` | `handleSubscriptionUpdated()` | Update subscription status/dates |
| `customer.subscription.deleted` | `handleSubscriptionDeleted()` | Mark subscription as canceled |

### Why We Don't Need Other Events

| Event | Why Not Needed |
|-------|----------------|
| `invoice.payment_succeeded` | ✅ Already handled by `subscription.updated` (status updated automatically) |
| `invoice.payment_failed` | ✅ Already handled by `subscription.updated` (status → `past_due`) |
| `customer.subscription.paused` | ✅ Already handled by `subscription.updated` (status → `paused`) |
| `customer.subscription.resumed` | ✅ Already handled by `subscription.updated` (status → `active`) |
| `customer.subscription.trial_will_end` | ℹ️ Optional notification event (not needed for access control) |

**Key Insight:** Stripe sends `subscription.updated` for ALL status changes, so we don't need to listen to individual payment/pause/resume events.

---

## Subscription Lifecycle Scenarios

### 1. New Subscription (Happy Path)

**User Action:** Completes payment in Stripe Checkout

**Webhook Sequence:**

```
Step 1: checkout.session.completed
├─ Webhook arrives ~1 second after payment
├─ Create auth user (email_confirm: true)
├─ Insert users table (with stripe_customer_id)
├─ Generate magic link
└─ Send welcome email (with retry)

Step 2: customer.subscription.created (~1-2 seconds later)
├─ Webhook arrives after Stripe creates subscription
├─ Call update_subscription_cache()
│  ├─ Find user by stripe_customer_id
│  └─ Insert subscription_cache entry
└─ User now has access!

Result:
✅ User account created
✅ Email sent
✅ subscription_cache populated
✅ Access granted
```

**Database State:**
```sql
-- users table
{
  id: uuid,
  email: "user@example.com",
  stripe_customer_id: "cus_xxx"
}

-- subscription_cache table
{
  user_id: uuid,
  stripe_subscription_id: "sub_xxx",
  stripe_customer_id: "cus_xxx",
  status: "active",
  current_period_end: "2025-02-07T00:00:00Z",
  cancel_at_period_end: false
}
```

---

### 2. Monthly Renewal

**Stripe Behavior:** On renewal date, Stripe charges card and extends subscription

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "active" (unchanged)
├─ current_period_start: "2025-02-07T00:00:00Z" (new period)
└─ current_period_end: "2025-03-07T00:00:00Z" (extended 1 month)

update_subscription_cache()
├─ Update current_period_start
├─ Update current_period_end
└─ Access extended for another month
```

**Result:** ✅ Seamless renewal, access continues

---

### 3. User Cancels Subscription

**User Action:** Clicks "Cancel" in billing portal

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "active" (still active!)
├─ cancel_at_period_end: true (flagged for cancellation)
└─ current_period_end: "2025-02-07T00:00:00Z" (unchanged)

update_subscription_cache()
├─ Update cancel_at_period_end = true
└─ Access continues until period_end
```

**Access Control:**
```sql
-- User STILL has access
SELECT * FROM videos WHERE requires_subscription = true;
-- ✅ ALLOWED (status='active', period_end > NOW())
```

**Database State:**
```sql
{
  status: "active",
  cancel_at_period_end: true,  ← Flagged
  current_period_end: "2025-02-07T00:00:00Z"
}
```

**UI Example:**
```typescript
const { data } = await supabase
  .rpc('get_user_subscription_status', { p_user_id: userId });

if (data.will_cancel) {
  return (
    <Alert>
      Your subscription ends on {formatDate(data.period_end)}.
      <Button onClick={reactivate}>Continue Subscription</Button>
    </Alert>
  );
}
```

---

### 4. Cancellation Takes Effect

**Stripe Behavior:** On period end date, Stripe deletes subscription

**Webhook Sequence:**

```
customer.subscription.deleted
├─ Sent on period_end date (e.g., 2025-02-07)
└─ Subscription no longer exists in Stripe

update_subscription_cache()
├─ status = "canceled"
└─ Access revoked
```

**Access Control:**
```sql
-- User now BLOCKED
SELECT * FROM videos WHERE requires_subscription = true;
-- ❌ DENIED (status='canceled')
```

**Database State:**
```sql
{
  status: "canceled",  ← Changed
  cancel_at_period_end: true,
  current_period_end: "2025-02-07T00:00:00Z"  ← Past date
}
```

---

### 5. User Reactivates Before Period Ends

**User Action:** Clicks "Resume Subscription" before cancellation takes effect

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "active"
├─ cancel_at_period_end: false (cancellation cancelled!)
└─ current_period_end: "2025-02-07T00:00:00Z"

update_subscription_cache()
├─ Update cancel_at_period_end = false
└─ Will renew normally on period_end
```

**Result:** ✅ Subscription continues, will renew on next period

---

### 6. Failed Payment (Renewal)

**Stripe Behavior:** Card is declined on renewal date

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "past_due" (payment failed)
├─ current_period_end: "2025-02-07T00:00:00Z" (unchanged)
└─ Stripe will retry payment

update_subscription_cache()
├─ Update status = "past_due"
└─ Access revoked (by default)
```

**Access Control (Strict):**
```sql
-- User BLOCKED immediately
status IN ('active', 'trialing')  -- past_due NOT included
-- ❌ DENIED
```

**Access Control (Grace Period - Optional):**
```sql
-- Give 3-day grace period
CREATE POLICY "Videos with grace period" ON videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscription_cache
      WHERE user_id = auth.uid()
      AND (
        (status IN ('active', 'trialing') AND current_period_end > NOW())
        OR
        (status = 'past_due' AND current_period_end > NOW() - INTERVAL '3 days')
      )
    )
  );
-- ✅ ALLOWED for 3 days
```

**Database State:**
```sql
{
  status: "past_due",  ← Changed
  current_period_end: "2025-02-07T00:00:00Z"
}
```

---

### 7. Payment Recovered

**Stripe Behavior:** User updates card, payment succeeds

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "active" (recovered!)
├─ current_period_end: "2025-02-07T00:00:00Z"
└─ Normal billing cycle resumes

update_subscription_cache()
├─ Update status = "active"
└─ Access restored
```

**Result:** ✅ Access immediately restored

---

### 8. Plan Upgrade (Monthly → Annual)

**Stripe Behavior:**
- Creates NEW subscription (annual)
- Cancels OLD subscription (monthly)
- Prorates credit from old subscription

**Webhook Sequence:**

```
Step 1: customer.subscription.created (new annual)
├─ stripe_subscription_id: "sub_new_annual"
├─ status: "active"
└─ current_period_end: "2026-01-07T00:00:00Z" (1 year!)

update_subscription_cache()
├─ UPSERT with new subscription_id
├─ ON CONFLICT (user_id) DO UPDATE
└─ Replaces old subscription

Step 2: customer.subscription.deleted (old monthly)
├─ stripe_subscription_id: "sub_old_monthly"
└─ Subscription already replaced, no action needed
```

**Result:** ✅ Seamless upgrade, access continues with new period_end

**Detecting Upgrades:**
```typescript
async function handleSubscriptionCreated(subscription, supabase) {
  // Check if user already has a subscription
  const { data: existing } = await supabase
    .from('subscription_cache')
    .select('stripe_subscription_id, current_period_end')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (existing && existing.stripe_subscription_id !== subscription.id) {
    console.log('User upgraded/downgraded plan');

    // Optional: Send notification
    const oldEnd = new Date(existing.current_period_end);
    const newEnd = new Date(subscription.current_period_end * 1000);

    if (newEnd > oldEnd) {
      console.log('Upgrade detected: period extended');
    } else {
      console.log('Downgrade detected: period shortened');
    }
  }

  // Update cache (same code as before)
  await supabase.rpc('update_subscription_cache', { ... });
}
```

---

### 9. Plan Downgrade (Annual → Monthly)

**Stripe Behavior:** Similar to upgrade, but with different timing

**Option A: Immediate Downgrade**
- Creates new monthly subscription immediately
- Prorates refund for unused annual time

**Option B: Downgrade at Period End**
- Old annual subscription continues until period_end
- New monthly subscription starts on period_end
- No proration

**Webhook Sequence (Option A - Immediate):**

```
Step 1: customer.subscription.created (new monthly)
├─ current_period_end: "2025-02-07T00:00:00Z" (1 month)
└─ Replaces annual subscription

Step 2: customer.subscription.deleted (old annual)
└─ Old subscription cancelled
```

**Webhook Sequence (Option B - At Period End):**

```
Step 1: customer.subscription.updated (old annual)
├─ status: "active"
├─ cancel_at_period_end: true
└─ schedule_to_cancel_at: "2025-12-07T00:00:00Z"

(On period end date)

Step 2: customer.subscription.deleted (old annual)
Step 3: customer.subscription.created (new monthly)
└─ New subscription starts
```

**Result:** ✅ Both options handled correctly by our webhook logic

---

### 10. Subscription Paused

**Stripe Behavior:** User pauses billing (requires special Stripe configuration)

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "paused"
├─ pause_collection: { behavior: "void" }
└─ current_period_end: unchanged

update_subscription_cache()
├─ Update status = "paused"
└─ Access revoked (status not in 'active'/'trialing')
```

**Access Control:**
```sql
-- User BLOCKED (paused not in allowed statuses)
status IN ('active', 'trialing')
-- ❌ DENIED
```

**Optional: Allow Access During Pause:**
```sql
-- If you want paused users to keep access
status IN ('active', 'trialing', 'paused')
-- ✅ ALLOWED
```

---

### 11. Subscription Resumed from Pause

**Webhook Sequence:**

```
customer.subscription.updated
├─ status: "active"
├─ pause_collection: null (removed)
└─ Billing resumes

update_subscription_cache()
├─ Update status = "active"
└─ Access restored
```

**Result:** ✅ Access immediately restored

---

## Race Conditions & Edge Cases

### Race Condition: Out-of-Order Webhooks

**Scenario:** Webhooks arrive in wrong order

```
Time 10:00 → subscription.updated (newer)
Time 09:59 → subscription.created (older)

If created arrives AFTER updated:
```

**Protection:**
```sql
-- In update_subscription_cache()
WHERE subscription_cache.stripe_updated_at <= EXCLUDED.stripe_updated_at
-- Only update if incoming data is newer
```

**Result:** ✅ Stale data is ignored

---

### Edge Case: User Deleted Before Subscription Webhook

**Scenario:**
1. User pays → `checkout.session.completed` creates user
2. User account manually deleted (admin action)
3. `subscription.created` webhook arrives

**Protection:**
```sql
-- In update_subscription_cache()
IF target_user_id IS NULL THEN
  RAISE WARNING 'User not found for stripe_customer_id: %', p_stripe_customer_id;
  RETURN;
END IF;
```

**Result:** ✅ Webhook fails gracefully with warning, no error thrown

---

### Edge Case: Duplicate Webhook Delivery

**Scenario:** Stripe sends same webhook twice (network retry)

**Protection:**
```typescript
// In stripe-webhook handler
const { data: existingEvent } = await supabase
  .from('stripe_events')
  .select('processed')
  .eq('id', event.id)
  .single();

if (existingEvent?.processed) {
  console.log('Event already processed, skipping');
  return { received: true, already_processed: true };
}
```

**Result:** ✅ Duplicate webhooks are idempotent

---

## Status Reference

### Subscription Statuses

| Status | Meaning | Access Granted? | Common Transitions |
|--------|---------|-----------------|-------------------|
| `active` | Subscription active, payment succeeded | ✅ Yes | → `past_due` (payment fails)<br>→ `canceled` (period ends after cancel) |
| `trialing` | Free trial period | ✅ Yes | → `active` (trial ends, payment succeeds)<br>→ `incomplete_expired` (trial ends, no payment) |
| `past_due` | Payment failed, retrying | ❌ No (strict)<br>✅ Yes (with grace period) | → `active` (payment recovered)<br>→ `canceled` (all retries failed) |
| `canceled` | Subscription ended | ❌ No | Terminal state |
| `incomplete` | Initial payment pending | ❌ No | → `active` (payment succeeds)<br>→ `incomplete_expired` (timeout) |
| `incomplete_expired` | Initial payment failed | ❌ No | Terminal state |
| `unpaid` | All payment retries failed | ❌ No | → `active` (payment recovered)<br>→ `canceled` (manual intervention) |
| `paused` | Billing paused | ❌ No (default)<br>✅ Yes (optional) | → `active` (resumed) |

---

## Verification Checklist

### Testing All Scenarios

Use Stripe CLI to test each scenario:

```bash
# Setup
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Test scenarios
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted

# Test specific status changes
stripe trigger customer.subscription.updated --add subscription:status=past_due
stripe trigger customer.subscription.updated --add subscription:cancel_at_period_end=true
```

### Checklist

- ✅ New subscription (checkout → subscription.created)
- ✅ Monthly/annual renewal (subscription.updated)
- ✅ User cancels (cancel_at_period_end = true)
- ✅ Cancellation takes effect (subscription.deleted)
- ✅ User reactivates before period ends
- ✅ Failed payment (status → past_due)
- ✅ Payment recovered (status → active)
- ✅ Plan upgrade (new subscription.created)
- ✅ Plan downgrade (new subscription.created + old deleted)
- ✅ Subscription paused (status → paused)
- ✅ Subscription resumed (status → active)
- ✅ Duplicate webhooks (idempotency check)
- ✅ Out-of-order webhooks (timestamp check)

---

## Summary

### Events We Handle

✅ **4 core events** cover all subscription scenarios:
1. `checkout.session.completed` - User creation
2. `subscription.created` - Cache population
3. `subscription.updated` - All status changes
4. `subscription.deleted` - Final cancellation

### Why This Works

- **`subscription.updated` is the key**: Stripe sends this for ALL changes (renewals, cancellations, payment failures, plan changes, pauses, resumes)
- **Status field drives access control**: Simple check of `status IN ('active', 'trialing')`
- **Race condition protection**: Timestamp-based updates prevent stale data
- **Idempotency**: `stripe_events` table prevents duplicate processing

### Access Control Formula

```sql
has_access = (
  status IN ('active', 'trialing')
  AND current_period_end > NOW()
)
```

That's it! All subscription scenarios are covered. 🚀

---

**Last Updated:** 2025-01-07
**Webhook Handler:** `supabase/functions/stripe-webhook/index.ts`
