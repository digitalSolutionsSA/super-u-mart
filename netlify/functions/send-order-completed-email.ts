import type { Handler } from '@netlify/functions';
import { sendOrderCompletedEmail } from './utils/send-order-completed-email';

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  try {
    console.log('send-order-completed-email invoked');

    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed.' });
    }

    if (!event.body) {
      return json(400, { error: 'Missing request body.' });
    }

    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }

    const {
      orderRef,
      createdAt,
      amount,
      deliveryMethod,
      deliveryFee,
      totalKg,
      customerName,
      customerEmail,
      customerPhone,
      collectionNote,
      deliveryAddress,
      items,
    } = body || {};

    if (!customerEmail) {
      return json(400, { error: 'Customer email is required.' });
    }

    if (!orderRef) {
      return json(400, { error: 'Order reference is required.' });
    }

    await sendOrderCompletedEmail({
      createdAt: createdAt || new Date().toISOString(),
      orderRef: String(orderRef),
      amount: Number(amount || 0),
      deliveryMethod: deliveryMethod === 'collection' ? 'collection' : 'courier',
      deliveryFee: Number(deliveryFee || 0),
      totalKg: Number(totalKg || 0),
      customerName: customerName || 'Customer',
      customerEmail: String(customerEmail),
      customerPhone: customerPhone || '-',
      collectionNote: collectionNote || '',
      deliveryAddress: deliveryAddress || '',
      items: Array.isArray(items) ? items : [],
    });

    return json(200, {
      success: true,
      message: 'Order completed email sent successfully.',
    });
  } catch (error: any) {
    console.error('send-order-completed-email error:', error);

    return json(500, {
      error: error?.message || 'Failed to send order completed email.',
    });
  }
};