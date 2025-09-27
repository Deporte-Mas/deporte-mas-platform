/**
 * Web3 Integration Utilities
 *
 * Handles all blockchain interactions through Cavos SDK
 * Provides wallet abstraction and smart contract integration
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

// Types
export interface WalletInfo {
  address: string;
  provider: 'cavos';
  created_at: Date;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
}

export interface MintPointsRequest {
  user_id: string;
  wallet_address: string;
  amount: number;
  reason: string;
  reference_id?: string;
}

export interface MembershipNFTRequest {
  user_id: string;
  wallet_address: string;
  tier: number;
}

// Cavos SDK Service
export class CavosService {
  private static instance: CavosService;
  private cavosApiKey: string;
  private cavosEndpoint: string;

  constructor() {
    this.cavosApiKey = Deno.env.get('CAVOS_API_KEY') || '';
    this.cavosEndpoint = Deno.env.get('CAVOS_ENDPOINT') || 'https://api.cavos.xyz';

    if (!this.cavosApiKey) {
      console.warn('CAVOS_API_KEY not set - Web3 features will be disabled');
    }
  }

  static getInstance(): CavosService {
    if (!CavosService.instance) {
      CavosService.instance = new CavosService();
    }
    return CavosService.instance;
  }

  /**
   * Create invisible wallet for user using Cavos Account Abstraction
   */
  async createWallet(userId: string, email: string): Promise<WalletInfo | null> {
    try {
      if (!this.cavosApiKey) {
        console.warn('Cavos not configured - skipping wallet creation');
        return null;
      }

      const response = await fetch(`${this.cavosEndpoint}/wallets/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cavosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email,
          recoveryMethod: 'email',
          sponsoredGas: true,
          metadata: {
            supabase_user_id: userId,
            platform: 'deportemas',
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Cavos API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        address: data.address,
        provider: 'cavos',
        created_at: new Date()
      };
    } catch (error) {
      console.error('Failed to create Cavos wallet:', error);
      return null;
    }
  }

  /**
   * Send sponsored transaction through Cavos
   */
  async sendSponsoredTransaction(
    walletAddress: string,
    contractAddress: string,
    functionData: any,
    purpose: string
  ): Promise<TransactionResult> {
    try {
      if (!this.cavosApiKey) {
        return { hash: '', success: false, error: 'Cavos not configured' };
      }

      const response = await fetch(`${this.cavosEndpoint}/transactions/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cavosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: walletAddress,
          transaction: {
            to: contractAddress,
            data: functionData,
            sponsored: true
          },
          paymaster: Deno.env.get('PLATFORM_PAYMASTER_ADDRESS'),
          maxFee: Deno.env.get('MAX_GAS_FEE'),
          metadata: { purpose }
        })
      });

      if (!response.ok) {
        throw new Error(`Transaction failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        hash: data.transactionHash,
        success: true
      };
    } catch (error) {
      console.error(`Transaction failed for ${purpose}:`, error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Smart Contract Integration
export class SmartContractService {
  private cavos: CavosService;
  private membershipNFTAddress: string;
  private deportePointsAddress: string;
  private yieldEngineAddress: string;

  constructor() {
    this.cavos = CavosService.getInstance();
    this.membershipNFTAddress = Deno.env.get('MEMBERSHIP_NFT_CONTRACT') || '';
    this.deportePointsAddress = Deno.env.get('DEPORTE_POINTS_CONTRACT') || '';
    this.yieldEngineAddress = Deno.env.get('YIELD_ENGINE_CONTRACT') || '';
  }

  /**
   * Mint membership NFT on subscription activation
   */
  async mintMembershipNFT(request: MembershipNFTRequest): Promise<TransactionResult> {
    if (!this.membershipNFTAddress) {
      return { hash: '', success: false, error: 'Contract address not configured' };
    }

    const functionData = this.encodeMintMembershipFunction(
      request.wallet_address,
      request.tier
    );

    return await this.cavos.sendSponsoredTransaction(
      request.wallet_address,
      this.membershipNFTAddress,
      functionData,
      'membership_mint'
    );
  }

  /**
   * Burn membership NFT on subscription cancellation
   */
  async burnMembershipNFT(walletAddress: string): Promise<TransactionResult> {
    if (!this.membershipNFTAddress) {
      return { hash: '', success: false, error: 'Contract address not configured' };
    }

    const functionData = this.encodeBurnMembershipFunction(walletAddress);

    return await this.cavos.sendSponsoredTransaction(
      walletAddress,
      this.membershipNFTAddress,
      functionData,
      'membership_burn'
    );
  }

  /**
   * Mint points for user
   */
  async mintPoints(request: MintPointsRequest): Promise<TransactionResult> {
    if (!this.deportePointsAddress) {
      return { hash: '', success: false, error: 'Contract address not configured' };
    }

    const functionData = this.encodeMintPointsFunction(
      request.wallet_address,
      request.amount
    );

    return await this.cavos.sendSponsoredTransaction(
      request.wallet_address,
      this.deportePointsAddress,
      functionData,
      request.reason
    );
  }

  /**
   * Batch mint points for multiple users (daily yield)
   */
  async batchMintPoints(
    recipients: string[],
    amounts: number[]
  ): Promise<TransactionResult> {
    if (!this.deportePointsAddress) {
      return { hash: '', success: false, error: 'Contract address not configured' };
    }

    // Use first recipient for transaction sender (system account)
    const systemWallet = Deno.env.get('SYSTEM_WALLET_ADDRESS') || recipients[0];

    const functionData = this.encodeBatchMintFunction(recipients, amounts);

    return await this.cavos.sendSponsoredTransaction(
      systemWallet,
      this.deportePointsAddress,
      functionData,
      'batch_yield_distribution'
    );
  }

  /**
   * Burn points when user spends them
   */
  async burnPoints(walletAddress: string, amount: number): Promise<TransactionResult> {
    if (!this.deportePointsAddress) {
      return { hash: '', success: false, error: 'Contract address not configured' };
    }

    const functionData = this.encodeBurnPointsFunction(walletAddress, amount);

    return await this.cavos.sendSponsoredTransaction(
      walletAddress,
      this.deportePointsAddress,
      functionData,
      'points_spend'
    );
  }

  // Contract function encoding methods (placeholder implementations)
  private encodeMintMembershipFunction(address: string, tier: number): any {
    // This would be the actual contract function encoding
    return {
      function: 'mint_membership',
      parameters: [address, tier]
    };
  }

  private encodeBurnMembershipFunction(address: string): any {
    return {
      function: 'burn_membership',
      parameters: [address]
    };
  }

  private encodeMintPointsFunction(address: string, amount: number): any {
    return {
      function: 'mint',
      parameters: [address, amount]
    };
  }

  private encodeBatchMintFunction(recipients: string[], amounts: number[]): any {
    return {
      function: 'batch_mint',
      parameters: [recipients, amounts]
    };
  }

  private encodeBurnPointsFunction(address: string, amount: number): any {
    return {
      function: 'burn',
      parameters: [address, amount]
    };
  }
}

// Web3 Integration Service
export class Web3IntegrationService {
  private supabase: any;
  private contractService: SmartContractService;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.contractService = new SmartContractService();
  }

  /**
   * Create wallet and update user record
   */
  async createUserWallet(userId: string, email: string): Promise<WalletInfo | null> {
    try {
      const cavosService = CavosService.getInstance();
      const wallet = await cavosService.createWallet(userId, email);

      if (!wallet) {
        return null;
      }

      // Update user record with wallet address
      const { error } = await this.supabase
        .from('users')
        .update({
          wallet_address: wallet.address,
          wallet_provider: wallet.provider,
          wallet_created_at: wallet.created_at.toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update user with wallet address:', error);
        return null;
      }

      return wallet;
    } catch (error) {
      console.error('Failed to create user wallet:', error);
      return null;
    }
  }

  /**
   * Handle subscription activation - mint membership NFT
   */
  async handleSubscriptionActivated(userId: string): Promise<void> {
    try {
      // Get user's wallet address
      const { data: user } = await this.supabase
        .from('users')
        .select('wallet_address, subscription_tier')
        .eq('id', userId)
        .single();

      if (!user?.wallet_address) {
        console.log('User has no wallet address - skipping NFT mint');
        return;
      }

      // Mint membership NFT
      const result = await this.contractService.mintMembershipNFT({
        user_id: userId,
        wallet_address: user.wallet_address,
        tier: user.subscription_tier === 'premium' ? 1 : 0
      });

      if (result.success) {
        console.log(`Membership NFT minted for user ${userId}: ${result.hash}`);
      } else {
        console.error(`Failed to mint membership NFT for user ${userId}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error handling subscription activation:', error);
    }
  }

  /**
   * Handle subscription cancellation - burn membership NFT
   */
  async handleSubscriptionCancelled(userId: string): Promise<void> {
    try {
      // Get user's wallet address
      const { data: user } = await this.supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();

      if (!user?.wallet_address) {
        console.log('User has no wallet address - skipping NFT burn');
        return;
      }

      // Burn membership NFT
      const result = await this.contractService.burnMembershipNFT(user.wallet_address);

      if (result.success) {
        console.log(`Membership NFT burned for user ${userId}: ${result.hash}`);
      } else {
        console.error(`Failed to burn membership NFT for user ${userId}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
    }
  }

  /**
   * Record points transaction in ledger
   */
  async recordPointsTransaction(
    userId: string,
    amount: number,
    type: string,
    category?: string,
    referenceId?: string,
    txHash?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('points_ledger')
        .insert({
          user_id: userId,
          amount,
          transaction_type: type,
          category,
          reference_id: referenceId,
          blockchain_tx_hash: txHash,
          description: `${type} ${category ? `- ${category}` : ''}`
        });
    } catch (error) {
      console.error('Failed to record points transaction:', error);
    }
  }
}

// Utility functions
export const isWeb3Enabled = (): boolean => {
  return !!Deno.env.get('CAVOS_API_KEY');
};

export const getContractAddresses = () => ({
  membershipNFT: Deno.env.get('MEMBERSHIP_NFT_CONTRACT'),
  deportePoints: Deno.env.get('DEPORTE_POINTS_CONTRACT'),
  yieldEngine: Deno.env.get('YIELD_ENGINE_CONTRACT'),
  giveawayVRF: Deno.env.get('GIVEAWAY_VRF_CONTRACT'),
  collectiblesNFT: Deno.env.get('COLLECTIBLES_NFT_CONTRACT')
});

export default {
  CavosService,
  SmartContractService,
  Web3IntegrationService,
  isWeb3Enabled,
  getContractAddresses
};