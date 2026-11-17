#!/usr/bin/env node
/**
 * Registers this site's Yoco webhook (run once per Yoco key: once for test, once for live).
 *
 * PowerShell:
 *   $env:YOCO_SECRET_KEY="sk_test_..."; node scripts/register-yoco-webhook.mjs https://your-site.netlify.app
 *
 * It prints the webhook secret ("whsec_..."). Yoco only shows it once, so copy it into
 * Netlify > Site configuration > Environment variables as YOCO_WEBHOOK_SECRET,
 * then redeploy.
 *
 * Add --list to see existing webhooks for the key instead of creating one.
 */

const secretKey = process.env.YOCO_SECRET_KEY;
const args = process.argv.slice(2);

if (!secretKey) {
  console.error('Set YOCO_SECRET_KEY in your environment first.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json',
};

if (args.includes('--list')) {
  const res = await fetch('https://payments.yoco.com/api/webhooks', { headers });
  console.log(res.status, await res.text());
  process.exit(res.ok ? 0 : 1);
}

const siteUrl = (args[0] || '').replace(/\/+$/, '');
if (!/^https:\/\//.test(siteUrl)) {
  console.error('Usage: node scripts/register-yoco-webhook.mjs https://your-site.netlify.app');
  process.exit(1);
}

const url = `${siteUrl}/.netlify/functions/yoco-webhook`;

const res = await fetch('https://payments.yoco.com/api/webhooks', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'super-u-mart-orders',
    url,
    events: ['payment.succeeded', 'checkout.expired'],
  }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Yoco returned ${res.status}: ${text}`);
  process.exit(1);
}

const data = JSON.parse(text);
console.log(`Webhook registered: ${data.id} -> ${url}`);
console.log('');
console.log('Set this in Netlify as YOCO_WEBHOOK_SECRET (shown only once):');
console.log(data.secret);
