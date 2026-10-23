import { z } from "zod";
import { Result, ok, fail } from "@/lib/result";

export const MAX_MARKDOWN_FILE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_MARKDOWN_EXTENSIONS = [".md", ".markdown"] as const;

export interface ValidatedMarkdownUpload {
  readonly fileName: string;
  readonly fileSize: number;
  readonly rawContent: string;
}

export const documentIdSchema = z
  .string()
  .uuid("Document identifier must be a valid UUID.");

export function hasAllowedMarkdownExtension(fileName: string): boolean {
  const normalized = fileName.trim().toLowerCase();
  return ALLOWED_MARKDOWN_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

export async function validateUploadedMarkdownFile(
  entry: FormDataEntryValue | null
): Promise<Result<ValidatedMarkdownUpload>> {
  if (!(entry instanceof File)) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Select a .md or .markdown file to upload.",
      status: 400,
    });
  }

  const sanitizedName = entry.name.trim();
  if (!sanitizedName || sanitizedName.length > 255) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "File name must be between 1 and 255 characters.",
      status: 400,
    });
  }

  if (!hasAllowedMarkdownExtension(sanitizedName)) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Only .md and .markdown files are permitted.",
      status: 400,
    });
  }

  if (entry.size === 0) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "The selected Markdown file is empty (0 bytes).",
      status: 400,
    });
  }

  if (entry.size > MAX_MARKDOWN_FILE_BYTES) {
    return fail({
      code: "PAYLOAD_TOO_LARGE",
      message: "File exceeds the 2 MB maximum size limit.",
      status: 413,
    });
  }

  const buffer = await entry.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Reject binary files disguised with a .md extension; PostgreSQL TEXT columns forbid null bytes.
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message:
          "File contains binary null bytes and is not valid UTF-8 Markdown text.",
        status: 400,
      });
    }
  }

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const rawContent = decoder.decode(bytes);

    if (rawContent.trim().length === 0) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "The Markdown file contains only whitespace.",
        status: 400,
      });
    }

    return ok({
      fileName: sanitizedName,
      fileSize: entry.size,
      rawContent,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "File is not encoded as valid UTF-8 text.",
        status: 400,
      });
    }
    throw error;
  }
}

