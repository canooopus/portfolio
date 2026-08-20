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
          fontFamily: "Inter, sans-serif",
          securityLevel: "loose",
          themeVariables: {
            fontFamily: "Inter, sans-serif",
            // 共通 / フローチャート設定
            primaryColor: "#fff4eb",
            primaryBorderColor: "#f97316",
            primaryTextColor: "#1f2937",
            secondaryColor: "#fff4eb",
            secondaryBorderColor: "#f97316",
            tertiaryColor: "#fff4eb",
            tertiaryBorderColor: "#f97316",
            lineColor: "#f97316",
            arrowheadColor: "#f97316",
            nodeBorder: "#f97316",
            nodeBkg: "#fff4eb",
            mainBkg: "#fff4eb",
            edgeLabelBackground: "#ffffff",

            // シーケンス図 (Sequence Diagram) 設定
            actorBkg: "#fff4eb",
            actorBorder: "#f97316",
            actorTextColor: "#1f2937",
            actorLineColor: "#f97316",
            signalColor: "#f97316",
            signalTextColor: "#1f2937",
            labelBoxBkgColor: "#fff4eb",
            labelBoxBorderColor: "#f97316",
            labelTextColor: "#1f2937",
            loopTextColor: "#1f2937",
            noteBkgColor: "#fff4eb",
            noteBorderColor: "#f97316",
            activationBkgColor: "#ffedd5",
            activationBorderColor: "#f97316",
            sequenceNumberColor: "#ffffff",
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

