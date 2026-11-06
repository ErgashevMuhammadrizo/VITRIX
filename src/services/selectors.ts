import type { Database } from "../types";
export const publicBusiness = (db: Database, slug: string) =>
  db.businesses.find((b) => b.slug === slug && b.active);
export const tenantCategories = (db: Database, id: string) =>
  db.categories
    .filter((c) => c.businessId === id && c.active)
    .sort((a, b) => a.order - b.order);
export const tenantProducts = (db: Database, id: string) => {
  const ids = new Set(tenantCategories(db, id).map((c) => c.id));
  return db.products
    .filter(
      (p) =>
        p.businessId === id &&
        p.status === "published" &&
        (!p.categoryId || ids.has(p.categoryId)),
    )
    .sort((a, b) => a.order - b.order);
};
