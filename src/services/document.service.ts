import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { Result, ok, fail } from "@/lib/result";
import { ValidatedMarkdownUpload } from "@/lib/validations/document.schema";

export interface DocumentHistoryItem {
  readonly id: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly createdAt: Date;
}

export interface DocumentFullRecord extends DocumentHistoryItem {
  readonly rawContent: string;
  readonly updatedAt: Date;
}

export async function createMarkdownDocument(
  userId: string,
  upload: ValidatedMarkdownUpload
): Promise<Result<DocumentHistoryItem>> {
  try {
    const created = await prisma.document.create({
      data: {
        userId,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        rawContent: upload.rawContent,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
    });

    logger.info("Stored Markdown document in PostgreSQL", {
      operation: "createMarkdownDocument",
      userId,
      documentId: created.id,
    });

    return ok(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error("Failed to insert Markdown document", {
        operation: "createMarkdownDocument",
        userId,
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message: "Failed to save Markdown document to PostgreSQL.",
        status: 500,
      });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("PostgreSQL connection failed during document upload", {
        operation: "createMarkdownDocument",
        userId,
        errorCode: error.errorCode,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message:
          "Cannot connect to PostgreSQL database. Verify POSTGRES_PRISMA_URL.",
        status: 503,
      });
    }
    throw error;
  }
}

export async function listUserDocumentHistory(
  userId: string
): Promise<Result<readonly DocumentHistoryItem[]>> {
  try {
    // Excludes rawContent so PostgreSQL avoids de-TOASTing large text bodies on list queries.
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(documents);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error("Failed to fetch document history", {
        operation: "listUserDocumentHistory",
        userId,
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message: "Unable to load your document history.",
        status: 500,
      });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("PostgreSQL connection failed while listing history", {
        operation: "listUserDocumentHistory",
        userId,
        errorCode: error.errorCode,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message:
          "Cannot connect to PostgreSQL database. Verify POSTGRES_PRISMA_URL.",
        status: 503,
      });
    }
    throw error;
  }
}

export async function getUserDocumentById(
  userId: string,
  documentId: string
): Promise<Result<DocumentFullRecord>> {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        rawContent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!document) {
      return fail({
        code: "NOT_FOUND",
        message: "Document not found or you do not have permission to read it.",
        status: 404,
      });
    }

    return ok(document);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error("Failed to load document by ID", {
        operation: "getUserDocumentById",
        userId,
        documentId,
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message: "Database error while loading document.",
        status: 500,
      });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("PostgreSQL connection failed while loading document", {
        operation: "getUserDocumentById",
        userId,
        documentId,
        errorCode: error.errorCode,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message:
          "Cannot connect to PostgreSQL database. Verify POSTGRES_PRISMA_URL.",
        status: 503,
      });
    }
    throw error;
  }
}

export async function deleteUserDocumentById(
  userId: string,
  documentId: string
): Promise<Result<{ readonly deletedId: string }>> {
  try {
    const deleteResult = await prisma.document.deleteMany({
      where: {
        id: documentId,
        userId,
      },
    });

    if (deleteResult.count === 0) {
      return fail({
        code: "NOT_FOUND",
        message: "Document not found or already deleted.",
        status: 404,
      });
    }

    logger.info("Deleted user Markdown document", {
      operation: "deleteUserDocumentById",
      userId,
      documentId,
    });

    return ok({ deletedId: documentId });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error("Failed to delete document", {
        operation: "deleteUserDocumentById",
        userId,
        documentId,
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message: "Database error while deleting document.",
        status: 500,
      });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("PostgreSQL connection failed while deleting document", {
        operation: "deleteUserDocumentById",
        userId,
        documentId,
        errorCode: error.errorCode,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message:
          "Cannot connect to PostgreSQL database. Verify POSTGRES_PRISMA_URL.",
        status: 503,
      });
    }
    throw error;
  }
}

