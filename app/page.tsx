import { Nova_Mono, Caveat } from "next/font/google";
import { PortfolioContainer } from "@/features/portfolio/components";
import { JsonLd } from "@/components/common";

export type { GalleryItem } from "@/features/portfolio/types";

const novaMono = Nova_Mono({
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: "400",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${BASE_URL}/#person`,
      name: "Canooopus",
      url: BASE_URL,
      jobTitle: "Engineer & Designer",
      description:
        "Engineer and designer living in Japan, building web applications and digital tools independently.",
      sameAs: [
        "https://github.com/canooopus",
        "https://x.com/Canopus1170612",
      ],
      knowsAbout: [
        "Web Development",
        "Next.js",
        "TypeScript",
        "React",
        "Tailwind CSS",
        "UI/UX Design",
        "Photography",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "Canooopus",
      url: BASE_URL,
      description: "Portfolio and personal website of Canooopus.",
      author: {
        "@id": `${BASE_URL}/#person`,
      },
      inLanguage: ["ja", "en"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/#project-bond`,
      name: "Bond",
      applicationCategory: "CommunicationApplication",
      operatingSystem: "Web Browser",
      url: "https://robopro2.com/app/nagasima/LINE/",
      description:
        "A browser-based real-time chat application developed independently by Canooopus.",
      author: {
        "@id": `${BASE_URL}/#person`,
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={homeJsonLd} />
      <PortfolioContainer
        novaMonoClass={novaMono.className}
        caveatClass={caveat.className}
      />
    </>
  );
}