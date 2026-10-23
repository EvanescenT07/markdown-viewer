import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SessionTokenPayload,
  verifySessionToken,
} from "@/lib/auth/jwt";

export const getOptionalSession = cache(
  async (): Promise<SessionTokenPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const verification = await verifySessionToken(token);
    if (!verification.isSuccess) {
      return null;
    }

    return verification.value;
  }
);

export const requireAuthenticatedSession = cache(
  async (): Promise<SessionTokenPayload> => {
    const session = await getOptionalSession();
    if (!session) {
      redirect("/login");
    }
    return session;
  }
);

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

