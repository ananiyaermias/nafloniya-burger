import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

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

// Rate limiting for failed login attempts
const failedAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION_SECONDS = 30 * 60; // 30 minutes

// Password strength validation
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "ADMIN_PASSWORD environment variable is required" };
  }
  
  if (password.length < 12) {
    return { valid: false, error: "ADMIN_PASSWORD must be at least 12 characters" };
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^password/i,
    /^admin/i,
    /^123456/,
    /^qwerty/i,
    /^letmein/i,
    /^welcome/i,
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { valid: false, error: "ADMIN_PASSWORD contains a common weak pattern" };
    }
  }
  
  // Require character diversity (at least 2 of: lowercase, uppercase, digits, special)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  
  const diversity = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (diversity < 2) {
    return { valid: false, error: "ADMIN_PASSWORD must contain at least 2 of: lowercase, uppercase, digits, special characters" };
  }
  
  return { valid: true };
}

// Create a crypto key from the admin password for JWT signing using PBKDF2
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

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function isBlocked(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() > record.blockedUntil) {
    failedAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): number {
  const record = failedAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION_MS;
  }
  failedAttempts.set(ip, record);
  return record.count;
}

function clearAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    
    // Check if IP is blocked
    if (isBlocked(clientIP)) {
      console.log(`Blocked IP attempted login: ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many failed attempts. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength on startup/first use
    const passwordValidation = validatePasswordStrength(adminPassword);
    if (!passwordValidation.valid) {
      console.error(`Password strength validation failed: ${passwordValidation.error}`);
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwtKey = await getJwtKey();

    // Handle token validation request
    if (body.action === "validate" && body.token) {
      try {
        const payload = await verify(body.token, jwtKey);
        if (payload.type === "admin-session") {
          return new Response(
            JSON.stringify({ success: true, valid: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        console.log("Token validation failed:", err instanceof Error ? err.message : "Unknown error");
      }
      return new Response(
        JSON.stringify({ success: false, valid: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle logout request
    if (body.action === "logout") {
      // JWT tokens are stateless, so logout is handled client-side
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle login request
    if (body.password) {
      if (body.password === adminPassword) {
        clearAttempts(clientIP);
        
        // Create JWT token
        const token = await create(
          { alg: "HS256", typ: "JWT" },
          { 
            type: "admin-session",
            iat: getNumericDate(0),
            exp: getNumericDate(SESSION_DURATION_SECONDS)
          },
          jwtKey
        );

        console.log(`Admin login success from IP: ${clientIP}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            token,
            expiresIn: SESSION_DURATION_SECONDS * 1000
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        const attempts = recordFailedAttempt(clientIP);
        console.log(`Admin login failed from IP: ${clientIP} (attempt ${attempts}/${MAX_ATTEMPTS})`);
        
        return new Response(
          JSON.stringify({ success: false }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-admin:", error);
    const origin = req.headers.get("origin");
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});