// src/app/incidents/missing-person/broadcast/page.tsx
import { Suspense } from "react";
import BroadcastClient from "./BroadcastClient"; // same folder

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading broadcast…</div>}>
      <BroadcastClient />
    </Suspense>
  );
}
