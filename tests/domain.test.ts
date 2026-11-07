import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/mocks/seed";
import { changesBetween } from "../src/services/workspace";
const cloneSeed = () => structuredClone(seed);
import {
  publicBusiness,
  tenantProducts,
  tenantCategories,
} from "../src/services/selectors";
import { registration, schema as login } from "../src/features/auth/schema";
import { schema as product } from "../src/features/products/schema";
import {
  canAddProduct,
  productCapacity,
  activatePlan,
  analyticsDays,
} from "../src/services/plans";
import { slugify, reserved, telegram } from "../src/lib/utils";
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}
Object.assign(globalThis, {
  localStorage: new MemoryStorage(),
  sessionStorage: new MemoryStorage(),
});
test("public catalogs isolate businesses and inactive/draft records", () => {
  const db = cloneSeed();
  assert.equal(tenantProducts(db, "b1").length, 12);
  assert.equal(tenantProducts(db, "b2").length, 1);
  assert.ok(tenantProducts(db, "b1").every((p) => p.businessId === "b1"));
  db.products[0].status = "draft";
  assert.equal(tenantProducts(db, "b1").length, 11);
  db.categories[0].active = false;
  assert.equal(tenantCategories(db, "b1").length, 2);
  assert.ok(tenantProducts(db, "b1").every((p) => p.categoryId !== "c1"));
  db.businesses[0].active = false;
  assert.equal(publicBusiness(db, "burger-house"), undefined);
  assert.equal(publicBusiness(db, "unknown"), undefined);
});
test("delta API sends changed entities without passwords or unrelated tenant data", () => {
  const before = cloneSeed();
  const after = cloneSeed();
  after.products[0].price = 40000;
  const changes = changesBetween(before, after);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].entity, "products");
  assert.equal(changes[0].record?.price, 40000);
  assert.equal(changes[0].record?.password, undefined);
});
test("no bundled login accounts or passwords", () => {
  const db = cloneSeed();
  assert.equal(db.users.length, 0);
  assert.equal(db.platform.name, "VITRIX");
});
test("registration validates fields, matching passwords and terms", () => {
  const v = {
    firstName: "Ali",
    lastName: "Valiyev",
    email: "ali@example.uz",
    phone: "+998901234567",
    username: "ali_test",
    password: "new-demo123",
    confirm: "new-demo123",
    terms: true,
  };
  assert.ok(registration.safeParse(v).success);
  for (const patch of [
    { confirm: "mismatch" },
    { terms: false },
    { email: "invalid" },
    { password: "123" },
    { username: "a b" },
    { phone: "abc" },
  ])
    assert.equal(registration.safeParse({ ...v, ...patch }).success, false);
  assert.equal(login.safeParse({ username: "", password: "" }).success, false);
});
test("product price, old price and slug validation", () => {
  const p = cloneSeed().products[0];
  assert.ok(product.safeParse(p).success);
  assert.equal(product.safeParse({ ...p, price: -1 }).success, false);
  assert.equal(product.safeParse({ ...p, oldPrice: 1 }).success, false);
  assert.equal(
    product.safeParse({ ...p, slug: "invalid slug" }).success,
    false,
  );
});
test("slug and Telegram helpers encode safe share links", () => {
  assert.equal(slugify("  Burger House! "), "burger-house");
  assert.ok(reserved.includes("admin"));
  const url = new URL(telegram("@burgerhouse", "Salom! Classic Burger"));
  assert.equal(url.hostname, "t.me");
  assert.equal(url.searchParams.get("text"), "Salom! Classic Burger");
});

test("trial caps at 1000 while Pro and VIP are unlimited", () => {
  const db = cloneSeed();
  const free = db.plans.find((p) => p.id === "starter");
  assert.ok(canAddProduct(free, 999));
  assert.equal(canAddProduct(free, 1000), false);
  for (const id of ["pro", "vip"]) {
    const p = db.plans.find((p) => p.id === id);
    assert.ok(canAddProduct(p, 1000000));
    assert.equal(productCapacity(p), "Cheksiz");
  }
  assert.equal(db.plans.find((p) => p.id === "vip")?.price, 99000);
});
test("VIP provides extended analytics and CSV while trial cannot be reactivated", () => {
  const db = cloneSeed();
  const free = db.plans.find((p) => p.id === "starter")!;
  assert.throws(() => activatePlan(db, "b1", free));
  assert.equal(analyticsDays(db.plans.find((p) => p.id === "pro")), 7);
  const vip = db.plans.find((p) => p.id === "vip")!;
  assert.equal(analyticsDays(vip), 90);
  assert.ok(vip.csvExport);
  activatePlan(db, "b1", vip);
  assert.equal(db.businesses[0].planId, "vip");
});

