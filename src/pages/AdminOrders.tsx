import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";
const BRAND_SLUG = "superumart";

type OrderStatus = "Paid" | "Pending" | "Cancelled" | "Shipped";

type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  items: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

function formatMoney(amount: number) {
  return `R ${amount.toFixed(2)}`;
}

function formatOrderDate(dateString: string) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function normalizeStatus(status: string | null | undefined, paymentStatus?: string | null): OrderStatus {
  const s = String(status || "").trim().toLowerCase();
  const p = String(paymentStatus || "").trim().toLowerCase();

  if (s === "cancelled" || s === "canceled" || p === "failed" || p === "cancelled") {
    return "Cancelled";
  }

  if (s === "shipped" || s === "fulfilled" || s === "delivered") {
    return "Shipped";
  }

  if (s === "paid" || p === "paid" || p === "completed" || p === "successful") {
    return "Paid";
  }

  return "Pending";
}

function StatusPill({ status }: { status: OrderStatus }) {
  const style = (() => {
    switch (status) {
      case "Paid":
        return {
          bg: "rgba(34,197,94,0.14)",
          border: "rgba(34,197,94,0.35)",
          text: "rgb(22,163,74)",
        };
      case "Pending":
        return {
          bg: "rgba(249,115,22,0.14)",
          border: "rgba(249,115,22,0.35)",
          text: "rgb(234,88,12)",
        };
      case "Shipped":
        return {
          bg: "rgba(59,130,246,0.14)",
          border: "rgba(59,130,246,0.35)",
          text: "rgb(37,99,235)",
        };
      case "Cancelled":
      default:
        return {
          bg: "rgba(239,68,68,0.14)",
          border: "rgba(239,68,68,0.35)",
          text: "rgb(220,38,38)",
        };
    }
  })();

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        if (mounted) {
          setLoading(true);
          setError("");
        }

        const { data: brand, error: brandError } = await supabase
          .from("brands")
          .select("id, slug")
          .eq("slug", BRAND_SLUG)
          .single();

        if (brandError || !brand?.id) {
          throw new Error("Could not find Super U Mart brand.");
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, customer_phone, status, payment_status, amount_cents, created_at, brand_id"
          )
          .eq("brand_id", brand.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        const safeOrders = Array.isArray(ordersData) ? ordersData : [];
        const orderIds = safeOrders.map((order: any) => order.id).filter(Boolean);

        let itemCountMap: Record<string, number> = {};

        if (orderIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("order_id, qty")
            .in("order_id", orderIds);

          if (itemsError) {
            throw itemsError;
          }

          itemCountMap = (itemsData || []).reduce((acc: Record<string, number>, item: any) => {
            const orderId = String(item.order_id || "");
            const qty = Number(item.qty || 0);

            if (!orderId) return acc;
            acc[orderId] = (acc[orderId] || 0) + qty;
            return acc;
          }, {});
        }

        const mapped: Order[] = safeOrders.map((order: any) => ({
          id: String(order.id),
          orderNumber: order.order_number?.trim() || String(order.id).slice(0, 8).toUpperCase(),
          customer: order.customer_name?.trim() || "Unknown customer",
          phone: order.customer_phone?.trim() || "-",
          items: itemCountMap[String(order.id)] || 0,
          total: Number(order.amount_cents || 0) / 100,
          status: normalizeStatus(order.status, order.payment_status),
          createdAt: formatOrderDate(order.created_at),
        }));

        if (mounted) {
          setOrders(mapped);
        }
      } catch (err: any) {
        console.error("Failed to load admin orders:", err);
        if (mounted) {
          setOrders([]);
          setError(err?.message || "Failed to load orders.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    const channel = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) =>
      [o.orderNumber, o.customer, o.phone, o.status, o.createdAt]
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [orders, query]);

  const totalValue = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-3xl font-extrabold" style={{ color: "white" }}>
            Orders
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            Live orders for Super U Mart from Supabase.
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div
            className="rounded-xl px-4 py-2 text-sm font-extrabold"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "white",
            }}
          >
            {filtered.length} orders
          </div>

          <div
            className="rounded-xl px-4 py-2 text-sm font-extrabold"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "white",
            }}
          >
            {formatMoney(totalValue)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID, customer, phone, status..."
          className="w-full rounded-2xl px-4 py-3 font-semibold outline-none"
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.20)",
            color: DARK_BLUE,
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
          }}
        />
      </div>

      {error && (
        <div
          className="mt-4 rounded-2xl px-4 py-3 font-semibold"
          style={{
            background: "rgba(239,68,68,0.16)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "white",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="mt-6 overflow-hidden rounded-2xl border border-white/15"
        style={{
          background: "rgba(255,255,255,0.10)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-white/75">
                <th className="px-5 py-4 font-extrabold">Order</th>
                <th className="px-5 py-4 font-extrabold">Customer</th>
                <th className="px-5 py-4 font-extrabold">Phone</th>
                <th className="px-5 py-4 font-extrabold">Items</th>
                <th className="px-5 py-4 font-extrabold">Total</th>
                <th className="px-5 py-4 font-extrabold">Status</th>
                <th className="px-5 py-4 font-extrabold">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/80 font-semibold">
                    Loading orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/80 font-semibold">
                    No orders found yet.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-t border-white/10 text-white">
                    <td className="px-5 py-4 font-extrabold">{o.orderNumber}</td>
                    <td className="px-5 py-4 font-semibold">{o.customer}</td>
                    <td className="px-5 py-4 font-semibold">{o.phone}</td>
                    <td className="px-5 py-4 font-extrabold">{o.items}</td>
                    <td className="px-5 py-4 font-extrabold">{formatMoney(o.total)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-5 py-4 font-semibold text-white/80">{o.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-t border-white/10">
          <div className="text-sm font-semibold text-white/75">
            Synced to Supabase for Super U Mart only.
          </div>

          <button
            className="rounded-xl px-4 py-2 text-sm font-extrabold uppercase tracking-wider text-white transition hover:brightness-110 active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT_ORANGE} 0%, #ff8a2a 60%, ${ACCENT_ORANGE} 100%)`,
              boxShadow: "0 14px 26px rgba(0,0,0,0.18)",
            }}
            onClick={() => setQuery("")}
          >
            clear search
          </button>
        </div>
      </div>
    </div>
  );
}