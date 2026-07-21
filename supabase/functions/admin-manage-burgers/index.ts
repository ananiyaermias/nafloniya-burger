import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

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
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((a) => origin.startsWith(a.replace(/\/$/, "")))
      ? origin
      : ALLOWED_ORIGINS[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

async function getJwtKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ADMIN_PASSWORD");
  if (!secret) throw new Error("ADMIN_PASSWORD env required");
  const encoder = new TextEncoder();
  const salt = encoder.encode("nafloniya-burger-admin-jwt-salt");
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits", "deriveKey"],
  );
  return await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const key = await getJwtKey();
    const payload = await verify(token, key);
    return payload.type === "admin-session";
  } catch {
    return false;
  }
}

function sanitizeStr(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function sanitizeIngredients(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((i) => (typeof i === "string" ? i.trim() : ""))
    .filter((i) => i.length > 0)
    .slice(0, 30)
    .map((i) => i.slice(0, 100));
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!body.token || !(await validateToken(body.token))) {
      return new Response(
        JSON.stringify({ success: false, error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const action = body.action as string;

    if (action === "list") {
      const { data, error } = await supabase
        .from("burgers")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, burgers: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload-image") {
      const base64 = sanitizeStr(body.fileBase64, 10_000_000);
      const contentType = sanitizeStr(body.contentType, 100) || "image/png";
      if (!base64) {
        return new Response(JSON.stringify({ success: false, error: "Missing image" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(contentType)) {
        return new Response(JSON.stringify({ success: false, error: "Unsupported image type" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      if (bytes.byteLength > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, error: "Image too large (max 5MB)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ext = contentType.split("/")[1].replace("jpeg", "jpg");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("burger-images")
        .upload(path, bytes, { contentType, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("burger-images").getPublicUrl(path);
      return new Response(JSON.stringify({ success: true, url: pub.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const row = {
        name: sanitizeStr(body.name, 100) || "Untitled Burger",
        description: sanitizeStr(body.description, 500),
        price: Number.isFinite(Number(body.price)) ? Math.max(0, Number(body.price)) : 0,
        image_url: sanitizeStr(body.image_url, 1000),
        ingredients: sanitizeIngredients(body.ingredients),
        sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 999,
      };
      const { data, error } = await supabase.from("burgers").insert(row).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, burger: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const id = Number(body.id);
      if (!Number.isFinite(id)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const patch: Record<string, unknown> = {};
      if (body.name !== undefined) patch.name = sanitizeStr(body.name, 100);
      if (body.description !== undefined) patch.description = sanitizeStr(body.description, 500);
      if (body.price !== undefined) patch.price = Math.max(0, Number(body.price) || 0);
      if (body.image_url !== undefined) patch.image_url = sanitizeStr(body.image_url, 1000);
      if (body.ingredients !== undefined) patch.ingredients = sanitizeIngredients(body.ingredients);
      if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
      if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
      const { data, error } = await supabase
        .from("burgers").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, burger: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const id = Number(body.id);
      if (!Number.isFinite(id)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.from("burgers").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-manage-burgers error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
