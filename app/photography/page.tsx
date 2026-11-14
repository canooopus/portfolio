import type { Metadata } from "next";
import { Caveat, Inter } from "next/font/google";
import { PhotographyGallery } from "@/features/photography/components";
import { JsonLd } from "@/components/common";
import { photographyStructuredData } from "@/lib/structuredData";

const inter = Inter({ subsets: ["latin"] });
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Photography",
  description: "A collection of photographs by Canooopus.",
};

export default function PhotographyPage() {
  return (
    <div
      className={`min-h-screen w-full overflow-x-clip bg-white ${inter.className}`}
    >
      <JsonLd data={photographyStructuredData()} />
      <main className="mx-auto w-full max-w-4xl animate-fade-up px-6 pt-24 pb-24 selection:bg-blue-100 md:pt-32">
        <header className="mb-14">
          <h1
            className={`text-3xl font-medium tracking-tight text-neutral-900 ${caveat.className}`}
          >
            Photography
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-500">
            A collection of photographs. Click a print to see the story behind
            it.
          </p>
        </header>

        <PhotographyGallery caveatClass={caveat.className} />
      </main>
    </div>
  );
}
