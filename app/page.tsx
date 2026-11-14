import { Nova_Mono, Caveat } from "next/font/google";
import { PortfolioContainer } from "@/features/portfolio/components";
import { JsonLd } from "@/components/common";
import { homeStructuredData } from "@/lib/structuredData";

export type { GalleryItem } from "@/features/portfolio/types";

const novaMono = Nova_Mono({
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: "400",
});

export default function Home() {
  return (
    <>
      <JsonLd data={homeStructuredData()} />
      <PortfolioContainer
        novaMonoClass={novaMono.className}
        caveatClass={caveat.className}
      />
    </>
  );
}