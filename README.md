# DeporteMas Platform

> **Transforming Costa Rica's most beloved sports program into an intimate digital community where legendary players and passionate fans experience football together every day—powered by invisible Web3 technology.**

## 🌟 Key Innovation: Invisible Blockchain

DeporteMas pioneered the **"Invisible Web3"** approach: users earn blockchain tokens, own NFTs, and participate in provably fair giveaways—**without ever knowing they're using blockchain technology**.

- **What users see:** "You earned 150 points today!"
- **What's happening:** ERC-20 tokens minted on Starknet
- **Why it matters:** True ownership, transparent fairness, and automatic rewards—all without crypto complexity

**Powered by Starknet** for scalable, low-cost blockchain operations with account abstraction.

---

## 🏗️ Project Structure

This repository contains the complete **DeporteMas Digital Platform** organized as a simple monorepo:

```
deporte-mas-platform/
├── deporte-mas-landing/        # Landing page with Stripe payments & auth
├── deporte-mas-admin/          # Admin dashboard for user management
├── deporte-mas-mobile/         # Mobile app (React Native + Expo)
│   └── config/aegis.ts         # Aegis SDK for invisible Starknet wallets
├── deporte-mas-contracts/      # Smart contracts (Cairo on Starknet)
│   ├── src/contracts/          # Membership NFT, Points, Giveaways
│   ├── tests/                  # Contract tests (Starknet Foundry)
│   └── Scarb.toml             # Cairo package configuration
├── supabase/                   # Shared backend infrastructure
│   ├── functions/              # Edge functions for payments & webhooks
│   ├── migrations/             # Database schemas
│   └── config.toml            # Supabase configuration
└── docs/                       # Documentation & implementation guides
    ├── knowledge-library/
    │   ├── web3-angle.md      # Invisible Web3 vision
    │   ├── smart-contracts.md # Contract architecture
    │   └── backend-architecture.md # Full system design
```

---

## 🔗 Blockchain Architecture (Starknet)

### Three-Token System

1. **🎫 Membership NFT (Soulbound ERC-721)**
   - Non-transferable proof of active subscription
   - Auto-minted when Stripe payment succeeds
   - Auto-burned when subscription cancels
   - Tracks loyalty tier for yield calculations

2. **💎 DeportePoints (ERC-20)**
   - Platform currency earned through engagement
   - Daily automatic yield based on membership duration
   - Spent on giveaway entries, exclusive content, NFT collectibles
   - True ownership with on-chain balance

3. **🏆 Collectibles NFT (ERC-721)**
   - Achievement badges for milestones
   - Prize NFTs from giveaways
   - Exclusive access tokens
   - Tradeable collectibles (future)

### Integration Points

```
Stripe Payment → Supabase Webhook → Starknet Contract
    ↓
Membership NFT Minted
    ↓
Daily CRON → YieldEngine → Points Minted
    ↓
User Activity → Backend Verification → Engagement Rewards
    ↓
Giveaway Entry → VRF Selection → Prize Distribution
```

### Critical Design Principle

**⚠️ Starknet is an enhancement layer, NOT a gatekeeper:**
- ✅ **Access Control:** Stripe subscription status (traditional)
- ❌ **Not Access Control:** Blockchain NFTs or tokens
- 🎁 **Web3 Adds:** Transparency, ownership, yield, provable fairness

If Starknet fails, the platform continues operating with traditional loyalty systems via feature flags.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm (any package manager)
- Supabase CLI (for backend deployment)
- Stripe account (for payments)
- Scarb & Starknet Foundry (for smart contracts)

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

### 3. Setup Mobile App

```bash
# Navigate to mobile app
cd deporte-mas-mobile

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in Supabase, Aegis SDK, and Starknet config

# Start Expo development server
npm start
```

### 4. Setup Backend (Supabase)

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

### 5. Setup Smart Contracts (Starknet)

```bash
# Navigate to contracts directory
cd deporte-mas-contracts

# Install Scarb (Cairo package manager)
# Visit: https://docs.swmansion.com/scarb/download.html

# Build contracts
scarb build

# Run tests
scarb test

# Deploy to Starknet testnet
starkli declare --network sepolia target/dev/MembershipNFT.json
starkli deploy --network sepolia <CLASS_HASH> <CONSTRUCTOR_ARGS>
```

---

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

