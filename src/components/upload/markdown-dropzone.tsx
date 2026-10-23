"use client";

import React, { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  hasAllowedMarkdownExtension,
  MAX_MARKDOWN_FILE_BYTES,
} from "@/lib/validations/document.schema";
import { messages } from "@/i18n/messages";

export function MarkdownDropzone(): React.JSX.Element {
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validateClientSideFile(file: File): string | null {
    if (!hasAllowedMarkdownExtension(file.name)) {
      return "Only .md and .markdown files are permitted.";
    }
    if (file.size === 0) {
      return "The selected Markdown file is empty (0 bytes).";
    }
    if (file.size > MAX_MARKDOWN_FILE_BYTES) {
      return "File exceeds the 2 MB maximum size limit.";
    }
    return null;
  }

  async function processFileUpload(file: File): Promise<void> {
    const clientError = validateClientSideFile(file);
    if (clientError) {
      setErrorMessage(clientError);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        readonly document?: { readonly id: string };
        readonly message?: string;
      };

      if (!response.ok || !payload.document?.id) {
        setErrorMessage(
          payload.message ?? "Upload failed. Check your file and try again."
        );
        return;
      }

      router.push(`/read/${payload.document.id}`);
      router.refresh();
    } catch {
      setErrorMessage(
        "Network error while uploading file. Verify your connection and try again."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      void processFileUpload(selectedFile);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      void processFileUpload(droppedFile);
    }
  }

  return (
    <section
      id="upload-panel"
      aria-labelledby="upload-panel-heading"
      className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6"
    >
      <h2
        id="upload-panel-heading"
        className="text-lg font-semibold text-[var(--text-primary)]"
      >
        {messages.dashboard.uploadHeading}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {messages.dashboard.uploadConstraints}
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-4 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
          isDragging
            ? "border-[var(--accent-primary)] bg-[var(--bg-canvas)]"
            : "border-[var(--border-interactive)] bg-[var(--bg-canvas)]"
        }`}
      >
        <svg
          aria-hidden="true"
          className="h-8 w-8 text-[var(--text-secondary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
        </svg>

        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
          {messages.dashboard.uploadInstructions}
        </p>

        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={handleFileChange}
          disabled={isUploading}
          className="sr-only"
        />

        <label
          htmlFor={fileInputId}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90"
        >
          {isUploading
            ? messages.dashboard.uploadingState
            : messages.dashboard.selectFileButton}
        </label>
      </div>

      {isUploading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
        >
          {messages.dashboard.uploadingState}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded border border-[var(--status-danger)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--status-danger)]"
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}
    </section>
  );
}

