"use client";

import { useEffect } from "react";

const COPY_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="copy-icon">
  <rect width="13" height="13" x="9" y="9" rx="2" ry="2"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>
`;

const CHECK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
  <polyline points="20 6 9 17 4 12"/>
</svg>
`;

export default function CodeCopyScript() {
  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const preElements = document.querySelectorAll<HTMLElement>(
      ".blog-content pre:not(.mermaid)",
    );

    const timeouts = new Map<HTMLElement, NodeJS.Timeout>();

    preElements.forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block-wrapper")) {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement("button");
      button.className = "copy-code-button";
      button.type = "button";
      button.setAttribute("aria-label", "Copy code");
      button.innerHTML = `
        <span class="copy-code-icon-wrapper">
          ${COPY_ICON}
          ${CHECK_ICON}
        </span>
      `;

      button.addEventListener(
        "click",
        async () => {
          const codeElement = pre.querySelector("code");
          const codeText =
            (codeElement ? codeElement.innerText : pre.innerText) ?? "";

          try {
            await navigator.clipboard.writeText(codeText);

            button.classList.add("copied");

            if (timeouts.has(button)) {
              clearTimeout(timeouts.get(button)!);
            }

            const timeout = setTimeout(() => {
              button.classList.remove("copied");
              timeouts.delete(button);
            }, 2000);

            timeouts.set(button, timeout);
          } catch (err) {
            console.error("Failed to copy code to clipboard:", err);
          }
        },
        { signal },
      );

      wrapper.appendChild(button);
    });

    return () => {
      abortController.abort();
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  return null;
}
