import React from "react";
import Link from "next/link";
import { messages } from "@/i18n/messages";

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start justify-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
        <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
          404 / NOT_FOUND
        </p>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Requested Document or Page Does Not Exist
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The Markdown document may have been deleted from PostgreSQL or the URL
          is invalid.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-[44px] items-center rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-contrast)]"
        >
          {messages.reader.backToWorkspace}
        </Link>
      </div>
    </div>
  );
}

