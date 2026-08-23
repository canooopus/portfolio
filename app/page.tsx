import { Nova_Mono, Caveat } from "next/font/google";
import { PortfolioContainer } from "@/features/portfolio/components";

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
    <PortfolioContainer
      novaMonoClass={novaMono.className}
      caveatClass={caveat.className}
    />
  );
}