import type { Handler } from '@netlify/functions';
import crypto from 'node:crypto';

type CheckoutItem = {
  id?: string | number;
  product_id?: string | number;
  name?: string;
  sku?: string;
  price?: number | string;
  quantity?: number | string;
  qty?: number | string;
  weightKg?: number | string;
  image?: string;
};

type CheckoutAddress = {
  streetAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  postal_code?: string;
  note?: string;
};

type CheckoutPayload = {
  deliveryMethod?: 'courier' | 'collection';
  delivery_method?: 'courier' | 'collection';

  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  deliveryAddress?: CheckoutAddress | null;
  address?: CheckoutAddress | null;

  collectionNote?: string;
  note?: string;

  items?: CheckoutItem[];

  subtotal?: number | string;
  totalWeight?: number | string;
  deliveryFee?: number | string;
  total?: number | string;

  amount?: number | string;
  amount_cents?: number | string;
  currency?: string;
};

type NormalizedItem = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  weightKg: number;
  image: string;
};

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toCents(value: unknown) {
  const num = safeNumber(value, 0);
  if (num < 0) return 0;
  return Math.round(num * 100);
}

function getBaseUrl(event: Parameters<Handler>[0]) {
  const envUrl =
    process.env.APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    '';

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  const host = event.headers.host;
  const proto =
    event.headers['x-forwarded-proto'] ||
    event.headers['X-Forwarded-Proto'] ||
    'https';

  return `${proto}://${host}`.replace(/\/+$/, '');
}

function normalizeDeliveryMethod(body: CheckoutPayload): 'courier' | 'collection' {
  const method = body.deliveryMethod || body.delivery_method;
  return method === 'collection' ? 'collection' : 'courier';
}

function normalizeCustomer(body: CheckoutPayload) {
  return {
    name: safeString(body.customer?.name || body.customerName),
    email: safeString(body.customer?.email || body.customerEmail),
    phone: safeString(body.customer?.phone || body.customerPhone),
  };
}

function normalizeAddress(body: CheckoutPayload): CheckoutAddress | null {
  const raw = body.deliveryAddress || body.address || null;

  if (!raw || typeof raw !== 'object') return null;

  return {
    streetAddress: safeString(raw.streetAddress || raw.addressLine1),
    addressLine1: safeString(raw.addressLine1 || raw.streetAddress),
    addressLine2: safeString(raw.addressLine2),
    suburb: safeString(raw.suburb),
    city: safeString(raw.city),
    province: safeString(raw.province),
    postalCode: safeString(raw.postalCode || raw.postal_code),
    postal_code: safeString(raw.postal_code || raw.postalCode),
    note: safeString(raw.note || body.note),
  };
}

