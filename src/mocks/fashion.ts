import { seed } from "./seed";
import { translate } from "../i18n/translate";
const text = (name: string) => ({
  uz: { name },
  ru: { name: translate(name, "ru") },
  en: { name: translate(name, "en") },
});
const business = {
  ...seed.businesses[0],
  name: "STUDIO",
  slug: "studio",
  description: "Kiyim va aksessuarlar namuna katalogi.",
  heroTitle: "Sizning uslubingiz. Sizning katalogingiz.",
  primary: "#2563eb",
  backgroundColor: "#f8fafc",
  surfaceColor: "#ffffff",
  textColor: "#101828",
  surfaceTextColor: "#101828",
  mutedColor: "#667085",
  logo: "",
  cover: "",
  phone: "",
  telegram: "",
  instagram: "",
  latitude: null,
  longitude: null,
  mapUrl: "",
  showLocation: false,
  address: "",
  hours: "",
  translations: {
    uz: {
      name: "STUDIO",
      description: "Kiyim va aksessuarlar namuna katalogi.",
      heroTitle: "Sizning uslubingiz. Sizning katalogingiz.",
    },
    ru: {
      name: "STUDIO",
      description: "Пример каталога одежды и аксессуаров.",
      heroTitle: "Ваш стиль. Ваш каталог.",
    },
    en: {
      name: "STUDIO",
      description: "An example clothing and accessories catalog.",
      heroTitle: "Your style. Your catalog.",
    },
  },
};
const categories = [
  {
    ...seed.categories[0],
    id: "clothes",
    businessId: business.id,
    name: "Kiyimlar",
    image: "",
    translations: text("Kiyimlar"),
  },
  {
    ...seed.categories[0],
    id: "accessories",
    businessId: business.id,
    name: "Aksessuarlar",
    image: "",
    translations: text("Aksessuarlar"),
  },
];
const products = [
  ["shirt", "Kundalik ko‘ylak", 189000, "clothes"],
  ["bag", "Shahar sumkasi", 249000, "accessories"],
  ["jacket", "Yengil jaket", 329000, "clothes"],
].map(([image, name, price, categoryId], order) => ({
  ...seed.products[0],
  id: String(image),
  businessId: business.id,
  slug: String(image),
  name: String(name),
  price: Number(price),
  oldPrice: 0,
  image: "/images/" + image + ".svg",
  images: [],
  categoryId: String(categoryId),
  description: "",
  shortDescription: "",
  translations: text(String(name)),
  order,
}));
export const fashion = { business, products, categories };
