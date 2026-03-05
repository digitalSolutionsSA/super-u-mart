// netlify/functions/admin-upload-product-image.ts
import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

function json(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!ADMIN_TOKEN) missing.push("ADMIN_TOKEN");
  return missing;
}

// Accepts: "data:image/jpeg;base64,...." or raw base64
function base64ToUint8Array(b64: string) {
  const cleaned = b64.includes("base64,") ? b64.split("base64,")[1] : b64;
  const buf = Buffer.from(cleaned, "base64");
  return new Uint8Array(buf);
}

export const handler: Handler = async (event) => {
  const missing = requireEnv();
  if (missing.length) return json(500, { error: "Missing env", missing });

  const token = event.headers["x-admin-token"] || event.headers["X-Admin-Token"];
  if (token !== ADMIN_TOKEN) return json(401, { error: "Unauthorized" });

  if (event.httpMethod !== "POST") return json(405, { error: "Use POST" });

  let payload: any;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const product_id = String(payload.product_id || "").trim();
  const image_base64 = String(payload.image_base64 || "").trim();
  const index = Number(payload.index ?? 1);

  if (!product_id) return json(400, { error: "product_id is required" });
  if (!image_base64) return json(400, { error: "image_base64 is required" });
  if (!Number.isFinite(index) || index < 1 || index > 3) return json(400, { error: "index must be 1..3" });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const bucket = "product-images";
  const path = `superumart/products/${product_id}/${index}.jpg`;

  const bytes = base64ToUint8Array(image_base64);

  // Upload (overwrite allowed)
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (upErr) return json(500, { error: "Upload failed", details: upErr.message });

  // Public URL
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

  return json(200, { ok: true, path, public_url: pub.publicUrl });
};