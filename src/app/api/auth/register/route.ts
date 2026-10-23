import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { registerInputSchema } from "@/lib/validations/auth.schema";
import { registerUserAccount } from "@/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const parsedInput = registerInputSchema.parse(rawBody);

    const result = await registerUserAccount(parsedInput);
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
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Invalid registration input.",
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
    logger.error("Unhandled registration route exception", {
      operation: "POST /api/auth/register",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

