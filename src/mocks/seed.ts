import type { Database, Business } from "../types";
export const burger: Business = {
  id: "b1",
  ownerId: "sample-burger",
  name: "Burger House",
  slug: "burger-house",
  description:
    "Yangi masalliqlar. Haqiqiy ta’m. Har kuni siz uchun mehr bilan tayyorlangan burgerlar va sevimli taomlar.",
  phone: "+998901234567",
  telegram: "burgerhouse",
  address: "Toshkent shahri, Amir Temur ko‘chasi, 24",
  hours: "Har kuni 10:00 – 23:00",
  instagram: "https://instagram.com",
  language: "uz",
  logo: "",
  cover: "/images/cover.jpg",
  active: true,
  theme: "modern",
  primary: "#d9542f",
  secondary: "#f6ede4",
  font: "sans",
  layout: "grid",
  card: "rounded",
  header: "center",
  buttons: "solid",
  planId: "pro",
  expires: "2027-01-31",
  createdAt: "2026-10-20",
};
const foods = [
  [
    "Classic Burger",
    35000,
    42000,
    "c1",
    "burger",
    "Mol go‘shti, cheddar, salat va maxsus sous.",
  ],
  [
    "Double Cheese",
    48000,
    0,
    "c1",
    "double",
    "Ikki qavat go‘sht va ikki karra cheddar.",
  ],
  [
    "Chicken Burger",
    32000,
    0,
    "c1",
    "chicken",
    "Qarsildoq tovuq filesi va yangi sabzavotlar.",
  ],
  [
    "BBQ Burger",
    42000,
    48000,
    "c1",
    "burger",
    "Grilda pishgan go‘sht va tutunli BBQ sous.",
  ],
  [
    "Fresh Lemonade",
    18000,
    0,
    "c2",
    "drink",
    "Limon, yalpiz va muz bilan tetiklantiruvchi ichimlik.",
  ],
  ["Iced Coffee", 22000, 0, "c2", "coffee", "Yangi espresso va mayin sut."],
  ["Orange Fresh", 25000, 0, "c2", "drink", "Yangi siqilgan apelsin sharbati."],
  [
    "French Fries",
    16000,
    20000,
    "c3",
    "fries",
    "Oltinrang va qarsildoq kartoshka fri.",
  ],
  [
    "Chicken Strips",
    28000,
    0,
    "c3",
    "chicken",
    "Yumshoq tovuq bo‘laklari, 5 dona.",
  ],
  ["Hot Dog", 24000, 0, "c3", "hotdog", "Yumshoq bulochka va maxsus sous."],
  [
    "Family Combo",
    115000,
    135000,
    "c3",
    "double",
    "Ikki burger, fri va ikkita ichimlik.",
  ],
  [
    "Spicy Burger",
    39000,
    0,
    "c1",
    "burger",
    "Achchiq sous, jalapeño va cheddar.",
  ],
] as const;
export const seed: Database = {
  version: 1,
  pricingVersion: 2,
  users: [],
  businesses: [
    burger,
    {
      ...burger,
      id: "b2",
      ownerId: "sample-cake",
      name: "Sweet Cake",
      slug: "sweet-cake",
      description:
        "Kichik baxt uchun katta sabab. Har bir bayramga mehr bilan tayyorlangan desertlar.",
      primary: "#8d4967",
      theme: "elegant",
      cover: "/images/cake.jpg",
      telegram: "sweetcake",
      planId: "starter",
    },
  ],
  categories: [
    {
      id: "c1",
      businessId: "b1",
      name: "Burgerlar",
      description: "Har kuni yangi",
      image: "/images/burger.jpg",
      order: 1,
      active: true,
    },
    {
      id: "c2",
      businessId: "b1",
      name: "Ichimliklar",
      description: "Tetiklantiruvchi",
      image: "/images/drink.jpg",
      order: 2,
      active: true,
    },
    {
      id: "c3",
      businessId: "b1",
      name: "Fast-food",
      description: "Sevimli taomlar",
      image: "/images/fries.jpg",
      order: 3,
      active: true,
    },
    {
      id: "c4",
      businessId: "b2",
      name: "Desertlar",
      description: "Shirin lahzalar",
      image: "/images/cake.jpg",
      order: 1,
      active: true,
    },
  ],
  products: [
    ...foods.map((f, i) => ({
      id: "p" + i,
      businessId: "b1",
      name: f[0],
      slug: f[0].toLowerCase().replace(/ /g, "-"),
      categoryId: f[3],
      image: "/images/" + f[4] + ".jpg",
      images: [],
      price: f[1],
      oldPrice: f[2],
      description:
        f[5] +
        " Buyurtma tafsilotlari va mavjudligini telefon yoki Telegram orqali aniqlashtiring.",
      shortDescription: f[5],
      availability: "available",
      featured: i < 3,
      order: i,
      status: "published" as const,
    })),
    {
      id: "cake1",
      businessId: "b2",
      name: "Berry Cheesecake",
      slug: "berry-cheesecake",
      categoryId: "c4",
      image: "/images/cake.jpg",
      images: [],
      price: 42000,
      oldPrice: 0,
      description: "Yangi rezavor mevalar bilan mayin cheesecake.",
      shortDescription: "Rezavorlar va qaymoqli pishloq.",
      availability: "available",
      featured: true,
      order: 1,
      status: "published",
    },
  ],
  plans: [
    {
      id: "starter",
      name: "Bepul sinov",
      price: 0,
      duration: 30,
      limit: 1000,
      analyticsDays: 7,
      csvExport: false,
      features:
        "Birinchi 1 oy bepul (30 kun)\n1 000 ta mahsulot\nCheksiz kategoriyalar\n3 ta professional dizayn\nTelefon va Telegram\nOxirgi 7 kun statistikasi",
    },
    {
      id: "pro",
      name: "Pro",
      price: 49000,
      duration: 30,
      limit: null,
      analyticsDays: 7,
      csvExport: false,
      features:
        "Cheksiz mahsulotlar\nCheksiz kategoriyalar\n3 ta professional dizayn\nTo‘liq brending sozlamalari\nTelefon va Telegram\nOxirgi 7 kun statistikasi",
    },
    {
      id: "vip",
      name: "VIP",
      price: 99000,
      duration: 30,
      limit: null,
      analyticsDays: 90,
      csvExport: true,
      features:
        "Barcha Pro imkoniyatlari\nCheksiz mahsulotlar\n7 / 30 / 90 kunlik analitika\nDavr bo‘yicha aloqa ko‘rsatkichlari\nCSV hisobotlarini yuklash",
    },
  ],
  activities: [
    {
      id: "act1",
      businessId: "b1",
      text: "Burger House sayti yaratildi",
      at: "2026-11-05T09:00:00Z",
    },
    {
      id: "act2",
      businessId: "b1",
      text: "12 ta mahsulot e’lon qilindi",
      at: "2026-11-06T07:00:00Z",
    },
  ],
  events: [],
  platform: {
    name: "VITRIX",
    email: "hello@vitrix.example",
    phone: "+998901234567",
    description: "Biznesingizning yangi manzili.",
    logo: "",
  },
};
const sampleNames: Record<string, [string, string]> = {
  c1: ["Бургеры", "Burgers"],
  c2: ["Напитки", "Drinks"],
  c3: ["Фастфуд", "Fast food"],
  c4: ["Десерты", "Desserts"],
};
for (const category of seed.categories) {
  category.translations = {
    ru: {
      name: sampleNames[category.id][0],
      description: "Свежие продукты каждый день",
    },
    en: {
      name: sampleNames[category.id][1],
      description: "Freshly prepared every day",
    },
  };
}
const sampleProducts: [string, string, string, string][] = [
  [
    "Классический бургер",
    "Classic Burger",
    "Говядина, чеддер, салат и фирменный соус.",
    "Beef, cheddar, lettuce and our signature sauce.",
  ],
  [
    "Двойной чизбургер",
    "Double Cheese",
    "Две котлеты и двойная порция чеддера.",
    "Double beef and double cheddar.",
  ],
  [
    "Бургер с курицей",
    "Chicken Burger",
    "Хрустящее куриное филе и свежие овощи.",
    "Crispy chicken fillet and fresh vegetables.",
  ],
  [
    "Бургер BBQ",
    "BBQ Burger",
    "Мясо на гриле и дымный соус BBQ.",
    "Grilled beef and smoky BBQ sauce.",
  ],
  [
    "Свежий лимонад",
    "Fresh Lemonade",
    "Освежающий напиток с лимоном, мятой и льдом.",
    "Refreshing lemon, mint and ice.",
  ],
  [
    "Айс-кофе",
    "Iced Coffee",
    "Свежий эспрессо и нежное молоко.",
    "Fresh espresso and smooth milk.",
  ],
  [
    "Апельсиновый фреш",
    "Orange Fresh",
    "Свежевыжатый апельсиновый сок.",
    "Freshly squeezed orange juice.",
  ],
  [
    "Картофель фри",
    "French Fries",
    "Золотистый хрустящий картофель фри.",
    "Golden crispy fries.",
  ],
  [
    "Куриные стрипсы",
    "Chicken Strips",
    "Нежные кусочки курицы, 5 штук.",
    "Five tender chicken strips.",
  ],
  [
    "Хот-дог",
    "Hot Dog",
    "Мягкая булочка и фирменный соус.",
    "A soft bun and signature sauce.",
  ],
  [
    "Семейное комбо",
    "Family Combo",
    "Два бургера, картофель фри и два напитка.",
    "Two burgers, fries and two drinks.",
  ],
  [
    "Острый бургер",
    "Spicy Burger",
    "Острый соус, халапеньо и чеддер.",
    "Spicy sauce, jalapeño and cheddar.",
  ],
  [
    "Ягодный чизкейк",
    "Berry Cheesecake",
    "Нежный чизкейк со свежими ягодами.",
    "Creamy cheesecake with fresh berries.",
  ],
];
seed.products.forEach((product, index) => {
  const row = sampleProducts[index];
  product.translations = {
    ru: {
      name: row[0],
      shortDescription: row[2],
      description: row[2] + " Уточняйте наличие по телефону или в Telegram.",
    },
    en: {
      name: row[1],
      shortDescription: row[3],
      description:
        row[3] + " Contact us by phone or Telegram for availability.",
    },
  };
});
for (const business of seed.businesses) {
  business.translations = {
    ru: {
      name: business.name,
      description:
        business.id === "b1"
          ? "Свежие ингредиенты. Настоящий вкус. Любимые бургеры и блюда каждый день."
          : "Десерты, приготовленные с любовью для каждого праздника.",
      address: "Ташкент, улица Амира Темура, 24",
      hours: "Ежедневно 10:00 – 23:00",
    },
    en: {
      name: business.name,
      description:
        business.id === "b1"
          ? "Fresh ingredients. Real flavor. Your favorite burgers and meals, prepared daily."
          : "Desserts made with care for every celebration.",
      address: "24 Amir Temur Street, Tashkent",
      hours: "Daily 10:00 – 23:00",
    },
  };
}
