// /src/app/ClientBody.tsx
"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

/**
 * Routes that should NOT show the dashboard shell.
 * Tweak this list to match your project.
 */
const NO_SHELL_MATCHERS = [
  /^\/$/,                    // landing/login page
  /^\/auth(\/.*)?$/,         // /auth, /auth/*
  /^\/login$/,               // explicit login
  /^\/signup$/,              // explicit signup
  /^\/reset-password$/,      // password reset
];

export default function ClientBody({ children }: PropsWithChildren) {
  const pathname = usePathname();

  // Only show the dashboard shell for "app" sections
  const showShell = useMemo(() => {
    if (!pathname) return true;
    return !NO_SHELL_MATCHERS.some((rx) => rx.test(pathname));
  }, [pathname]);

  // NOTE:
  // - Do not mutate document.body.className here; it causes a flash on hydration.
  // - Keep "antialiased" on <body> in your RootLayout (you already do).

  const content = <main className="min-h-screen antialiased">{children}</main>;

  return showShell ? (
    <DashboardLayout>{content}</DashboardLayout>
  ) : (
    content
  );
}
