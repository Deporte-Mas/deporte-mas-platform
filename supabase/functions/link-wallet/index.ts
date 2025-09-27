/**
 * Link Wallet Edge Function
 *
 * Creates Cavos wallet for authenticated user with invisible Web3 integration
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  requireActiveSubscription,
  type AuthContext
} from "../_shared/auth.ts";
import { Web3IntegrationService } from "../_shared/web3.ts";
import { ValidationService, WalletLinkSchema } from "../_shared/validation.ts";

// Types
interface WalletLinkResponse {
  wallet: {
    address: string;
    provider: string;
    created_at: string;
  };
  membership_nft: {
    minted: boolean;
    transaction_hash?: string;
  };
  message: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  return await withAuth(req, async (context: AuthContext) => {
    const { user, supabase } = context;

    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = ValidationService.validate(WalletLinkSchema, body);

      if (!validation.success) {
        return ValidationService.createValidationResponse(validation.errors!);
      }

      // Check if user already has a wallet
      const { data: existingUser } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      if (existingUser?.wallet_address) {
        return createErrorResponse(
          'User already has a linked wallet',
          400,
          'WALLET_ALREADY_LINKED'
        );
      }

      // Initialize Web3 service
      const web3Service = new Web3IntegrationService();

      // Create wallet using Cavos SDK
      const walletInfo = await web3Service.createUserWallet(user.id, user.email);

      if (!walletInfo) {
        return createErrorResponse(
          'Failed to create wallet',
          500,
          'WALLET_CREATION_FAILED'
        );
      }

      // Check if user has active subscription and mint membership NFT if so
      const hasActiveSubscription = await requireActiveSubscription(supabase, user.id);
      let nftResult = { minted: false };

      if (hasActiveSubscription) {
        try {
          await web3Service.handleSubscriptionActivated(user.id);
          nftResult = { minted: true };
        } catch (error) {
          console.error('Failed to mint membership NFT:', error);
          // Don't fail the wallet creation if NFT minting fails
          nftResult = { minted: false };
        }
      }

      const response: WalletLinkResponse = {
        wallet: {
          address: walletInfo.address,
          provider: walletInfo.provider,
          created_at: walletInfo.created_at.toISOString()
        },
        membership_nft: nftResult,
        message: hasActiveSubscription
          ? 'Wallet created and membership NFT minted successfully'
          : 'Wallet created successfully. Membership NFT will be minted upon subscription activation.'
      };

      return createSuccessResponse(response, 'Wallet linked successfully');

    } catch (error) {
      console.error('Wallet linking error:', error);
      return createErrorResponse('Failed to link wallet', 500, 'WALLET_LINK_ERROR');
    }
  });
});