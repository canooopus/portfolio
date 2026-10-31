import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { MenuProvider } from "@/context/MenuContext";
import FloatingMenu from "@/components/layout/FloatingMenu";
import Footer from "@/components/layout/Footer";
import { ScrollRestoration } from "@/components/common";
import "katex/dist/katex.min.css";

const rubik = Rubik({ subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Canooopus",
    template: "%s | Canooopus",
  },
  description: "Portfolio of Canooopus.",
  openGraph: {
    title: "Canooopus",
    description: "Portfolio of Canooopus.",
    url: siteUrl,
    siteName: "Canooopus",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Canooopus",
    description: "Portfolio of Canooopus.",
  },
  // Google Search Console の確認コードを取得したら、以下のコメントアウトを解除してコードを入れてください
  verification: {
    google: "OLBliKq0-sRAuFQTuLAg7YnZtGuLSaF5OkNG18Se1eg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={rubik.className}>
        <ScrollRestoration />
        <MenuProvider>
          <div className="flex flex-col min-h-screen">
            <main className="grow">{children}</main>
            <Footer />
            <FloatingMenu />
          </div>
        </MenuProvider>
        <Analytics />
      </body>
    </html>
  );
}
