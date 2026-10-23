import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { documentIdSchema } from "@/lib/validations/document.schema";
import {
  deleteUserDocumentById,
  getUserDocumentById,
} from "@/services/document.service";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Sign in to access this document.",
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const parsedId = documentIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Document ID must be a valid UUID.",
      },
      { status: 400 }
    );
  }

  const documentResult = await getUserDocumentById(session.sub, parsedId.data);
  if (!documentResult.isSuccess) {
    return NextResponse.json(
      {
        code: documentResult.failure.code,
        message: documentResult.failure.message,
      },
      { status: documentResult.failure.status }
    );
  }

  return NextResponse.json(
    {
      document: documentResult.value,
    },
    { status: 200 }
  );
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Sign in to delete documents.",
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const parsedId = documentIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Document ID must be a valid UUID.",
      },
      { status: 400 }
    );
  }

  const deleteResult = await deleteUserDocumentById(session.sub, parsedId.data);
  if (!deleteResult.isSuccess) {
    return NextResponse.json(
      {
        code: deleteResult.failure.code,
        message: deleteResult.failure.message,
      },
      { status: deleteResult.failure.status }
    );
  }

  return NextResponse.json(
    {
      deletedId: deleteResult.value.deletedId,
    },
    { status: 200 }
  );
}

