"use client";
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
} from "../../components/ui/shared";
import { uid } from "../../lib/utils";
import { toast } from "sonner";
import type { Category } from "../../types";
export function CategoryManager({ businessId }: { businessId: string }) {
  const { db, update } = useApp();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Category | null | undefined>();
  const [del, setDel] = useState<Category>();
  const items = db.categories
    .filter(
      (c) =>
        c.businessId === businessId &&
        c.name.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => a.order - b.order);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Kategoriyalar</h1>
          <p>
            Mahsulotlaringizni tartiblang. Mijozingiz keraklisini tezroq topsin.
          </p>
        </div>
        <Button onClick={() => setEdit(null)}>
          <Plus size={18} />
          Kategoriya qo‘shish
        </Button>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="Kategoriya qidirish…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="muted">{items.length} ta kategoriya</span>
      </div>
      {items.length ? (
        <div className="category-grid">
          {items.map((c) => (
            <article className="panel category-card" key={c.id}>
              {c.image ? (
                <img src={c.image} alt={c.name} />
              ) : (
                <div className="category-placeholder">
                  <FolderOpen />
                </div>
              )}
              <div>
                <span className={`badge ${c.active ? "green" : "gray"}`}>
                  {c.active ? "Faol" : "Yashirilgan"}
                </span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="between">
                  <small>
                    {db.products.filter((p) => p.categoryId === c.id).length} ta
                    mahsulot · Tartib: {c.order}
                  </small>
                  <div className="actions">
                    <button
                      className="icon-btn"
                      title="Tahrirlash"
                      onClick={() => setEdit(c)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn red"
                      title="O‘chirish"
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
      {edit !== undefined && (
        <CategoryEditor
          category={edit}
          businessId={businessId}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {del && (
        <Confirm
          title={`“${del.name}” kategoriyasi o‘chirilsinmi? Mahsulotlar kategoriyasiz qoladi.`}
          onClose={() => setDel(undefined)}
          onConfirm={() =>
            update((d) => {
              d.categories = d.categories.filter((c) => c.id !== del.id);
              d.products.forEach((p) => {
                if (p.categoryId === del.id) p.categoryId = "";
              });
            }, "Kategoriya o‘chirildi")
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
    if (!dirty || confirm("Saqlanmagan o‘zgarishlar bor. Chiqasizmi?"))
      onClose();
  };
  return (
    <Modal
      title={category ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
      onClose={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (v.name.trim().length < 2) {
            toast.error("Kategoriya nomini kiriting");
            return;
          }
          if (
            await update((d) => {
              if (category)
                d.categories = d.categories.map((c) => (c.id === v.id ? v : c));
              else d.categories.push({ ...v, name: v.name.trim() });
              recordActivity(d, businessId, v.name + " kategoriyasi saqlandi");
            })
          )
            onClose();
        }}
      >
        <Field label="Kategoriya nomi *">
          <input
            required
            minLength={2}
            maxLength={80}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label="Tavsif">
          <textarea
            maxLength={500}
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Field>
        <UploadImage
          value={v.image}
          onChange={(image) => setV({ ...v, image })}
        />
        <Field label="Tartib">
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
          Faol kategoriya
        </label>
        <div className="actions end">
          <Button type="button" variant="secondary" onClick={close}>
            Bekor qilish
          </Button>
          <Button>Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}
