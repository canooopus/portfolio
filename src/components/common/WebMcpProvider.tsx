"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BOND_PROJECT, SITE_AUTHOR, SITE_NAME, SITE_URL } from "@/lib/site";

declare module "react" {
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
  }
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    toolparamdescription?: string;
  }
}

interface WebMcpDocument extends Document {
  modelContext?: {
    registerTool: (
      tool: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
        execute: (params: Record<string, unknown>) => Promise<unknown>;
      },
      options?: { signal?: AbortSignal },
    ) => Promise<void>;
  };
}

/**
 * WebMCP Provider: Exposes browser-level agent tools via WebMCP API (document.modelContext.registerTool)
 * and declarative HTML form attributes for AI browser agents.
 */
export function WebMcpProvider() {
  const router = useRouter();

  useEffect(() => {
    const doc = document as WebMcpDocument;
    if (!doc.modelContext?.registerTool) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    // 1. Tool: get_author_info
    doc.modelContext
      .registerTool(
        {
          name: "get_author_info",
          description: `Get background, bio, and social links for ${SITE_NAME}.`,
          inputSchema: {
            type: "object",
            properties: {},
          },
          execute: async () => {
            return {
              name: SITE_AUTHOR.name,
              jobTitle: SITE_AUTHOR.jobTitle,
              location: SITE_AUTHOR.location,
              description: SITE_AUTHOR.description,
              contact: SITE_AUTHOR.contact,
              featuredProject: BOND_PROJECT,
            };
          },
        },
        { signal },
      )
      .catch((err) => {
        console.warn("Failed to register WebMCP get_author_info:", err);
      });

    // 2. Tool: navigate_page
    doc.modelContext
      .registerTool(
        {
          name: "navigate_page",
          description: `Navigate to a section of ${SITE_NAME}'s website (home, blog, photography, bond).`,
          inputSchema: {
            type: "object",
            properties: {
              destination: {
                type: "string",
                enum: ["home", "blog", "photography", "bond"],
                description: "Destination page name",
              },
            },
            required: ["destination"],
          },
          execute: async (params) => {
            const dest = String(params.destination || "").toLowerCase();
            if (dest === "home") {
              router.push("/");
              return { success: true, url: "/" };
            }
            if (dest === "blog") {
              router.push("/blog");
              return { success: true, url: "/blog" };
            }
            if (dest === "photography") {
              router.push("/photography");
              return { success: true, url: "/photography" };
            }
            if (dest === "bond") {
              window.open(BOND_PROJECT.url, "_blank", "noopener,noreferrer");
              return { success: true, url: BOND_PROJECT.url };
            }
            return { success: false, error: "Unknown destination" };
          },
        },
        { signal },
      )
      .catch((err) => {
        console.warn("Failed to register WebMCP navigate_page:", err);
      });

    // 3. Tool: get_site_summary
    doc.modelContext
      .registerTool(
        {
          name: "get_site_summary",
          description: "Get summary of site content, llms.txt endpoints, and contact information.",
          inputSchema: {
            type: "object",
            properties: {},
          },
          execute: async () => {
            return {
              siteUrl: SITE_URL,
              llmsSummaryUrl: `${SITE_URL}/llms.txt`,
              fullArchiveUrl: `${SITE_URL}/llms-full.txt`,
              apiCatalogUrl: `${SITE_URL}/.well-known/api-catalog`,
            };
          },
        },
        { signal },
      )
      .catch((err) => {
        console.warn("Failed to register WebMCP get_site_summary:", err);
      });

    return () => {
      controller.abort();
    };
  }, [router]);

  return (
    // Declarative WebMCP HTML form for browsers scanning DOM attributes
    <form
      action="/blog"
      method="GET"
      toolname="search_content"
      tooldescription="Search technical blog articles and portfolio content by keyword"
      className="sr-only"
      aria-hidden="true"
    >
      <input
        type="text"
        name="q"
        toolparamdescription="Search keyword to find relevant blog articles and projects"
        placeholder="Search posts..."
        defaultValue=""
      />
      <button type="submit">Search</button>
    </form>
  );
}
