/**
 * Input Validation Utilities
 *
 * Provides Zod schemas and validation functions for all API endpoints
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================================================
// AUTHENTICATION & USER SCHEMAS
// ============================================================================

export const UserProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  country: z.string().min(2).max(50).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  avatar_url: z.string().url().optional(),
  team_badges: z.array(z.string().uuid()).max(5).optional(),
  preferred_language: z.enum(['es', 'en']).optional(),
  notification_preferences: z.record(z.boolean()).optional()
});

export const WalletLinkSchema = z.object({
  provider: z.enum(['cavos']).default('cavos'),
  recovery_method: z.enum(['email', 'phone']).default('email')
});

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const CheckoutSessionSchema = z.object({
  returnUrl: z.string().url(),
  planType: z.enum(['monthly', 'annual']),
  metadata: z.record(z.string()).optional()
});

export const SubscriptionManagementSchema = z.object({
  action: z.enum(['cancel', 'reactivate']),
  reason: z.string().max(500).optional()
});

// ============================================================================
// STREAMING SCHEMAS
// ============================================================================

export const StreamInitializeSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  scheduled_start: z.string().datetime(),
  panelists: z.array(z.string().min(1).max(100)).max(10),
  category: z.enum(['match_analysis', 'interview', 'q_and_a', 'news', 'special']),
  topics: z.array(z.string().min(1).max(100)).max(20).optional()
});

export const StreamUpdateSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  scheduled_start: z.string().datetime().optional(),
  panelists: z.array(z.string().min(1).max(100)).max(10).optional(),
  topics: z.array(z.string().min(1).max(100)).max(20).optional()
});

export const ChatMessageSchema = z.object({
  stream_id: z.string().uuid(),
  content: z.string().min(1).max(500).trim(),
  reply_to: z.string().uuid().optional(),
  type: z.enum(['message', 'announcement']).default('message')
});

export const ChatModerationSchema = z.object({
  message_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  action: z.enum(['delete_message', 'timeout_user', 'ban_user']),
  duration: z.number().int().min(1).max(10080).optional(), // max 7 days in minutes
  reason: z.string().min(1).max(200).trim()
});

// ============================================================================
// CONTENT SCHEMAS
// ============================================================================

export const ContentUploadSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  type: z.enum(['vod', 'interview', 'analysis', 'course_module']),
  category: z.enum(['tactical_analysis', 'player_interview', 'match_recap', 'training', 'behind_scenes']),
  is_premium: z.boolean().default(false),
  points_cost: z.number().int().min(0).max(10000).default(0),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  panelists: z.array(z.string().min(1).max(100)).max(10).optional()
});

export const ContentPublishSchema = z.object({
  content_id: z.string().uuid(),
  publish_date: z.string().datetime().optional(),
  featured: z.boolean().default(false),
  featured_order: z.number().int().min(0).optional(),
  collections: z.array(z.string().uuid()).max(10).optional(),
  visibility: z.enum(['published', 'unlisted']).default('published')
});

export const ContentViewSchema = z.object({
  content_id: z.string().uuid(),
  watch_time: z.number().int().min(0),
  current_position: z.number().int().min(0),
  session_id: z.string().uuid().optional()
});

export const ContentSearchSchema = z.object({
  q: z.string().min(1).max(100).trim().optional(),
  type: z.enum(['vod', 'interview', 'analysis', 'course_module']).optional(),
  category: z.string().min(1).max(50).optional(),
  panelist: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
  is_premium: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(['recent', 'popular', 'relevance']).default('relevance')
});

export const CollectionCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  type: z.enum(['series', 'playlist', 'category', 'featured']),
  is_premium: z.boolean().default(false),
  points_cost: z.number().int().min(0).max(10000).default(0),
  is_featured: z.boolean().default(false)
});

export const CollectionManageSchema = z.object({
  collection_id: z.string().uuid(),
  content_id: z.string().uuid(),
  action: z.enum(['add', 'remove']),
  order_index: z.number().int().min(0).optional()
});

// ============================================================================
// POINTS SCHEMAS
// ============================================================================

export const PointsSpendSchema = z.object({
  amount: z.number().int().min(1).max(50000),
  purpose: z.enum(['giveaway_entry', 'content_unlock', 'premium_feature']),
  reference_id: z.string().uuid(),
  metadata: z.record(z.string()).optional()
});

export const PointsRefundSchema = z.object({
  transaction_id: z.string().uuid(),
  reason: z.string().min(1).max(200).trim()
});

export const PointsHistorySchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  type: z.enum(['yield', 'engagement', 'spend', 'refund', 'admin']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
});

// ============================================================================
// GIVEAWAY SCHEMAS
// ============================================================================

export const GiveawayCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim(),
  prize_type: z.enum(['physical', 'nft', 'points', 'experience']),
  prize_details: z.record(z.any()),
  prize_value: z.number().int().min(0).optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  entry_requirements: z.record(z.any()).optional(),
  base_entries: z.number().int().min(1).max(100).default(1),
  points_per_entry: z.number().int().min(0).max(1000).default(100),
  max_entries_per_user: z.number().int().min(1).max(1000).default(10),
  number_of_winners: z.number().int().min(1).max(100).default(1)
});

export const GiveawayEntrySchema = z.object({
  giveaway_id: z.string().uuid(),
  additional_entries: z.number().int().min(0).max(100)
});

export const GiveawayClaimSchema = z.object({
  giveaway_id: z.string().uuid(),
  shipping_address: z.object({
    name: z.string().min(1).max(100),
    address_line_1: z.string().min(1).max(200),
    address_line_2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postal_code: z.string().min(1).max(20),
    country: z.string().min(2).max(2)
  }).optional()
});

// ============================================================================
// POLL SCHEMAS
// ============================================================================

export const PollCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  type: z.enum(['multiple_choice', 'yes_no', 'rating', 'ranking']),
  options: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(200),
    image_url: z.string().url().optional()
  })).min(2).max(10),
  stream_id: z.string().uuid().optional(),
  content_id: z.string().uuid().optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  allow_multiple_selection: z.boolean().default(false),
  show_results_live: z.boolean().default(false),
  anonymous_voting: z.boolean().default(false),
  points_reward: z.number().int().min(0).max(1000).default(25)
});

export const PollVoteSchema = z.object({
  poll_id: z.string().uuid(),
  selected_options: z.array(z.string()).min(1).max(10),
  comment: z.string().max(500).trim().optional()
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const AdminUserUpdateSchema = z.object({
  user_id: z.string().uuid(),
  updates: z.object({
    is_active_subscriber: z.boolean().optional(),
    points_adjustment: z.number().int().optional(),
    team_badges: z.array(z.string().uuid()).optional(),
    banned: z.boolean().optional()
  }),
  reason: z.string().min(1).max(500).trim()
});

export const AdminContentModerationSchema = z.object({
  content_id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'flag', 'unpublish']),
  reason: z.string().max(500).trim().optional(),
  visibility: z.enum(['published', 'draft', 'unlisted', 'archived']).optional()
});

export const AdminUserListSchema = z.object({
  search: z.string().max(100).trim().optional(),
  is_active_subscriber: z.boolean().optional(),
  banned: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'last_active', 'subscription_started_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationCreateSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(10000),
  type: z.enum(['stream_start', 'giveaway_win', 'points_earned', 'content_available', 'announcement']),
  title: z.string().min(1).max(200).trim(),
  body: z.string().max(1000).trim(),
  action_url: z.string().url().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  send_push: z.boolean().default(true),
  send_email: z.boolean().default(false),
  expires_at: z.string().datetime().optional()
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationService {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
  } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        return { success: false, errors };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown' }]
      };
    }
  }

  static createValidationResponse(errors: ValidationError[]): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Validation failed',
        errors
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/);
export const URLSchema = z.string().url();
export const DateTimeSchema = z.string().datetime();

// Pagination schema for list endpoints
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

// Common filters
export const DateRangeSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
});

export default {
  ValidationService,
  // Auth & User
  UserProfileUpdateSchema,
  WalletLinkSchema,
  // Subscription
  CheckoutSessionSchema,
  SubscriptionManagementSchema,
  // Streaming
  StreamInitializeSchema,
  StreamUpdateSchema,
  ChatMessageSchema,
  ChatModerationSchema,
  // Content
  ContentUploadSchema,
  ContentPublishSchema,
  ContentViewSchema,
  ContentSearchSchema,
  CollectionCreateSchema,
  CollectionManageSchema,
  // Points
  PointsSpendSchema,
  PointsRefundSchema,
  PointsHistorySchema,
  // Giveaways
  GiveawayCreateSchema,
  GiveawayEntrySchema,
  GiveawayClaimSchema,
  // Polls
  PollCreateSchema,
  PollVoteSchema,
  // Admin
  AdminUserUpdateSchema,
  AdminContentModerationSchema,
  AdminUserListSchema,
  // Notifications
  NotificationCreateSchema,
  // Utilities
  UUIDSchema,
  EmailSchema,
  PhoneSchema,
  URLSchema,
  DateTimeSchema,
  PaginationSchema,
  DateRangeSchema
};