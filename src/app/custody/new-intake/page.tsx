// /src/app/custody/new-intake/page.tsx
import { Suspense } from "react";
import NewIntakeClient from "./NewIntakeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading intake…</div>}>
      <NewIntakeClient />
    </Suspense>
  );
}
