import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { MenuProvider } from "@/context/MenuContext";
import FloatingMenu from "@/components/layout/FloatingMenu";
import Footer from "@/components/layout/Footer";
import "katex/dist/katex.min.css";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Canooopus",
  description: "Created with Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={rubik.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              window.scrollTo(0, 0);
            `,
          }}
        />
        <MenuProvider>
          <div className="flex flex-col min-h-screen">
            <main className="grow">
              {children}
            </main>
            <Footer />
            <FloatingMenu />
          </div>
        </MenuProvider>
        <Analytics />
      </body>
    </html>
  );
}
