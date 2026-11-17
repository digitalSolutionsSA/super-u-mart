import type { Handler } from '@netlify/functions';
import crypto from 'node:crypto';
import { getOrder, initOrderStore, saveOrder, type StoredOrder } from './utils/order-store';
import { sendOrderCompletedEmail } from './utils/send-order-completed-email';
import { sendCustomerReceiptEmail } from './utils/send-customer-receipt-email';
import { handler as sendWhatsappNotification } from './send-order-notification';

/**
 * Yoco webhook receiver.
 * Register it with scripts/register-yoco-webhook.mjs and set YOCO_WEBHOOK_SECRET
 * (the "whsec_..." value Yoco returns) in Netlify environment variables.
 *
 * Verification follows Yoco's docs: HMAC-SHA256 over
 * `${webhook-id}.${webhook-timestamp}.${rawBody}` with the base64-decoded
 * secret (after the "whsec_" prefix), compared to the "v1,<sig>" entries
 * in the webhook-signature header.
 */

const MAX_TIMESTAMP_SKEW_SECONDS = 3 * 60;

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function header(headers: Record<string, string | undefined>, name: string) {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers || {})) {
    if (k.toLowerCase() === lower) return v ?? '';
  }
  return '';
}

export function verifyYocoSignature(
  rawBody: string,
  headers: Record<string, string | undefined>,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): { ok: true } | { ok: false; reason: string } {
  const id = header(headers, 'webhook-id');
  const timestamp = header(headers, 'webhook-timestamp');
  const signatureHeader = header(headers, 'webhook-signature');

  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'Missing webhook signature headers' };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return { ok: false, reason: 'Webhook timestamp outside allowed window' };
  }

  const secretPart = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const key = Buffer.from(secretPart, 'base64');

  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  const matches = signatureHeader
    .split(' ')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => {
      const [version, sig] = entry.split(',', 2);
      if (version !== 'v1' || !sig) return false;
      const received = Buffer.from(sig, 'base64');
      return received.length === expected.length && crypto.timingSafeEqual(received, expected);
    });

  return matches ? { ok: true } : { ok: false, reason: 'Invalid webhook signature' };
}

/** Rebuilds an order from Yoco metadata if it wasn't saved at checkout. */
function orderFromMetadata(meta: Record<string, any>, amountCents: number): StoredOrder {
  const toCents = (v: unknown) => Math.round(Number(v || 0) * 100) || 0;
  return {
    orderRef: String(meta.orderRef || ''),
    status: 'pending',
    createdAt: new Date().toISOString(),
    checkoutId: meta.checkoutId || null,
    totalCents: amountCents,
    subtotalCents: toCents(meta.subtotal),
    deliveryFeeCents: toCents(meta.deliveryFee),
    totalWeightKg: Number(meta.totalWeightKg || 0),
    deliveryMethod: meta.deliveryMethod === 'collection' ? 'collection' : 'courier',
    customer: {
      name: String(meta.customerName || ''),
      email: String(meta.customerEmail || ''),
      phone: String(meta.customerPhone || ''),
    },
    deliveryAddressText: String(meta.deliveryAddress || ''),
    note: String(meta.note || ''),
    // Only a summary string is in metadata.
    items: meta.items
      ? [{ id: '', name: String(meta.items), sku: '', price: 0, quantity: 1, weightKg: 0 }]
      : [],
  };
}

