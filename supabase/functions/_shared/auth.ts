import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  supabase: any;
}

/**
 * Creates an authenticated Supabase client and verifies the user
 */
export async function createAuthenticatedClient(req: Request): Promise<AuthContext> {
  // Get Supabase configuration
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get and verify authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const jwt = authHeader.replace('Bearer ', '');

  // Verify JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    throw new Error('Invalid or expired token');
  }

  return {
    user: {
      id: user.id,
      email: user.email!,
      role: user.role
    },
    supabase
  };
}

/**
 * Middleware function to handle authentication for edge functions
 */
export async function withAuth(
  req: Request,
  handler: (context: AuthContext, req: Request) => Promise<Response>
): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const context = await createAuthenticatedClient(req);
    return await handler(context, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    const status = message.includes('Missing') ? 401 :
                  message.includes('Invalid') ? 401 : 500;

    return new Response(JSON.stringify({
      error: message,
      code: status === 401 ? 'UNAUTHORIZED' : 'AUTH_ERROR'
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Validates request body against a schema
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: string[],
  allowedFields?: string[]
): T {
  // Check required fields
  const missingFields = requiredFields.filter(field =>
    body[field] === undefined || body[field] === null
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Filter to allowed fields if specified
  if (allowedFields) {
    const validBody: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        validBody[field] = body[field];
      }
    }
    return validBody as T;
  }

  return body as T;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data: any, message?: string): Response {
  return new Response(JSON.stringify({
    success: true,
    data,
    ...(message && { message })
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 500,
  code?: string
): Response {
  const message = error instanceof Error ? error.message : error;

  return new Response(JSON.stringify({
    success: false,
    error: message,
    ...(code && { code })
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Checks if user has required subscription status
 */
export async function requireActiveSubscription(
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('has_active_subscription', { user_id: userId });

  if (error) {
    console.error('Error checking subscription status:', error);
    throw new Error('Unable to verify subscription status');
  }

  return data === true;
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, number[]>();

export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];

  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    return false;
  }

  // Add current request
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);

  return true;
}