import crypto from "crypto";
import { BOND_PROJECT, SITE_AUTHOR, SITE_NAME, SITE_URL } from "./site";

export const PORTFOLIO_SKILL_MD = `---
name: portfolio-guide
description: Complete guide to navigating Canooopus's portfolio, the Bond chat project, technical articles, and photography gallery.
---

# Portfolio Guide Skill — ${SITE_NAME}

This skill provides AI agents with context and instructions on how to discover and interpret information about ${SITE_AUTHOR.name} and their projects.

## About Canooopus
${SITE_AUTHOR.name} is an ${SITE_AUTHOR.jobTitle.toLowerCase()} living in ${SITE_AUTHOR.location}, specializing in modern web development, TypeScript, Next.js, and design systems.

## Primary Projects
1. **${BOND_PROJECT.name}**:
   - URL: ${BOND_PROJECT.url}
   - Description: ${BOND_PROJECT.description}
   - Category: ${BOND_PROJECT.applicationCategory} (${BOND_PROJECT.operatingSystem})

2. **Personal Portfolio & Blog**:
   - URL: ${SITE_URL}
   - Stack: Next.js 16 App Router, TypeScript, Tailwind CSS, Sharp, Cloudflare R2 & Workers.
   - Design: Responsive layout with Dark/Light styling and custom typography.

## How to Query & Discover Information
- **Full Text**: Fetch \`${SITE_URL}/llms-full.txt\` for all blog posts and portfolio information.
- **Summary**: Fetch \`${SITE_URL}/llms.txt\` for a structured overview.
- **Content Negotiation**: Request any page URL with \`Accept: text/markdown\` for machine-readable content.
- **API Catalog**: Check \`${SITE_URL}/.well-known/api-catalog\` (RFC 9727).
- **Tools via MCP**: Connect to the Model Context Protocol endpoint at \`${SITE_URL}/api/mcp\`.
- **A2A Protocol**: Communicate with this agent at \`${SITE_URL}/api/a2a\`.
`;

export function getPortfolioSkillDigest(): string {
  return crypto.createHash("sha256").update(PORTFOLIO_SKILL_MD, "utf8").digest("hex");
}
