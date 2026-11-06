"use client";
import { useTranslator } from "../../i18n/runtime";
import { CurrentPlan } from "./current-plan";
import { useState } from "react";
import { Check, Send } from "lucide-react";
import { useApp } from "../../stores/app-store";
import type { Business } from "../../types";
import { Button, SiteLink } from "../../components/ui/shared";
import { AccountId } from "../../components/ui/account-id";
import { workspaceApi } from "../../services/workspace";
import { productCapacity } from "../../services/plans";
import { date, money } from "../../lib/utils";
import { toast } from "sonner";
export function SubscriptionPage({ business }: { business: Business }) {
  const __t = useTranslator();
  const { db } = useApp();
  const [busy, setBusy] = useState(false);
  const operator = db.platform.subscriptionTelegram;
  return (
    <>
      <CurrentPlan business={business} />
      <div className="page-title">
        <div>
          <h1>{__t("Obuna va tariflar")}</h1>
          <p>
            {__t(db.plans.find((p) => p.id === business.planId)?.name)} ·{" "}
            {date(business.expires, __t.language)}
            {__t("gacha")}
          </p>
        </div>
        <AccountId id={business.accountId || business.ownerId} />
      </div>
      <div className="panel subscription-summary">
        <div>
          <h3>{business.name}</h3>
          <SiteLink slug={business.slug} />
        </div>
        <p>
          {__t(
            "Birinchi 30 kun bepul. Pullik obunani administrator to\u2018lov tasdig\u2018idan keyin faollashtiradi.",
          )}
        </p>
      </div>
      <div className="callout">
        {operator ? (
          <>
            {__t("Tugma @")}
            {operator}
            {__t(
              "bilan Telegram suhbatini ochadi. ID, do\u2018kon va tarif yozilgan tayyor xabarni o\u2018zingiz yuborasiz.",
            )}
          </>
        ) : (
          __t(
            "Administrator Telegram manzilini hali sozlamagan. Obuna uchun aloqa manzili sozlangach tugmalar ishlaydi.",
          )
        )}
      </div>
      <div className="pricing-grid">
        {db.plans.map((p) => (
          <article className="price-card" key={p.id}>
            <h2>{__t(p.name)}</h2>
            <div className="price">
              {p.price ? money(p.price, __t.language) : __t("Bepul")}
              <small> / {p.price ? __t("oy") : __t("birinchi oy")}</small>
            </div>
            <small>
              {__t("30 kun \u00B7")}
              {__t(productCapacity(p))}
              {__t("mahsulot")}
            </small>
            <ul>
              {p.features.split("\n").map((f) => (
                <li key={__t(f)}>
                  <Check size={16} />
                  {__t(f)}
                </li>
              ))}
            </ul>
            <Button
              disabled={p.price <= 0 || busy || !operator}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await workspaceApi.telegramSubscription(p.id);
                  window.location.assign(result.url);
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? __t(e.message)
                      : __t("Telegram ochilmadi."),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Send size={16} />
              {p.price <= 0
                ? __t("Faqat bir marta \u2014 ro\u2018yxatdan o\u2018tganda")
                : __t("Telegram orqali obuna bo\u2018lish")}
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
