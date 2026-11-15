import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { MenuProvider } from "@/context/MenuContext";
import { TocProvider } from "@/context/TocContext";
import FloatingMenu from "@/components/layout/FloatingMenu";
import Footer from "@/components/layout/Footer";
import { ScrollRestoration, WebMcpProvider } from "@/components/common";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "katex/dist/katex.min.css";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
        {/* ARD の追加 discovery mechanism。React が <head> に hoist する */}
        <link rel="ai-catalog" href="/.well-known/ai-catalog.json" />
        <ScrollRestoration />
        <WebMcpProvider />
        <TocProvider>
          <MenuProvider>
            <div className="flex flex-col min-h-screen">
              <main className="grow">{children}</main>
              <Footer />
              <FloatingMenu />
            </div>
          </MenuProvider>
        </TocProvider>
        <Analytics />
      </body>
    </html>
  );
}
