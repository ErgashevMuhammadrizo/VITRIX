import type { Plan, Business, Database } from "../types";
export const productCapacity = (plan: Plan | undefined) =>
  plan?.limit === null
    ? "Cheksiz"
    : new Intl.NumberFormat("uz-UZ").format(plan?.limit ?? 0);
export const canAddProduct = (plan: Plan | undefined, count: number) =>
  !!plan && (plan.limit === null || count < plan.limit);
export const isExpired = (business: Business, now = Date.now()) =>
  new Date(business.expires).getTime() <= now;
export const analyticsDays = (plan: Plan | undefined) =>
  plan?.analyticsDays ?? 7;
export function activatePlan(db: Database, businessId: string, plan: Plan) {
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) throw new Error("Biznes topilmadi.");
  if (plan.id === "starter")
    throw new Error(
      "Bepul sinov faqat bir marta, ro‘yxatdan o‘tganda beriladi.",
    );
  business.planId = plan.id;
  business.expires = new Date(
    Date.now() + plan.duration * 86400000,
  ).toISOString();
}
