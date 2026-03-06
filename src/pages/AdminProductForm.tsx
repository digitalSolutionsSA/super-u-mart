import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, ImagePlus, Save, X } from "lucide-react";
import { useStore } from "../context/StoreContext";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";

/**
 * ✅ ONLY categories allowed (exactly what you asked for).
 * These ids are what will be stored in product.category.
 */
const PERMANENT_CATEGORIES = [
  { id: "kitchen-appliances", name: "Kitchen Appliances" },
  { id: "tools", name: "Tools" },
  { id: "electronics-gaming", name: "Electronics & Gaming" },
  { id: "toys", name: "Toys" },
  { id: "sports-outdoor", name: "Sports & Outdoor" },
  { id: "car-accessories", name: "Car Accessories" },
  { id: "lights-solar", name: "Lights & Solar" },
] as const;

type CategoryId = (typeof PERMANENT_CATEGORIES)[number]["id"];

/**
 * If older products stored names like "Tools" instead of "tools",
 * normalize them so edit mode selects the right option.
 */
function normalizeCategoryId(raw?: string): CategoryId | "" {
  const v = String(raw ?? "").trim();
  if (!v) return "";

  // direct match
  const direct = PERMANENT_CATEGORIES.find((c) => c.id === v);
  if (direct) return direct.id;

  // match by display name (case-insensitive)
  const lower = v.toLowerCase();
  const byName = PERMANENT_CATEGORIES.find((c) => c.name.toLowerCase() === lower);
  if (byName) return byName.id;

  // no match
  return "";
}

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { products, addProduct, updateProduct } = useStore() as any;

  const existing = useMemo(() => {
    if (!id) return null;
    return (products ?? []).find((p: any) => String(p.id) === String(id)) ?? null;
  }, [id, products]);

  const [name, setName] = useState(existing?.name ?? "");
  const [price, setPrice] = useState<number>(existing?.price ?? 0);
  const [description, setDescription] = useState(existing?.description ?? "");

  // ✅ normalize for edit mode
  const [category, setCategory] = useState<string>(normalizeCategoryId(existing?.category));

  const [onSale, setOnSale] = useState<boolean>(!!existing?.onSale);
  const [salePrice, setSalePrice] = useState<number | "">(existing?.salePrice ?? "");

  const [lengthCm, setLengthCm] = useState<number | "">(existing?.lengthCm ?? "");
  const [widthCm, setWidthCm] = useState<number | "">(existing?.widthCm ?? "");
  const [heightCm, setHeightCm] = useState<number | "">(existing?.heightCm ?? "");
  const [weightKg, setWeightKg] = useState<number | "">(existing?.weightKg ?? "");

  const [images, setImages] = useState<string[]>(existing?.images ?? []);

  const onPickImages = (files: FileList | null) => {
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...urls]);
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((x) => x !== url));
    try {
      URL.revokeObjectURL(url);
    } catch {}
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      alert("Price must be a positive number.");
      return;
    }
    if (!category) {
      alert("Please select a category.");
      return;
    }

    const payload: any = {
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      price: Number(price),
      description: description.trim(),

      // ✅ store ONLY allowed category ids
      category: String(category),

      onSale,
      salePrice: onSale && salePrice !== "" ? Number(salePrice) : undefined,

      lengthCm: lengthCm === "" ? undefined : Number(lengthCm),
      widthCm: widthCm === "" ? undefined : Number(widthCm),
      heightCm: heightCm === "" ? undefined : Number(heightCm),
      weightKg: weightKg === "" ? undefined : Number(weightKg),

      images,
    };

    if (existing) updateProduct?.(payload);
    else addProduct?.(payload);

    navigate("/admin/products");
  };

  return (
    <form onSubmit={onSave}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* ✅ white heading */}
          <h1 className="text-2xl font-extrabold text-white">
            {existing ? "Edit Product" : "Add Product"}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Upload images or take a photo, add dimensions, pricing, and sale settings.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <X size={16} />
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT_ORANGE }}
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Product Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="e.g. Toilet Paper 2-ply 24 pack"
              />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select a category...
                </option>
                {PERMANENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Price (R)">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="e.g. 99.99"
              />
            </Field>

            <Field label="Sale">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={onSale}
                    onChange={(e) => setOnSale(e.target.checked)}
                  />
                  On Sale (shows on Home featured)
                </label>
              </div>

              {onSale && (
                <div className="mt-2">
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) =>
                      setSalePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Sale price (R)"
                  />
                </div>
              )}
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Write a short product description..."
              />
            </Field>
          </div>

          <div className="mt-6">
            <div className="text-sm font-extrabold" style={{ color: DARK_BLUE }}>
              Dimensions
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Length (cm)">
                <input
                  type="number"
                  value={lengthCm}
                  onChange={(e) =>
                    setLengthCm(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Width (cm)">
                <input
                  type="number"
                  value={widthCm}
                  onChange={(e) =>
                    setWidthCm(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Height (cm)">
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) =>
                    setHeightCm(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) =>
                    setWeightKg(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
          <div className="text-sm font-extrabold" style={{ color: DARK_BLUE }}>
            Images
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Upload from device or take a photo (phone camera).
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {/* Upload */}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              <ImagePlus size={16} />
              Upload images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPickImages(e.target.files)}
              />
            </label>

            {/* Camera capture */}
            <label
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: DARK_BLUE }}
            >
              <Camera size={16} />
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPickImages(e.target.files)}
              />
            </label>
          </div>

          {/* Gallery */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {images.map((url) => (
              <div key={url} className="relative overflow-hidden rounded-xl border">
                <img src={url} alt="product" className="h-24 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-900"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed p-4 text-center text-xs text-slate-500">
              No images yet.
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}