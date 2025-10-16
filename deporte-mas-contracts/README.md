# DeporteMas Platform: Smart Contracts Architecture

> **Master specification for the Web3 components powering the invisible blockchain integration of Costa Rica's premier sports community platform.**

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Contract Architecture](#contract-architecture)
3. [Contract Relationships & Dependencies](#contract-relationships--dependencies)
4. [Points Economy Design](#points-economy-design)
5. [Transaction Classification](#transaction-classification)
6. [Implementation Details](#implementation-details)
7. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

### Platform Vision

DeporteMas transforms Costa Rica's most beloved sports program into an intimate digital community through **invisible blockchain integration**. Users experience a yield-generating loyalty ecosystem where active membership automatically earns valuable points that unlock exclusive experiences—all powered by Starknet technology they never see or need to understand.

### Core Innovation: Invisible Web3

- **Zero crypto complexity**: Users see "points earned" not "tokens minted"
- **Automatic value creation**: Subscriptions generate passive yield through blockchain
- **Transparent fairness**: Giveaways and rewards verified on-chain but invisible to users
- **Social recovery**: Email/phone authentication replaces seed phrases
- **Gas abstraction**: All transaction fees sponsored by platform

### Three-Token Economic System

1. **🎫 MembershipNFT** (Soulbound) - Gateway to platform, burns on cancellation
2. **💎 DeportePoints** (ERC-20) - Platform currency earned through engagement
3. **🏆 CollectiblesNFT** (ERC-721) - Achievement badges, prizes, and exclusive collectibles

### Key Benefits

- **For Users**: Invisible blockchain benefits without learning curve
- **For Business**: Increased retention through yield-based loyalty
- **For Ecosystem**: Mass Starknet adoption through real utility demonstration

---

## Contract Architecture

### 1. MembershipNFT Contract (Soulbound Token)

**Purpose**: Non-transferable proof of active subscription that gates all Web3 features, ERC721 Openzeppelin.

#### Core Functions:
```cairo
#[starknet::interface]
trait IMembershipNFT<TContractState> {
    fn mint_membership(ref self: TContractState, user: ContractAddress, tier: u8);
    fn burn_membership(ref self: TContractState, user: ContractAddress);
    fn get_membership_status(self: @TContractState, user: ContractAddress) -> bool;
    fn get_membership_start_date(self: @TContractState, user: ContractAddress) -> u64;
    fn get_loyalty_tier(self: @TContractState, user: ContractAddress) -> u8;
}
```

#### State Variables:
- `memberships: LegacyMap<ContractAddress, MembershipData>`
- `total_active_members: u256`
- `yield_engine_address: ContractAddress`

#### Key Features:
- **Soulbound**: Cannot be transferred between addresses
- **Auto-mint**: Triggered by Stripe webhook on payment success
- **Auto-burn**: Triggered on subscription cancellation
- **Loyalty tracking**: Calculates membership duration for yield multipliers

---

### 2. DeportePoints Contract (ERC-20 Token)

**Purpose**: Platform's primary currency for all transactions and rewards.

#### Core Functions:
```cairo
#[starknet::interface]
trait IDeportePoints<TContractState> {
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
    fn burn(ref self: TContractState, from: ContractAddress, amount: u256);
    fn batch_mint(ref self: TContractState, recipients: Array<ContractAddress>, amounts: Array<u256>);
    fn authorize_minter(ref self: TContractState, minter: ContractAddress);
    fn revoke_minter(ref self: TContractState, minter: ContractAddress);
}
```

#### Economic Properties:
- **Controlled supply**: Only authorized contracts can mint
- **Deflationary**: Points burned on spending (not transferred)
- **Non-transferable**: Users cannot send points to each other
- **Batch operations**: Gas-efficient mass distribution

#### Authorized Minters:
- YieldEngine (daily yields)
- EngagementRewards (activity bonuses)
- GiveawayManager (refunds only)

---

### 3. YieldEngine Contract

**Purpose**: Automatic daily point generation based on active membership and loyalty.

#### Core Functions:
```cairo
#[starknet::interface]
trait IYieldEngine<TContractState> {
    fn calculate_daily_yield(self: @TContractState, user: ContractAddress) -> u256;
    fn distribute_yield_batch(ref self: TContractState, users: Array<ContractAddress>);
    fn register_member(ref self: TContractState, user: ContractAddress);
    fn pause_member(ref self: TContractState, user: ContractAddress);
    fn claim_yield(ref self: TContractState);
}
```

#### Loyalty Multiplier Logic:
```cairo
fn get_loyalty_multiplier(membership_duration: u64) -> u256 {
    if membership_duration < 90 days { 1 }         // 1.0x (20 points/day)
    else if membership_duration < 180 days { 15 }  // 1.5x (30 points/day)
    else if membership_duration < 365 days { 20 }  // 2.0x (40 points/day)
    else { 30 }                                    // 3.0x (60 points/day)
}
```

#### State Variables:
- `last_claim_timestamp: LegacyMap<ContractAddress, u64>`
- `base_daily_yield: u256 = 20`
- `multiplier_config: LegacyMap<u64, u256>`

---

### 4. EngagementRewards Contract

**Purpose**: Award points for verified platform activities and engagement.

#### Core Functions:
```cairo
#[starknet::interface]
trait IEngagementRewards<TContractState> {
    fn reward_activity(ref self: TContractState, user: ContractAddress, activity: ActivityType, proof: Array<felt252>);
    fn batch_reward(ref self: TContractState, users: Array<ContractAddress>, activities: Array<ActivityType>);
    fn set_activity_reward(ref self: TContractState, activity: ActivityType, reward: u256);
    fn check_daily_limit(self: @TContractState, user: ContractAddress, activity: ActivityType) -> u256;
}
```

#### Activity Types & Rewards:
```cairo
enum ActivityType {
    StreamWatch,      // 200 points (max 1/day)
    ChatParticipation,// 5 points (max 10/day)
    PollCompletion,   // 25 points (max 1/day)
    VODWatch,         // 10 points per 10min (max 100/day)
    ContentShare,     // 20 points (max 1/day)
    ReferralSuccess,  // 2000 points (no limit)
    CourseCompletion, // 500 points (no limit)
    PredictionCorrect,// 100 points (no limit)
}
```

#### Anti-Gaming Mechanisms:
- Daily limits per activity type
- Proof verification requirements
- Cooldown periods between rewards
- Activity fingerprinting to prevent duplicates

---

### 5. GiveawayManager Contract

**Purpose**: Transparent, provably fair giveaway system with blockchain verification.

#### Core Functions:
```cairo
#[starknet::interface]
trait IGiveawayManager<TContractState> {
    fn create_giveaway(ref self: TContractState, params: GiveawayParams);
    fn enter_giveaway(ref self: TContractState, giveaway_id: u256, additional_entries: u256);
    fn select_winner(ref self: TContractState, giveaway_id: u256);
    fn claim_prize(ref self: TContractState, giveaway_id: u256);
    fn get_entry_count(self: @TContractState, giveaway_id: u256, user: ContractAddress) -> u256;
}
```

#### Entry Calculation Logic:
```cairo
fn calculate_total_entries(base: u256, additional: u256, loyalty_multiplier: u256) -> u256 {
    (base + additional) * loyalty_multiplier / 10
}
```

#### Prize Distribution:
- **Physical prizes**: Require winner verification and shipping
- **NFT prizes**: Automatically minted to winner's wallet
- **Experience prizes**: Coordinated through admin panel
- **Point prizes**: Direct DeportePoints transfer

#### Randomness Source:
- Starknet VRF for verifiable randomness
- Commit-reveal scheme for additional security
- Public seed verification on-chain

---

### 6. CollectiblesNFT Contract (ERC-721)

**Purpose**: Unified NFT collection for all rewards, achievements, and collectibles.

#### Core Functions:
```cairo
#[starknet::interface]
trait ICollectiblesNFT<TContractState> {
    fn mint_collectible(ref self: TContractState, to: ContractAddress, token_type: TokenType, metadata: Array<felt252>);
    fn purchase_with_points(ref self: TContractState, token_type: TokenType);
    fn award_from_giveaway(ref self: TContractState, winner: ContractAddress, token_type: TokenType);
    fn get_token_benefits(self: @TContractState, token_id: u256) -> BenefitsData;
    fn set_purchase_price(ref self: TContractState, token_type: TokenType, price: u256);
}
```

#### Token Categories:
```cairo
enum TokenType {
    AchievementBadge,  // Earned through milestones
    GiveawayPrize,     // Won through giveaways
    PurchasableItem,   // Bought with points
    EventTicket,       // Redeemable for real events
    LegendMoment,      // Historic football moments
}
```

#### Benefits System:
- **Yield multipliers**: Some NFTs boost daily point generation
- **Access tokens**: Unlock exclusive content or experiences
- **Social status**: Display in user profiles
- **Collectible value**: Tradeable on secondary markets (future)

---

### 7. AccessControl Contract

**Purpose**: Centralized permission and role management for all platform contracts.

#### Core Functions:
```cairo
#[starknet::interface]
trait IAccessControl<TContractState> {
    fn grant_role(ref self: TContractState, role: felt252, account: ContractAddress);
    fn revoke_role(ref self: TContractState, role: felt252, account: ContractAddress);
    fn has_role(self: @TContractState, role: felt252, account: ContractAddress) -> bool;
    fn pause_contract(ref self: TContractState, contract: ContractAddress);
    fn unpause_contract(ref self: TContractState, contract: ContractAddress);
}
```

#### Role Definitions:
- **ADMIN**: Full system control, multi-sig required
- **OPERATOR**: Day-to-day operations (backend services)
- **REWARDS_MANAGER**: Can trigger engagement rewards
- **GIVEAWAY_CREATOR**: Can create and manage giveaways
- **YIELD_DISTRIBUTOR**: Can execute yield distributions
- **EMERGENCY_ADMIN**: Can pause system in crisis

---

## Contract Relationships & Dependencies

### Dependency Flow Diagram

![Contract Dependency Diagram](contract-dependency-diagram.jpeg)

**Key Elements:**
- **Orange highlights**: Backend Services (system-initiated transactions)
- **Direct User Interactions**: Only with GiveawayManager and CollectiblesNFT
- **Central Authority**: AccessControl governs all contract permissions
- **Point Flow**: DeportePoints serves as the central currency for all transactions

### Critical Integration Points

1. **Stripe → MembershipNFT**: Payment success triggers membership minting
2. **MembershipNFT → YieldEngine**: Membership changes notify yield calculator
3. **Backend → EngagementRewards**: Activity verification triggers point rewards
4. **All Contracts → AccessControl**: Permission checking for sensitive operations
5. **VRF Oracle → GiveawayManager**: Verifiable randomness for fair winner selection

---

## Points Economy Design

### Base Economics ($20/month subscription)

#### Daily Yield Rates by Loyalty Tier:
```
Membership Duration    Daily Points    Monthly Total    Value Equivalent
─────────────────────────────────────────────────────────────────────
0-3 months             20 points       600 points       $3.00 (15%)
3-6 months             30 points       900 points       $4.50 (22.5%)
6-12 months            40 points       1,200 points     $6.00 (30%)
12+ months             60 points       1,800 points     $9.00 (45%)
```

#### Engagement Rewards Structure:
```
Activity                    Points    Daily Limit    Monthly Potential
──────────────────────────────────────────────────────────────────────
Watch Live Stream           200       1              6,000
Participate in Chat         5         10             1,500
Complete Daily Poll         25        1              750
Watch VOD (per 10 min)      10        100            3,000
Share Content               20        1              600
Refer New Member           2,000      unlimited      -
Complete Course Module      500       unlimited      -
Correct Prediction          100       unlimited      -
Perfect Prediction Week    1,000      unlimited      -

Estimated Active User Monthly: 2,000-4,000 points
Estimated Power User Monthly: 6,000-12,000 points
```

#### Point Redemption Economy:
```
Redemption Category         Points Cost    Real Value    ROI for Users
─────────────────────────────────────────────────────────────────────
Enhanced Experiences:
- Giveaway Extra Entry      100            $0.50         High
- Priority Chat (1 week)    200            $1.00         High
- Direct Question           500            $2.50         Medium
- Custom Analysis Request   2,000          $10.00        Medium

Exclusive Content:
- Premium VOD Access        300            $1.50         High
- Legend Interview          500            $2.50         High
- Tactical Masterclass      1,000          $5.00         Medium
- Historic Archive          200            $1.00         High

Collectible NFTs:
- Common Achievement        1,000          $5.00         Medium
- Rare Badge                3,000          $15.00        Medium
- Epic Badge                5,000          $25.00        Low
- Legendary Moment          10,000         $50.00        Low
- Event Ticket NFT          20,000         $100.00       Medium

Physical Rewards:
- Signed Photo              5,000          $25.00        Medium
- Official Merchandise      8,000          $40.00        Medium
- Match Tickets (pair)      15,000         $75.00        High
- VIP Experience            30,000         $150.00       Very High
- Dinner with Legends       50,000         $250.00       Very High
```

### Economic Balance Mechanisms

#### Monthly Point Generation (per 1000 users):
```
Source                      Points/Month    Percentage
─────────────────────────────────────────────────────
Yield Distribution          1,050,000       60%
Engagement Rewards          525,000         30%
Special Events/Bonuses      175,000         10%
Total Generation:           1,750,000       100%
```

#### Monthly Point Consumption (per 1000 users):
```
Sink Type                   Points/Month    Percentage
─────────────────────────────────────────────────────
Giveaway Entries            350,000         20%
Content Purchases           525,000         30%
NFT Purchases               350,000         20%
Saved/Accumulated           525,000         30%
Total Consumption:          1,750,000       100%
```

#### Economic Controls:
- **Inflation Control**: Daily yield caps, activity limits
- **Deflation Mechanisms**: Point burning on all spending
- **Value Stability**: Points pegged to subscription value (~1 point = $0.005)
- **Reserve Fund**: Platform maintains point buyback capability

---

## Transaction Classification

### User-Contract Interaction Overview

**Users directly interact with only 2 contracts:**
- **GiveawayManager**: Enter giveaways and claim prizes
- **CollectiblesNFT**: Purchase NFTs with points

**All other contracts are backend-only:**
- MembershipNFT, DeportePoints, YieldEngine, EngagementRewards, AccessControl

Users receive benefits (points, NFTs, membership) from backend transactions but only actively sign when spending points or claiming prizes.

### User Wallet Transactions (Require User Signature)

#### 1. Giveaway Participation
```cairo
// User enters with additional entries (costs points)
transaction_type: USER_INITIATED
gas_paid_by: PLATFORM (via Account Abstraction)
user_approval: REQUIRED (spending points)

GiveawayManager.enter_giveaway(giveaway_id, additional_entries)
└── DeportePoints.burn(user_address, entry_cost)
```

#### 2. NFT Purchases
```cairo
// User purchases collectible with points
transaction_type: USER_INITIATED
gas_paid_by: PLATFORM (via Account Abstraction)
user_approval: REQUIRED (spending points)

CollectiblesNFT.purchase_with_points(token_type)
├── DeportePoints.burn(user_address, purchase_price)
└── CollectiblesNFT.mint(user_address, token_id)
```

#### 3. Prize Claims
```cairo
// Winner claims giveaway prize
transaction_type: USER_INITIATED
gas_paid_by: PLATFORM (via Account Abstraction)
user_approval: REQUIRED (claiming prize)

GiveawayManager.claim_prize(giveaway_id)
└── CollectiblesNFT.mint(winner_address, prize_token)
```

### System/Backend Transactions (Platform-Initiated)

#### 1. Membership Management
```cairo
// Automated on Stripe events
transaction_type: SYSTEM_INITIATED
gas_paid_by: PLATFORM (backend wallet)
trigger: STRIPE_WEBHOOK

// On payment success
MembershipNFT.mint_membership(user_address, tier)
└── YieldEngine.register_member(user_address)

// On cancellation
MembershipNFT.burn_membership(user_address)
└── YieldEngine.pause_member(user_address)
```

#### 2. Daily Yield Distribution
```cairo
// Automated daily batch process
transaction_type: SYSTEM_INITIATED
gas_paid_by: PLATFORM (backend wallet)
trigger: CRON_JOB (daily at 00:00 UTC)

YieldEngine.distribute_yield_batch(user_addresses[])
└── DeportePoints.batch_mint(users, calculated_yields)
```

#### 3. Engagement Rewards
```cairo
// Real-time activity rewards
transaction_type: SYSTEM_INITIATED
gas_paid_by: PLATFORM (backend wallet)
trigger: VERIFIED_ACTIVITY

// Individual reward
EngagementRewards.reward_activity(user, STREAM_WATCH, proof)
└── DeportePoints.mint(user, 200)

// Batch processing (hourly)
EngagementRewards.batch_reward(users[], activities[])
└── DeportePoints.batch_mint(users, reward_amounts)
```

#### 4. Giveaway Administration
```cairo
// Admin creates giveaway
transaction_type: ADMIN_INITIATED
gas_paid_by: PLATFORM (admin wallet)
trigger: ADMIN_PANEL

GiveawayManager.create_giveaway(params)

// System selects winner
transaction_type: SYSTEM_INITIATED
gas_paid_by: PLATFORM (backend wallet)
trigger: VRF_CALLBACK

GiveawayManager.select_winner(giveaway_id)
└── VRF_Oracle.request_randomness()
```

### Transaction Batching Strategy

#### Gas Optimization Approach:
```cairo
// ❌ Inefficient: Individual transactions
foreach user in active_users:
    YieldEngine.distribute_yield(user)      // 1000 transactions

// ✅ Efficient: Batch processing
YieldEngine.distribute_yield_batch(users[0:1000])  // 1 transaction
```

#### Batch Processing Schedule:
- **Daily Yields**: 00:00 UTC batch process
- **Engagement Rewards**: Hourly batch process
- **Membership Updates**: Real-time (low frequency)
- **Emergency Operations**: Real-time when needed

### User Interaction Summary

```
User-Initiated Transactions (require user signatures):
├── GiveawayManager.enter_giveaway() - Enter giveaways with additional entries
├── GiveawayManager.claim_prize() - Claim won prizes
└── CollectiblesNFT.purchase_with_points() - Buy NFTs with points

Backend-Initiated Transactions (users receive benefits):
├── MembershipNFT.mint_membership() - Membership creation on payment
├── DeportePoints.mint() - Daily yields and engagement rewards
├── YieldEngine.distribute_yield_batch() - Automated daily point distribution
└── EngagementRewards.reward_activity() - Activity-based point rewards
```

**Key Principle**: Users only sign transactions when spending their points or claiming prizes. All value generation happens through backend transactions that require no user interaction.

### Gas Fee Structure

```
Transaction Category          | Who Pays Gas  | Method
─────────────────────────────────────────────────────────
User Giveaway Entry           | Platform      | Account Abstraction
User NFT Purchase             | Platform      | Account Abstraction
User Prize Claim              | Platform      | Account Abstraction
Daily Yield Distribution      | Platform      | Backend Wallet
Engagement Rewards            | Platform      | Backend Wallet
Membership Minting/Burning    | Platform      | Backend Wallet
Giveaway Creation             | Platform      | Admin Wallet
Winner Selection              | Platform      | Backend Wallet
Emergency Admin Actions       | Platform      | Emergency Wallet
```

---

## Implementation Details

### Starknet-Specific Considerations

#### Cairo Language Features:
- **Felt252 primitive**: Used for compact data storage
- **LegacyMap**: Gas-efficient key-value storage
- **Array handling**: Batch operations with dynamic arrays
- **Interface traits**: Clean contract interaction patterns

#### Account Abstraction Integration:
```cairo
// Cavos SDK integration for invisible wallets
#[starknet::contract]
mod MembershipNFT {
    // Contract accepts calls from Cavos-managed accounts
    // Users never see private keys or seed phrases
    // Email/phone recovery handled by Cavos infrastructure
}
```

#### Gas Optimization Patterns:
- **Batch operations**: Process multiple users in single transaction
- **Packed storage**: Combine related data in single storage slot
- **Event emissions**: Minimal data in events, detailed queries off-chain
- **Lazy computation**: Calculate values on-demand rather than storing

### Security Architecture

#### Multi-Signature Requirements:
```cairo
// Critical operations require multiple signatures
Role: ADMIN
Required Signatures: 3 of 5
Operations: Role management, contract upgrades, emergency pause

Role: EMERGENCY_ADMIN
Required Signatures: 2 of 3
Operations: System pause, critical bug fixes
```

#### Permission Hierarchy:
```
ADMIN (Multi-sig)
├── OPERATOR (Backend services)
├── REWARDS_MANAGER (Engagement system)
├── GIVEAWAY_CREATOR (Admin panel)
├── YIELD_DISTRIBUTOR (Automated systems)
└── EMERGENCY_ADMIN (Crisis response)
```

#### Upgrade Strategy:
- **Proxy pattern**: Enable contract updates without losing state
- **Timelock**: 48-hour delay on critical upgrades
- **Rollback capability**: Ability to revert problematic upgrades
- **Version tracking**: Maintain upgrade history on-chain

### Integration Points

#### External Service Connections:

1. **Cavos SDK Integration:**
   - Invisible wallet creation and management
   - Social recovery mechanisms
   - Transaction signing with user consent
   - Cross-device wallet synchronization

2. **Starknet VRF Oracle:**
   - Verifiable randomness for giveaways
   - Commit-reveal scheme implementation
   - On-chain randomness verification

3. **Backend API Endpoints:**
   ```cairo
   // Activity verification endpoint
   POST /api/verify-activity
   {
       user_address: ContractAddress,
       activity_type: ActivityType,
       proof: Array<felt252>
   }

   // Batch yield distribution trigger
   POST /api/distribute-yields
   {
       user_batch: Array<ContractAddress>
   }
   ```

4. **Stripe Webhook Integration:**
   ```cairo
   // Subscription events
   POST /webhook/stripe/subscription.created
   POST /webhook/stripe/subscription.cancelled
   POST /webhook/stripe/invoice.payment_succeeded
   POST /webhook/stripe/invoice.payment_failed
   ```

### Monitoring and Observability

#### Key Metrics to Track:
- Daily active members and yield distribution
- Points generation vs consumption rates
- Giveaway participation and fairness metrics
- Contract gas usage and optimization opportunities
- User engagement patterns and reward effectiveness

#### Alert Conditions:
- Unusual point minting or burning activity
- Failed batch transactions
- VRF oracle failures
- Unauthorized role changes
- Emergency pause triggers

---

## Conclusion

This smart contract architecture provides DeporteMas with a robust, scalable Web3 foundation that delivers real value to users while remaining completely invisible. The seven-contract system creates a sustainable token economy that incentivizes engagement, rewards loyalty, and builds community—all while demonstrating the power of practical blockchain applications.

**Built for football culture. Powered by Starknet innovation.**

---

*This document serves as the master specification for all smart contract development. All implementation decisions should reference and align with these specifications.*

sncast \
  deploy \
  --class-hash 0x025993746751109b2b57e763898adec04ca5eb5178017cf0dc7c8f61040888cd \
  --arguments '0x7fc33af06dad3891b7a050d4d0c9f09126f811f62989dccebb5cd5da6d2713e, 0x7fc33af06dad3891b7a050d4d0c9f09126f811f62989dccebb5cd5da6d2713e, 0x7fc33af06dad3891b7a050d4d0c9f09126f811f62989dccebb5cd5da6d2713e, 0x7fc33af06dad3891b7a050d4d0c9f09126f811f62989dccebb5cd5da6d2713e'\
  --network sepolia