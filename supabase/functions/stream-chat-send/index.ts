/**
 * Stream Chat Send Edge Function
 *
 * Sends chat message during live stream with rate limiting and moderation
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthContext
} from "../_shared/auth.ts";
import { ValidationService, ChatMessageSchema } from "../_shared/validation.ts";
import { Web3IntegrationService } from "../_shared/web3.ts";

// Types
interface ChatMessageResponse {
  message: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      avatar_url?: string;
      team_badges: string[];
    };
    created_at: string;
    type: string;
    reply_to?: string;
  };
  points_earned: number;
  rate_limit: {
    remaining: number;
    reset_time: string;
  };
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
      const validation = ValidationService.validate(ChatMessageSchema, body);

      if (!validation.success) {
        return ValidationService.createValidationResponse(validation.errors!);
      }

      const messageData = validation.data!;

      // Check if user has access (active subscription)
      const { data: userProfile } = await supabase
        .from('users')
        .select('subscription_status, subscription_ends_at, name, avatar_url, team_badges')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.subscription_status !== 'active') {
        return createErrorResponse(
          'Active subscription required to chat',
          403,
          'SUBSCRIPTION_REQUIRED'
        );
      }

      const hasAccess = !userProfile.subscription_ends_at ||
                       new Date(userProfile.subscription_ends_at) > new Date();

      if (!hasAccess) {
        return createErrorResponse(
          'Subscription expired',
          403,
          'SUBSCRIPTION_EXPIRED'
        );
      }

      // Verify stream exists and is live
      const { data: stream } = await supabase
        .from('streams')
        .select('id, status, title')
        .eq('id', messageData.stream_id)
        .single();

      if (!stream) {
        return createErrorResponse('Stream not found', 404, 'STREAM_NOT_FOUND');
      }

      if (stream.status !== 'live') {
        return createErrorResponse(
          'Can only chat during live streams',
          400,
          'STREAM_NOT_LIVE'
        );
      }

      // TODO: Implement rate limiting
      // Check if user has exceeded chat rate limit (10 messages per minute)
      const rateLimitKey = `chat_rate_limit:${user.id}`;
      const currentTime = new Date();
      const oneMinuteAgo = new Date(currentTime.getTime() - 60 * 1000);

      const { count: recentMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('stream_id', messageData.stream_id)
        .gte('created_at', oneMinuteAgo.toISOString());

      const RATE_LIMIT = 10;
      if ((recentMessages || 0) >= RATE_LIMIT) {
        return createErrorResponse(
          'Rate limit exceeded. Please wait before sending another message.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // Validate reply_to message if provided
      if (messageData.reply_to) {
        const { data: replyMessage } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('id', messageData.reply_to)
          .eq('stream_id', messageData.stream_id)
          .single();

        if (!replyMessage) {
          return createErrorResponse(
            'Reply message not found',
            400,
            'REPLY_MESSAGE_NOT_FOUND'
          );
        }
      }

      // Insert chat message
      const { data: chatMessage, error: chatError } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: messageData.stream_id,
          user_id: user.id,
          content: messageData.content,
          type: messageData.type,
          reply_to: messageData.reply_to
        })
        .select()
        .single();

      if (chatError) {
        console.error('Failed to create chat message:', chatError);
        return createErrorResponse('Failed to send message', 500, 'MESSAGE_SEND_FAILED');
      }

      // Award points for chat participation (5 points per message, max 50/day)
      const pointsEarned = 5;
      const web3Service = new Web3IntegrationService();

      // Check daily chat points limit
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: todaysChatPoints } = await supabase
        .from('points_ledger')
        .select('amount')
        .eq('user_id', user.id)
        .eq('transaction_type', 'engagement')
        .eq('category', 'chat')
        .gte('created_at', startOfDay.toISOString());

      const totalTodayPoints = todaysChatPoints?.reduce((sum, record) => sum + record.amount, 0) || 0;
      const DAILY_CHAT_LIMIT = 50;

      let actualPointsEarned = 0;
      if (totalTodayPoints < DAILY_CHAT_LIMIT) {
        actualPointsEarned = Math.min(pointsEarned, DAILY_CHAT_LIMIT - totalTodayPoints);

        // Record engagement activity
        await supabase
          .from('engagement_activities')
          .insert({
            user_id: user.id,
            activity_type: 'chat',
            activity_category: 'stream_chat',
            points_earned: actualPointsEarned,
            reference_type: 'stream',
            reference_id: messageData.stream_id,
            daily_limit: DAILY_CHAT_LIMIT,
            current_daily_count: 1
          });

        // Award points via Web3 if enabled
        if (actualPointsEarned > 0) {
          await web3Service.recordPointsTransaction(
            user.id,
            actualPointsEarned,
            'engagement',
            'chat',
            chatMessage.id
          );
        }
      }

      // Update stream chat message count
      await supabase
        .rpc('increment_chat_count', {
          stream_id: messageData.stream_id
        });

      const response: ChatMessageResponse = {
        message: {
          id: chatMessage.id,
          content: chatMessage.content,
          user: {
            id: user.id,
            name: userProfile.name || user.email,
            avatar_url: userProfile.avatar_url,
            team_badges: userProfile.team_badges || []
          },
          created_at: chatMessage.created_at,
          type: chatMessage.type,
          reply_to: chatMessage.reply_to
        },
        points_earned: actualPointsEarned,
        rate_limit: {
          remaining: RATE_LIMIT - (recentMessages || 0) - 1,
          reset_time: new Date(currentTime.getTime() + 60 * 1000).toISOString()
        }
      };

      return createSuccessResponse(response, 'Message sent successfully');

    } catch (error) {
      console.error('Chat message error:', error);
      return createErrorResponse('Failed to send chat message', 500, 'CHAT_MESSAGE_ERROR');
    }
  });
});