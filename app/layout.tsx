import type { Metadata } from "next";
import { AppProvider } from "../src/stores/app-store";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "VITRIX — Mahsulotlaringiz. Bitta havola.",
    template: "%s | VITRIX",
  },
  description:
    "Kichik biznes uchun onlayn katalog. Mahsulotlar, narxlar va aloqa ma’lumotlari bitta havolada.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
