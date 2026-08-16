"use client";

import { useEffect } from "react";

export default function MermaidScript() {
  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;
        
        if (!isMounted) return;

        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          themeVariables: {
            edgeLabelBackground: "#ffffff",
          },
          flowchart: {
            htmlLabels: true,
          },
        });

        const elements = document.querySelectorAll(".mermaid");
        if (elements.length > 0) {
          await mermaid.run({
            querySelector: ".mermaid",
          });
        }
      } catch (error) {
        console.error("Failed to render Mermaid diagrams:", error);
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}

