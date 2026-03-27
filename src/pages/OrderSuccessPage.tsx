import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Home,
  ShoppingBag,
  Copy,
  ClipboardCheck,
  Truck,
  Store,
  User,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useStore } from '../context/StoreContext';

type SnapshotItem = {
  id?: string;
  product_id?: string;
  name?: string;
  sku?: string;
  price?: number;
  qty?: number;
  quantity?: number;
  weightKg?: number;
  image?: string;
};

type SnapshotOrder = {
  orderRef?: string | null;
  createdAt?: string;
  deliveryMethod?: 'courier' | 'collection';
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  deliveryAddress?: {
    streetAddress?: string;
    addressLine1?: string;
    addressLine2?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    postal_code?: string;
    note?: string;
  } | null;
  collectionNote?: string;
  items?: SnapshotItem[];
  subtotal?: number;
  deliveryFee?: number;
  totalWeight?: number;
  total?: number;
};

function safeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatMoney(value: unknown) {
  return `R${safeNumber(value).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildAddressText(order: SnapshotOrder | null) {
  if (!order) return 'N/A';

  const address = order.deliveryAddress;
  if (!address) {
    return order.deliveryMethod === 'collection' ? 'Collection from store' : 'N/A';
  }

  return [
    address.streetAddress || address.addressLine1,
    address.addressLine2,
    address.suburb,
    address.city,
    address.province,
    address.postalCode || address.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
}

function buildAddressLines(order: SnapshotOrder | null) {
  if (!order) return ['N/A'];

  const address = order.deliveryAddress;
  if (!address) {
    return order.deliveryMethod === 'collection' ? ['Collect in store'] : ['N/A'];
  }

  return [
    address.streetAddress || address.addressLine1,
    address.addressLine2,
    address.suburb,
    [address.city, address.province].filter(Boolean).join(', '),
    address.postalCode || address.postal_code,
  ].filter(Boolean) as string[];
}

function buildCopyText(order: SnapshotOrder) {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.deliveryAddress;

  const lines: string[] = [
    'ORDER COMPLETED',
    `Created: ${order.createdAt || 'N/A'}`,
    `Order Ref: ${order.orderRef || 'N/A'}`,
    `Amount: ${formatMoney(order.total)}`,
    `${order.deliveryMethod === 'collection' ? 'Collection' : 'Courier'}: ${formatMoney(
      order.deliveryMethod === 'collection' ? 0 : order.deliveryFee
    )} (Total kg: ${safeNumber(order.totalWeight).toFixed(2)}kg)`,
    `Customer: ${order.customer?.name || 'N/A'}`,
    `Email: ${order.customer?.email || 'N/A'}`,
    `Phone: ${order.customer?.phone || 'N/A'}`,
  ];

  if (order.deliveryMethod === 'courier') {
    lines.push('Address:');
    if (address?.streetAddress || address?.addressLine1) {
      lines.push(address.streetAddress || address.addressLine1 || '');
    }
    if (address?.addressLine2) lines.push(address.addressLine2);
    if (address?.suburb || address?.city) {
      lines.push([address.suburb, address.city].filter(Boolean).join(', '));
    }
    if (address?.province || address?.postalCode || address?.postal_code) {
      lines.push(
        [address.province, address.postalCode || address.postal_code]
          .filter(Boolean)
          .join(', ')
      );
    }
    if (address?.note) {
      lines.push(`Note: ${address.note}`);
    }
  } else if (order.collectionNote) {
    lines.push(`Collection Note: ${order.collectionNote}`);
  }

  lines.push('Items:');

  if (!items.length) {
    lines.push('- No items found');
  } else {
    items.forEach(item => {
      const qty = safeNumber(item.quantity ?? item.qty, 0);
      const price = safeNumber(item.price, 0);
      const weight = safeNumber(item.weightKg, 0);
      const weightText = weight > 0 ? ` (${weight.toFixed(2)}kg)` : '';
      lines.push(`- ${qty}x ${item.name || 'Product'}${weightText} @ ${formatMoney(price)} each`);
    });
  }

  return lines.join('\n');
}

export default function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();
  const { orders } = useStore();
  const storeOrder = orders.find(o => String(o.id) === String(id));

  const [copied, setCopied] = useState(false);
  const [snapshot, setSnapshot] = useState<SnapshotOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastOrderDetails');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSnapshot(parsed);
    } catch (error) {
      console.error('Failed to read lastOrderDetails from sessionStorage:', error);
    }
  }, []);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const checkoutStatus = searchParams.get('checkoutStatus') || '';
  const orderRefFromUrl = searchParams.get('orderRef') || '';

  const order: SnapshotOrder | null = useMemo(() => {
    if (snapshot) {
      return {
        ...snapshot,
        orderRef: snapshot.orderRef || orderRefFromUrl || null,
      };
    }

    if (!storeOrder) return null;

    return {
      orderRef: orderRefFromUrl || String(storeOrder.id ?? ''),
      createdAt: undefined,
      deliveryMethod: (storeOrder as any).deliveryMethod,
      customer: {
        name: (storeOrder as any).customer?.name,
        email: (storeOrder as any).customer?.email,
        phone: (storeOrder as any).customer?.phone,
      },
      deliveryAddress: (storeOrder as any).deliveryAddress || null,
      collectionNote: (storeOrder as any).collectionNote || '',
      items: Array.isArray((storeOrder as any).items)
        ? (storeOrder as any).items.map((item: any) => ({
            id: item?.id,
            product_id: item?.product_id,
            name: item?.name,
            sku: item?.sku,
            price: safeNumber(item?.price),
            quantity: safeNumber(item?.quantity ?? item?.qty),
            qty: safeNumber(item?.quantity ?? item?.qty),
            weightKg: safeNumber(item?.weightKg),
            image: item?.image,
          }))
        : [],
      subtotal: safeNumber((storeOrder as any).subtotal),
      deliveryFee: safeNumber((storeOrder as any).deliveryFee),
      totalWeight: safeNumber((storeOrder as any).totalWeight),
      total: safeNumber((storeOrder as any).total),
    };
  }, [snapshot, storeOrder, orderRefFromUrl]);

  useEffect(() => {
    if (!order) return;
    if (checkoutStatus !== 'success') return;

    const resolvedOrderRef = order.orderRef || orderRefFromUrl;
    if (!resolvedOrderRef) {
      console.warn('Skipping owner notification: missing orderRef');
      return;
    }

    const sentKey = `ownerNotificationSent:${resolvedOrderRef}`;
    const alreadySent = sessionStorage.getItem(sentKey);

    if (alreadySent === 'true') {
      console.log('Owner notification already sent for this orderRef:', resolvedOrderRef);
      return;
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const addressLines =
      order.deliveryMethod === 'courier'
        ? buildAddressLines(order)
        : ['Collect in store'];

    const ownerNotificationPayload = {
      orderRef: resolvedOrderRef,
      createdAt: order.createdAt || new Date().toISOString(),
      customerName: order.customer?.name || 'Unknown customer',
      phone: order.customer?.phone || '-',
      email: order.customer?.email || '-',
      deliveryMethod: order.deliveryMethod === 'courier' ? 'delivery' : 'collection',
      address: addressLines.join('\n'),
      note:
        order.deliveryMethod === 'collection'
          ? order.collectionNote || '-'
          : order.deliveryAddress?.note || '-',
      items: items.map(item => ({
        ...item,
        price_cents: Math.round(safeNumber(item.price) * 100),
      })),
      total: formatMoney(order.total),
      courierFee:
        order.deliveryMethod === 'collection'
          ? '0.00'
          : safeNumber(order.deliveryFee).toFixed(2),
    };

    const sendNotification = async () => {
      try {
        console.log('Sending owner notification from OrderSuccessPage:', ownerNotificationPayload);

        const response = await fetch('/.netlify/functions/send-order-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ownerNotificationPayload),
        });

        const responseText = await response.text();

        console.log('send-order-notification status:', response.status);
        console.log('send-order-notification response:', responseText);

        if (!response.ok) {
          throw new Error(responseText || 'Failed to send owner notification');
        }

        sessionStorage.setItem(sentKey, 'true');
      } catch (error) {
        console.error('Owner WhatsApp notification failed on success page:', error);
      }
    };

    sendNotification();
  }, [order, checkoutStatus, orderRefFromUrl]);

  const items = Array.isArray(order?.items) ? order.items : [];

  const itemsTotal =
    order?.subtotal ??
    items.reduce((sum, item) => {
      const qty = safeNumber(item.quantity ?? item.qty, 0);
      const price = safeNumber(item.price, 0);
      return sum + qty * price;
    }, 0);

  const deliveryFee =
    order?.deliveryMethod === 'collection' ? 0 : safeNumber(order?.deliveryFee);

  const totalKg = safeNumber(order?.totalWeight);
  const totalAmount = safeNumber(order?.total);

  const copyText = useMemo(() => {
    if (!order) return '';
    return buildCopyText(order);
  }, [order]);

  const handleCopy = async () => {
    if (!copyText) return;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      console.error('Failed to copy order details:', error);
      alert('Could not copy the order details.');
    }
  };

  const pageShell: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    fontFamily: 'Barlow, sans-serif',
  };

  const mainCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    border: '1px solid #e2e8f0',
    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
  };

  const infoCard: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 18,
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
    padding: 24,
  };

  return (
    <div style={pageShell}>
      <Header />

      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1160,
          margin: '0 auto',
          padding: '42px 24px 56px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            ...mainCard,
            padding: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 18,
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: 22,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(34, 197, 94, 0.10)',
                border: '1px solid rgba(34, 197, 94, 0.20)',
                flexShrink: 0,
              }}
            >
              <CheckCircle size={46} color="#22c55e" />
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <h1
                style={{
                  margin: '0 0 10px',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 900,
                  fontSize: 42,
                  color: '#0f172a',
                  lineHeight: 1,
                }}
              >
                Payment completed
              </h1>
              <p
                style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: 17,
                  lineHeight: 1.7,
                  maxWidth: 760,
                }}
              >
                Thank you. Your checkout was completed successfully. The full order details are shown
                below so they can be copied later if needed, because apparently screenshots are still a
                business process.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <div style={infoCard}>
              <h2
                style={{
                  margin: '0 0 18px',
                  fontWeight: 800,
                  fontSize: 19,
                  color: '#0f172a',
                }}
              >
                Order summary
              </h2>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#475569', fontSize: 15 }}>Items total</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatMoney(itemsTotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#475569', fontSize: 15 }}>
                    {order?.deliveryMethod === 'collection' ? 'Collection' : 'Courier'}
                  </span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatMoney(deliveryFee)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#475569', fontSize: 15 }}>Total weight</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{totalKg.toFixed(2)} kg</span>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    marginTop: 8,
                    paddingTop: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: 17,
                    }}
                  >
                    Grand total
                  </span>
                  <span
                    style={{
                      color: '#f97316',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 900,
                      fontSize: 34,
                      lineHeight: 1,
                    }}
                  >
                    {formatMoney(totalAmount)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop: '1px solid #e2e8f0',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Order Ref</span>
                  <span style={{ color: '#1a2e7a', fontWeight: 700, textAlign: 'right' }}>
                    {order?.orderRef || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Created</span>
                  <span style={{ color: '#334155', fontWeight: 600, textAlign: 'right' }}>
                    {formatDate(order?.createdAt)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Customer</span>
                  <span style={{ color: '#334155', fontWeight: 600, textAlign: 'right' }}>
                    {order?.customer?.name || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Delivery</span>
                  <span
                    style={{
                      color: '#334155',
                      fontWeight: 600,
                      textAlign: 'right',
                      textTransform: 'capitalize',
                    }}
                  >
                    {order?.deliveryMethod || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Address</span>
                  <span
                    style={{
                      color: '#334155',
                      fontWeight: 600,
                      textAlign: 'right',
                      maxWidth: 280,
                      lineHeight: 1.5,
                    }}
                  >
                    {buildAddressText(order)}
                  </span>
                </div>
              </div>
            </div>

            <div style={infoCard}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 14,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: '0 0 6px',
                      fontWeight: 800,
                      fontSize: 19,
                      color: '#0f172a',
                    }}
                  >
                    Copyable details
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Use this if someone needs the order summary later.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: copied ? '#dcfce7' : '#1a2e7a',
                    color: copied ? '#166534' : '#ffffff',
                    border: copied ? '1px solid #bbf7d0' : 'none',
                    borderRadius: 12,
                    padding: '11px 14px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy details'}
                </button>
              </div>

              <div
                style={{
                  borderRadius: 16,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: 18,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#334155',
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {copyText || 'No order details found.'}
                </pre>
              </div>
            </div>
          </div>

          <div
            style={{
              ...infoCard,
              marginTop: 24,
            }}
          >
            <h2
              style={{
                margin: '0 0 18px',
                fontWeight: 800,
                fontSize: 19,
                color: '#0f172a',
              }}
            >
              Order details
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    color: '#1a2e7a',
                    fontWeight: 800,
                  }}
                >
                  <User size={16} />
                  Customer
                </div>
                <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.7 }}>
                  <div>{order?.customer?.name || 'N/A'}</div>
                  <div>{order?.customer?.email || 'N/A'}</div>
                  <div>{order?.customer?.phone || 'N/A'}</div>
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    color: '#1a2e7a',
                    fontWeight: 800,
                  }}
                >
                  {order?.deliveryMethod === 'collection' ? <Store size={16} /> : <Truck size={16} />}
                  {order?.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'}
                </div>
                <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.7 }}>
                  {order?.deliveryMethod === 'collection' ? (
                    <div>{order?.collectionNote || 'Collection from store'}</div>
                  ) : (
                    <>
                      <div>{buildAddressText(order)}</div>
                      {order?.deliveryAddress?.note ? (
                        <div style={{ marginTop: 8, color: '#64748b' }}>
                          Note: {order.deliveryAddress.note}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>

            {items.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map((item, index) => {
                  const qty = safeNumber(item.quantity ?? item.qty, 0);
                  const price = safeNumber(item.price, 0);

                  return (
                    <div
                      key={`${item.id || item.product_id || item.name || 'item'}-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: 15,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.name || 'Product'}
                        </div>
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: 13,
                            marginTop: 4,
                            lineHeight: 1.5,
                          }}
                        >
                          Qty {qty}
                          {item.sku ? ` • SKU: ${item.sku}` : ''}
                          {safeNumber(item.weightKg) > 0
                            ? ` • ${safeNumber(item.weightKg).toFixed(2)} kg each`
                            : ''}
                        </div>
                      </div>

                      <div
                        style={{
                          color: '#1a2e7a',
                          fontWeight: 800,
                          fontSize: 15,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatMoney(qty * price)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: 18,
                  borderRadius: 16,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: 14,
                }}
              >
                No item details found.
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 28,
            }}
          >
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#1a2e7a',
                color: 'white',
                textDecoration: 'none',
                padding: '13px 24px',
                borderRadius: 12,
                fontWeight: 800,
                boxShadow: '0 10px 20px rgba(26, 46, 122, 0.18)',
              }}
            >
              <Home size={16} /> Home
            </Link>

            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#f97316',
                color: 'white',
                textDecoration: 'none',
                padding: '13px 24px',
                borderRadius: 12,
                fontWeight: 800,
                boxShadow: '0 10px 20px rgba(249, 115, 22, 0.20)',
              }}
            >
              <ShoppingBag size={16} /> Shop More
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}