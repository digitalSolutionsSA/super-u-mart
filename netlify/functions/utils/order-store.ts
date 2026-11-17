import { connectLambda, getStore } from '@netlify/blobs';

/**
 * Orders created at checkout, keyed by orderRef, stored in Netlify Blobs.
 * The Yoco webhook is the only thing that marks an order as paid.
 */

export type StoredOrderItem = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  weightKg: number;
};

export type StoredOrder = {
  orderRef: string;
  status: 'pending' | 'paid' | 'amount_mismatch' | 'expired';
  createdAt: string;
  paidAt?: string;
  checkoutId?: string | null;
  paymentId?: string | null;
  paidAmountCents?: number;
  processingMode?: string | null;
  totalCents: number;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalWeightKg: number;
  deliveryMethod: 'courier' | 'collection';
  customer: { name: string; email: string; phone: string };
  deliveryAddressText: string;
  note: string;
  items: StoredOrderItem[];
  notifiedAt?: string;
  customerEmailedAt?: string;
  processedEventIds?: string[];
};

const STORE_NAME = 'yoco-orders';

/** Must be called once per invocation (Lambda-style handlers) before using the store. */
export function initOrderStore(event: unknown) {
  try {
    // Provides Blobs credentials in Lambda-compatible functions on Netlify.
    connectLambda(event as Parameters<typeof connectLambda>[0]);
  } catch {
    // Not running on Netlify with Blobs context (e.g. local tests) – getStore
    // will use NETLIFY_BLOBS_CONTEXT / siteID+token env vars if available.
  }
}

function store() {
  // Default (eventual) consistency: strong consistency needs an
  // uncachedEdgeURL that Lambda-compatible functions aren't given, and fails.
  // Duplicate emails from a stale read are prevented by Resend idempotency keys.
  return getStore({ name: STORE_NAME });
}

function key(orderRef: string) {
  return `orders/${orderRef.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export async function saveOrder(order: StoredOrder) {
  await store().setJSON(key(order.orderRef), order);
}

export async function getOrder(orderRef: string): Promise<StoredOrder | null> {
  if (!orderRef) return null;
  const data = await store().get(key(orderRef), { type: 'json' });
  return (data as StoredOrder | null) ?? null;
}
