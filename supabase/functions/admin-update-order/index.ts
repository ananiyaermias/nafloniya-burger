import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// Allowed origins for CORS - restrict to your domains
const ALLOWED_ORIGINS = [
  Deno.env.get("FRONTEND_URL"),
  "https://reliable-jalebi-8dbeb7.netlify.app",
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

// Create a crypto key from the admin password for JWT verification using PBKDF2
async function getJwtKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ADMIN_PASSWORD");
  if (!secret) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }
  const encoder = new TextEncoder();
  const salt = encoder.encode("nafloniya-burger-admin-jwt-salt");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"]
  );
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const jwtKey = await getJwtKey();
    const payload = await verify(token, jwtKey);
    return payload.type === "admin-session";
  } catch (err) {
    console.log("Token validation failed:", err instanceof Error ? err.message : "Unknown error");
    return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, status, token } = body;

    // Validate required fields
    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ success: false, error: "Order ID and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate status value
    const validStatuses = ["pending", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid status value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate JWT token
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await validateToken(token);
    if (!isValid) {
      console.log("Admin update attempt: failed - invalid or expired token");
      return new Response(
        JSON.stringify({ success: false, error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin update order: ${orderId} -> ${status}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-update-order:", error);
    const origin = req.headers.get("origin");
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});