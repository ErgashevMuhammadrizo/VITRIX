import type { Database, Business, Product, Category } from "../types";
import { request } from "./auth";
export type PublicCatalog = {
  pageInfo?: { nextOffset: number | null };
  business: Business;
  products: Product[];
  categories: Category[];
};
type Change = {
  entity: string;
  op: "upsert" | "delete";
  record?: Record<string, unknown>;
  id?: string;
  revision?: string;
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
        result.push({ entity, op: "upsert", record, revision: (old.get(id) as unknown as { revision?: string } | undefined)?.revision });
    for (const [id] of old)
      if (!next.has(id)) result.push({ entity, op: "delete", id, revision: (old.get(id) as unknown as { revision?: string })?.revision });
  }
  if (JSON.stringify(before.platform) !== JSON.stringify(after.platform))
    result.push({
      entity: "platform",
      op: "upsert",
      record: { id: "1", ...after.platform },
      revision: (before.platform as typeof before.platform & { revision?: string }).revision,
    });
  return result;
}
async function loadWorkspace(): Promise<Database> {
  const first = await request<Database>("/workspace/");
  let offset = first.pageInfo?.nextOffset;
  while (offset != null) {
    const page = await request<Database>(`/workspace/?offset=${offset}`);
    for (const key of ["users", "businesses", "categories", "products"] as const) {
      // Each collection has its own element type.
      (first[key] as unknown[]).push(...page[key]);
    }
    offset = page.pageInfo?.nextOffset;
  }
  return first;
}
async function mutateWorkspace(path: string, method: string, data: unknown): Promise<Database> {
  await request(path, method, data);
  return loadWorkspace();
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
    mutateWorkspace(
      `/admin/businesses/${encodeURIComponent(id)}/subscription/`,
      "POST",
      data,
    ),
  load: loadWorkspace,
  save: (before: Database, after: Database) => {
    const changes = changesBetween(before, after);
    return changes.length
      ? mutateWorkspace("/workspace/", "PATCH", { changes })
      : Promise.resolve(after);
  },
  requestPlan: (planId: string) =>
    mutateWorkspace("/subscriptions/request/", "POST", { planId }),
  reviewPlan: (id: string, approve: boolean) =>
    mutateWorkspace(
      `/admin/subscriptions/${encodeURIComponent(id)}/review/`,
      "POST",
      { approve },
    ),
};
export const publicApi = {
  config: () =>
    request<Pick<Database, "platform" | "plans">>("/public/config/"),
  catalog: (slug: string, offset = 0, q = "", category = "") =>
    request<PublicCatalog>(`/public/businesses/${encodeURIComponent(slug)}/?${new URLSearchParams({ offset: String(offset), q, category })}`),
  track: (slug: string, kind: "visit" | "phone" | "telegram") =>
    request(`/public/businesses/${encodeURIComponent(slug)}/events/`, "POST", {
      kind,
    }),
};
