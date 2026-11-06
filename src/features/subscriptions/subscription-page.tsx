"use client";
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
  const { db } = useApp();
  const [busy, setBusy] = useState(false);
  const operator = db.platform.subscriptionTelegram;
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Obuna va tariflar</h1>
          <p>
            {db.plans.find((p) => p.id === business.planId)?.name} ·{" "}
            {date(business.expires)} gacha
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
          Birinchi 30 kun bepul. Pullik obunani administrator to‘lov tasdig‘idan
          keyin faollashtiradi.
        </p>
      </div>
      <div className="callout">
        {operator ? (
          <>
            Tugma @{operator} bilan Telegram suhbatini ochadi. ID, do‘kon va
            tarif yozilgan tayyor xabarni o‘zingiz yuborasiz.
          </>
        ) : (
          "Administrator Telegram manzilini hali sozlamagan. Obuna uchun aloqa manzili sozlangach tugmalar ishlaydi."
        )}
      </div>
      <div className="pricing-grid">
        {db.plans.map((p) => (
          <article className="price-card" key={p.id}>
            <h2>{p.name}</h2>
            <div className="price">
              {p.price ? money(p.price) : "Bepul"}
              <small> / {p.price ? "oy" : "birinchi oy"}</small>
            </div>
            <small>30 kun · {productCapacity(p)} mahsulot</small>
            <ul>
              {p.features.split("\n").map((f) => (
                <li key={f}>
                  <Check size={16} />
                  {f}
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
                    e instanceof Error ? e.message : "Telegram ochilmadi.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Send size={16} />
              {p.price <= 0
                ? "Faqat bir marta — ro‘yxatdan o‘tganda"
                : "Telegram orqali obuna bo‘lish"}
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
