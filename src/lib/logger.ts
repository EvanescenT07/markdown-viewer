export interface LogContext {
  readonly operation: string;
  readonly userId?: string;
  readonly documentId?: string;
  readonly errorCode?: string;
  readonly details?: string;
  readonly stack?: string;
}

// Structured JSON logger compatible with both Node.js Serverless and Vercel Edge Runtime.
export const logger = {
  error(message: string, context: LogContext): void {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },
  info(message: string, context: Omit<LogContext, "stack">): void {
    console.info(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },
};
