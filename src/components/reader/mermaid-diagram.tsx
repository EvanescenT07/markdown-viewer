"use client";

import React, { useEffect, useId, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { messages } from "@/i18n/messages";

interface MermaidDiagramProps {
  readonly chartDefinition: string;
}

export function MermaidDiagram({
  chartDefinition,
}: MermaidDiagramProps): React.JSX.Element {
  const rawId = useId();
  const sanitizedId = `mermaid-svg-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { effectiveTheme } = useTheme();

  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isSourceVisible, setIsSourceVisible] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function compileDiagram(): Promise<void> {
      setRenderError(null);
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: effectiveTheme === "dark" ? "dark" : "neutral",
          fontFamily: "var(--font-sans), sans-serif",
        });

        const renderTargetId = `${sanitizedId}-${effectiveTheme}-${Date.now()}`;
        const { svg } = await mermaid.render(
          renderTargetId,
          chartDefinition.trim()
        );

        if (!isCancelled) {
          setSvgMarkup(svg);
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Invalid Mermaid diagram syntax.";
          setRenderError(message);
        }
      }
    }

    void compileDiagram();

    return () => {
      isCancelled = true;
    };
  }, [chartDefinition, effectiveTheme, sanitizedId]);

  if (renderError) {
    return (
      <div
        role="alert"
        className="my-5 rounded-md border border-[var(--status-danger)] bg-[var(--bg-surface)] p-4"
      >
        <p className="text-sm font-semibold text-[var(--status-danger)]">
          {messages.reader.mermaidErrorPrefix}
        </p>
        <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
          {renderError}
        </p>
        <pre className="mt-3 overflow-x-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 font-mono text-xs text-[var(--text-primary)]">
          <code>{chartDefinition}</code>
        </pre>
      </div>
    );
  }

  return (
    <figure className="mermaid-diagram-block my-6 break-inside-avoid rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="mb-2 flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 print:hidden">
        <span className="font-mono text-xs font-medium text-[var(--text-secondary)]">
          mermaid
        </span>
        <button
          type="button"
          onClick={() => setIsSourceVisible((prev) => !prev)}
          className="inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
        >
          {messages.reader.mermaidSourceToggle}
        </button>
      </div>

      {!svgMarkup ? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[140px] items-center justify-center rounded bg-[var(--bg-canvas)] p-6 text-sm text-[var(--text-secondary)]"
        >
          {messages.reader.mermaidLoading}
        </div>
      ) : (
        <ScrollArea className="w-full rounded bg-[var(--bg-canvas)]">
          <div
            className="flex justify-center p-4 [&_svg]:h-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </ScrollArea>
      )}

      {isSourceVisible && (
        <ScrollArea className="mt-3 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] print:hidden">
          <pre className="p-3 font-mono text-xs text-[var(--text-primary)]">
            <code>{chartDefinition}</code>
          </pre>
        </ScrollArea>
      )}
    </figure>
  );
}

