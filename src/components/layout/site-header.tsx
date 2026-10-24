"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DocuMarkLogo } from "@/components/brand/documark-logo";
import { useTheme } from "@/components/theme/theme-provider";
import { messages } from "@/i18n/messages";
import type { SessionTokenPayload } from "@/lib/auth/jwt";

interface SiteHeaderProps {
  readonly session: SessionTokenPayload | null;
}

export function SiteHeader({ session }: SiteHeaderProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href={session ? "/dashboard" : "/"}
            className="inline-flex min-h-[44px] items-center gap-2 rounded px-1 font-semibold tracking-tight text-[var(--text-primary)]"
          >
            <DocuMarkLogo className="h-6 w-6 shrink-0" />
            <span className="text-lg">{messages.brand.name}</span>
            <span className="rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-xs font-medium text-[var(--text-secondary)]">
              {messages.brand.extensionTag}
            </span>
          </Link>

          {session && (
            <nav
              aria-label="Primary Workspace Navigation"
              className="hidden items-center gap-2 md:flex"
            >
              <Link
                href="/dashboard"
                className={`inline-flex min-h-[44px] items-center rounded px-3 text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] underline decoration-[var(--accent-primary)] decoration-2 underline-offset-8"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {messages.nav.workspace}
              </Link>
              <Link
                href="/dashboard#upload-panel"
                className="inline-flex min-h-[44px] items-center rounded px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                {messages.nav.uploadSection}
              </Link>
              <Link
                href="/dashboard#history-panel"
                className="inline-flex min-h-[44px] items-center rounded px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                {messages.nav.historySection}
              </Link>
            </nav>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={(event) => toggleTheme(event)}
            aria-label={
              theme === "light"
                ? messages.nav.themeToDark
                : messages.nav.themeToLight
            }
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            {theme === "light" ? (
              <svg
                data-theme-icon="true"
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                data-theme-icon="true"
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            <span>
              {theme === "light"
                ? messages.nav.themeLabelDark
                : messages.nav.themeLabelLight}
            </span>
          </button>

          {session ? (
            <div className="flex items-center gap-3">
              <span
                className="max-w-[180px] truncate font-mono text-xs text-[var(--text-secondary)]"
                title={session.email}
              >
                {session.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] bg-transparent px-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-60"
              >
                {isSigningOut ? messages.nav.signingOut : messages.nav.signOut}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center rounded border border-[var(--border-interactive)] px-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]"
              >
                {messages.nav.signIn}
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[44px] items-center rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90"
              >
                {messages.nav.createAccount}
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={(event) => toggleTheme(event)}
            aria-label={
              theme === "light"
                ? messages.nav.themeToDark
                : messages.nav.themeToLight
            }
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)]"
          >
            {theme === "light" ? (
              <svg
                data-theme-icon="true"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                data-theme-icon="true"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            <span>
              {theme === "light"
                ? messages.nav.themeLabelDark
                : messages.nav.themeLabelLight}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded border border-[var(--border-interactive)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)]"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            <span>
              {isMobileMenuOpen
                ? messages.nav.closeMenu
                : messages.nav.openMenu}
            </span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          id="mobile-navigation-drawer"
          aria-label="Mobile Navigation"
          className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 md:hidden"
        >
          {session ? (
            <div className="flex flex-col gap-2">
              <div className="border-b border-[var(--border-subtle)] pb-2 font-mono text-xs text-[var(--text-secondary)]">
                {session.name} ({session.email})
              </div>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded px-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
              >
                {messages.nav.workspace}
              </Link>
              <Link
                href="/dashboard#upload-panel"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded px-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
              >
                {messages.nav.uploadSection}
              </Link>
              <Link
                href="/dashboard#history-panel"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded px-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
              >
                {messages.nav.historySection}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-1 inline-flex min-h-[44px] w-full items-center justify-center rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-3 text-sm font-medium text-[var(--text-primary)]"
              >
                {isSigningOut ? messages.nav.signingOut : messages.nav.signOut}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded border border-[var(--border-interactive)] bg-[var(--bg-canvas)] px-3 text-sm font-medium text-[var(--text-primary)]"
              >
                {messages.nav.signIn}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded bg-[var(--accent-primary)] px-3 text-sm font-semibold text-[var(--accent-contrast)]"
              >
                {messages.nav.createAccount}
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

