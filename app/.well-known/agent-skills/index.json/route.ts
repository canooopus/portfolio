import { SITE_URL } from "@/lib/site";
import { getPortfolioSkillDigest } from "@/lib/agentSkills";

export const dynamic = "force-static";

/**
 * /.well-known/agent-skills/index.json — Agent Skills Discovery Index (RFC v0.2.0).
 */
export async function GET() {
  const digest = getPortfolioSkillDigest();

  const index = {
    $schema: "https://agentskills.io/schema/v0.2.0/index.json",
    skills: [
      {
        name: "portfolio-guide",
        type: "skill-md",
        description:
          "Complete guide to navigating Canooopus's portfolio, Bond chat project, technical articles, and photography gallery.",
        url: `${SITE_URL}/.well-known/agent-skills/portfolio-guide/SKILL.md`,
        digest: `sha256:${digest}`,
      },
    ],
  };

  return Response.json(index, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
