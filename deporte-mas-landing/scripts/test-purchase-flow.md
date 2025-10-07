# Stripe Purchase Flow Testing Guide

This guide provides step-by-step instructions for testing the complete Stripe purchase flow.

## Prerequisites

1. ✅ All environment variables configured (run `node scripts/test-stripe-config.js`)
2. ✅ Stripe products and prices created in Stripe Dashboard
3. ✅ Webhook endpoint configured in Stripe Dashboard
4. ✅ Local development environment running

## Test Environment Setup

### 1. Start Development Environment

```bash
# Start the landing page
cd deporte-mas-landing
npm run dev

# Start Supabase locally (optional)
supabase start

# Start webhook forwarding (in separate terminal)
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
```

### 2. Configure Test Mode

Ensure `VITE_DEV_MODE=true` in your `.env` file.

## Test Cases

### Test Case 1: Monthly Subscription

1. **Navigate to pricing section**
   - Go to `http://localhost:5173/#pricing`
   - Verify pricing displays correctly ($20/month)

2. **Click Monthly Plan Button**
   - Click "COMENZAR AHORA" on monthly plan
   - ✅ Modal should open with loading state
   - ✅ Facebook Lead tracking should fire (check console)

3. **Complete Checkout**
   - Use test card: `4242424242424242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Fill billing information
   - ✅ Checkout should complete successfully

4. **Verify Database Updates**
   - Check Supabase database:
   ```sql
   SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;
   ```
   - ✅ User record created with subscription_status = 'active'
   - ✅ Subscription record created with status = 'active'

5. **Verify Webhook Processing**
   - Check Stripe CLI output for webhook events
   - ✅ `checkout.session.completed` processed
   - ✅ `customer.subscription.created` processed
   - ✅ `invoice.payment_succeeded` processed

### Test Case 2: Annual Subscription

Repeat Test Case 1 but:
- Click "AHORRAR $60 AHORA" button
- Verify annual pricing ($180/year)
- Check plan_type = 'annual' in database

### Test Case 3: Failed Payment

1. **Use declined test card**
   - Card: `4000000000000002`
   - ✅ Payment should be declined
   - ✅ User should see error message
   - ✅ No database records created

### Test Case 4: 3D Secure Authentication

1. **Use 3D Secure test card**
   - Card: `4000002500003155`
   - ✅ 3D Secure challenge should appear
   - Complete authentication
   - ✅ Payment should succeed after authentication

### Test Case 5: Webhook Failure Recovery

1. **Simulate webhook failure**
   - Temporarily stop webhook forwarding
   - Complete a purchase
   - ✅ Checkout completes but no database update

2. **Replay webhook**
   - Restart webhook forwarding
   - Replay webhook from Stripe Dashboard
   - ✅ Database should update correctly

## Integration Tests

### Meta Conversion API

1. **Check InitiateCheckout Event**
   - Open browser dev tools
   - Click purchase button
   - ✅ InitiateCheckout event sent (check network tab)

2. **Check Subscribe Event**
   - Complete purchase
   - ✅ Subscribe event sent via webhook
   - Check Meta Events Manager for events

### Zapier Integration

1. **Complete purchase**
   - ✅ Zapier webhook should fire (if configured)
   - Check Zapier history for webhook delivery

## Production Testing

### Before Going Live

1. **Switch to production mode**
   ```bash
   # Update environment variables
   VITE_DEV_MODE=false
   # Update to live Stripe keys and product IDs
   ```

2. **Test with small real transaction**
   - Use real payment method with small amount
   - ✅ Complete full purchase flow
   - ✅ Verify live webhook delivery
   - ✅ Refund test transaction

### Monitoring

1. **Set up monitoring**
   - Stripe Dashboard: Monitor payments and subscriptions
   - Supabase: Monitor edge function logs
   - Database: Monitor user creation and subscription status

2. **Test failure scenarios**
   - Network timeouts
   - Invalid webhook signatures
   - Database connection issues

## Troubleshooting

### Common Issues

1. **"Missing Stripe price ID" error**
   - ✅ Check environment variables are set correctly
   - ✅ Verify price IDs exist in Stripe Dashboard

2. **Webhook not firing**
   - ✅ Check webhook endpoint URL
   - ✅ Verify webhook events are selected
   - ✅ Check webhook signature configuration

3. **Database not updating**
   - ✅ Check Supabase service role key
   - ✅ Verify database table structure
   - ✅ Check edge function logs

4. **Frontend checkout not loading**
   - ✅ Check publishable key configuration
   - ✅ Verify Supabase URL and anon key
   - ✅ Check browser console for errors

### Debug Commands

```bash
# Check Supabase edge function logs
supabase functions logs --f stripe-webhook

# Test Stripe CLI
stripe listen --events checkout.session.completed

# Verify webhook signature
stripe webhook sign --payload test-payload --secret whsec_test_...
```

## Success Criteria

- ✅ Both monthly and annual plans work correctly
- ✅ User records created with proper subscription status
- ✅ All webhook events processed successfully
- ✅ Third-party integrations (Meta, Zapier) working
- ✅ Error handling works for failed payments
- ✅ Production mode tested and verified

## Security Checklist

- ✅ Webhook signatures verified
- ✅ No secret keys exposed in frontend
- ✅ Database RLS policies working
- ✅ HTTPS used for all endpoints
- ✅ Environment variables secured