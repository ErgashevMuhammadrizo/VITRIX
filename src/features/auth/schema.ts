import { z } from "zod";
export const schema = z.object({
  username: z.string().min(1, "Username kiriting"),
  password: z.string().min(1, "Parol kiriting"),
});
export const registration = z
  .object({
    firstName: z.string().min(2, "Kamida 2 belgi"),
    lastName: z.string().min(2, "Kamida 2 belgi"),
    email: z.string().email("Email noto‘g‘ri"),
    phone: z.string().regex(/^\+?[0-9\s-]{9,17}$/, "Telefon raqami noto‘g‘ri"),
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,30}$/, "3–30 ta lotin harfi, raqam yoki _"),
    password: z.string().min(8, "Kamida 8 belgi"),
    confirm: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Shartlarga rozilik kerak" }),
    }),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Parollar mos emas",
  });
