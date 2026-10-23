import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedSession } from "@/lib/auth/session";
import { documentIdSchema } from "@/lib/validations/document.schema";
import { getUserDocumentById } from "@/services/document.service";
import { DocumentReaderWorkspace } from "@/components/reader/document-reader-workspace";
import { messages } from "@/i18n/messages";

interface ReadDocumentPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function ReadDocumentPage({
  params,
}: ReadDocumentPageProps): Promise<React.JSX.Element> {
  const session = await requireAuthenticatedSession();
  const { id } = await params;

  const parsedId = documentIdSchema.safeParse(id);
  if (!parsedId.success) {
    notFound();
  }

  const documentResult = await getUserDocumentById(session.sub, parsedId.data);
  if (!documentResult.isSuccess) {
    if (documentResult.failure.code === "NOT_FOUND") {
      notFound();
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div
          role="alert"
          className="rounded-md border border-[var(--status-danger)] bg-[var(--bg-surface)] p-6"
        >
          <h1 className="text-lg font-semibold text-[var(--status-danger)]">
            Unable to Load Markdown Document
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {documentResult.failure.message}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-4 text-sm font-medium text-[var(--text-primary)]"
          >
            {messages.reader.backToWorkspace}
          </Link>
        </div>
      </div>
    );
  }

  const doc = documentResult.value;

  return (
    <DocumentReaderWorkspace
      documentId={doc.id}
      fileName={doc.fileName}
      fileSize={doc.fileSize}
      createdAtIso={doc.createdAt.toISOString()}
      rawContent={doc.rawContent}
    />
  );
}

