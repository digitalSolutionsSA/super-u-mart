import { Resend } from 'resend';

/**
 * Customer-facing "order confirmed" receipt, sent by the Yoco webhook once a
 * payment is confirmed.
 *
 * Env:
 *  RESEND_API_KEY, RESEND_FROM_EMAIL   (required, shared with the shop email)
 *  CUSTOMER_REPLY_TO                   (optional; defaults to the first ORDER_NOTIFICATION_TO)
 */

const resend = new Resend(process.env.RESEND_API_KEY);

const SHOP_NAME = 'Super U Mart';
const SHOP_PHONE = '084 988 8800';
const SHOP_LOCATION = 'Vereeniging Industrial';

export type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

export type CustomerReceiptInput = {
  orderRef: string;
  paidAt: string;
  customerName: string;
  customerEmail: string;
  deliveryMethod: 'courier' | 'collection';
  deliveryAddress: string;
  note: string;
  items: ReceiptItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

function money(value: number) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function firstName(name: string) {
  return (name || '').trim().split(/\s+/)[0] || 'there';
}

function fulfilmentText(order: CustomerReceiptInput) {
  return order.deliveryMethod === 'collection'
    ? `Collection from ${SHOP_LOCATION}. We'll contact you when your order is ready to collect.`
    : `Courier delivery to: ${order.deliveryAddress || 'the address you provided'}.`;
}

function buildText(order: CustomerReceiptInput) {
  const lines = [
    `Hi ${firstName(order.customerName)},`,
    '',
    `Thank you for your order with ${SHOP_NAME}. Your payment has been received and confirmed.`,
    '',
    `Order reference: ${order.orderRef}`,
    `Paid: ${formatDate(order.paidAt)}`,
    '',
    'Items:',
    ...order.items.map(
      (i) => `- ${i.quantity} x ${i.name} @ ${money(i.price)} = ${money(i.price * i.quantity)}`
    ),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `${order.deliveryMethod === 'collection' ? 'Collection' : 'Courier'}: ${money(order.deliveryFee)}`,
    `Total paid: ${money(order.total)}`,
    '',
    fulfilmentText(order),
  ];

  if (order.note) lines.push(`Your note: ${order.note}`);

  lines.push(
    '',
    `Questions? Reply to this email or call us on ${SHOP_PHONE}, quoting your order reference.`,
    '',
    SHOP_NAME
  );

  return lines.join('\n');
}

function buildHtml(order: CustomerReceiptInput) {
  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">${esc(i.name)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#475569;text-align:center;white-space:nowrap;">${i.quantity} &times; ${money(i.price)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;text-align:right;white-space:nowrap;font-weight:700;">${money(i.price * i.quantity)}</td>
        </tr>`
    )
    .join('');

  const noteBlock = order.note
    ? `<p style="margin:8px 0 0;color:#64748b;font-size:14px;">Your note: ${esc(order.note)}</p>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#1a2e7a;padding:22px 28px;">
              <span style="color:#ffffff;font-size:22px;font-weight:800;">Super <span style="background:#f97316;padding:0 6px;border-radius:3px;">&Uuml;</span> Mart</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Order confirmed</h1>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Hi ${esc(firstName(order.customerName))}, thank you for your order. Your payment has been received and confirmed.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:22px;">
                <tr>
                  <td style="padding:14px 16px;font-size:14px;color:#64748b;">Order reference<br><strong style="color:#1a2e7a;font-size:16px;">${esc(order.orderRef)}</strong></td>
                  <td style="padding:14px 16px;font-size:14px;color:#64748b;text-align:right;">Paid<br><strong style="color:#0f172a;">${esc(formatDate(order.paidAt))}</strong></td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                ${rows}
                <tr>
                  <td colspan="2" style="padding:12px 0 4px;color:#475569;">Subtotal</td>
                  <td style="padding:12px 0 4px;text-align:right;color:#0f172a;">${money(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:4px 0;color:#475569;">${order.deliveryMethod === 'collection' ? 'Collection' : 'Courier'}</td>
                  <td style="padding:4px 0;text-align:right;color:#0f172a;">${money(order.deliveryFee)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:12px 0 0;border-top:2px solid #e2e8f0;font-weight:800;font-size:16px;color:#0f172a;">Total paid</td>
                  <td style="padding:12px 0 0;border-top:2px solid #e2e8f0;text-align:right;font-weight:800;font-size:18px;color:#f97316;">${money(order.total)}</td>
                </tr>
              </table>

              <div style="margin-top:24px;padding:16px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;">
                <p style="margin:0;color:#9a3412;font-size:14px;font-weight:700;">${order.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'}</p>
                <p style="margin:6px 0 0;color:#7c2d12;font-size:14px;line-height:1.5;">${esc(fulfilmentText(order))}</p>
                ${noteBlock}
              </div>

              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Questions? Reply to this email or call us on ${SHOP_PHONE}, quoting your order reference.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 28px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;">
              ${SHOP_NAME} &middot; ${SHOP_LOCATION} &middot; ${SHOP_PHONE}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendCustomerReceiptEmail(order: CustomerReceiptInput) {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  if (!process.env.RESEND_FROM_EMAIL) throw new Error('Missing RESEND_FROM_EMAIL');
  if (!order.customerEmail) throw new Error('Missing customer email');

  const replyTo =
    process.env.CUSTOMER_REPLY_TO ||
    (process.env.ORDER_NOTIFICATION_TO || '').split(',').map((e) => e.trim()).filter(Boolean)[0] ||
    undefined;

  const { data, error } = await resend.emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL,
      to: [order.customerEmail],
      subject: `Your ${SHOP_NAME} order is confirmed – ${order.orderRef}`,
      text: buildText(order),
      html: buildHtml(order),
      replyTo,
    },
    // Resend drops duplicates with the same key for 24h.
    { idempotencyKey: `customer-receipt-${order.orderRef}` }
  );

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
