import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { messages } from "@/i18n/messages";

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {messages.auth.loginTitle}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          {messages.auth.loginSubtitle}
        </p>

        <div className="mt-6">
          <Suspense
            fallback={
              <div className="py-4 text-sm text-[var(--text-secondary)]">
                Loading sign-in form...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