#### Starknet & Web3 (Required for blockchain features)
```bash
# Aegis SDK Configuration (Mobile App)
EXPO_PUBLIC_AEGIS_NETWORK=sepolia  # or mainnet
EXPO_PUBLIC_AEGIS_APP_NAME=DeporteMas
EXPO_PUBLIC_AEGIS_APP_ID=your-app-id-from-aegis
EXPO_PUBLIC_AEGIS_ENABLE_LOGGING=true

# Smart Contract Addresses (After deployment)
VITE_MEMBERSHIP_NFT_CONTRACT=0x...
VITE_DEPORTE_POINTS_CONTRACT=0x...
VITE_YIELD_ENGINE_CONTRACT=0x...
VITE_GIVEAWAY_MANAGER_CONTRACT=0x...

# Starknet RPC
VITE_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io

# Feature Flags
VITE_WEB3_ENABLED=true
VITE_BLOCKCHAIN_POINTS=true
VITE_VRF_GIVEAWAYS=true
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

---

## 💳 Stripe Setup

**📚 For complete Stripe configuration, see [deporte-mas-landing/STRIPE_CONFIG.md](./deporte-mas-landing/STRIPE_CONFIG.md)**

### Quick Setup

1. **Configure Environment Variables**
   ```bash
   cd deporte-mas-landing
   # Check your configuration
   node scripts/test-stripe-config.js
   ```

2. **Create Stripe Products**
   - Monthly subscription: $20/month
   - Annual subscription: $180/year
   - Set up both test and production versions

3. **Configure Webhooks**
   - Add webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select required events (see STRIPE_CONFIG.md for details)

4. **Test the Integration**
   ```bash
   cd deporte-mas-landing
   # Follow the testing guide
   cat scripts/test-purchase-flow.md
   ```

---

## 📊 Features

### ✅ Implemented

#### Core Platform
- **Landing Page** - Responsive design with Stripe checkout integration
- **Stripe Payments** - Embedded checkout with subscription management
- **User Authentication** - Complete auth flow with Supabase
- **Admin Dashboard** - User, subscription, and payment management
- **Facebook Tracking** - Meta Conversion API integration
- **Database Schema** - Production-ready with proper relationships
- **Edge Functions** - Secure payment processing and webhooks
- **Clean Architecture** - Standalone projects in simple monorepo

#### Blockchain (Starknet)
- **Membership NFT Contract** - Soulbound ERC-721 with OpenZeppelin (Cairo)
- **Aegis SDK Integration** - Invisible wallet creation in mobile app
- **Smart Contract Tests** - Starknet Foundry test suite
- **Account Abstraction Ready** - Gasless transactions via paymaster

### 🚧 In Progress

#### Mobile & Streaming
- **Mobile App** (React Native + Expo)
- **Video Streaming** (Mux integration)
- **Real-time Chat** functionality
- **Push Notifications**

#### Advanced Web3
- **DeportePoints ERC-20** - Platform currency token
- **YieldEngine Contract** - Automatic daily point distribution
- **GiveawayManager Contract** - VRF-powered fair giveaways
- **CollectiblesNFT Contract** - Achievement badges and prizes
- **Stripe→Blockchain Integration** - Auto-mint/burn on subscription events

#### Analytics & Features
- **Advanced Analytics Dashboard**
- **Content Recommendation Engine**
- **Polls & Community Engagement**
- **User Progress Tracking**

---

## 💡 Why Starknet?

### Technical Benefits

1. **Account Abstraction Native**
   - Users authenticate with email/phone (no seed phrases)
   - Platform sponsors all gas fees (invisible costs)
   - Multi-device wallet access with social recovery

2. **Scalability & Cost**
   - Low transaction fees for mass operations
   - Batch processing for daily yield distribution
   - Efficient Cairo VM execution

3. **Security & Transparency**
   - Verifiable Random Function (VRF) for fair giveaways
   - All transactions auditable on-chain
   - Cairo's provable correctness for smart contracts

4. **Developer Experience**
   - Modern language (Cairo) with strong typing
   - OpenZeppelin contract libraries
   - Excellent tooling (Scarb, Starknet Foundry)

### Business Benefits

1. **Mass Adoption**
   - Onboard non-crypto users invisibly
   - No wallet management complexity
   - Familiar Web2 UX with Web3 benefits

2. **True Ownership**
   - Users actually own their points (ERC-20)
   - Provably fair giveaway system builds trust
   - Future DeFi integration possibilities

3. **Unique Positioning**
   - First platform with invisible blockchain at scale
   - Grant opportunities from Starknet ecosystem
   - Innovation showcase for other communities

---

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

### Mobile App
```bash
cd deporte-mas-mobile
npm start            # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in browser
```

### Smart Contracts
```bash
cd deporte-mas-contracts
scarb build          # Compile contracts
scarb test           # Run tests
scarb fmt            # Format code
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

