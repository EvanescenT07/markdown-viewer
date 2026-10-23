"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { messages } from "@/i18n/messages";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputId = useId();
  const passwordInputId = useId();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        readonly message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ?? "Sign in failed. Verify your email and password."
        );
        return;
      }

      const redirectTarget = searchParams.get("redirectTo");
      const safeDestination =
        redirectTarget && redirectTarget.startsWith("/")
          ? redirectTarget
          : "/dashboard";

      router.push(safeDestination);
      router.refresh();
    } catch {
      setErrorMessage(
        "Network error while signing in. Verify your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded border border-[var(--status-danger)] bg-[var(--bg-canvas)] p-3.5 text-sm text-[var(--status-danger)]"
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label
          htmlFor={emailInputId}
          className="block text-sm font-medium text-[var(--text-primary)]"
        >
          {messages.auth.emailLabel}
        </label>
        <input
          id={emailInputId}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={messages.auth.emailPlaceholder}
          className="mt-1.5 block min-h-[44px] w-full rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
      </div>

      <div>
        <label
          htmlFor={passwordInputId}
          className="block text-sm font-medium text-[var(--text-primary)]"
        >
          {messages.auth.passwordLabel}
        </label>
        <input
          id={passwordInputId}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={messages.auth.passwordPlaceholder}
          className="mt-1.5 block min-h-[44px] w-full rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting
          ? messages.auth.loginSubmitting
          : messages.auth.loginSubmit}
      </button>

      <p className="pt-2 text-center text-sm text-[var(--text-secondary)]">
        {messages.auth.noAccountPrompt}{" "}
        <Link
          href="/register"
          className="font-medium text-[var(--accent-primary)] underline underline-offset-4"
        >
          {messages.auth.noAccountLink}
        </Link>
      </p>
    </form>
  );
}

