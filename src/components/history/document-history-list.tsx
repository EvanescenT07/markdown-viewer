"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatByteSize, formatDocumentTimestamp } from "@/lib/formatters";
import { messages } from "@/i18n/messages";

export interface SerializedDocumentHistoryItem {
  readonly id: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly createdAt: string;
}

interface DocumentHistoryListProps {
  readonly initialDocuments: readonly SerializedDocumentHistoryItem[];
  readonly initialError: string | null;
}

export function DocumentHistoryList({
  initialDocuments,
  initialError,
}: DocumentHistoryListProps): React.JSX.Element {
  const router = useRouter();
  const [documents, setDocuments] =
    useState<readonly SerializedDocumentHistoryItem[]>(initialDocuments);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingDeleteDoc, setPendingDeleteDoc] =
    useState<SerializedDocumentHistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setDocuments(initialDocuments);
    setErrorMessage(initialError);
  }, [initialDocuments, initialError]);

  useEffect(() => {
    if (!pendingDeleteDoc) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setPendingDeleteDoc(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDeleteDoc]);

  async function handleRetryFetch(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/documents", { method: "GET" });
      const payload = (await response.json()) as {
        readonly documents?: readonly SerializedDocumentHistoryItem[];
        readonly message?: string;
      };
      if (!response.ok || !payload.documents) {
        setErrorMessage(
          payload.message ?? "Unable to fetch document history from PostgreSQL."
        );
        return;
      }
      setDocuments(payload.documents);
    } catch {
      setErrorMessage("Network error while loading document history.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDeleteDoc) {
      return;
    }
    const targetId = pendingDeleteDoc.id;
    setDeletingId(targetId);

    try {
      const response = await fetch(`/api/documents/${targetId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        readonly message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ?? "Failed to delete document from PostgreSQL."
        );
        return;
      }

      setDocuments((prev) => prev.filter((item) => item.id !== targetId));
      setPendingDeleteDoc(null);
      router.refresh();
    } catch {
      setErrorMessage("Network error while deleting document.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      id="history-panel"
      aria-labelledby="history-panel-heading"
      className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6"
    >
      <div className="border-b border-[var(--border-subtle)] pb-3">
        <h2
          id="history-panel-heading"
          className="text-lg font-semibold text-[var(--text-primary)]"
        >
          {messages.dashboard.historyHeading}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {messages.dashboard.historyDescription}
        </p>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 text-center text-sm text-[var(--text-secondary)]"
        >
          {messages.dashboard.historyLoading}
        </div>
      ) : errorMessage ? (
        <div
          role="alert"
          className="mt-4 rounded border border-[var(--status-danger)] bg-[var(--bg-canvas)] p-5"
        >
          <p className="text-sm font-medium text-[var(--status-danger)]">
            {messages.dashboard.historyErrorPrefix} {errorMessage}
          </p>
          <button
            type="button"
            onClick={handleRetryFetch}
            className="mt-3 inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            {messages.dashboard.historyRetryButton}
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="mt-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {messages.dashboard.historyEmptyTitle}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {messages.dashboard.historyEmptyAction}
          </p>
        </div>
      ) : (
        <ScrollArea className="mt-4 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
                <th className="px-4 py-3">{messages.dashboard.colFileName}</th>
                <th className="px-4 py-3">{messages.dashboard.colFileSize}</th>
                <th className="px-4 py-3">
                  {messages.dashboard.colUploadedAt}
                </th>
                <th className="px-4 py-3 text-right">
                  {messages.dashboard.colActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[var(--bg-surface)]">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-[var(--text-primary)]">
                    <Link
                      href={`/read/${doc.id}`}
                      className="underline decoration-[var(--border-interactive)] underline-offset-4 hover:decoration-[var(--accent-primary)]"
                    >
                      {doc.fileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                    {formatByteSize(doc.fileSize)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                    <time dateTime={doc.createdAt}>
                      {formatDocumentTimestamp(doc.createdAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/read/${doc.id}`}
                        className="inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
                      >
                        {messages.dashboard.openDocumentButton}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteDoc(doc)}
                        disabled={deletingId === doc.id}
                        className="inline-flex min-h-[44px] items-center rounded border border-[var(--status-danger)] bg-transparent px-3 text-xs font-medium text-[var(--status-danger)] transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-50"
                      >
                        {deletingId === doc.id
                          ? messages.dashboard.deletingDocumentButton
                          : messages.dashboard.deleteDocumentButton}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}

      {pendingDeleteDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-md border border-[var(--border-interactive)] bg-[var(--bg-canvas)] p-6">
            <h3
              id="delete-modal-title"
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              {messages.dashboard.confirmDeleteTitle}:{" "}
              <span className="font-mono">{pendingDeleteDoc.fileName}</span>
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {messages.dashboard.confirmDeleteBody}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteDoc(null)}
                className="inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)]"
              >
                {messages.dashboard.confirmDeleteCancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === pendingDeleteDoc.id}
                className="inline-flex min-h-[44px] items-center rounded bg-[var(--status-danger)] px-4 text-sm font-semibold text-white"
              >
                {deletingId === pendingDeleteDoc.id
                  ? messages.dashboard.deletingDocumentButton
                  : messages.dashboard.confirmDeleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

