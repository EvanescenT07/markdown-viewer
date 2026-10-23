import React from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { messages } from "@/i18n/messages";

export default function RegisterPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {messages.auth.registerTitle}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          {messages.auth.registerSubtitle}
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

