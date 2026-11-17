/**
 * Server-side product lookups (prices, weights, dimensions) from Supabase,
 * so checkout and courier quotes never trust browser-supplied values.
 */

export type ProductRow = Record<string, any>;

function n(value: unknown) {
  const v = Number(value);
  return Number.isFinite(v) ? v : 0;
}

// Mirrors mapProductRow in src/context/StoreContext.tsx (the cart charges `price`).
export function productPrice(row: ProductRow) {
  if (typeof row.price === 'number') return row.price;
  if (typeof row.price === 'string' && row.price.trim() !== '') return n(row.price);
  if (typeof row.price_cents === 'number') return row.price_cents / 100;
  return 0;
}

export function productWeight(row: ProductRow) {
  return n(row.weight_kg ?? row.weightKg);
}

export function productDims(row: ProductRow) {
  return {
    lengthCm: n(row.length_cm ?? row.lengthCm),
    widthCm: n(row.width_cm ?? row.widthCm),
    heightCm: n(row.height_cm ?? row.heightCm),
  };
}

export function productCollectionOnly(row: ProductRow) {
  return Boolean(row.collection_only ?? row.collectionOnly ?? row.collectiononly ?? false);
}

/**
 * Loads products by id. Returns null when Supabase is not configured for
 * functions (callers then fall back to browser-supplied values).
 */
export async function fetchProductsById(ids: string[]): Promise<Map<string, ProductRow> | null> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key) return null;

  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return new Map();
  const inList = unique.map((id) => `"${id.replace(/"/g, '')}"`).join(',');
  const endpoint = `${url}/rest/v1/products?select=*&id=in.(${encodeURIComponent(inList)})`;

  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    throw new Error(`Supabase products lookup failed (${res.status}): ${await res.text()}`);
  }

  const rows = (await res.json()) as ProductRow[];
  return new Map(rows.map((row) => [String(row.id), row]));
}
