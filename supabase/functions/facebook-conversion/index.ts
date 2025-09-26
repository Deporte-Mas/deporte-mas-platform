import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      event_name,
      event_id,
      action_source = "website",
      event_source_url,
      fbp,
      fbc,
      user_data,
      custom_data,
      metadata = {}
    } = await req.json();

    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    const pixelId = Deno.env.get("META_PIXEL_ID");

    if (!accessToken || !pixelId) {
      console.warn("Meta Conversion API not configured - skipping event");
      return new Response(JSON.stringify({
        success: false,
        message: "Meta API not configured"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prepare the conversion event
    const eventData = {
      data: [{
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        action_source,
        event_source_url,
        user_data: {
          ...user_data,
          // Hash sensitive data if needed
          em: user_data?.email ? await hashData(user_data.email.toLowerCase()) : undefined,
          ph: user_data?.phone ? await hashData(user_data.phone) : undefined,
        },
        custom_data,
        event_id, // For deduplication
      }],
      ...(fbp && { _fbp: fbp }),
      ...(fbc && { _fbc: fbc }),
    };

    // Remove undefined fields
    Object.keys(eventData.data[0]).forEach(key => {
      if (eventData.data[0][key] === undefined) {
        delete eventData.data[0][key];
      }
    });

    // Send to Meta Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Meta Conversion API error:", result);
      return new Response(JSON.stringify({
        success: false,
        error: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("Meta Conversion API success:", { event_name, event_id });

    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Facebook conversion error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Simple SHA-256 hashing function for sensitive data
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}