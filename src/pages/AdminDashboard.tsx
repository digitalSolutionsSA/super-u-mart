import React from "react";
import { useStore } from "../context/StoreContext";
import { Package, Tag, Star, Settings } from "lucide-react";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";

type TileProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "orange" | "glass";
  subtext?: string;
};

function Tile({ title, value, icon, variant = "orange", subtext }: TileProps) {
  const isGlass = variant === "glass";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl",
        "border",
        "shadow-[0_18px_40px_rgba(0,0,0,0.20)]",
        "transition-transform duration-200 hover:-translate-y-[2px]",
      ].join(" ")}
      style={{
        borderColor: isGlass ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.10)",
        background: isGlass
          ? "rgba(255,255,255,0.92)"
          : `linear-gradient(135deg, ${ACCENT_ORANGE} 0%, #ff8a2a 55%, ${ACCENT_ORANGE} 100%)`,
      }}
    >
      {/* soft shine */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full"
        style={{
          background: isGlass
            ? "radial-gradient(circle, rgba(17,29,94,0.10), transparent 60%)"
            : "radial-gradient(circle, rgba(255,255,255,0.28), transparent 60%)",
        }}
      />

      <div className="p-5">
        {/* header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="text-sm font-extrabold uppercase tracking-wider"
              style={{ color: isGlass ? "rgba(17,29,94,0.85)" : "rgba(255,255,255,0.92)" }}
            >
              {title}
            </div>

            {subtext ? (
              <div
                className="mt-1 text-xs font-semibold"
                style={{ color: isGlass ? "rgba(17,29,94,0.60)" : "rgba(255,255,255,0.75)" }}
              >
                {subtext}
              </div>
            ) : null}
          </div>

          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: isGlass ? "rgba(17,29,94,0.08)" : "rgba(255,255,255,0.16)",
              color: isGlass ? DARK_BLUE : "white",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {icon}
          </div>
        </div>

        {/* value */}
        <div
          className="mt-6 text-5xl font-extrabold leading-none"
          style={{ color: isGlass ? DARK_BLUE : "white" }}
        >
          {value}
        </div>

        {/* bottom divider */}
        <div
          className="mt-5 h-px w-full"
          style={{
            background: isGlass ? "rgba(17,29,94,0.10)" : "rgba(0,0,0,0.10)",
          }}
        />
        <div
          className="mt-3 text-xs font-semibold"
          style={{ color: isGlass ? "rgba(17,29,94,0.65)" : "rgba(255,255,255,0.78)" }}
        >
          Updated live from store data
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { products } = useStore() as any;

  const total = products?.length ?? 0;
  const onSale = (products ?? []).filter((p: any) => p.onSale).length;
  const featured = onSale; // as requested: featured = on sale
  const manage = "Ready";

  return (
    <div>
      {/* Dashboard title bar */}
      <div
        className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.22)] px-6 py-5"
        style={{ color: "white" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Dashboard
            </div>
            <div className="mt-1 text-sm font-semibold text-white/80">
              Quick overview of your catalogue
            </div>
          </div>

          <div
            className="rounded-xl px-4 py-2 text-sm font-extrabold uppercase tracking-wider"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            Admin Panel
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Tile
          title="Total Products"
          value={total}
          icon={<Package size={18} />}
          variant="orange"
          subtext="All items in store"
        />
        <Tile
          title="On Sale"
          value={onSale}
          icon={<Tag size={18} />}
          variant="glass"
          subtext="Discounted right now"
        />
        <Tile
          title="Featured"
          value={featured}
          icon={<Star size={18} />}
          variant="orange"
          subtext="Mirrors On Sale"
        />
        <Tile
          title="Manage"
          value={manage}
          icon={<Settings size={18} />}
          variant="glass"
          subtext="System status"
        />
      </div>
    </div>
  );
}