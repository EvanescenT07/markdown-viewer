export type FailureCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "DATABASE_ERROR";

export interface AppFailure {
  readonly code: FailureCode;
  readonly message: string;
  readonly status: number;
}

export type Result<T, E = AppFailure> =
  | { readonly isSuccess: true; readonly value: T }
  | { readonly isSuccess: false; readonly failure: E };

export function ok<T>(value: T): Result<T, never> {
  return { isSuccess: true, value };
}

export function fail<E = AppFailure>(failure: E): Result<never, E> {
  return { isSuccess: false, failure };
}

