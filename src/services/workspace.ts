import type { Database, Business, Product, Category } from "../types";
import { request } from "./auth";
export type PublicCatalog = {
  business: Business;
  focusProduct?: string;
  products: Product[];
  categories: Category[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  categoryPagination?: {
    page: number;
    total: number;
    hasMore: boolean;
  };
};
type Change = {
  revision?: number;
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
        result.push({
          entity,
          op: "upsert",
          revision: record.revision ?? old.get(id)?.revision,
          record: old.has(id)
            ? Object.fromEntries(
                Object.entries(record).filter(
                  ([k, value]) =>
                    k === "id" ||
                    JSON.stringify(value) !==
                      JSON.stringify(
                        (old.get(id) as unknown as Record<string, unknown>)[k],
                      ),
                ),
              )
            : record,
        });
    for (const [id] of old)
      if (!next.has(id))
        result.push({
          entity,
          op: "delete",
          id,
          revision: old.get(id)?.revision,
        });
  }
  if (JSON.stringify(before.platform) !== JSON.stringify(after.platform))
    result.push({
      revision: before.platform.revision,
      entity: "platform",
      op: "upsert",
      record: { id: "1", ...after.platform },
    });
  return result;
}
export const workspaceApi = {
  telegramSubscription: (planId: string) =>
    request<{
      url: string;
    }>("/subscriptions/telegram/", "POST", { planId }),
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
  summary: () =>
    request<Pick<Database, "analytics" | "counts" | "collections">>(
      "/workspace/?view=summary",
    ),
  load: () => request<Database>("/workspace/"),
  save: (before: Database, after: Database) => {
    const changes = changesBetween(before, after);
    return changes.length
      ? request<{
          acknowledged: {
            entity: string;
            record: Record<string, unknown>;
          }[];
          deleted: {
            entity: string;
            id: string;
          }[];
        }>("/workspace/", "PATCH", { changes }).then((result) => {
          const saved = structuredClone(after);
          for (const change of result.acknowledged) {
            if (change.entity === "platform")
              saved.platform = change.record as unknown as Database["platform"];
            else {
              const name = change.entity as
                | "businesses"
                | "products"
                | "categories"
                | "plans";
              const index = saved[name].findIndex(
                (r) => r.id === change.record.id,
              );
              if (index >= 0) (saved[name] as unknown[])[index] = change.record;
            }
          }
          return saved;
        })
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
  catalog: (slug: string, params: Record<string, string | number> = {}) =>
    request<PublicCatalog>(
      `/public/businesses/${encodeURIComponent(slug)}/?` +
        new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ),
    ),
  track: (slug: string, kind: "visit" | "phone" | "telegram") =>
    request(`/public/businesses/${encodeURIComponent(slug)}/events/`, "POST", {
      kind,
    }),
};
export type CollectionPage<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
};
export const collectionApi = <T>(
  entity: string,
  params: Record<string, string | number> = {},
) =>
  request<CollectionPage<T>>(
    "/collections/" +
      entity +
      "/?" +
      new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
  );
export const analyticsApi = (id: string, days: number) =>
  request<import("../types").AnalyticsSummary>(
    "/businesses/" + encodeURIComponent(id) + "/analytics/?days=" + days,
  );
export const designsApi = {
  list: (id: string) =>
    request<{
      versions: {
        id: number;
        createdAt: string;
        design: Partial<Business>;
      }[];
    }>("/businesses/" + encodeURIComponent(id) + "/designs/"),
  restore: (id: string, versionId: number, revision: number) =>
    request<{
      business: Business;
    }>("/businesses/" + encodeURIComponent(id) + "/designs/", "POST", {
      versionId,
      revision,
    }),
};
