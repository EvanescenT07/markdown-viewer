"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { messages } from "@/i18n/messages";

interface CodeBlockProps {
  readonly code: string;
  readonly language: string;
}

export function CodeBlock({
  code,
  language,
}: CodeBlockProps): React.JSX.Element {
  const { effectiveTheme } = useTheme();
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const normalizedCode = code.replace(/\n$/, "");
  const displayLanguage = language || "text";

  useEffect(() => {
    let isCancelled = false;

    async function highlightSnippet(): Promise<void> {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(normalizedCode, {
          lang: displayLanguage,
          theme: effectiveTheme === "dark" ? "github-dark" : "github-light",
        });
        if (!isCancelled) {
          setHighlightedHtml(html);
        }
      } catch {
        // Fallback to plain preformatted block when the language grammar is unrecognized.
        if (!isCancelled) {
          setHighlightedHtml(null);
        }
      }
    }

    void highlightSnippet();

    return () => {
      isCancelled = true;
    };
  }, [normalizedCode, displayLanguage, effectiveTheme]);

  async function handleCopyCode(): Promise<void> {
    await navigator.clipboard.writeText(normalizedCode);
    setIsCopied(true);
    window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }

  return (
    <div className="my-5 break-inside-avoid overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3.5 py-1.5">
        <span className="font-mono text-xs font-medium text-[var(--text-secondary)]">
          {displayLanguage}
        </span>

        <button
          type="button"
          onClick={handleCopyCode}
          aria-label={`${messages.reader.copySnippetButton} ${displayLanguage} code`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)] print:hidden"
        >
          {isCopied ? (
            <>
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 text-[var(--status-success)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-[var(--status-success)]">
                {messages.reader.copiedSnippetConfirmation}
              </span>
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{messages.reader.copySnippetButton}</span>
            </>
          )}
        </button>
      </div>

      {highlightedHtml ? (
        <div
          className="overflow-x-auto bg-[var(--bg-canvas)] p-4 font-mono text-sm leading-relaxed [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="m-0 overflow-x-auto bg-[var(--bg-canvas)] p-4 font-mono text-sm leading-relaxed text-[var(--text-primary)]">
          <code>{normalizedCode}</code>
        </pre>
      )}
    </div>
  );
}

