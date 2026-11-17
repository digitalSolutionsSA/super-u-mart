import type { Handler } from '@netlify/functions';
import { quoteCourier, type CourierAddress, type CourierItem } from './utils/courier';
import {
  fetchProductsById,
  productCollectionOnly,
  productDims,
  productPrice,
  productWeight,
} from './utils/products';

/**
 * POST /.netlify/functions/courier-quote
 * Body: { deliveryAddress?: {...}, items: [{ id, quantity }] }
 * Returns the courier fee checkout will charge (live The Courier Guy rate
 * when configured, otherwise the table on chargeable weight).
 */

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

const s = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 200) : '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  let body: any;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const rawItems: any[] = Array.isArray(body?.items) ? body.items.slice(0, 200) : [];
  const wanted = rawItems
    .map((i) => ({
      id: String(i?.id ?? '').trim(),
      quantity: Math.max(0, Math.min(1000, Math.floor(Number(i?.quantity) || 0))),
    }))
    .filter((i) => i.id && i.quantity > 0);

  if (!wanted.length) return json(400, { error: 'No items.' });

  let rows;
  try {
    rows = await fetchProductsById(wanted.map((i) => i.id));
  } catch (err) {
    console.error('courier-quote product lookup failed:', err);
    return json(502, { error: 'Could not load products.' });
  }
  if (!rows) return json(503, { error: 'Product data not configured.' });

  const items: CourierItem[] = [];
  let collectionOnly = false;
  for (const w of wanted) {
    const row = rows.get(w.id);
    if (!row) continue;
    collectionOnly ||= productCollectionOnly(row);
    items.push({
      name: String(row.name ?? ''),
      quantity: w.quantity,
      weightKg: productWeight(row),
      price: productPrice(row),
      ...productDims(row),
    });
  }

  if (!items.length) return json(400, { error: 'Products not found.' });

  const a = body?.deliveryAddress || {};
  const address: CourierAddress = {
    streetAddress: s(a.streetAddress),
    addressLine2: s(a.addressLine2),
    suburb: s(a.suburb),
    city: s(a.city),
    province: s(a.province),
    postalCode: s(a.postalCode),
  };

  const quote = await quoteCourier(address, items);

  return json(200, {
    deliveryFee: quote.feeCents / 100,
    source: quote.source,
    serviceLevel: quote.serviceLevel,
    actualKg: quote.actualKg,
    volumetricKg: quote.volumetricKg,
    chargeableKg: quote.chargeableKg,
    parcels: quote.parcels,
    collectionOnly,
    warning: quote.warning || null,
  });
};
