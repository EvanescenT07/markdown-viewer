import { SignJWT, jwtVerify, errors as JoseErrors } from "jose";
import { logger } from "@/lib/logger";
import { Result, ok, fail } from "@/lib/result";

export interface SessionTokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly name: string;
}

const JWT_ALGORITHM = "HS256";
const TOKEN_TTL = "7d";
export const AUTH_COOKIE_NAME = "documark_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSigningKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new TypeError(
      "JWT_SECRET environment variable must be configured with at least 32 characters."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionTokenPayload
): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSigningKey());
}

export async function verifySessionToken(
  token: string
): Promise<Result<SessionTokenPayload>> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: [JWT_ALGORITHM],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Malformed session token claims.",
        status: 401,
      });
    }

    return ok({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    });
  } catch (error) {
    if (error instanceof JoseErrors.JWTExpired) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Your session has expired. Please sign in again.",
        status: 401,
      });
    }
    if (error instanceof JoseErrors.JOSEError) {
      logger.error("JWT signature or format verification failed", {
        operation: "verifySessionToken",
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "UNAUTHORIZED",
        message: "Invalid authentication token.",
        status: 401,
      });
    }
    throw error;
  }
}

