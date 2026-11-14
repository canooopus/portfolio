import { PORTFOLIO_SKILL_MD } from "@/lib/agentSkills";

export const dynamic = "force-static";

/**
 * /.well-known/agent-skills/portfolio-guide/SKILL.md — Skill definition for agent skills discovery.
 */
export async function GET() {
  return new Response(PORTFOLIO_SKILL_MD, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
