import type { Database, Business, Product, Category } from "../types";
import { request } from "./auth";
export type PublicCatalog = {
  business: Business;
  products: Product[];
  categories: Category[];
};
type Change = {
  entity: string;
  op: "upsert" | "delete";
  record?: Record<string, unknown>;
  id?: string;
};
export const emptyWorkspace = (): Database => ({
  version: 1,
  pricingVersion: 2,
  users: [],
  businesses: [],
  products: [],
  categories: [],
  plans: [],
  activities: [],
  events: [],
  subscriptionRequests: [],
  platform: {
    name: "VITRIX",
    email: "",
    phone: "",
    description: "Biznesingizning yangi manzili.",
    logo: "",
  },
});
export function changesBetween(before: Database, after: Database): Change[] {
  const result: Change[] = [];
  for (const entity of [
    "businesses",
    "categories",
    "products",
    "plans",
  ] as const) {
    const old = new Map(before[entity].map((v) => [v.id, v]));
    const next = new Map(after[entity].map((v) => [v.id, v]));
    for (const [id, record] of next)
      if (JSON.stringify(old.get(id)) !== JSON.stringify(record))
        result.push({ entity, op: "upsert", record });
    for (const [id] of old)
      if (!next.has(id)) result.push({ entity, op: "delete", id });
  }
  if (JSON.stringify(before.platform) !== JSON.stringify(after.platform))
    result.push({
      entity: "platform",
      op: "upsert",
      record: { id: "1", ...after.platform },
    });
  return result;
}
export const workspaceApi = {
  telegramSubscription: (planId: string) =>
    request<{ url: string }>("/subscriptions/telegram/", "POST", { planId }),
  activateSubscription: (
    id: string,
    data: {
      planId: string;
      months: number;
      mode: string;
      note: string;
      idempotencyKey: string;
    },
  ) =>
    request<Database>(
      `/admin/businesses/${encodeURIComponent(id)}/subscription/`,
      "POST",
      data,
    ),
  load: () => request<Database>("/workspace/"),
  save: (before: Database, after: Database) => {
    const changes = changesBetween(before, after);
    return changes.length
      ? request<Database>("/workspace/", "PATCH", { changes })
      : Promise.resolve(after);
  },
  requestPlan: (planId: string) =>
    request<Database>("/subscriptions/request/", "POST", { planId }),
  reviewPlan: (id: string, approve: boolean) =>
    request<Database>(
      `/admin/subscriptions/${encodeURIComponent(id)}/review/`,
      "POST",
      { approve },
    ),
};
export const publicApi = {
  config: () =>
    request<Pick<Database, "platform" | "plans">>("/public/config/"),
  catalog: (slug: string) =>
    request<PublicCatalog>(`/public/businesses/${encodeURIComponent(slug)}/`),
  track: (slug: string, kind: "visit" | "phone" | "telegram") =>
    request(`/public/businesses/${encodeURIComponent(slug)}/events/`, "POST", {
      kind,
    }),
};
