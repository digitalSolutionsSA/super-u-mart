/**
 * GA4 ecommerce events (G-PY4K7LWSN9, loaded in index.html).
 * Event names/params follow GA4's recommended ecommerce schema so they show
 * up in GA4's Monetisation reports. Safe to call when gtag is blocked.
 */

type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function send(event: string, params: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  } catch {
    // analytics must never break the shop
  }
}

export function toAnalyticsItem(product: any, quantity: number): AnalyticsItem {
  return {
    item_id: String(product?.sku || product?.id || ''),
    item_name: String(product?.name || 'Product'),
    item_category: product?.category ? String(product.category) : undefined,
    price: Number(product?.price) || 0,
    quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
  };
}

function value(items: AnalyticsItem[]) {
  return Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
}

export function trackAddToCart(product: any, quantity: number) {
  const items = [toAnalyticsItem(product, quantity)];
  send('add_to_cart', { currency: 'ZAR', value: value(items), items });
}

export function trackRemoveFromCart(product: any, quantity: number) {
  const items = [toAnalyticsItem(product, quantity)];
  send('remove_from_cart', { currency: 'ZAR', value: value(items), items });
}

export function trackBeginCheckout(items: AnalyticsItem[], total: number, deliveryMethod: string) {
  send('begin_checkout', {
    currency: 'ZAR',
    value: Math.round(total * 100) / 100,
    shipping_tier: deliveryMethod,
    items,
  });
}

/** Sent once per order (deduped in sessionStorage), only after payment is confirmed. */
export function trackPurchase(params: {
  orderRef: string;
  total: number;
  shipping: number;
  deliveryMethod: string;
  items: AnalyticsItem[];
}) {
  const key = `ga4PurchaseSent:${params.orderRef}`;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    // ignore
  }

  send('purchase', {
    transaction_id: params.orderRef,
    currency: 'ZAR',
    value: Math.round(params.total * 100) / 100,
    shipping: Math.round(params.shipping * 100) / 100,
    shipping_tier: params.deliveryMethod,
    items: params.items,
  });

  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}