test("same-origin Django proxy forwards CSRF/cookies and preserves session cookies", async () => {
  const { POST } = await import("../app/api/[...path]/route");
  const previous = process.env.DJANGO_API_URL;
  const original = globalThis.fetch;
  process.env.DJANGO_API_URL = "http://django.internal:8000";
  let captured = "";
  try {
    globalThis.fetch = async (input, options) => {
      captured = String(input);
      const headers = new Headers(options?.headers);
      assert.equal(headers.get("cookie"), "csrftoken=test-token");
      assert.equal(headers.get("x-csrftoken"), "test-token");
      assert.equal(headers.get("origin"), "http://localhost:3000");
      return new Response('{"ok":true}', {
        headers: {
          "content-type": "application/json",
          "set-cookie": "sessionid=test-session; HttpOnly; SameSite=Lax",
        },
      });
    };
    const request = new Request("http://localhost:3000/api/v1/auth/login/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "csrftoken=test-token",
        "x-csrftoken": "test-token",
        origin: "http://localhost:3000",
      },
      body: '{"username":"example"}',
    });
    const response = await POST(request as import("next/server").NextRequest);
    assert.equal(captured, "http://django.internal:8000/api/v1/auth/login/");
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("set-cookie")?.includes("HttpOnly"));
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.DJANGO_API_URL;
    else process.env.DJANGO_API_URL = previous;
  }
});
test("proxy reports missing backend honestly instead of allowing demo login", async () => {
  const { GET } = await import("../app/api/[...path]/route");
  const previous = process.env.DJANGO_API_URL;
  delete process.env.DJANGO_API_URL;
  try {
    const response = await GET(
      new Request(
        "http://localhost:3000/api/v1/auth/me/",
      ) as import("next/server").NextRequest,
    );
    assert.equal(response.status, 503);
  } finally {
    if (previous !== undefined) process.env.DJANGO_API_URL = previous;
  }
});

import { appearanceOf, palettes } from "../src/features/businesses/appearance";
import {
  validCoordinates,
  safeMapUrl,
  parseMapCoordinates,
  mapLink,
} from "../src/features/location/location-utils";
test("merchant palettes change actual backgrounds and default to full width", () => {
  const b = cloneSeed().businesses[0];
  assert.equal(appearanceOf(b).contentWidth, "full");
  assert.equal(palettes[0].colors.colorMode, "light");
  assert.equal(palettes[1].colors.colorMode, "dark");
  assert.equal(palettes[2].colors.colorMode, "contrast");
  assert.notEqual(
    palettes[0].colors.backgroundColor,
    palettes[1].colors.backgroundColor,
  );
  assert.equal(
    appearanceOf({ ...b, ...palettes[1].colors }).surfaceTextColor,
    "#f2f5fc",
  );
});
test("location allows zero and rejects partial or invalid coordinates", () => {
  assert.ok(validCoordinates(0, 0));
  assert.ok(!validCoordinates(null, 10));
  assert.ok(!validCoordinates(91, 0));
  assert.ok(!validCoordinates(10, NaN));
  assert.match(mapLink({ latitude: 41, longitude: 69 }), /query=41,69/);
});
test("map links parse coordinates and reject spoofed hosts", () => {
  assert.deepEqual(
    parseMapCoordinates("https://www.google.com/maps/@41.31,69.27,14z"),
    [41.31, 69.27],
  );
  assert.deepEqual(
    parseMapCoordinates("https://yandex.uz/maps/?ll=69.27,41.31"),
    [41.31, 69.27],
  );
  assert.equal(safeMapUrl("https://google.com.evil.example/maps"), "");
  assert.equal(safeMapUrl("javascript:alert(1)"), "");
  assert.equal(safeMapUrl("https://user:pass@maps.google.com/"), "");
});

