import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, ImagePlus, Save, X } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { supabase } from "../lib/supabase";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";
const STORAGE_BUCKET = "product-images";

/**
 * ✅ ONLY categories allowed.
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

function normalizeCategoryId(raw?: string): CategoryId | "" {
  const v = String(raw ?? "").trim();
  if (!v) return "";

  const direct = PERMANENT_CATEGORIES.find((c) => c.id === v);
  if (direct) return direct.id;

  const lower = v.toLowerCase();
  const byName = PERMANENT_CATEGORIES.find((c) => c.name.toLowerCase() === lower);
  if (byName) return byName.id;

  return "";
}

function normalizeImages(input: any, fallbackImageUrl?: string | null): string[] {
  const out: string[] = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string" && item.trim()) out.push(item.trim());
      else if (item && typeof item === "object") {
        if (typeof item.url === "string" && item.url.trim()) out.push(item.url.trim());
        if (typeof item.src === "string" && item.src.trim()) out.push(item.src.trim());
      }
    }
  } else if (typeof input === "string" && input.trim()) {
    const raw = input.trim();
    try {
      const parsed = JSON.parse(raw);
      return normalizeImages(parsed, fallbackImageUrl);
    } catch {
      out.push(raw);
    }
  } else if (input && typeof input === "object") {
    for (const value of Object.values(input)) {
      if (typeof value === "string" && value.trim()) out.push(value.trim());
      else if (value && typeof value === "object") {
        if (typeof (value as any).url === "string" && (value as any).url.trim()) {
          out.push((value as any).url.trim());
        }
        if (typeof (value as any).src === "string" && (value as any).src.trim()) {
          out.push((value as any).src.trim());
        }
      }
    }
  }

  if (out.length === 0 && typeof fallbackImageUrl === "string" && fallbackImageUrl.trim()) {
    out.push(fallbackImageUrl.trim());
  }

  return Array.from(new Set(out));
}

async function uploadFileToSupabase(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `products/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Could not get public URL for uploaded image.");
  }

  return data.publicUrl;
}

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, addProduct, updateProduct } = useStore() as any;

  const existing = useMemo(() => {
    if (!id) return null;
    return (products ?? []).find((p: any) => String(p.id) === String(id)) ?? null;
  }, [id, products]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");

  const [onSale, setOnSale] = useState<boolean>(false);
  const [salePrice, setSalePrice] = useState<number | "">("");

  const [lengthCm, setLengthCm] = useState<number | "">("");
  const [widthCm, setWidthCm] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");

  // Existing/saved remote URLs
  const [images, setImages] = useState<string[]>([]);
  // New files selected this session
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Local previews for pending files
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) {
      if (!id) {
        setName("");
        setPrice(0);
        setDescription("");
        setCategory("");
        setOnSale(false);
        setSalePrice("");
        setLengthCm("");
        setWidthCm("");
        setHeightCm("");
        setWeightKg("");
        setImages([]);
        setPendingFiles([]);
        setPendingPreviews([]);
      }
      return;
    }

    setName(existing?.name ?? "");
    setPrice(Number(existing?.price ?? 0));
    setDescription(existing?.description ?? "");
    setCategory(normalizeCategoryId(existing?.category));
    setOnSale(!!existing?.onSale);
    setSalePrice(existing?.salePrice ?? "");
    setLengthCm(existing?.lengthCm ?? "");
    setWidthCm(existing?.widthCm ?? "");
    setHeightCm(existing?.heightCm ?? "");
    setWeightKg(existing?.weightKg ?? "");
    setImages(normalizeImages(existing?.images, existing?.image ?? existing?.image_url ?? null));
    setPendingFiles([]);
    setPendingPreviews([]);
  }, [existing, id]);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, [pendingPreviews]);

  const onPickImages = (files: FileList | null) => {
    if (!files?.length) return;

    const picked = Array.from(files);
    const previews = picked.map((file) => URL.createObjectURL(file));

    setPendingFiles((prev) => [...prev, ...picked]);
    setPendingPreviews((prev) => [...prev, ...previews]);
  };

  const removeExistingImage = (url: string) => {
    setImages((prev) => prev.filter((x) => x !== url));
  };

  const removePendingImage = (previewUrl: string, index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => {
      const target = prev[index];
      if (target?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target);
        } catch {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSave = async (e: React.FormEvent) => {
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

    try {
      setSaving(true);

      let uploadedUrls: string[] = [];

      if (pendingFiles.length > 0) {
        uploadedUrls = await Promise.all(pendingFiles.map(uploadFileToSupabase));
      }

      const finalImages = [...images, ...uploadedUrls];

      const payload: any = {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        category: String(category),

        onSale,
        salePrice: onSale && salePrice !== "" ? Number(salePrice) : undefined,

        lengthCm: lengthCm === "" ? undefined : Number(lengthCm),
        widthCm: widthCm === "" ? undefined : Number(widthCm),
        heightCm: heightCm === "" ? undefined : Number(heightCm),
        weightKg: weightKg === "" ? undefined : Number(weightKg),

        images: finalImages,
        image_url: finalImages[0] ?? null,
      };

      if (existing) {
        await updateProduct(String(existing.id), payload);
      } else {
        await addProduct(payload);
      }

      navigate("/admin/products");
    } catch (err) {
      console.error("Save product failed:", err);
      alert("Failed to save product or upload images.");
    } finally {
      setSaving(false);
    }
  };

  const gallery = [
    ...images.map((url) => ({ type: "existing" as const, url })),
    ...pendingPreviews.map((url, index) => ({ type: "pending" as const, url, index })),
  ];

  return (
    <form onSubmit={onSave}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
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
            disabled={saving}
          >
            <X size={16} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: ACCENT_ORANGE }}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
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

        <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
          <div className="text-sm font-extrabold" style={{ color: DARK_BLUE }}>
            Images
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Upload from device or take a photo (phone camera).
          </p>

          <div className="mt-4 flex flex-col gap-3">
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

          <div className="mt-4 grid grid-cols-3 gap-2">
            {gallery.map((item, i) => (
              <div key={`${item.type}-${item.url}-${i}`} className="relative overflow-hidden rounded-xl border">
                <img
                  src={item.url}
                  alt="product"
                  className="h-24 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.35";
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    item.type === "existing"
                      ? removeExistingImage(item.url)
                      : removePendingImage(item.url, item.index)
                  }
                  className="absolute right-1 top-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-900"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {gallery.length === 0 && (
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