---

## 🏗️ Database Schema

The platform uses 18 main tables organized in PostgreSQL via Supabase:

### Core Tables
- **users** - User profiles, subscription status, wallet addresses
- **subscriptions** - Stripe subscription details and billing
- **streams** - Live streaming management and analytics
- **content** - VOD library, courses, exclusive content
- **chat_messages** - Real-time stream chat
- **points_ledger** - Point transaction history (analytics)
- **giveaways** - Prize management and winner selection
- **giveaway_entries** - User entries with loyalty multipliers
- **polls** - Community engagement and voting
- **teams** - Team badges for user preferences

See `supabase/migrations/` for the complete schema and `docs/knowledge-library/backend-architecture.md` for detailed documentation.

---

## 🔐 Security

### Platform Security
- All payments processed securely through Stripe
- User authentication via Supabase Auth
- Row Level Security (RLS) enabled on all tables
- Environment variables for sensitive data
- HTTPS enforced in production

### Blockchain Security
- Multi-signature admin controls for contracts
- OpenZeppelin audited contract libraries
- Platform pays all gas fees (no user wallet exposure)
- Smart contract upgrade capability with timelock
- Emergency pause functionality

### Access Control Model
- **Primary Gate:** Stripe subscription status (database)
- **Enhancement:** Blockchain features (optional layer)
- **Failover:** Automatic fallback to traditional systems
- **Monitoring:** Real-time alerts for suspicious activity

---

## 📝 API Documentation

### Supabase Edge Functions

#### Payment & Subscription
- **create-checkout-session** - Creates Stripe checkout sessions
- **stripe-webhook** - Handles Stripe subscription events
- **subscription/manage-billing** - Customer portal access
- **subscription/cancel** - Cancel subscription

#### Web3 Integration
- **web3/mint-membership** - Mint NFT on subscription activation
- **web3/burn-membership** - Burn NFT on cancellation
- **web3/batch-mint-points** - Daily yield distribution
- **web3/verify-activity** - Generate proofs for rewards

#### Content & Streaming
- **stream/initialize** - Create stream with RTMP keys
- **stream/start** - Mark stream live, notify users
- **stream/chat/send** - Send chat messages (rate-limited)
- **content/upload/initialize** - Start Mux video upload
- **content/view** - Track viewing, award points

#### Points & Rewards
- **points/balance** - Get on-chain balance
- **points/history** - Transaction history
- **points/daily-yield** - CRON job for yield distribution
- **giveaway/enter** - Enter with additional entries
- **giveaway/select-winner** - VRF winner selection

#### Analytics
- **facebook-conversion** - Sends events to Meta Conversion API
- **admin/analytics/dashboard** - Platform metrics
- **admin/facebook/sync** - Sync group membership

### Complete API documentation available in `docs/knowledge-library/backend-architecture.md`

---

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

### Mobile App
```bash
cd deporte-mas-mobile
# For production build
eas build --platform all
# For app store submission
eas submit
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

### Smart Contracts (Starknet)
```bash
cd deporte-mas-contracts

# Deploy to Starknet Sepolia (testnet)
starkli declare --network sepolia target/dev/MembershipNFT.json
starkli deploy --network sepolia <CLASS_HASH> <OWNER_ADDRESS> <YIELD_ENGINE>

# Deploy to Starknet Mainnet
starkli declare --network mainnet target/dev/MembershipNFT.json
starkli deploy --network mainnet <CLASS_HASH> <OWNER_ADDRESS> <YIELD_ENGINE>

# Update contract addresses in environment variables
```

---

## 📚 Documentation

Complete documentation available in `/docs/knowledge-library/`:

- **[web3-angle.md](./docs/knowledge-library/web3-angle.md)** - Invisible Web3 vision and three-token system
- **[smart-contracts.md](./docs/knowledge-library/smart-contracts.md)** - Complete contract architecture
- **[backend-architecture.md](./docs/knowledge-library/backend-architecture.md)** - Full backend specification
- **[mvp.md](./docs/knowledge-library/mvp.md)** - MVP launch specification
- **[stripe/](./docs/knowledge-library/stripe/)** - Stripe integration guides

---

## 📄 License

This project is private and proprietary to DeporteMas.

---

## 🆘 Support

For technical support or questions:
- Contact the development team
- Check the documentation in `/docs`
- Review smart contract docs: [Cairo Book](https://book.cairo-lang.org/)
- Starknet developer resources: [Starknet Docs](https://docs.starknet.io/)

---

**Built with ❤️ for Costa Rican football culture**
**Powered by Starknet for invisible Web3 innovation**
