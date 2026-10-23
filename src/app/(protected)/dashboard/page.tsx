import React from "react";
import { requireAuthenticatedSession } from "@/lib/auth/session";
import { listUserDocumentHistory } from "@/services/document.service";
import { MarkdownDropzone } from "@/components/upload/markdown-dropzone";
import {
  DocumentHistoryList,
  SerializedDocumentHistoryItem,
} from "@/components/history/document-history-list";
import { messages } from "@/i18n/messages";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await requireAuthenticatedSession();
  const historyResult = await listUserDocumentHistory(session.sub);

  const serializedDocuments: readonly SerializedDocumentHistoryItem[] =
    historyResult.isSuccess
      ? historyResult.value.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          createdAt: doc.createdAt.toISOString(),
        }))
      : [];

  const initialError = historyResult.isSuccess
    ? null
    : historyResult.failure.message;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 border-b border-[var(--border-subtle)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {messages.dashboard.title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--text-secondary)] sm:text-base">
          {messages.dashboard.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <MarkdownDropzone />
        </div>
        <div className="lg:col-span-7">
          <DocumentHistoryList
            initialDocuments={serializedDocuments}
            initialError={initialError}
          />
        </div>
      </div>
    </div>
  );
}

