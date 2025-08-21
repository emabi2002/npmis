// /src/components/layout/shell-context.ts
"use client";

import { createContext, useContext } from "react";

/** True when a DashboardLayout is already mounted above */
export const ShellContext = createContext<boolean>(false);

export function useIsInsideShell() {
  return useContext(ShellContext);
}
