"use client";
import { useTranslator } from "../i18n/runtime";
import { DemoDesigner } from "../features/businesses/demo-designer";
import Link from "next/link";
import { lazy, Suspense, useEffect } from "react";
import { useApp } from "../stores/app-store";
const MarketingPage = lazy(() =>
  import("../features/marketing/pages").then((m) => ({
    default: m.MarketingPage,
  })),
);
const AuthPage = lazy(() =>
  import("../features/auth/auth-page").then((m) => ({ default: m.AuthPage })),
);
const Workspace = lazy(() =>
  import("../features/dashboard/dashboard").then((m) => ({
    default: m.Workspace,
  })),
);
import { seed } from "../mocks/seed";
import type { PublicCatalog } from "../services/workspace";
import { BusinessSite } from "./public-website/business-site";
import { Button, Loading } from "./ui/shared";
const marketing = [
  "pricing",
  "features",
  "about",
  "contact",
  "privacy",
  "terms",
];
function RouterContent({
  path = [],
  publicData,
  publicError,
}: {
  path?: string[];
  publicData?: PublicCatalog;
  publicError?: string;
}) {
  const __t = useTranslator();
  const { db, ready, error, reset } = useApp();
  const [root, section] = path;
  useEffect(() => {
    if (publicData) document.title = publicData.business.name + " | VITRIX";
    else document.title = "VITRIX — " + __t("Biznesingizning yangi manzili.");
  }, [__t, publicData]);
  if (!root) return <MarketingPage />;
  if (marketing.includes(root) && path.length === 1)
    return <MarketingPage page={root} />;
  if (
    ["login", "register", "forgot-password"].includes(root) &&
    path.length === 1
  )
    return <AuthPage mode={root} />;
  if (root === "dashboard" || root === "admin")
    return (
      <Workspace
        admin={root === "admin"}
        section={path.length > 2 ? "not-found" : (section ?? "")}
      />
    );
  if (root === "500")
    return (
      <div className="guard">
        <strong className="error-code">500</strong>
        <h1>{__t("Kutilmagan xatolik")}</h1>
        <p>{__t("Qayta urinib ko\u2018ring.")}</p>
        <Button onClick={() => location.reload()}>{__t("Yangilash")}</Button>
      </div>
    );
  if (root === "demo" && path.length === 1) return <DemoDesigner />;
  if (publicError)
    return (
      <div className="guard">
        <h1>{__t("Sayt vaqtincha ochilmadi")}</h1>
        <p>{publicError}</p>
        <Button onClick={() => location.reload()}>
          {__t("Qayta urinish")}
        </Button>
        <Link href="/">{__t("Bosh sahifa")}</Link>
      </div>
    );
  if (publicData)
    return <BusinessSite business={publicData.business} data={publicData} />;
  return <NotFoundBusiness />;
}
export function NotFoundBusiness() {
  const __t = useTranslator();
  return (
    <div className="not-found">
      <span className="eyebrow">
        {__t("BU MANZILDA HALI HECH KIM YO\u2018Q")}
      </span>
      <strong className="error-code">
        404<span>↗</span>
      </strong>
      <h1>{__t("Sayt topilmadi.")}</h1>
      <p>
        {__t("Havolani tekshiring. Biznes sayti o\u2018chirilgan")}
        <br />
        {__t("yoki vaqtincha yashirilgan bo\u2018lishi mumkin.")}
      </p>
      <Link className="btn" href="/">
        {__t("Bosh sahifaga qaytish")}
      </Link>
    </div>
  );
}
export function AppRouter(props: {
  path?: string[];
  publicData?: PublicCatalog;
  publicError?: string;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <RouterContent {...props} />
    </Suspense>
  );
}
