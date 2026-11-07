import type { Metadata } from "next";
import { AppProvider } from "../src/stores/app-store";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "VITRIX — Biznesingizning yangi manzili",
    template: "%s | VITRIX",
  },
  description:
    "Dasturchisiz professional biznes saytingizni yarating. Mahsulotlar, dizayn va aloqalar bir joyda.",
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
