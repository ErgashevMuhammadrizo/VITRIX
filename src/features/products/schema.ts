import { z } from "zod";
export const schema = z
  .object({
    name: z.string().min(2, "Kamida 2 belgi").max(100),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Faqat lotin harflari, raqam va tire",
      ),
    categoryId: z.string(),
    price: z.coerce.number().min(0, "Narx manfiy bo‘lmasin"),
    oldPrice: z.coerce.number().min(0),
    description: z.string().max(4000),
    shortDescription: z.string().max(180),
    availability: z.string(),
    featured: z.boolean(),
    order: z.coerce.number().min(0),
    status: z.enum(["published", "draft", "archived"]),
  })
  .refine((v) => !v.oldPrice || v.oldPrice > v.price, {
    path: ["oldPrice"],
    message: "Eski narx joriy narxdan katta bo‘lsin",
  });
