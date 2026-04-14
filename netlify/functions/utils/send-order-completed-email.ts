import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type OrderItem = {
  name: string;
  quantity: number;
  weightKg?: number;
  price: number;
};

export type SendOrderCompletedEmailInput = {
  createdAt: string;
  orderRef: string;
  amount: number;
  deliveryMethod: 'collection' | 'courier';
  deliveryFee: number;
  totalKg: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  collectionNote?: string;
  deliveryAddress?: string;
  items: OrderItem[];
};

function formatMoney(value: number): string {
  return `R${Number(value || 0).toFixed(2)}`;
}

function formatWeight(value?: number): string {
  return `${Number(value || 0).toFixed(2)}kg`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildItemsLines(items: OrderItem[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '- No items found';
  }

  return items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const name = item.name || 'Unnamed item';
      const weightPart =
        typeof item.weightKg === 'number'
          ? ` (${formatWeight(item.weightKg)})`
          : '';
      const price = formatMoney(item.price);

      return `- ${quantity}x ${name}${weightPart} @ ${price} each`;
    })
    .join('\n');
}

function buildOrderCompletedText(order: SendOrderCompletedEmailInput): string {
  const deliveryLabel =
    order.deliveryMethod === 'collection' ? 'Collection' : 'Courier';

  const extraLine =
    order.deliveryMethod === 'collection'
      ? `Collection Note: ${order.collectionNote || 'N/A'}`
      : `Delivery Address: ${order.deliveryAddress || 'N/A'}`;

  return `ORDER COMPLETED
Created: ${order.createdAt}
Order Ref: ${order.orderRef}
Amount: ${formatMoney(order.amount)}
${deliveryLabel}: ${formatMoney(order.deliveryFee)} (Total kg: ${formatWeight(order.totalKg)})
Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
${extraLine}
Items:
${buildItemsLines(order.items)}`;
}

function buildOrderCompletedHtml(order: SendOrderCompletedEmailInput): string {
  const text = buildOrderCompletedText(order);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 16px;">ORDER COMPLETED</h2>
      <pre style="white-space: pre-wrap; font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 0;">${escapeHtml(text)}</pre>
    </div>
  `;
}

export async function sendOrderCompletedEmail(
  order: SendOrderCompletedEmailInput
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('Missing RESEND_FROM_EMAIL');
  }

  const notificationRecipients = (
    process.env.ORDER_NOTIFICATION_TO || ''
  )
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (!notificationRecipients.length) {
    throw new Error('Missing ORDER_NOTIFICATION_TO');
  }

  const subject = `Order completed - ${order.orderRef}`;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: notificationRecipients,
    subject,
    text: buildOrderCompletedText(order),
    html: buildOrderCompletedHtml(order),
    replyTo: order.customerEmail || undefined,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}