import { translate } from "../src/i18n/translate";
import catalogue from "../src/i18n/catalogue.json";
import { localizedContent } from "../src/i18n/content";
import {
  resetDesign,
  factoryDesign,
} from "../src/features/businesses/appearance";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../src/i18n/runtime";
import { AppearanceControls } from "../src/features/businesses/appearance-controls";
import { CTA } from "../src/components/layout/marketing";
import { AppProvider } from "../src/stores/app-store";
import { BusinessSite } from "../src/components/public-website/business-site";
import { Pricing } from "../src/features/marketing/pages";
test("every catalogue entry has Russian and English translations", () => {
  assert.ok(Object.keys(catalogue).length > 700);
  for (const [key, text] of Object.entries(catalogue)) {
    assert.ok(text.ru.trim(), key);
    assert.ok(text.en.trim(), key);
  }
});
test("translations handle interpolation, multiline features and validation", () => {
  assert.equal(translate("Saqlash", "ru"), "Сохранить");
  assert.equal(translate("Parollar mos emas", "en"), "Passwords do not match");
  assert.equal(
    translate("{0} ta mahsulot", "ru", { "0": 1000 }),
    "1000 товаров",
  );
  assert.equal(
    translate("Cheksiz mahsulotlar\nCSV eksporti", "en"),
    "Unlimited products\nCSV export",
  );
});
test("content locale selection preserves original and uses a safe fallback", () => {
  const record = {
    name: "Asosiy",
    description: "Original",
    translations: {
      ru: { name: "Название", description: "" },
      en: { name: "Name" },
    },
  };
  assert.equal(localizedContent(record, "ru").name, "Название");
  assert.equal(localizedContent(record, "ru").description, "Original");
  assert.equal(record.name, "Asosiy");
  assert.equal(localizedContent(record, "uz").name, "Asosiy");
});
test("design reset restores all style fields while preserving account catalog and branding", () => {
  const original = {
    ...cloneSeed().businesses[0],
    colorMode: "dark" as const,
    primary: "#123456",
    logo: "/media/logo.png",
    latitude: 41,
    longitude: 69,
    translations: { ru: { name: "Магазин" } },
  };
  const restored = resetDesign(original);
  for (const [key, value] of Object.entries(factoryDesign))
    assert.equal((restored as unknown as Record<string, unknown>)[key], value);
  for (const key of [
    "id",
    "ownerId",
    "name",
    "slug",
    "logo",
    "planId",
    "expires",
    "latitude",
    "longitude",
    "translations",
  ] as const)
    assert.deepEqual(restored[key], original[key]);
  assert.equal(original.colorMode, "dark");
});
test("updated plans keep the free trial limit and paid plans unlimited", () => {
  const db = cloneSeed();
  assert.equal(db.plans.find((p) => p.id === "pro")?.price, 49000);
  assert.equal(db.plans.find((p) => p.id === "vip")?.price, 99000);
  assert.equal(db.plans.find((p) => p.id === "starter")?.limit, 1000);
  assert.equal(db.plans.find((p) => p.id === "vip")?.limit, null);
});
test("Russian and English design forms render translated labels and choices", () => {
  for (const language of ["ru", "en"] as const) {
    const markup = renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        { language },
        React.createElement(AppearanceControls, {
          value: cloneSeed().businesses[0],
          onChange: () => {},
        }),
      ),
    );
    assert.ok(
      markup.includes(language === "ru" ? "Ширина сайта" : "Website width"),
    );
    assert.ok(
      markup.includes(language === "ru" ? "Фон страницы" : "Page background"),
    );
    assert.ok(!markup.includes("Sayt kengligi"));
    assert.ok(!markup.includes("Asosiy matn"));
  }
});
test("marketing CTA follows locale and guest pricing does not show prices", () => {
  for (const language of ["ru", "en"] as const) {
    const markup = renderToStaticMarkup(
      React.createElement(I18nProvider, { language }, React.createElement(CTA)),
    );
    assert.ok(
      markup.includes(language === "ru" ? "Начать бесплатно" : "Start free"),
    );
    assert.ok(!markup.includes("Bepul boshlash"));
  }
  const pricing = renderToStaticMarkup(
    React.createElement(AppProvider, null, React.createElement(Pricing)),
  );
  assert.ok(!pricing.includes("49"));
  assert.ok(!pricing.includes("99"));
  assert.ok(pricing.includes("/register"));
});
test("public catalogs render UZ RU EN selector and chosen content without dashboard locale leaks", () => {
  const base = cloneSeed();
  for (const language of ["ru", "en"] as const) {
    const business = {
      ...base.businesses[0],
      language,
      translations: {
        ru: { name: "Мой магазин", description: "Описание магазина" },
        en: { name: "My shop", description: "Shop description" },
      },
    };
    const markup = renderToStaticMarkup(
      React.createElement(
        AppProvider,
        { initialLanguage: "uz" },
        React.createElement(BusinessSite, {
          business,
          preview: true,
          data: {
            business,
            products: base.products,
            categories: base.categories,
          },
        }),
      ),
    );
    assert.ok(markup.includes(language === "ru" ? "Мой магазин" : "My shop"));
    assert.ok(
      markup.includes(
        language === "ru" ? "Выберите своё любимое." : "Find your favorite.",
      ),
    );
    for (const value of ["uz", "ru", "en"])
      assert.ok(markup.includes(`value="${value}"`));
    assert.ok(markup.includes("DEALS"));
  }
});

test("delta updates and deletes carry the original server revision", () => {
  const before = cloneSeed();
  Object.assign(before.products[0], { revision: "server-token" });
  const after = structuredClone(before);
  after.products[0] = { ...after.products[0], price: 43210 };
  assert.equal(changesBetween(before, after)[0].revision, "server-token");
  after.products = after.products.filter((item) => item.id !== before.products[0].id);
  assert.equal(changesBetween(before, after)[0].revision, "server-token");
});
test("platform edits preserve the server revision even when a form replaces the record", () => {
  const before = cloneSeed();
  Object.assign(before.platform, { revision: "platform-token" });
  const after = structuredClone(before);
  after.platform = { ...seed.platform, name: "Updated" };
  const changes = changesBetween(before, after);
  assert.equal(changes[0].entity, "platform");
  assert.equal(changes[0].revision, "platform-token");
});
