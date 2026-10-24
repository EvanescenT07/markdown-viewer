"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { CodeBlock } from "@/components/reader/code-block";
import { MermaidDiagram } from "@/components/reader/mermaid-diagram";
import { ScrollArea } from "@/components/ui/scroll-area";

// Extend GitHub sanitization schema to preserve language-* classes on code blocks and GFM task list checkboxes.
const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-./],
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ["type", "checkbox"],
      ["disabled", true],
      ["checked", true],
    ],
  },
};

interface MarkdownViewerProps {
  readonly content: string;
}

const markdownComponents: Components = {
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children, ...props }) {
    const rawText = String(children ?? "");
    const languageMatch = /language-([\w-]+)/.exec(className ?? "");
    const language = languageMatch?.[1]?.toLowerCase() ?? "";
    const isFencedBlock = Boolean(languageMatch) || rawText.includes("\n");

    if (!isFencedBlock) {
      return (
        <code
          className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[0.875em] text-[var(--text-primary)]"
          {...props}
        >
          {children}
        </code>
      );
    }

    if (language === "mermaid") {
      return <MermaidDiagram chartDefinition={rawText} />;
    }

    return <CodeBlock code={rawText} language={language} />;
  },
  table({ children }) {
    return (
      <ScrollArea className="my-5 w-full break-inside-avoid rounded-md border border-[var(--border-subtle)]">
        <table className="w-full border-collapse text-left text-sm">
          {children}
        </table>
      </ScrollArea>
    );
  },
  thead({ children }) {
    return (
      <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] font-semibold text-[var(--text-primary)]">
        {children}
      </thead>
    );
  },
  th({ children }) {
    return (
      <th className="border-r border-[var(--border-subtle)] px-3.5 py-2.5 last:border-r-0">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-t border-r border-[var(--border-subtle)] px-3.5 py-2.5 text-[var(--text-primary)] last:border-r-0">
        {children}
      </td>
    );
  },
  a({ href, children }) {
    const isExternal = Boolean(href && /^https?:\/\//i.test(href));
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium text-[var(--accent-primary)] underline underline-offset-4 hover:opacity-85"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-4 border-l-2 border-[var(--border-interactive)] bg-[var(--bg-surface)] py-2 pr-4 pl-4 italic text-[var(--text-secondary)]">
        {children}
      </blockquote>
    );
  },
};

export function MarkdownViewer({
  content,
}: MarkdownViewerProps): React.JSX.Element {
  return (
    <div className="documark-prose max-w-none text-[var(--text-primary)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

