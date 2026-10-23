import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { loginInputSchema } from "@/lib/validations/auth.schema";
import { authenticateUserCredentials } from "@/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const parsedInput = loginInputSchema.parse(rawBody);

    const result = await authenticateUserCredentials(parsedInput);
    if (!result.isSuccess) {
      return NextResponse.json(
        {
          code: result.failure.code,
          message: result.failure.message,
        },
        { status: result.failure.status }
      );
    }

    await setSessionCookie(result.value.token);

    return NextResponse.json(
      {
        user: result.value.user,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Invalid login input.",
        },
        { status: 400 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
        },
        { status: 400 }
      );
    }
    logger.error("Unhandled login route exception", {
      operation: "POST /api/auth/login",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

