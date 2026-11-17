import type { Handler } from '@netlify/functions';
import { getOrder, initOrderStore } from './utils/order-store';

/**
 * GET /.netlify/functions/order-status?orderRef=sm-...
 * Returns only the payment status (no personal details), so the success page
 * can show "paid" once the Yoco webhook has confirmed it.
 */
export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  const orderRef = String(event.queryStringParameters?.orderRef || '').trim();
  if (!/^sm-[0-9]+-[0-9]+$/.test(orderRef)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid orderRef.' }) };
  }

  try {
    initOrderStore(event);
    const order = await getOrder(orderRef);
    if (!order) {
      return { statusCode: 404, headers, body: JSON.stringify({ status: 'unknown' }) };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderRef,
        status: order.status,
        paidAt: order.paidAt || null,
        total: order.totalCents / 100,
      }),
    };
  } catch (err) {
    console.error('order-status error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lookup failed.' }) };
  }
};
