// netlify/functions/admin-upsert-product.ts
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

function parseIntSafe(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseBool(v: any): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function slugify(input: string): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const handler: Handler = async (event) => {
  const missing = requireEnv();
  if (missing.length) return json(500, { error: "Missing env", missing });

  // Simple admin auth
  const token = event.headers["x-admin-token"] || event.headers["X-Admin-Token"];
  if (token !== ADMIN_TOKEN) return json(401, { error: "Unauthorized" });

  if (event.httpMethod !== "POST") return json(405, { error: "Use POST" });

  let payload: any;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Lock this function to SuperÜMart (multi-store ready later)
  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select("id, slug")
    .eq("slug", "superumart")
    .single();

  if (brandErr || !brand) return json(500, { error: "Brand lookup failed", details: brandErr?.message });

  const id = payload.id ? String(payload.id) : null;
  const name = String(payload.name || "").trim();
  if (!name) return json(400, { error: "name is required" });

  const category_id = payload.category_id ? String(payload.category_id) : null;

  // Optional: verify category is in same brand
  if (category_id) {
    const { data: cat, error: catErr } = await supabase
      .from("categories")
      .select("id, brand_id")
      .eq("id", category_id)
      .single();

    if (catErr || !cat) return json(400, { error: "Invalid category_id" });
    if (cat.brand_id !== brand.id) return json(400, { error: "Category brand mismatch" });
  }

  const is_on_sale = parseBool(payload.is_on_sale);
  const is_featured = parseBool(payload.is_featured);

  const price_cents = parseIntSafe(payload.price_cents);
  const sale_price_cents = parseIntSafe(payload.sale_price_cents);

  if (!price_cents || price_cents <= 0) return json(400, { error: "price_cents must be > 0" });

  if (is_on_sale) {
    if (!sale_price_cents || sale_price_cents <= 0) return json(400, { error: "sale_price_cents required when on sale" });
    if (sale_price_cents >= price_cents) return json(400, { error: "sale_price_cents must be less than price_cents" });
  }

  // Images: expect array of URLs length 0..3
  const images = Array.isArray(payload.images) ? payload.images.map(String) : [];
  if (images.length > 3) return json(400, { error: "Max 3 images per product" });

  const image_url = payload.image_url ? String(payload.image_url) : (images[0] || null);

  const slug = payload.slug ? String(payload.slug) : slugify(name);

  const row = {
    brand_id: brand.id,
    category_id,
    name,
    slug,
    description: payload.description ? String(payload.description) : null,

    image_url,
    images,

    weight_grams: parseIntSafe(payload.weight_grams),
    length_mm: parseIntSafe(payload.length_mm),
    width_mm: parseIntSafe(payload.width_mm),
    height_mm: parseIntSafe(payload.height_mm),

    price_cents,
    is_featured,
    is_on_sale,
    sale_price_cents: is_on_sale ? sale_price_cents : null,

    is_active: payload.is_active === undefined ? true : parseBool(payload.is_active),
  };

  // Upsert: if id provided -> update, else insert
  if (id) {
    const { data, error } = await supabase
      .from("products")
      .update(row)
      .eq("id", id)
      .eq("brand_id", brand.id) // extra safety
      .select("*")
      .single();

    if (error) return json(500, { error: "Update failed", details: error.message });
    return json(200, { ok: true, product: data });
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select("*")
      .single();

    if (error) return json(500, { error: "Insert failed", details: error.message });
    return json(200, { ok: true, product: data });
  }
};