import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { validateUploadedMarkdownFile } from "@/lib/validations/document.schema";
import {
  createMarkdownDocument,
  listUserDocumentHistory,
} from "@/services/document.service";

export async function GET(): Promise<NextResponse> {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Sign in to view your document history.",
      },
      { status: 401 }
    );
  }

  const historyResult = await listUserDocumentHistory(session.sub);
  if (!historyResult.isSuccess) {
    return NextResponse.json(
      {
        code: historyResult.failure.code,
        message: historyResult.failure.message,
      },
      { status: historyResult.failure.status }
    );
  }

  return NextResponse.json(
    {
      documents: historyResult.value,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Sign in to upload Markdown files.",
      },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Request must be multipart/form-data containing a file.",
        },
        { status: 400 }
      );
    }
    throw error;
  }

  const fileEntry = formData.get("file");
  const validationResult = await validateUploadedMarkdownFile(fileEntry);
  if (!validationResult.isSuccess) {
    return NextResponse.json(
      {
        code: validationResult.failure.code,
        message: validationResult.failure.message,
      },
      { status: validationResult.failure.status }
    );
  }

  const createResult = await createMarkdownDocument(
    session.sub,
    validationResult.value
  );
  if (!createResult.isSuccess) {
    return NextResponse.json(
      {
        code: createResult.failure.code,
        message: createResult.failure.message,
      },
      { status: createResult.failure.status }
    );
  }

  return NextResponse.json(
    {
      document: createResult.value,
    },
    { status: 201 }
  );
}

