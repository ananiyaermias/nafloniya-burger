import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to your domains
const ALLOWED_ORIGINS = [
  Deno.env.get("FRONTEND_URL"),
  "https://4050c612-9249-4fb6-aea6-d095216cd0ef.lovableproject.com",
  "https://id-preview--4050c612-9249-4fb6-aea6-d095216cd0ef.lovable.app",
  "https://nafloniyaburger.lovable.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8080",
].filter(Boolean) as string[];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))
    ? origin
    : ALLOWED_ORIGINS[0] || "*";
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max orders per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// Input validation for batch orders
function validateOrder(data: any): { valid: boolean; error?: string } {
  if (!data.customer_name || typeof data.customer_name !== 'string') {
    return { valid: false, error: "Customer name is required" };
  }
  if (data.customer_name.trim().length < 2 || data.customer_name.length > 100) {
    return { valid: false, error: "Customer name must be 2-100 characters" };
  }
  
  if (!data.customer_phone || typeof data.customer_phone !== 'string') {
    return { valid: false, error: "Phone number is required" };
  }
  const phoneDigits = data.customer_phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return { valid: false, error: "Phone number must be 10-15 digits" };
  }

  // Support batch items array or single burger_name
  if (data.items && Array.isArray(data.items)) {
    if (data.items.length === 0 || data.items.length > 20) {
      return { valid: false, error: "Must have 1-20 items" };
    }
    for (const item of data.items) {
      if (!item.burger_name || typeof item.burger_name !== 'string' || item.burger_name.length > 100) {
        return { valid: false, error: "Invalid burger name in items" };
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 10) {
        return { valid: false, error: "Quantity must be 1-10 per item" };
      }
    }
  } else {
    if (!data.burger_name || typeof data.burger_name !== 'string' || data.burger_name.length > 100) {
      return { valid: false, error: "Burger name is required" };
    }
    if (!data.quantity || typeof data.quantity !== 'number' || data.quantity < 1 || data.quantity > 10) {
      return { valid: false, error: "Quantity must be 1-10" };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check rate limit
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited: ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many orders. Please wait a minute and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateOrder(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to insert order(s)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Build rows - support batch or single
    const rows = body.items && Array.isArray(body.items)
      ? body.items.map((item: any) => ({
          burger_name: item.burger_name.trim(),
          customer_name: body.customer_name.trim(),
          customer_phone: body.customer_phone.replace(/\D/g, ''),
          quantity: item.quantity,
          status: "pending",
        }))
      : [{
          burger_name: body.burger_name.trim(),
          customer_name: body.customer_name.trim(),
          customer_phone: body.customer_phone.replace(/\D/g, ''),
          quantity: body.quantity,
          status: "pending",
        }];

    const { data, error } = await supabase
      .from("orders")
      .insert(rows)
      .select();

    if (error) {
      console.error("Error creating order:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${data.length} order(s) created from IP ${clientIP}`);

    return new Response(
      JSON.stringify({ success: true, orderIds: data.map((d: any) => d.id) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-order:", error);
    const origin = req.headers.get("origin");
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});