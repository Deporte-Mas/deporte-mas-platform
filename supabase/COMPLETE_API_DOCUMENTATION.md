# DeporteMás Platform - Complete API Documentation

> **Comprehensive API reference for all 45 edge functions with Web3 integration and traditional fallbacks**

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Authentication & User Management (3)](#authentication--user-management)
3. [Subscription Management (4)](#subscription-management)
4. [Streaming Management (6)](#streaming-management)
5. [Content Management (8)](#content-management)
6. [Points & Rewards (6)](#points--rewards)
7. [Giveaways (5)](#giveaways)
8. [Polls & Community (3)](#polls--community)
9. [Web3 Bridge (4)](#web3-bridge)
10. [Admin Functions (6)](#admin-functions)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## Authentication & Authorization

### Base URL
```
https://mvmbwhosxcivnjirbcdn.supabase.co/functions/v1
```

### Authentication Headers
All authenticated endpoints require:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Access Control Model
**Primary**: Stripe subscription status controls all platform access
**Enhancement**: Web3 components provide additional features for subscribed users

---

## Authentication & User Management

### 1. Validate Session
**Endpoint**: `POST /validate-session`
**Auth**: Required
**Purpose**: Validate JWT and return enriched user data

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "subscription_status": "active",
      "wallet_address": "0x...",
      "total_points_earned": 1250
    },
    "subscription": {
      "status": "active",
      "tier": "premium",
      "current_period_end": "2024-01-31T23:59:59Z"
    },
    "hasAccess": true,
    "features": {
      "web3_enabled": true,
      "can_chat": true,
      "can_access_premium": true
    }
  }
}
```

### 2. Link Wallet
**Endpoint**: `POST /link-wallet`
**Auth**: Required
**Purpose**: Create invisible Cavos wallet for user

**Request**:
```json
{
  "provider": "cavos",
  "recovery_method": "email"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "wallet": {
      "address": "0x...",
      "provider": "cavos",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "membership_nft": {
      "minted": true,
      "transaction_hash": "0x..."
    }
  }
}
```

### 3. Wallet Recovery
**Endpoint**: `POST /wallet-recovery`
**Auth**: Required
**Purpose**: Recover wallet access via email

**Request**:
```json
{
  "recovery_method": "email",
  "contact": "user@example.com"
}
```

---

## Subscription Management

### 4. Create Checkout
**Endpoint**: `POST /create-checkout`
**Auth**: Optional (can be used for new users)
**Purpose**: Create Stripe checkout session

**Request**:
```json
{
  "returnUrl": "https://deportemas.com/success",
  "planType": "monthly",
  "metadata": {
    "_fbp": "fb_browser_id",
    "_fbc": "fb_click_id"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "cs_test_...",
    "sessionId": "cs_test_..."
  }
}
```

### 5. Manage Billing
**Endpoint**: `POST /manage-billing`
**Auth**: Required
**Purpose**: Create Stripe customer portal session

**Request**:
```json
{
  "return_url": "https://deportemas.com/account"
}
```

### 6. Cancel Subscription
**Endpoint**: `POST /cancel-subscription`
**Auth**: Required
**Purpose**: Cancel subscription at period end

**Request**:
```json
{
  "action": "cancel",
  "reason": "User requested cancellation"
}
```

### 7. Reactivate Subscription
**Endpoint**: `POST /reactivate-subscription`
**Auth**: Required
**Purpose**: Reactivate canceled subscription

---

## Streaming Management

### 8. Stream Initialize
**Endpoint**: `POST /stream-initialize`
**Auth**: Admin only
**Purpose**: Create new live stream with RTMP credentials

**Request**:
```json
{
  "title": "Liga Nacional Analysis",
  "description": "Weekly analysis of Costa Rican football",
  "scheduled_start": "2024-01-15T20:00:00Z",
  "panelists": ["Carlos Rodriguez", "Maria Gonzalez"],
  "category": "match_analysis",
  "topics": ["tactics", "player_performance"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "uuid",
      "stream_key": "dk_abc123...",
      "rtmp_url": "rtmps://live.mux.com/live/...",
      "playback_url": "https://stream.mux.com/abc123.m3u8"
    },
    "instructions": {
      "rtmp_server": "rtmps://live.mux.com/live/...",
      "stream_key": "dk_abc123...",
      "software_settings": "Configure 1080p30, 3500 kbps..."
    }
  }
}
```

### 9. Stream Start
**Endpoint**: `POST /stream-start`
**Auth**: Admin only
**Purpose**: Mark stream as live and notify subscribers

### 10. Stream End
**Endpoint**: `POST /stream-end`
**Auth**: Admin only
**Purpose**: End stream and trigger VOD conversion

### 11. Stream Viewers
**Endpoint**: `GET /stream-viewers`
**Auth**: Admin only
**Purpose**: Get current viewer analytics

### 12. Stream Chat Send
**Endpoint**: `POST /stream-chat-send`
**Auth**: Required (Active subscription)
**Purpose**: Send chat message during live stream

**Request**:
```json
{
  "stream_id": "uuid",
  "content": "Great analysis!",
  "reply_to": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "content": "Great analysis!",
      "user": {
        "name": "User Name",
        "team_badges": ["CR", "LDA"]
      },
      "created_at": "2024-01-15T20:30:00Z"
    },
    "points_earned": 5,
    "rate_limit": {
      "remaining": 9,
      "reset_time": "2024-01-15T20:31:00Z"
    }
  }
}
```

### 13. Stream Chat Moderate
**Endpoint**: `DELETE /stream-chat-moderate`
**Auth**: Moderator role
**Purpose**: Moderate chat messages

---

## Content Management

### 14. Content Upload Initialize
**Endpoint**: `POST /content-upload-initialize`
**Auth**: Admin only
**Purpose**: Initialize video upload with Mux

**Request**:
```json
{
  "title": "Tactical Analysis: 4-3-3 Formation",
  "description": "Deep dive into modern 4-3-3",
  "type": "analysis",
  "category": "tactical_analysis",
  "is_premium": true,
  "points_cost": 100
}
```

### 15. Content Upload Complete
**Endpoint**: `POST /content-upload-complete`
**Auth**: Webhook signature verification
**Purpose**: Handle Mux upload completion

### 16. Content Publish
**Endpoint**: `POST /content-publish`
**Auth**: Admin only
**Purpose**: Publish content from draft

### 17. Content View
**Endpoint**: `POST /content-view`
**Auth**: Required
**Purpose**: Track viewing progress and award points

### 18. Content Search
**Endpoint**: `GET /content-search`
**Purpose**: Search content library

**Query Parameters**:
```
?q=tactical
&type=analysis
&category=tactical_analysis
&limit=20
&offset=0
&sort=recent
```

### 19. Content Recommendations
**Endpoint**: `GET /content-recommendations`
**Auth**: Required
**Purpose**: Get personalized recommendations

### 20. Content Collection Create
**Endpoint**: `POST /content-collection-create`
**Auth**: Admin only
**Purpose**: Create content collections

### 21. Content Collection Manage
**Endpoint**: `POST /content-collection-manage`
**Auth**: Admin only
**Purpose**: Add/remove content from collections

---

## Points & Rewards

### 22. Points Balance
**Endpoint**: `GET /points-balance`
**Auth**: Required
**Purpose**: Get current point balance

**Response**:
```json
{
  "success": true,
  "data": {
    "current_balance": 1250,
    "total_earned": 2400,
    "total_spent": 1150,
    "daily_yield_rate": 30,
    "recent_transactions": [
      {
        "amount": 30,
        "type": "yield",
        "description": "Daily yield",
        "created_at": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

### 23. Points History
**Endpoint**: `GET /points-history`
**Auth**: Required
**Purpose**: Get detailed transaction history

### 24. Points Daily Yield
**Endpoint**: `POST /points-daily-yield`
**Auth**: System only (CRON)
**Purpose**: Distribute daily yield to active subscribers

### 25. Points Engagement Reward
**Endpoint**: `POST /points-engagement-reward`
**Auth**: System only
**Purpose**: Award points for verified activities

### 26. Points Spend
**Endpoint**: `POST /points-spend`
**Auth**: Required
**Purpose**: Deduct points for purchases

**Request**:
```json
{
  "amount": 100,
  "purpose": "giveaway_entry",
  "reference_id": "giveaway_uuid"
}
```

### 27. Points Refund
**Endpoint**: `POST /points-refund`
**Auth**: Admin only
**Purpose**: Refund points for failed transactions

---

## Giveaways

### 28. Giveaway List
**Endpoint**: `GET /giveaway-list`
**Purpose**: Get active and upcoming giveaways

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Signed Jersey Giveaway",
      "description": "Official LDA jersey signed by the team",
      "prize_type": "physical",
      "ends_at": "2024-01-31T23:59:59Z",
      "total_entries": 247,
      "user_entries": 5,
      "max_entries_per_user": 10,
      "points_per_entry": 100
    }
  ]
}
```

### 29. Giveaway Create
**Endpoint**: `POST /giveaway-create`
**Auth**: Admin only
**Purpose**: Create new giveaway

### 30. Giveaway Enter
**Endpoint**: `POST /giveaway-enter`
**Auth**: Required (Active subscription)
**Purpose**: Enter giveaway with points

**Request**:
```json
{
  "giveaway_id": "uuid",
  "additional_entries": 5
}
```

### 31. Giveaway Select Winner
**Endpoint**: `POST /giveaway-select-winner`
**Auth**: System only
**Purpose**: Use VRF for fair winner selection

### 32. Giveaway Claim
**Endpoint**: `POST /giveaway-claim`
**Auth**: Required (Winner only)
**Purpose**: Winner claims prize

---

## Polls & Community

### 33. Poll Create
**Endpoint**: `POST /poll-create`
**Auth**: Admin only
**Purpose**: Create community poll

**Request**:
```json
{
  "title": "Best Costa Rican Player of 2024?",
  "type": "multiple_choice",
  "options": [
    {"id": "1", "text": "Keylor Navas"},
    {"id": "2", "text": "Joel Campbell"},
    {"id": "3", "text": "Celso Borges"}
  ],
  "ends_at": "2024-01-31T23:59:59Z",
  "points_reward": 25
}
```

### 34. Poll Vote
**Endpoint**: `POST /poll-vote`
**Auth**: Required
**Purpose**: Submit poll vote

**Request**:
```json
{
  "poll_id": "uuid",
  "selected_options": ["1"],
  "comment": "Keylor is a legend!"
}
```

### 35. Poll Results
**Endpoint**: `GET /poll-results`
**Purpose**: Get poll results

---

## Web3 Bridge

### 36. Web3 Mint Membership
**Endpoint**: `POST /web3-mint-membership`
**Auth**: System only
**Purpose**: Mint membership NFT on subscription

### 37. Web3 Burn Membership
**Endpoint**: `POST /web3-burn-membership`
**Auth**: System only
**Purpose**: Burn membership NFT on cancellation

### 38. Web3 Batch Mint Points
**Endpoint**: `POST /web3-batch-mint-points`
**Auth**: System only
**Purpose**: Batch mint points for daily yield

### 39. Web3 Verify Activity
**Endpoint**: `POST /web3-verify-activity`
**Auth**: System only
**Purpose**: Generate proof for activity rewards

---

## Admin Functions

### 40. Admin Users List
**Endpoint**: `GET /admin-users-list`
**Auth**: Admin only
**Purpose**: List users with search and filters

**Query Parameters**:
```
?search=email@example.com
&subscription_status=active
&limit=50
&offset=0
```

### 41. Admin Users Update
**Endpoint**: `PATCH /admin-users-update`
**Auth**: Admin only
**Purpose**: Update user data

**Request**:
```json
{
  "user_id": "uuid",
  "updates": {
    "subscription_status": "active",
    "points_adjustment": 100,
    "banned": false
  },
  "reason": "Account correction"
}
```

### 42. Admin Content Moderate
**Endpoint**: `POST /admin-content-moderate`
**Auth**: Moderator role
**Purpose**: Moderate content

### 43. Admin Analytics Dashboard
**Endpoint**: `GET /admin-analytics-dashboard`
**Auth**: Admin only
**Purpose**: Get platform metrics

**Response**:
```json
{
  "success": true,
  "data": {
    "subscriptions": {
      "active": 1247,
      "new_this_month": 156,
      "churn_rate": 3.2,
      "mrr": 12470000
    },
    "engagement": {
      "dau": 892,
      "average_session_time": 2340,
      "content_completion_rate": 78.5
    },
    "points": {
      "total_distributed": 2456780,
      "total_spent": 892345,
      "points_per_user_avg": 1247
    }
  }
}
```

### 44. Admin Facebook Sync
**Endpoint**: `POST /admin-facebook-sync`
**Auth**: System only (CRON)
**Purpose**: Sync Facebook group membership

### 45. Admin Giveaway Analytics
**Endpoint**: `GET /admin-giveaway-analytics`
**Auth**: Admin only
**Purpose**: Get giveaway performance metrics

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `SUBSCRIPTION_REQUIRED` | Active subscription required | 403 |
| `SUBSCRIPTION_EXPIRED` | Subscription has expired | 403 |
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `RESOURCE_NOT_FOUND` | Requested resource not found | 404 |
| `METHOD_NOT_ALLOWED` | HTTP method not supported | 405 |
| `INTERNAL_ERROR` | Server error | 500 |

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_email"
    }
  ]
}
```

---

## Rate Limiting

### Default Limits

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Chat messages | 10 requests | 1 minute |
| Content uploads | 5 requests | 1 hour |
| Poll voting | 100 requests | 1 hour |
| General API | 1000 requests | 1 hour |
| Admin endpoints | 500 requests | 1 hour |

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1641234567
```

### Rate Limit Response
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "resetTime": "2024-01-15T20:31:00Z"
}
```

---

## Web3 Integration Notes

### Invisible Design Principles
1. **User Experience**: Users see "points earned" not "tokens minted"
2. **Automatic Operations**: All blockchain transactions are sponsored and automatic
3. **Fallback Systems**: Traditional database operations when blockchain unavailable
4. **Primary Control**: Stripe subscription status always determines access

### Smart Contract Interactions
- **Membership NFTs**: Minted/burned automatically on subscription changes
- **Points Tokens**: Minted for engagement, burned for spending
- **VRF Giveaways**: Verifiable random winner selection
- **Yield Distribution**: Daily point accumulation based on membership duration

### Web3 Status Indicators
- `web3_enabled`: Boolean indicating if Web3 features are active
- `wallet_address`: User's blockchain wallet (if created)
- `blockchain_tx_hash`: Transaction hashes for transparency (optional)

---

## Environment Configuration

### Required Environment Variables

```bash
# Supabase
SUPABASE_URL=https://mvmbwhosxcivnjirbcdn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_TEST_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Mux Video
MUX_TOKEN_ID=mux_token_id
MUX_TOKEN_SECRET=mux_token_secret
MUX_WEBHOOK_SECRET=mux_webhook_secret

# Web3 (Cavos SDK)
CAVOS_API_KEY=cavos_api_key
MEMBERSHIP_NFT_CONTRACT=0x...
DEPORTE_POINTS_CONTRACT=0x...
YIELD_ENGINE_CONTRACT=0x...

# Facebook Integration
FACEBOOK_ACCESS_TOKEN=facebook_token
FACEBOOK_GROUP_ID=group_id
META_ACCESS_TOKEN=meta_token
META_PIXEL_ID=pixel_id

# Feature Flags
VITE_DEV_MODE=false  # true for development
```

---

**Built for Costa Rican football culture. Powered by invisible Web3 innovation.**

*This API provides the complete foundation for transforming Costa Rican sports engagement while demonstrating practical blockchain applications at scale.*