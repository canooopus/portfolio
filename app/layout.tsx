import type { Metadata } from "next";
import Image from 'next/image';
import { Rubik } from 'next/font/google';
import "./globals.css";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "Created with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={rubik.className}>
        {/* childrenの中にpage.tsxの内容が入ります */}
        {children}
      </body>
    </html>
  );
}