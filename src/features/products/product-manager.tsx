"use client";
import { useTranslator } from "../../i18n/runtime";
import { ContentTranslationsEditor } from "../../components/ui/content-translations";
import type { ContentTranslations } from "../../types";
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
  const __t = useTranslator();
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
      recordActivity(d, p.businessId, p.name + __t(" holati yangilandi"));
    });
  }
  return (
    <>
      <div className="page-title">
        <div>
          <h1>
            {monitor ? __t("Mahsulotlar monitoringi") : __t("Mahsulotlar")}
          </h1>
          <p>
            {monitor
              ? __t("Barcha bizneslar katalogini nazorat qiling.")
              : __t(
                  "Katalogingizni yangilang va mijozlaringizga namoyish eting.",
                )}
          </p>
        </div>
        {!monitor && (
          <Button onClick={() => setEdit(null)}>
            <Plus size={18} />
            {__t("Mahsulot qo\u2018shish")}
          </Button>
        )}
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label={__t("Mahsulot qidirish")}
            placeholder={__t("Mahsulot qidirish\u2026")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label={__t("Kategoriya filtri")}
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{__t("Barcha kategoriyalar")}</option>
          {categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label={__t("Holat filtri")}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{__t("Barcha holatlar")}</option>
          <option value="published">{__t("E\u2019lon qilingan")}</option>
          <option value="draft">{__t("Qoralama")}</option>
          <option value="archived">{__t("Arxiv")}</option>
        </select>
        {monitor && (
          <select
            aria-label={__t("Biznes filtri")}
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{__t("Barcha bizneslar")}</option>
            {db.businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label={__t("Saralash")}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="order">{__t("Tartib bo\u2018yicha")}</option>
          <option value="name">{__t("Nomi bo\u2018yicha")}</option>
          <option value="price">{__t("Narxi bo\u2018yicha")}</option>
        </select>
        <div className="segmented">
          <button
            aria-label={__t("Grid ko\u2018rinishi")}
            className={grid ? "active" : ""}
            onClick={() => setGrid(true)}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            aria-label={__t("Jadval ko\u2018rinishi")}
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
                      ? __t("E\u2019lon qilingan")
                      : p.status === "draft"
                        ? __t("Qoralama")
                        : __t("Arxiv")}
                  </span>
                  {p.featured && <span className="featured-star">★</span>}
                </div>
                <div className="product-content">
                  <small>
                    {monitor
                      ? db.businesses.find((b) => b.id === p.businessId)?.name
                      : (categories.find((c) => c.id === p.categoryId)?.name ??
                        __t("Kategoriyasiz"))}
                  </small>
                  <h3>{p.name}</h3>
                  <p>{p.shortDescription}</p>
                  <div className="between">
                    <strong>{money(p.price, __t.language)}</strong>
                    <small>
                      {p.availability === "available"
                        ? __t("Mavjud")
                        : __t("Mavjud emas")}
                    </small>
                  </div>
                  <div className="product-tools">
                    {!monitor && (
                      <Button
                        variant="secondary small"
                        onClick={() => setEdit(p)}
                      >
                        <Pencil size={14} />
                        {__t("Tahrirlash")}
                      </Button>
                    )}
                    <button
                      className="icon-btn"
                      title={
                        p.status === "published"
                          ? __t("Yashirish")
                          : __t("E\u2019lon qilish")
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
                      title={__t("Arxivlash")}
                      onClick={() => change(p, "archived")}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      className="icon-btn red"
                      title={__t("O\u2018chirish")}
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
                  <th>{__t("Mahsulot")}</th>
                  <th>{__t("Kategoriya / Biznes")}</th>
                  <th>{__t("Narx")}</th>
                  <th>{__t("Holat")}</th>
                  <th>{__t("Amallar")}</th>
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
                    <td>{money(p.price, __t.language)}</td>
                    <td>{p.status}</td>
                    <td>
                      <div className="actions">
                        {!monitor && (
                          <button
                            className="icon-btn"
                            title={__t("Tahrirlash")}
                            onClick={() => setEdit(p)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button
                          className="icon-btn"
                          title={__t("Holatni o\u2018zgartirish")}
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
                          title={__t("Arxivlash")}
                          onClick={() => change(p, "archived")}
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          className="icon-btn red"
                          title={__t("O\u2018chirish")}
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
        <Empty title={__t("Mahsulot topilmadi")} />
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
          title={__t("\u201C{0}\u201D o\u2018chirilsinmi?", { "0": del.name })}
          onClose={() => setDel(undefined)}
          onConfirm={() =>
            update((d) => {
              d.products = d.products.filter((p) => p.id !== del.id);
              recordActivity(
                d,
                del.businessId,
                del.name + __t(" o\u2018chirildi"),
              );
            }, __t("Mahsulot o\u2018chirildi"))
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
  const __t = useTranslator();
  const { db, update } = useApp();
  const [translations, setTranslations] = useState<ContentTranslations>(
    product?.translations || {},
  );
  const [image, setImage] = useState(product?.image ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
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
    JSON.stringify(translations) !==
      JSON.stringify(product?.translations || {}) ||
    form.formState.isDirty ||
    image !== (product?.image ?? "") ||
    JSON.stringify(images) !== JSON.stringify(product?.images ?? []);
  useDirtyWarning(dirty);
  function close() {
    if (
      !dirty ||
      confirm(__t("Saqlanmagan o\u2018zgarishlar bor. Chiqasizmi?"))
    )
      onClose();
  }
  return (
    <Modal
      title={product ? __t("Mahsulotni tahrirlash") : __t("Yangi mahsulot")}
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
            form.setError("slug", { message: __t("Bu slug band") });
            return;
          }
          const b = db.businesses.find((b) => b.id === businessId);
          const plan = db.plans.find((p) => p.id === b?.planId);
          if (b && isExpired(b)) {
            toast.error(
              __t(
                "Obuna muddati tugagan. Davom etish uchun Pro yoki VIP tarifini tanlang.",
              ),
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
            toast.error(__t("Tarifdagi mahsulotlar limiti tugadi"));
            return;
          }
          const p: Product = {
            ...values,
            translations,
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
                p.name +
                  (product ? __t(" yangilandi") : __t(" qo\u2018shildi")),
              );
            }, __t("Mahsulot saqlandi"))
          )
            onClose();
        })}
      >
        <ContentTranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { key: "name", label: __t("Mahsulot nomi"), max: 100 },
            {
              key: "description",
              label: __t("To\u2018liq tavsif"),
              max: 4000,
              multiline: true,
            },
            { key: "shortDescription", label: __t("Qisqa tavsif"), max: 180 },
          ]}
        />
        <div className="form-grid">
          <Field
            label={__t("Mahsulot nomi *")}
            error={__t(form.formState.errors.name?.message)}
          >
            <input
              {...form.register("name", {
                onChange: (e) => {
                  if (!product) form.setValue("slug", slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field
            label={__t("Slug *")}
            error={__t(form.formState.errors.slug?.message)}
          >
            <input {...form.register("slug")} />
          </Field>
          <Field label={__t("Kategoriya")}>
            <select {...form.register("categoryId")}>
              <option value="">{__t("Kategoriyasiz")}</option>
              {db.categories
                .filter((c) => c.businessId === businessId)
                .map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={__t("Holat")}>
            <select {...form.register("status")}>
              <option value="published">{__t("E\u2019lon qilingan")}</option>
              <option value="draft">{__t("Qoralama")}</option>
              <option value="archived">{__t("Arxiv")}</option>
            </select>
          </Field>
          <Field
            label={__t("Narx (so\u2018m) *")}
            error={__t(form.formState.errors.price?.message)}
          >
            <input type="number" {...form.register("price")} />
          </Field>
          <Field
            label={__t("Eski narx (ixtiyoriy)")}
            error={__t(form.formState.errors.oldPrice?.message)}
          >
            <input type="number" {...form.register("oldPrice")} />
          </Field>
        </div>
        <Field label={__t("Asosiy rasm")}>
          <UploadImage value={image} onChange={setImage} />
        </Field>
        <div className="form-grid">
          {[0, 1, 2].map((i) => (
            <UploadImage
              key={i}
              value={images[i] ?? ""}
              label={__t("Qo\u2018shimcha rasm {0}", { "0": i + 1 })}
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
          label={__t("Qisqa tavsif")}
          error={__t(form.formState.errors.shortDescription?.message)}
        >
          <textarea rows={2} {...form.register("shortDescription")} />
        </Field>
        <Field
          label={__t("To\u2018liq tavsif")}
          error={__t(form.formState.errors.description?.message)}
        >
          <textarea rows={4} {...form.register("description")} />
        </Field>
        <div className="form-grid">
          <Field label={__t("Mavjudligi")}>
            <select {...form.register("availability")}>
              <option value="available">{__t("Mavjud")}</option>
              <option value="unavailable">{__t("Mavjud emas")}</option>
            </select>
          </Field>
          <Field
            label={__t("Ko\u2018rsatish tartibi")}
            error={__t(form.formState.errors.order?.message)}
          >
            <input type="number" {...form.register("order")} />
          </Field>
        </div>
        <label className="check">
          <input type="checkbox" {...form.register("featured")} />
          {__t("Tavsiya etilgan mahsulot")}
        </label>
        <div className="actions end">
          <Button type="button" variant="secondary" onClick={close}>
            {__t("Bekor qilish")}
          </Button>
          <Button type="submit">{__t("Mahsulotni saqlash")}</Button>
        </div>
      </form>
    </Modal>
  );
}
