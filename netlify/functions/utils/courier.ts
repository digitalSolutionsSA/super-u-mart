/**
 * Courier pricing for The Courier Guy (TCG).
 *
 * TCG no longer publishes a public rate card – rates are per account. TCG's
 * portal runs on Shiplogic, whose API returns the account's real rate for a
 * route + parcel sizes: POST {TCG_API_BASE}/rates (Bearer API key).
 * Docs: https://www.shiplogic.com/api-docs/post-getting-rates
 *
 * When TCG_API_KEY + collection address are configured, live TCG rates are
 * used. Otherwise the shop's own weight table is used, applied to the
 * chargeable weight (greater of actual and volumetric weight per parcel).
 *
 * Env:
 *   TCG_API_KEY               API key from portal.thecourierguy.co.za > Integrations > API Keys
 *   TCG_API_BASE              default https://api-tcg.shiplogic.com (confirm in TCG portal docs)
 *   TCG_SERVICE_LEVEL         service code to charge, e.g. ECO (economy). Default: cheapest returned.
 *   TCG_COLLECTION_COMPANY, TCG_COLLECTION_STREET, TCG_COLLECTION_SUBURB,
 *   TCG_COLLECTION_CITY, TCG_COLLECTION_PROVINCE, TCG_COLLECTION_POSTAL_CODE
 *   VOLUMETRIC_DIVISOR        default 5000 (L×W×H cm ÷ divisor = kg). Confirm on your TCG rate card.
 */

export type CourierItem = {
  name: string;
  quantity: number;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  price?: number;
};

export type CourierAddress = {
  streetAddress?: string;
  addressLine2?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

export type CourierQuote = {
  feeCents: number;
  source: 'tcg' | 'table';
  serviceLevel: string | null;
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
  parcels: number;
  warning?: string;
};

const MAX_PARCELS = 50;

export function volumetricDivisor() {
  const d = Number(process.env.VOLUMETRIC_DIVISOR);
  return Number.isFinite(d) && d > 0 ? d : 5000;
}

/** Shop's fallback table (Rands) – keep in sync with src/context/StoreContext.tsx */
export function tableCourierFee(chargeableKg: number) {
  if (chargeableKg <= 0) return 0;
  if (chargeableKg <= 2) return 120;
  if (chargeableKg <= 5) return 155;
  if (chargeableKg <= 10) return 165;
  if (chargeableKg <= 15) return 200;
  if (chargeableKg <= 20) return 285;
  const extraKg = Math.ceil(chargeableKg - 20);
  return 285 + extraKg * 15;
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Per-unit volumetric kg = L×W×H / divisor (0 if dimensions unknown). */
export function unitVolumetricKg(item: CourierItem, divisor = volumetricDivisor()) {
  const l = num(item.lengthCm);
  const w = num(item.widthCm);
  const h = num(item.heightCm);
  if (!l || !w || !h) return 0;
  return (l * w * h) / divisor;
}

/** Couriers bill each parcel on max(actual, volumetric). */
export function weightSummary(items: CourierItem[], divisor = volumetricDivisor()) {
  let actualKg = 0;
  let volumetricKg = 0;
  let chargeableKg = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    const actual = num(item.weightKg);
    const vol = unitVolumetricKg(item, divisor);
    actualKg += actual * qty;
    volumetricKg += vol * qty;
    chargeableKg += Math.max(actual, vol) * qty;
  }
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return { actualKg: round(actualKg), volumetricKg: round(volumetricKg), chargeableKg: round(chargeableKg) };
}

/**
 * One parcel per unit (each product ships in its own packaging). Very large
 * orders are merged into MAX_PARCELS parcels by stacking the extra units.
 */
export function buildParcels(items: CourierItem[]) {
  const units: { l: number; w: number; h: number; kg: number }[] = [];
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    for (let i = 0; i < qty; i++) {
      units.push({
        l: num(item.lengthCm) || 10,
        w: num(item.widthCm) || 10,
        h: num(item.heightCm) || 10,
        kg: num(item.weightKg) || 0.1,
      });
    }
  }

  while (units.length > MAX_PARCELS) {
    // Merge the two smallest-volume parcels by stacking (keeps volume honest).
    units.sort((a, b) => a.l * a.w * a.h - b.l * b.w * b.h);
    const a = units.shift()!;
    const b = units.shift()!;
    const l = Math.max(a.l, b.l);
    const w = Math.max(a.w, b.w);
    const h = (a.l * a.w * a.h + b.l * b.w * b.h) / (l * w);
    units.push({ l, w, h, kg: a.kg + b.kg });
  }

  return units.map((u) => ({
    submitted_length_cm: Math.round(u.l * 10) / 10,
    submitted_width_cm: Math.round(u.w * 10) / 10,
    submitted_height_cm: Math.round(u.h * 10) / 10,
    submitted_weight_kg: Math.round(u.kg * 1000) / 1000,
  }));
}

