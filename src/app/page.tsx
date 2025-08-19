import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4
                    bg-gradient-to-b from-red-700 via-blue-800 to-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-white space-y-4">
          {/* Crest logo */}
          <div className="relative mx-auto w-28 h-28 mb-6">
            <Image
              src="/police-badge.png"
              alt="Royal PNG Constabulary Badge"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-3xl font-bold">
            Royal Papua New Guinea Constabulary
          </h1>
          <p className="text-blue-100">Police Management System</p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="text-center text-blue-100 text-sm">
          <p>For technical support, contact IT Department</p>
          <p className="mt-1">Emergency: 000 | Police: 111</p>
        </div>
      </div>
    </div>
  )
}
