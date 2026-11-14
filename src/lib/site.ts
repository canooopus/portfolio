/**
 * サイト全体で共有するメタ情報。
 *
 * llms.txt / robots.txt / sitemap.xml / JSON-LD / Markdown negotiation など、
 * 複数の AI エージェント向けファイルから同じ値を使えるようにここへ集約する。
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://canooopus-me.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Canooopus";

export const SITE_TITLE = "Canooopus";

export const SITE_DESCRIPTION =
  "Portfolio and blog of Canooopus, an engineer & designer based in Japan. Projects, technical writing, and photography.";

export const SITE_AUTHOR = {
  name: "Canooopus",
  jobTitle: "Engineer & Designer",
  description:
    "Engineer and designer living in Japan, building web applications and digital tools independently.",
  location: "Japan",
  url: SITE_URL,
  github: "https://github.com/canooopus",
  x: "https://x.com/Canopus1170612",
  email: "canooopus@gmail.com",
  /** 現時点で公開している連絡手段 */
  contact: "https://x.com/Canopus1170612",
} as const;

export const SOCIAL_LINKS = [
  {
    label: "GitHub",
    url: SITE_AUTHOR.github,
    description: "Open source projects, experiments, and source code.",
  },
  {
    label: "X (formerly Twitter)",
    url: SITE_AUTHOR.x,
    description: "Social updates, thoughts, and announcements.",
  },
] as const;

export const BOND_PROJECT = {
  name: "Bond",
  url: "https://robopro2.com/app/nagasima/LINE/",
  applicationCategory: "CommunicationApplication",
  operatingSystem: "Web Browser",
  description:
    "A browser-based real-time chat application developed independently by Canooopus.",
} as const;

export const KNOWS_ABOUT = [
  "Web Development",
  "Next.js",
  "TypeScript",
  "React",
  "Tailwind CSS",
  "UI/UX Design",
  "Photography",
] as const;

/**
 * AI / LLM クローラー。robots.txt で明示的に許可する。
 * 未知のクローラー向けに `*` の Allow も別途出力する。
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "CCBot",
  "Bytespider",
] as const;
