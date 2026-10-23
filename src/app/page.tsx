import React from "react";
import Link from "next/link";
import { getOptionalSession } from "@/lib/auth/session";
import { MarkdownViewer } from "@/components/reader/markdown-viewer";
import { messages } from "@/i18n/messages";

const LIVE_SAMPLE_MARKDOWN = `## Architecture & Upload Flow

DocuMark processes raw UTF-8 Markdown files up to **2 MB** and persists them atomically inside PostgreSQL \`TEXT\` columns via Prisma ORM.

\`\`\`mermaid
flowchart LR
    Client["Browser (.md Upload)"] --> Guard["UTF-8 & 2MB Guard"]
    Guard --> Prisma["Prisma ORM (PostgreSQL TOAST)"]
    Prisma --> Reader["Sanitized GFM + Shiki + Mermaid SVG"]
    Reader --> Print["High-Contrast A4 PDF Export"]
\`\`\`

### Query Optimization (Excludes \`raw_content\` in History Lists)

\`\`\`typescript
const history = await prisma.document.findMany({
  where: { userId: session.sub },
  select: {
    id: true,
    fileName: true,
    fileSize: true,
    createdAt: true,
  },
  orderBy: { createdAt: "desc" },
});
\`\`\`

| Feature Requirement | Implementation | Security / Performance Guarantee |
| :--- | :--- | :--- |
| **FR-AUTH-02** | \`jose\` HS256 JWT + \`bcryptjs\` | HttpOnly, SameSite=Lax cookie |
| **FR-READ-01** | \`remark-gfm\` + \`rehype-sanitize\` | Blocks XSS while keeping language tags |
| **FR-PDF-02** | \`react-to-print\` + \`@media print\` | Re-renders Mermaid in light mode before print |
`;

export default async function HomePage(): Promise<React.JSX.Element> {
  const session = await getOptionalSession();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="grid grid-cols-1 items-start gap-8 border-b border-[var(--border-subtle)] pb-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            {messages.landing.heading}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            {messages.landing.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-[44px] items-center rounded bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90"
              >
                {messages.landing.primaryCtaAuthenticated}
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex min-h-[44px] items-center rounded bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90"
                >
                  {messages.landing.primaryCtaGuest}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
                >
                  {messages.landing.secondaryCtaGuest}
                </Link>
              </>
            )}
          </div>

          <dl className="mt-8 space-y-4 border-t border-[var(--border-subtle)] pt-6">
            <div>
              <dt className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                01 / {messages.landing.capabilities.gfmTitle}
              </dt>
              <dd className="mt-1 text-sm text-[var(--text-secondary)]">
                {messages.landing.capabilities.gfmBody}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                02 / {messages.landing.capabilities.mermaidTitle}
              </dt>
              <dd className="mt-1 text-sm text-[var(--text-secondary)]">
                {messages.landing.capabilities.mermaidBody}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                03 / {messages.landing.capabilities.storageTitle}
              </dt>
              <dd className="mt-1 text-sm text-[var(--text-secondary)]">
                {messages.landing.capabilities.storageBody}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                04 / {messages.landing.capabilities.pdfTitle}
              </dt>
              <dd className="mt-1 text-sm text-[var(--text-secondary)]">
                {messages.landing.capabilities.pdfBody}
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <span className="font-mono text-xs font-medium text-[var(--text-secondary)]">
                {messages.landing.samplePreviewLabel}
              </span>
              <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                UTF-8 / GFM + Mermaid
              </span>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 sm:p-6">
              <MarkdownViewer content={LIVE_SAMPLE_MARKDOWN} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

