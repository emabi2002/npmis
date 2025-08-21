// /src/app/personnel/[id]/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = { params: { id: string } };

export default function OfficerDetailPage({ params }: Props) {
  const id = decodeURIComponent(params.id);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Officer Profile</h1>
      <p className="text-sm text-muted-foreground">ID: {id}</p>
      <Button asChild variant="outline">
        <Link href="/personnel">← Back to Personnel</Link>
      </Button>
      {/* TODO: render real officer details */}
    </div>
  );
}
