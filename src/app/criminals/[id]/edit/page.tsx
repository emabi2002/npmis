"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function EditCriminal() {
  const { id } = useParams<{ id: string }>();
  return (
    <DashboardLayout>
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Edit Criminal Profile</h1>
        <p className="text-sm text-muted-foreground">ID: {decodeURIComponent(id)}</p>
        {/* TODO: put your real edit form here */}
      </div>
    </DashboardLayout>
  );
}
