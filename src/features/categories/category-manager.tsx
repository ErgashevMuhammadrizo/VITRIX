"use client";
import NextImage from "next/image";
import { useTranslator } from "../../i18n/runtime";
import { ContentTranslationsEditor } from "../../components/ui/content-translations";
import { useCollection } from "../../hooks/use-collection";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, FolderOpen } from "lucide-react";
import { useApp, recordActivity } from "../../stores/app-store";
import {
  Button,
  Field,
  Modal,
  Confirm,
  UploadImage,
  Empty,
  useDirtyWarning,
  Pagination,
} from "../../components/ui/shared";
import { uid } from "../../lib/utils";
import { toast } from "sonner";
import type { Category } from "../../types";
export function CategoryManager({ businessId }: { businessId: string }) {
  const __t = useTranslator();
  const { db, update } = useApp();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Category | null | undefined>();
  const [del, setDel] = useState<Category>();
  const [page, setPage] = useState(1);
  const query = useCollection<Category>("categories", {
    businessId,
    q,
    page,
    pageSize: 8,
  });
  const items = query.items;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{__t("Kategoriyalar")}</h1>
          <p>
            {__t(
              "Mahsulotlaringizni tartiblang. Mijozingiz keraklisini tezroq topsin.",
            )}
          </p>
        </div>
        <Button onClick={() => setEdit(null)}>
          <Plus size={18} />
          {__t("Kategoriya qo\u2018shish")}
        </Button>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder={__t("Kategoriya qidirish\u2026")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="muted">
          {query.total}
          {__t("ta kategoriya")}
        </span>
      </div>
      {query.loading && <p role="status">{__t("Yuklanmoqda…")}</p>}
      {query.error && <p role="alert">{__t(query.error)}</p>}
      {items.length ? (
        <div className="category-grid">
          {items.map((c) => (
            <article className="panel category-card" key={c.id}>
              {c.image ? (
                <NextImage
                  unoptimized
                  width={800}
                  height={800}
                  src={c.image}
                  alt={c.name}
                />
              ) : (
                <div className="category-placeholder">
                  <FolderOpen />
                </div>
              )}
              <div>
                <span className={`badge ${c.active ? "green" : "gray"}`}>
                  {c.active ? __t("Faol") : __t("Yashirilgan")}
                </span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="between">
                  <small>
                    {c.productCount ??
                      db.products.filter((p) => p.categoryId === c.id).length}
                    {__t("ta mahsulot \u00B7 Tartib:")}
                    {c.order}
                  </small>
                  <div className="actions">
                    <button
                      className="icon-btn"
                      title={__t("Tahrirlash")}
                      onClick={() => setEdit(c)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn red"
                      title={__t("O\u2018chirish")}
                      onClick={() => setDel(c)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty />
      )}
      <Pagination page={page} total={query.total} onChange={setPage} />
      {edit !== undefined && (
        <CategoryEditor
          category={edit}
          businessId={businessId}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {del && (
        <Confirm
          title={__t(
            "\u201C{0}\u201D kategoriyasi o\u2018chirilsinmi? Mahsulotlar kategoriyasiz qoladi.",
            { "0": del.name },
          )}
          onClose={() => setDel(undefined)}
          onConfirm={() =>
            update((d) => {
              d.categories = d.categories.filter((c) => c.id !== del.id);
              d.products.forEach((p) => {
                if (p.categoryId === del.id) p.categoryId = "";
              });
            }, __t("Kategoriya o\u2018chirildi"))
          }
        />
      )}
    </>
  );
}
function CategoryEditor({
  category,
  businessId,
  onClose,
}: {
  category: Category | null;
  businessId: string;
  onClose: () => void;
}) {
  const __t = useTranslator();
  const { update } = useApp();
  const [v, setV] = useState<Category>(
    category ?? {
      id: uid(),
      businessId,
      name: "",
      description: "",
      image: "",
      order: 0,
      active: true,
    },
  );
  const initial = JSON.stringify(category ?? { ...v });
  const [start] = useState(initial);
  const dirty = JSON.stringify(v) !== start;
  useDirtyWarning(dirty);
  const close = () => {
    if (
      !dirty ||
      confirm(__t("Saqlanmagan o\u2018zgarishlar bor. Chiqasizmi?"))
    )
      onClose();
  };
  return (
    <Modal
      title={
        category ? __t("Kategoriyani tahrirlash") : __t("Yangi kategoriya")
      }
      onClose={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (v.name.trim().length < 2) {
            toast.error(__t("Kategoriya nomini kiriting"));
            return;
          }
          if (
            await update((d) => {
              if (category)
                d.categories = d.categories.map((c) => (c.id === v.id ? v : c));
              else d.categories.push({ ...v, name: v.name.trim() });
              recordActivity(
                d,
                businessId,
                v.name + __t(" kategoriyasi saqlandi"),
              );
            })
          )
            onClose();
        }}
      >
        <Field label={__t("Kategoriya nomi *")}>
          <input
            required
            minLength={2}
            maxLength={80}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label={__t("Tavsif")}>
          <textarea
            maxLength={500}
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Field>
        <ContentTranslationsEditor
          value={v.translations}
          onChange={(translations) => setV({ ...v, translations })}
          fields={[
            { key: "name", label: __t("Kategoriya nomi"), max: 80 },
            {
              key: "description",
              label: __t("Tavsif"),
              max: 500,
              multiline: true,
            },
          ]}
        />
        <UploadImage
          value={v.image}
          onChange={(image) => setV({ ...v, image })}
        />
        <Field label={__t("Tartib")}>
          <input
            type="number"
            min="0"
            required
            value={v.order}
            onChange={(e) => setV({ ...v, order: Number(e.target.value) })}
          />
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={v.active}
            onChange={(e) => setV({ ...v, active: e.target.checked })}
          />
          {__t("Faol kategoriya")}
        </label>
        <div className="actions end">
          <Button type="button" variant="secondary" onClick={close}>
            {__t("Bekor qilish")}
          </Button>
          <Button>{__t("Saqlash")}</Button>
        </div>
      </form>
    </Modal>
  );
}
