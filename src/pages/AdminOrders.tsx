import React, { useMemo, useState } from "react";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";

type OrderStatus = "Paid" | "Pending" | "Cancelled" | "Shipped";

type Order = {
  id: string;
  customer: string;
  phone: string;
  items: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

function StatusPill({ status }: { status: OrderStatus }) {
  const style = (() => {
    switch (status) {
      case "Paid":
        return { bg: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.35)", text: "rgb(22,163,74)" };
      case "Pending":
        return { bg: "rgba(249,115,22,0.14)", border: "rgba(249,115,22,0.35)", text: "rgb(234,88,12)" };
      case "Shipped":
        return { bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.35)", text: "rgb(37,99,235)" };
      case "Cancelled":
      default:
        return { bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.35)", text: "rgb(220,38,38)" };
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

  const orders: Order[] = useMemo(
    () => [
      { id: "UM-10021", customer: "M. van Rooyen", phone: "063 903 4514", items: 6, total: 1299.5, status: "Paid", createdAt: "2026-02-27 08:41" },
      { id: "UM-10022", customer: "K. Mokoena", phone: "071 222 9011", items: 3, total: 489.0, status: "Pending", createdAt: "2026-02-27 09:03" },
      { id: "UM-10023", customer: "S. Naidoo", phone: "082 555 1109", items: 12, total: 2440.0, status: "Shipped", createdAt: "2026-02-26 16:18" },
      { id: "UM-10024", customer: "J. Botha", phone: "083 991 7788", items: 2, total: 219.99, status: "Cancelled", createdAt: "2026-02-26 11:02" },
      { id: "UM-10025", customer: "A. Petersen", phone: "060 111 7731", items: 9, total: 1789.25, status: "Paid", createdAt: "2026-02-25 14:27" },
      { id: "UM-10026", customer: "N. Dlamini", phone: "078 090 1212", items: 4, total: 699.0, status: "Pending", createdAt: "2026-02-25 10:09" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.id, o.customer, o.phone, o.status].some((v) => v.toLowerCase().includes(q))
    );
  }, [orders, query]);

  const totalValue = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-3xl font-extrabold" style={{ color: "white" }}>
            Orders
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            Dummy data for now. Real orders can come later when humans invent Supabase.
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
            R {totalValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search */}
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

      {/* Table */}
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
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-white/10 text-white">
                  <td className="px-5 py-4 font-extrabold">{o.id}</td>
                  <td className="px-5 py-4 font-semibold">{o.customer}</td>
                  <td className="px-5 py-4 font-semibold">{o.phone}</td>
                  <td className="px-5 py-4 font-extrabold">{o.items}</td>
                  <td className="px-5 py-4 font-extrabold">R {o.total.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-5 py-4 font-semibold text-white/80">{o.createdAt}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/80 font-semibold">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-t border-white/10">
          <div className="text-sm font-semibold text-white/75">
            Tip: when Supabase is connected, this becomes real-time.
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