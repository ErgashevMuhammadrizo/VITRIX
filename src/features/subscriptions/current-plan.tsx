"use client";
import { useNow } from "../../hooks/use-now";
import { useTranslator } from "../../i18n/runtime";
import Link from "next/link";
import { useApp } from "../../stores/app-store";
import type { Business } from "../../types";
import { date } from "../../lib/utils";
export function CurrentPlan({ business }: { business: Business }) {
  const __t = useTranslator();
  const { db } = useApp();
  const plan = db.plans.find((p) => p.id === business.planId);
  const now = useNow();
  const expired = new Date(business.expires).getTime() <= now;
  return (
    <section className="panel current-plan">
      <div>
        <span className="eyebrow">{__t("JORIY TARIF")}</span>
        <h2>{__t(plan?.name || business.planId)}</h2>
        <p>
          {expired ? __t("Obuna muddati tugagan") : __t("Obuna faol")} ·{" "}
          {date(business.expires, __t.language)}
        </p>
      </div>
      <div>
        <span className={`badge ${expired ? "amber" : "green"}`}>
          {plan?.limit == null
            ? __t("Cheksiz mahsulotlar")
            : __t("{0} ta mahsulot", { "0": plan.limit })}
        </span>
        <Link href="/dashboard/subscription" className="text-link">
          {__t("Obunani boshqarish \u2197")}
        </Link>
      </div>
    </section>
  );
}