function normalizeItems(items: unknown): NormalizedItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item): NormalizedItem | null => {
      if (!item || typeof item !== 'object') return null;

      const typed = item as CheckoutItem;
      const id = String(typed.id ?? typed.product_id ?? '').trim();
      const name = safeString(typed.name);
      const sku = safeString(typed.sku);
      const price = safeNumber(typed.price, 0);
      const quantity = Math.max(
        0,
        Math.floor(safeNumber(typed.quantity ?? typed.qty, 0))
      );
      const weightKg = safeNumber(typed.weightKg, 0);
      const image = safeString(typed.image);

      if (!id || !name || price <= 0 || quantity <= 0) {
        return null;
      }

      return {
        id,
        name,
        sku,
        price,
        quantity,
        weightKg,
        image,
      };
    })
    .filter((item): item is NormalizedItem => Boolean(item));
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed.' });
    }

    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      return json(500, { error: 'Missing YOCO_SECRET_KEY environment variable.' });
    }

    let body: CheckoutPayload;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }

    const deliveryMethod = normalizeDeliveryMethod(body);
    const customer = normalizeCustomer(body);
    const address = normalizeAddress(body);
    const items = normalizeItems(body.items);

    console.log('create-checkout received:', {
      deliveryMethod,
      customer,
      itemsCount: items.length,
      subtotal: body.subtotal,
      deliveryFee: body.deliveryFee,
      total: body.total,
      amount: body.amount,
      amount_cents: body.amount_cents,
    });

    if (!customer.name) {
      return json(400, { error: 'Customer name is required.' });
    }

    if (!customer.email) {
      return json(400, { error: 'Customer email is required.' });
    }

    if (!customer.phone) {
      return json(400, { error: 'Customer phone is required.' });
    }

    if (!items.length) {
      return json(400, {
        error: 'Your cart is empty or contains invalid items.',
      });
    }

    if (deliveryMethod === 'courier') {
      if (
        !address?.streetAddress ||
        !address?.suburb ||
        !address?.city ||
        !address?.province ||
        !address?.postalCode
      ) {
        return json(400, { error: 'Please complete the full delivery address.' });
      }
    }

    const calculatedSubtotalCents = items.reduce((sum, item) => {
      return sum + Math.round(item.price * 100) * item.quantity;
    }, 0);

    const subtotalCents =
      body.subtotal !== undefined
        ? toCents(body.subtotal)
        : calculatedSubtotalCents;

    const deliveryFeeCents =
      deliveryMethod === 'collection'
        ? 0
        : toCents(body.deliveryFee);

    let totalCents: number;

    if (body.amount_cents !== undefined) {
      totalCents = Math.max(0, Math.round(safeNumber(body.amount_cents, 0)));
    } else if (body.total !== undefined) {
      totalCents = toCents(body.total);
    } else if (body.amount !== undefined) {
      totalCents = toCents(body.amount);
    } else {
      totalCents = calculatedSubtotalCents + deliveryFeeCents;
    }

    const expectedTotalCents = calculatedSubtotalCents + deliveryFeeCents;

    if (subtotalCents !== calculatedSubtotalCents) {
      return json(400, {
        error: 'Subtotal mismatch. Please refresh your cart and try again.',
        details: {
          receivedSubtotalCents: subtotalCents,
          calculatedSubtotalCents,
        },
      });
    }

    if (totalCents !== expectedTotalCents) {
      return json(400, {
        error: 'Total mismatch. Please refresh your cart and try again.',
        details: {
          receivedTotalCents: totalCents,
          expectedTotalCents,
          deliveryFeeCents,
          calculatedSubtotalCents,
        },
      });
    }

    if (totalCents <= 0) {
      return json(400, { error: 'Invalid order total.' });
    }

    const baseUrl = getBaseUrl(event);
    const orderRef = `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const idempotencyKey = crypto.randomUUID();

    const yocoPayload = {
      amount: totalCents,
      currency: safeString(body.currency) || 'ZAR',
      successUrl: `${baseUrl}/order-success?checkoutStatus=success&orderRef=${encodeURIComponent(orderRef)}`,
      cancelUrl: `${baseUrl}/cart?checkoutStatus=cancelled`,
      failureUrl: `${baseUrl}/cart?checkoutStatus=failed`,
      subtotalAmount: subtotalCents,
      lineItems: items.map((item) => ({
  displayName: item.name || 'Product',
  quantity: item.quantity,
  pricingDetails: {
    price: Math.round(item.price * 100),
  },
})),
      clientReferenceId: orderRef,
      externalId: orderRef,
      metadata: {
        orderRef,
        deliveryMethod,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        totalWeight: safeNumber(body.totalWeight, 0),
        collectionNote: safeString(body.collectionNote || body.note),
        deliveryAddress: address,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          weightKg: item.weightKg,
        })),
      },
    };

    console.log('Sending Yoco payload:', yocoPayload);

    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(yocoPayload),
    });

    const rawYocoText = await yocoResponse.text();
    let yocoData: any = null;

    try {
      yocoData = rawYocoText ? JSON.parse(rawYocoText) : null;
    } catch {
      yocoData = null;
    }

    console.log('Yoco response status:', yocoResponse.status);
    console.log('Yoco response body:', rawYocoText);

    if (!yocoResponse.ok) {
      return json(yocoResponse.status || 500, {
        error:
          yocoData?.message ||
          yocoData?.error ||
          rawYocoText ||
          'Failed to create Yoco checkout.',
        details: yocoData || rawYocoText || null,
      });
    }

    return json(200, {
      ok: true,
      orderRef,
      checkoutId: yocoData?.id || null,
      redirectUrl: yocoData?.redirectUrl || yocoData?.redirect_url || null,
      successUrl: yocoData?.successUrl || null,
      cancelUrl: yocoData?.cancelUrl || null,
      processingMode: yocoData?.processingMode || null,
    });
  } catch (error: any) {
    console.error('create-checkout unexpected error:', error);

    return json(500, {
      error: error?.message || 'Unexpected server error.',
    });
  }
};