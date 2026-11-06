"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  Package,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schema } from "./schema";
import { useApp, recordActivity } from "../../stores/app-store";
import {
  Button,
  Field,
  Modal,
  Confirm,
  UploadImage,
  Empty,
  Pagination,
  useDirtyWarning,
} from "../../components/ui/shared";
import type { Product } from "../../types";
import { canAddProduct, isExpired } from "../../services/plans";
import { money, slugify, uid } from "../../lib/utils";
import { toast } from "sonner";
export function ProductManager({
  businessId,
  monitor = false,
}: {
  businessId?: string;
  monitor?: boolean;
}) {
  const { db, update } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState("order");
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Product | null | undefined>();
  const [del, setDel] = useState<Product>();
  const products = db.products
    .filter(
      (p) =>
        (!businessId || p.businessId === businessId) &&
        p.name.toLowerCase().includes(q.toLowerCase()) &&
        (!cat || p.categoryId === cat) &&
        (!status || p.status === status) &&
        (!owner || p.businessId === owner),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : a.order - b.order,
    );
  const categories = db.categories.filter(
    (c) => !businessId || c.businessId === businessId,
  );
  const current = Math.min(page, Math.max(1, Math.ceil(products.length / 8)));
  const items = products.slice((current - 1) * 8, current * 8);
  function change(p: Product, status: Product["status"]) {
    update((d) => {
      const target = d.products.find((i) => i.id === p.id);
      if (target) target.status = status;
      recordActivity(d, p.businessId, p.name + " holati yangilandi");
    });
  }
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{monitor ? "Mahsulotlar monitoringi" : "Mahsulotlar"}</h1>
          <p>
            {monitor
              ? "Barcha bizneslar katalogini nazorat qiling."
              : "Katalogingizni yangilang va mijozlaringizga namoyish eting."}
          </p>
        </div>
        {!monitor && (
          <Button onClick={() => setEdit(null)}>
            <Plus size={18} />
            Mahsulot qo‘shish
          </Button>
        )}
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Mahsulot qidirish"
            placeholder="Mahsulot qidirish…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Kategoriya filtri"
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Holat filtri"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Barcha holatlar</option>
          <option value="published">E’lon qilingan</option>
          <option value="draft">Qoralama</option>
          <option value="archived">Arxiv</option>
        </select>
        {monitor && (
          <select
            aria-label="Biznes filtri"
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Barcha bizneslar</option>
            {db.businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Saralash"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="order">Tartib bo‘yicha</option>
          <option value="name">Nomi bo‘yicha</option>
          <option value="price">Narxi bo‘yicha</option>
        </select>
        <div className="segmented">
          <button
            aria-label="Grid ko‘rinishi"
            className={grid ? "active" : ""}
            onClick={() => setGrid(true)}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            aria-label="Jadval ko‘rinishi"
            className={!grid ? "active" : ""}
            onClick={() => setGrid(false)}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      {products.length ? (
        grid ? (
          <div className="product-grid admin-products">
            {items.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-image">
                  <img
                    src={p.image || "/images/burger.jpg"}
                    alt={p.name}
                    loading="lazy"
                  />
                  <span
                    className={`badge ${p.status === "published" ? "green" : "gray"}`}
                  >
                    {p.status === "published"
                      ? "E’lon qilingan"
                      : p.status === "draft"
                        ? "Qoralama"
                        : "Arxiv"}
                  </span>
                  {p.featured && <span className="featured-star">★</span>}
                </div>
                <div className="product-content">
                  <small>
                    {monitor
                      ? db.businesses.find((b) => b.id === p.businessId)?.name
                      : (categories.find((c) => c.id === p.categoryId)?.name ??
                        "Kategoriyasiz")}
                  </small>
                  <h3>{p.name}</h3>
                  <p>{p.shortDescription}</p>
                  <div className="between">
                    <strong>{money(p.price)}</strong>
                    <small>
                      {p.availability === "available"
                        ? "Mavjud"
                        : "Mavjud emas"}
                    </small>
                  </div>
                  <div className="product-tools">
                    {!monitor && (
                      <Button
                        variant="secondary small"
                        onClick={() => setEdit(p)}
                      >
                        <Pencil size={14} />
                        Tahrirlash
                      </Button>
                    )}
                    <button
                      className="icon-btn"
                      title={
                        p.status === "published" ? "Yashirish" : "E’lon qilish"
                      }
                      onClick={() =>
                        change(
                          p,
                          p.status === "published" ? "draft" : "published",
                        )
                      }
                    >
                      {p.status === "published" ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      className="icon-btn"
                      title="Arxivlash"
                      onClick={() => change(p, "archived")}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      className="icon-btn red"
                      title="O‘chirish"
                      onClick={() => setDel(p)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Kategoriya / Biznes</th>
                  <th>Narx</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <img src={p.image || "/images/burger.jpg"} alt="" />
                        {p.name}
                      </div>
                    </td>
                    <td>
                      {monitor
                        ? db.businesses.find((b) => b.id === p.businessId)?.name
                        : categories.find((c) => c.id === p.categoryId)?.name}
                    </td>
                    <td>{money(p.price)}</td>
                    <td>{p.status}</td>
                    <td>
                      <div className="actions">
                        {!monitor && (
                          <button
                            className="icon-btn"
                            title="Tahrirlash"
                            onClick={() => setEdit(p)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button
                          className="icon-btn"
                          title="Holatni o‘zgartirish"
                          onClick={() =>
                            change(
                              p,
                              p.status === "published" ? "draft" : "published",
                            )
                          }
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          title="Arxivlash"
                          onClick={() => change(p, "archived")}
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          className="icon-btn red"
                          title="O‘chirish"
                          onClick={() => setDel(p)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <Empty title="Mahsulot topilmadi" />
      )}
      <Pagination page={current} total={products.length} onChange={setPage} />
      {edit !== undefined && businessId && (
        <ProductEditor
          businessId={businessId}
          product={edit}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {del && (
        <Confirm
          title={`“${del.name}” o‘chirilsinmi?`}
          onClose={() => setDel(undefined)}
          onConfirm={() =>
            update((d) => {
              d.products = d.products.filter((p) => p.id !== del.id);
              recordActivity(d, del.businessId, del.name + " o‘chirildi");
            }, "Mahsulot o‘chirildi")
          }
        />
      )}
    </>
  );
}
function ProductEditor({
  product,
  businessId,
  onClose,
}: {
  product: Product | null;
  businessId: string;
  onClose: () => void;
}) {
  const { db, update } = useApp();
  const [image, setImage] = useState(product?.image ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: product ?? {
      name: "",
      slug: "",
      categoryId: "",
      price: 0,
      oldPrice: 0,
      description: "",
      shortDescription: "",
      availability: "available",
      featured: false,
      order: 0,
      status: "published",
    },
  });
  const dirty =
    form.formState.isDirty ||
    image !== (product?.image ?? "") ||
    JSON.stringify(images) !== JSON.stringify(product?.images ?? []);
  useDirtyWarning(dirty);
  function close() {
    if (!dirty || confirm("Saqlanmagan o‘zgarishlar bor. Chiqasizmi?"))
      onClose();
  }
  return (
    <Modal
      title={product ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
      onClose={close}
      wide
    >
      <form
        onSubmit={form.handleSubmit(async (values) => {
          if (
            db.products.some(
              (p) =>
                p.businessId === businessId &&
                p.slug === values.slug &&
                p.id !== product?.id,
            )
          ) {
            form.setError("slug", { message: "Bu slug band" });
            return;
          }
          const b = db.businesses.find((b) => b.id === businessId);
          const plan = db.plans.find((p) => p.id === b?.planId);
          if (b && isExpired(b)) {
            toast.error(
              "Obuna muddati tugagan. Davom etish uchun Pro yoki VIP tarifini tanlang.",
            );
            return;
          }
          if (
            !product &&
            !canAddProduct(
              plan,
              db.products.filter((p) => p.businessId === businessId).length,
            )
          ) {
            toast.error("Tarifdagi mahsulotlar limiti tugadi");
            return;
          }
          const p: Product = {
            ...values,
            id: product?.id ?? uid(),
            businessId,
            image,
            images: images.filter(Boolean),
          };
          if (
            await update((d) => {
              if (product)
                d.products = d.products.map((i) => (i.id === p.id ? p : i));
              else d.products.push(p);
              recordActivity(
                d,
                businessId,
                p.name + (product ? " yangilandi" : " qo‘shildi"),
              );
            }, "Mahsulot saqlandi")
          )
            onClose();
        })}
      >
        <div className="form-grid">
          <Field
            label="Mahsulot nomi *"
            error={form.formState.errors.name?.message}
          >
            <input
              {...form.register("name", {
                onChange: (e) => {
                  if (!product) form.setValue("slug", slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field label="Slug *" error={form.formState.errors.slug?.message}>
            <input {...form.register("slug")} />
          </Field>
          <Field label="Kategoriya">
            <select {...form.register("categoryId")}>
              <option value="">Kategoriyasiz</option>
              {db.categories
                .filter((c) => c.businessId === businessId)
                .map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Holat">
            <select {...form.register("status")}>
              <option value="published">E’lon qilingan</option>
              <option value="draft">Qoralama</option>
              <option value="archived">Arxiv</option>
            </select>
          </Field>
          <Field
            label="Narx (so‘m) *"
            error={form.formState.errors.price?.message}
          >
            <input type="number" {...form.register("price")} />
          </Field>
          <Field
            label="Eski narx (ixtiyoriy)"
            error={form.formState.errors.oldPrice?.message}
          >
            <input type="number" {...form.register("oldPrice")} />
          </Field>
        </div>
        <Field label="Asosiy rasm">
          <UploadImage value={image} onChange={setImage} />
        </Field>
        <div className="form-grid">
          {[0, 1, 2].map((i) => (
            <UploadImage
              key={i}
              value={images[i] ?? ""}
              label={`Qo‘shimcha rasm ${i + 1}`}
              onChange={(s) =>
                setImages((prev) => {
                  const n = [...prev];
                  n[i] = s;
                  return n;
                })
              }
            />
          ))}
        </div>
        <Field
          label="Qisqa tavsif"
          error={form.formState.errors.shortDescription?.message}
        >
          <textarea rows={2} {...form.register("shortDescription")} />
        </Field>
        <Field
          label="To‘liq tavsif"
          error={form.formState.errors.description?.message}
        >
          <textarea rows={4} {...form.register("description")} />
        </Field>
        <div className="form-grid">
          <Field label="Mavjudligi">
            <select {...form.register("availability")}>
              <option value="available">Mavjud</option>
              <option value="unavailable">Mavjud emas</option>
            </select>
          </Field>
          <Field
            label="Ko‘rsatish tartibi"
            error={form.formState.errors.order?.message}
          >
            <input type="number" {...form.register("order")} />
          </Field>
        </div>
        <label className="check">
          <input type="checkbox" {...form.register("featured")} />
          Tavsiya etilgan mahsulot
        </label>
        <div className="actions end">
          <Button type="button" variant="secondary" onClick={close}>
            Bekor qilish
          </Button>
          <Button type="submit">Mahsulotni saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}
