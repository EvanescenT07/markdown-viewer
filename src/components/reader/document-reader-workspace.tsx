"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { MarkdownViewer } from "@/components/reader/markdown-viewer";
import { useTheme } from "@/components/theme/theme-provider";
import { formatByteSize, formatDocumentTimestamp } from "@/lib/formatters";
import { messages } from "@/i18n/messages";

interface DocumentReaderWorkspaceProps {
  readonly documentId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly createdAtIso: string;
  readonly rawContent: string;
}

export function DocumentReaderWorkspace({
  fileName,
  fileSize,
  createdAtIso,
  rawContent,
}: DocumentReaderWorkspaceProps): React.JSX.Element {
  const printableAreaRef = useRef<HTMLDivElement>(null);
  const proseContainerRef = useRef<HTMLDivElement>(null);
  const { enterPrintMode, exitPrintMode } = useTheme();

  const [copiedMode, setCopiedMode] = useState<"raw" | "plain" | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState<boolean>(false);

  const pdfTitle = fileName.replace(/\.(md|markdown)$/i, "");

  const triggerPrint = useReactToPrint({
    contentRef: printableAreaRef,
    documentTitle: pdfTitle,
    onBeforePrint: async () => {
      setIsPreparingPdf(true);
      await enterPrintMode();
    },
    onAfterPrint: () => {
      exitPrintMode();
      setIsPreparingPdf(false);
    },
    onPrintError: () => {
      exitPrintMode();
      setIsPreparingPdf(false);
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 16mm 14mm;
      }
      @media print {
        html, body {
          background-color: #FFFFFF !important;
          color: #141413 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        pre, table, figure, .mermaid-diagram-block {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        h1, h2, h3, h4 {
          break-after: avoid;
          page-break-after: avoid;
        }
      }
    `,
  });

  async function handleCopyRawMarkdown(): Promise<void> {
    await navigator.clipboard.writeText(rawContent);
    setCopiedMode("raw");
    window.setTimeout(() => setCopiedMode(null), 2000);
  }

  async function handleCopyPlainText(): Promise<void> {
    const renderedText =
      proseContainerRef.current?.innerText?.trim() || rawContent;
    await navigator.clipboard.writeText(renderedText);
    setCopiedMode("plain");
    window.setTimeout(() => setCopiedMode(null), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center gap-2 rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{messages.reader.backToWorkspace}</span>
          </Link>
        </div>

        <div
          role="toolbar"
          aria-label="Document Actions"
          className="flex flex-wrap items-center gap-2.5"
        >
          <button
            type="button"
            onClick={handleCopyRawMarkdown}
            className="inline-flex min-h-[44px] items-center gap-2 rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>
              {copiedMode === "raw"
                ? messages.reader.copiedRawConfirmation
                : messages.reader.copyRawMarkdown}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyPlainText}
            className="inline-flex min-h-[44px] items-center gap-2 rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <span>
              {copiedMode === "plain"
                ? messages.reader.copiedPlainConfirmation
                : messages.reader.copyPlainText}
            </span>
          </button>

          <button
            type="button"
            onClick={() => triggerPrint()}
            disabled={isPreparingPdf}
            className="inline-flex min-h-[44px] items-center gap-2 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>
              {isPreparingPdf
                ? messages.reader.preparingPdfButton
                : messages.reader.exportPdfButton}
            </span>
          </button>
        </div>
      </div>

      <article
        ref={printableAreaRef}
        className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-5 sm:p-8 lg:p-10 print:border-0 print:p-0"
      >
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
          <h1 className="font-mono text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl">
            {fileName}
          </h1>
          <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
            <span>{formatByteSize(fileSize)}</span>
            <span aria-hidden="true">/</span>
            <time dateTime={createdAtIso}>
              {formatDocumentTimestamp(createdAtIso)}
            </time>
          </div>
        </header>

        <div ref={proseContainerRef}>
          <MarkdownViewer content={rawContent} />
        </div>
      </article>
    </div>
  );
}

