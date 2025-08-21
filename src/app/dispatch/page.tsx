// /src/app/dispatch/page.tsx
import { Suspense } from "react";
import DispatchClient from "./DispatchClient";

// Opt out of static generation & wrap client hooks in Suspense
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DispatchClient />
    </Suspense>
  );
}
