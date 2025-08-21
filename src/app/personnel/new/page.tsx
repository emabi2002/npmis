"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewOfficerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    badgeNumber: "",
    name: "",
    rank: "",
    department: "",
    status: "Active Duty",
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: send to API
    alert(`Officer ${form.name} (${form.badgeNumber}) created`)
    // After save, take them to the new profile
    router.push(`/personnel/${encodeURIComponent(form.badgeNumber)}`)
  }

  return (
    <DashboardLayout>
      <Card className="max-w-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Add Officer</CardTitle>
          <Link href="/personnel">
            <Button variant="outline">Cancel</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Badge Number</Label>
                <Input
                  value={form.badgeNumber}
                  onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Rank</Label>
                <Select value={form.rank} onValueChange={(v) => setForm({ ...form, rank: v })}>
                  <SelectTrigger><SelectValue placeholder="Select rank" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Constable">Constable</SelectItem>
                    <SelectItem value="Sergeant">Sergeant</SelectItem>
                    <SelectItem value="Inspector">Inspector</SelectItem>
                    <SelectItem value="Chief Inspector">Chief Inspector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Criminal Investigation Department"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/personnel">
                <Button type="button" variant="outline">Back</Button>
              </Link>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Save Officer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
