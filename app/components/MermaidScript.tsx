"use client";

import Script from "next/script";

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
      run: (options?: { querySelector?: string }) => void;
    };
  }
}

export default function MermaidScript() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
          });
          window.mermaid.run({
            querySelector: ".mermaid",
          });
        }
      }}
    />
  );
}
