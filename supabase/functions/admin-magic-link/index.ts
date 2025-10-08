import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MagicLinkRequest {
  email: string;
  returnUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, returnUrl } = await req.json() as MagicLinkRequest;

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email is in admin whitelist
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !adminUser) {
      console.log('Unauthorized email attempt:', email);
      // Return success to prevent email enumeration
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If your email is authorized, you will receive a magic link.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store magic link token
    const { error: linkError } = await supabase
      .from('admin_magic_links')
      .insert([{
        admin_user_id: adminUser.id,
        token,
        expires_at: expiresAt.toISOString(),
        return_url: returnUrl || '/admin'
      }]);

    if (linkError) {
      console.error('Error creating magic link:', linkError);
      throw new Error('Failed to create magic link');
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://deportemas.com';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Deporte+ Club <equipo@deportemas.com>';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const magicLinkUrl = `${frontendUrl}/admin/auth/verify?token=${token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Login - Deporte+</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(to right, #1f2937, #111827); padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Deporte+ Admin</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">Admin Login Request</h2>
                      <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 24px;">
                        You requested access to the Deporte+ admin panel. Click the button below to securely log in.
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 16px 0;">
                            <a href="${magicLinkUrl}" style="display: inline-block; padding: 16px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Access Admin Panel
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                        This link will expire in <strong>10 minutes</strong> and can only be used once.
                      </p>

                      <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                        If you didn't request this, please ignore this email. The link will expire automatically.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Deporte+ Club. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Admin Login - Deporte+ Club',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Magic link sent to:', email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Magic link sent! Check your email.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-magic-link:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
