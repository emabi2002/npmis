// /src/app/dispatch/page.tsx
import { Suspense } from "react";
import DispatchClient from "./DispatchClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading dispatch…</div>}>
      <DispatchClient />
    </Suspense>
  );
}
