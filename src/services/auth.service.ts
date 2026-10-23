import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { Result, ok, fail } from "@/lib/result";
import { SessionTokenPayload, signSessionToken } from "@/lib/auth/jwt";
import { LoginInput, RegisterInput } from "@/lib/validations/auth.schema";

const BCRYPT_SALT_ROUNDS = 12;

export interface AuthenticatedSessionResult {
  readonly user: SessionTokenPayload;
  readonly token: string;
}

export async function registerUserAccount(
  input: RegisterInput
): Promise<Result<AuthenticatedSessionResult>> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      return fail({
        code: "CONFLICT",
        message: "An account with this email address already exists.",
        status: 409,
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    const createdUser = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const sessionPayload: SessionTokenPayload = {
      sub: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    };

    const token = await signSessionToken(sessionPayload);

    logger.info("Registered new user account", {
      operation: "registerUserAccount",
      userId: createdUser.id,
    });

    return ok({ user: sessionPayload, token });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return fail({
          code: "CONFLICT",
          message: "An account with this email address already exists.",
          status: 409,
        });
      }
      logger.error("Database failure during user registration", {
        operation: "registerUserAccount",
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message: "Database error while creating your account.",
        status: 500,
      });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("PostgreSQL connection initialization failed", {
        operation: "registerUserAccount",
        errorCode: error.errorCode,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message:
          "Cannot reach PostgreSQL database. Check MDVIEWER_PRISMA_DATABASE_URL configuration.",
        status: 503,
      });
    }
    throw error;
  }
}

export async function authenticateUserCredentials(
  input: LoginInput
): Promise<Result<AuthenticatedSessionResult>> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Invalid email address or password.",
        status: 401,
      });
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Invalid email address or password.",
        status: 401,
      });
    }

    const sessionPayload: SessionTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const token = await signSessionToken(sessionPayload);

    logger.info("Authenticated user session", {
      operation: "authenticateUserCredentials",
      userId: user.id,
    });

    return ok({ user: sessionPayload, token });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error("Database failure during user login", {
        operation: "authenticateUserCredentials",
        errorCode: error.code,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message: "Database error while verifying credentials.",
        status: 500,
      });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error("PostgreSQL connection initialization failed", {
        operation: "authenticateUserCredentials",
        errorCode: error.errorCode,
        stack: error.stack,
      });
      return fail({
        code: "DATABASE_ERROR",
        message:
          "Cannot reach PostgreSQL database. Check MDVIEWER_PRISMA_DATABASE_URL configuration.",
        status: 503,
      });
    }
    throw error;
  }
}