function collectionAddress() {
  const e = process.env;
  const addr = {
    type: 'business',
    company: e.TCG_COLLECTION_COMPANY || 'Super U Mart',
    street_address: e.TCG_COLLECTION_STREET || '',
    local_area: e.TCG_COLLECTION_SUBURB || '',
    city: e.TCG_COLLECTION_CITY || '',
    zone: e.TCG_COLLECTION_PROVINCE || '',
    country: 'ZA',
    code: e.TCG_COLLECTION_POSTAL_CODE || '',
  };
  return addr.street_address && addr.city && addr.code ? addr : null;
}

export function liveRatesConfigured() {
  return Boolean(process.env.TCG_API_KEY && collectionAddress());
}

function pickRate(rates: any[]): { rand: number; code: string | null } | null {
  const wanted = (process.env.TCG_SERVICE_LEVEL || '').trim().toUpperCase();
  const parsed = rates
    .map((r) => ({
      rand: Number(r?.rate),
      code: String(r?.service_level?.code || r?.service_level_code || '').toUpperCase() || null,
      name: r?.service_level?.name || null,
    }))
    .filter((r) => Number.isFinite(r.rand) && r.rand > 0);

  if (!parsed.length) return null;
  if (wanted) {
    const match = parsed.find((r) => r.code === wanted);
    if (match) return { rand: match.rand, code: match.code };
  }
  const cheapest = parsed.sort((a, b) => a.rand - b.rand)[0];
  return { rand: cheapest.rand, code: cheapest.code };
}

async function tcgRate(address: CourierAddress, items: CourierItem[]) {
  const base = (process.env.TCG_API_BASE || 'https://api-tcg.shiplogic.com').replace(/\/+$/, '');
  const declaredValue = items.reduce((s, i) => s + num(i.price) * Math.max(0, i.quantity), 0);

  const body = {
    collection_address: collectionAddress(),
    delivery_address: {
      type: 'residential',
      company: '',
      street_address: [address.streetAddress, address.addressLine2].filter(Boolean).join(', '),
      local_area: address.suburb || '',
      city: address.city || '',
      zone: address.province || '',
      country: 'ZA',
      code: address.postalCode || '',
    },
    parcels: buildParcels(items),
    declared_value: Math.round(declaredValue * 100) / 100,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}/rates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TCG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`TCG rates ${res.status}: ${text.slice(0, 300)}`);
    const data = JSON.parse(text);
    const picked = pickRate(Array.isArray(data?.rates) ? data.rates : []);
    if (!picked) throw new Error('TCG returned no usable rates');
    return picked;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Courier quote for a cart. Always returns a fee: live TCG rate when
 * configured and reachable, otherwise the table on chargeable weight.
 */
export async function quoteCourier(
  address: CourierAddress | null,
  items: CourierItem[]
): Promise<CourierQuote> {
  const weights = weightSummary(items);
  const parcels = buildParcels(items).length;
  const table: CourierQuote = {
    feeCents: Math.round(tableCourierFee(weights.chargeableKg) * 100),
    source: 'table',
    serviceLevel: null,
    parcels,
    ...weights,
  };

  const addressComplete = Boolean(address?.streetAddress && address?.city && address?.postalCode);
  if (!liveRatesConfigured() || !addressComplete) return table;

  try {
    const rate = await tcgRate(address!, items);
    return {
      ...table,
      feeCents: Math.round(rate.rand * 100),
      source: 'tcg',
      serviceLevel: rate.code,
    };
  } catch (err: any) {
    console.error('TCG live rate failed, using table:', err?.message || err);
    return { ...table, warning: 'Live courier rate unavailable; standard rate applied.' };
  }
}
