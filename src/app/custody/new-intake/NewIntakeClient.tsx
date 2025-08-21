// /src/app/custody/new-intake/NewIntakeClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
// import your other UI/layout pieces here…

export default function NewIntakeClient() {
  const params = useSearchParams();
  const suspectId = params.get("suspectId") ?? "";

  // ⬇️ Paste EVERYTHING that was in your old page.tsx return here
  // (DashboardLayout, forms, etc.)
  return (
    <div>/* your previous JSX */</div>
  );
}