async function notifyShop(order: StoredOrder) {
  const flag = order.status === 'amount_mismatch' ? ' [CHECK: AMOUNT MISMATCH]' : '';

  await sendOrderCompletedEmail({
    createdAt: order.paidAt || order.createdAt,
    orderRef: order.orderRef + flag,
    amount: (order.paidAmountCents ?? order.totalCents) / 100,
    deliveryMethod: order.deliveryMethod,
    deliveryFee: order.deliveryFeeCents / 100,
    totalKg: order.totalWeightKg,
    customerName: order.customer.name || 'Customer',
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone || '-',
    collectionNote: order.note,
    deliveryAddress: order.deliveryAddressText,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      weightKg: item.weightKg,
      price: item.price,
    })),
  });

  // WhatsApp alert is optional – only if its env vars are configured.
  const hasWhatsapp =
    (process.env.SUPERUMART_WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID) &&
    (process.env.SUPERUMART_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN) &&
    (process.env.SUPERUMART_OWNER_WHATSAPP || process.env.OWNER_WHATSAPP);

  if (hasWhatsapp) {
    try {
      const res: any = await sendWhatsappNotification(
        {
          httpMethod: 'POST',
          body: JSON.stringify({
            orderRef: order.orderRef + flag,
            createdAt: order.paidAt || order.createdAt,
            customerName: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
            address: order.deliveryAddressText,
            note: order.note,
            items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
            total: `R${((order.paidAmountCents ?? order.totalCents) / 100).toFixed(2)}`,
            courierFee: order.deliveryFeeCents / 100,
            deliveryMethod: order.deliveryMethod,
          }),
        }
      );
      if (res?.statusCode && res.statusCode >= 300) {
        console.error('WhatsApp notification failed:', res.body);
      }
    } catch (err) {
      console.error('WhatsApp notification error:', err);
    }
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('yoco-webhook: YOCO_WEBHOOK_SECRET is not set');
    return json(500, { error: 'Webhook not configured.' });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '';

  const verification = verifyYocoSignature(
    rawBody,
    event.headers as Record<string, string | undefined>,
    secret
  );
  if (!verification.ok) {
    console.warn('yoco-webhook rejected:', verification.reason);
    return json(401, { error: verification.reason });
  }

  let payloadEvent: any;
  try {
    payloadEvent = JSON.parse(rawBody);
  } catch {
    return json(400, { error: 'Invalid JSON.' });
  }

  const type = String(payloadEvent?.type || '');
  const eventId = String(payloadEvent?.id || '');
  const payload = payloadEvent?.payload || {};
  const metadata: Record<string, any> = payload?.metadata || {};
  const orderRef = String(metadata.orderRef || payload?.clientReferenceId || '');

  console.log('yoco-webhook event:', { type, eventId, orderRef, mode: payload?.mode });

  if (type !== 'payment.succeeded' && type !== 'checkout.expired') {
    // Acknowledge events we don't act on so Yoco doesn't retry them.
    return json(200, { ok: true, ignored: type });
  }

  if (!orderRef) {
    console.warn('yoco-webhook: event has no orderRef in metadata');
    return json(200, { ok: true, ignored: 'no orderRef' });
  }

  initOrderStore(event);

  let order = await getOrder(orderRef);

  if (type === 'checkout.expired') {
    if (order && order.status === 'pending') {
      order.status = 'expired';
      await saveOrder(order);
    }
    return json(200, { ok: true });
  }

  // payment.succeeded
  const paidAmountCents = Math.round(Number(payload?.amount || 0));

  if (!order) {
    console.warn('yoco-webhook: no stored order, rebuilding from metadata', orderRef);
    order = orderFromMetadata(metadata, paidAmountCents);
  }

  if (eventId && order.processedEventIds?.includes(eventId) && order.notifiedAt) {
    return json(200, { ok: true, duplicate: true });
  }

  if (order.status === 'pending' || order.status === 'expired') {
    order.status = paidAmountCents === order.totalCents ? 'paid' : 'amount_mismatch';
    order.paidAt = payload?.createdDate || new Date().toISOString();
    order.paidAmountCents = paidAmountCents;
    order.paymentId = payload?.id || null;
    order.checkoutId = order.checkoutId || metadata.checkoutId || null;
    order.processingMode = payload?.mode || order.processingMode || null;
  }

  order.processedEventIds = Array.from(
    new Set([...(order.processedEventIds || []), ...(eventId ? [eventId] : [])])
  ).slice(-20);

  await saveOrder(order);

  if (order.status === 'amount_mismatch') {
    console.error('yoco-webhook: amount mismatch', {
      orderRef,
      expected: order.totalCents,
      paid: paidAmountCents,
    });
  }

  let shopFailed = false;

  if (!order.notifiedAt) {
    try {
      await notifyShop(order);
      order.notifiedAt = new Date().toISOString();
      await saveOrder(order);
    } catch (err) {
      console.error('yoco-webhook: order notification failed', err);
      shopFailed = true;
    }
  }

  // Customer receipt: only for confirmed, correctly-paid orders.
  if (order.status === 'paid' && !order.customerEmailedAt && order.customer.email) {
    try {
      await sendCustomerReceiptEmail({
        orderRef: order.orderRef,
        paidAt: order.paidAt || new Date().toISOString(),
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddressText,
        note: order.note,
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        subtotal: order.subtotalCents / 100,
        deliveryFee: order.deliveryFeeCents / 100,
        total: (order.paidAmountCents ?? order.totalCents) / 100,
      });
      order.customerEmailedAt = new Date().toISOString();
      await saveOrder(order);
    } catch (err) {
      // Not retried via Yoco on its own: a bad customer address would otherwise
      // make Yoco retry for days and eventually disable the webhook. It is
      // re-attempted if Yoco retries because the shop email failed.
      console.error('yoco-webhook: customer receipt failed', err);
    }
  }

  if (shopFailed) {
    // Non-2xx makes Yoco retry, which retries the shop notification.
    return json(500, { error: 'Notification failed; will retry.' });
  }

  return json(200, { ok: true, status: order.status });
};
