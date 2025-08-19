"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  FileText,
  Phone,
  Shield,
  BarChart3,
  Database,
  Car,
  MapPin,
  Settings,
  LogOut,
  Menu,
  AlertTriangle,
  Clock,
  User as UserIcon,
  Briefcase,
  BookOpen,
  Lock,
  Scale,
  History,
  Monitor,
  ExternalLink
} from "lucide-react"
import type { User } from "@/types/user"
import { CYBERCRIME_URL } from "@/lib/urls"   // centralized URL

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Digital Occurance Book", href: "/logbook", icon: BookOpen },
  { name: "Custody(Cell) Management", href: "/custody", icon: Lock },
  { name: "Incidents Mangement", href: "/incidents", icon: AlertTriangle },
  { name: "Cases Management", href: "/cases", icon: FileText },
  { name: "Criminals Management", href: "/criminals", icon: Shield },
  { name: "Personnel Management", href: "/personnel", icon: Users },
  { name: "Dispatch Management", href: "/dispatch", icon: Phone },
  { name: "Evidence Management", href: "/evidence", icon: Database },
  { name: "Fleet Management", href: "/fleet", icon: Car },
  { name: "Audit Trail", href: "/audit-trail", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },

  // External app – uses centralized constant
  { name: "Cybercrime Unit", href: CYBERCRIME_URL, icon: Monitor, external: true },
]

// Route → Title mapping for the top bar
const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/logbook": "Digital Occurrence Book",
  "/custody": "Custody (Cell) Management",
  "/incidents": "Incident Management",
  "/cases": "Cases Management",
  "/criminals": "Criminals Management",
  "/personnel": "Personnel Management",
  "/dispatch": "Dispatch Management",
  "/evidence": "Evidence Management",
  "/audit-trail": "Audit Trail",
  "/analytics": "Analytics",

  // NEW: page title for Fleet module
  "/fleet": "Fleet Management",
}

export function DashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // compute the base path (e.g., "/incidents") and current title
  const basePath = "/" + (pathname?.split("/")[1] || "dashboard")
  const currentTitle = pageNames[basePath] ?? "Royal Papua New Guinea Constabulary"

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`flex flex-col h-full ${mobile ? "p-4" : ""} bg-gradient-to-b from-blue-900 via-blue-700 to-blue-300`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-white/20">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
          <Image
            src="/police-badge.png"
            alt="Royal PNG Constabulary Crest"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white drop-shadow">Royal PNG Constabulary</h1>
          <p className="text-sm text-blue-100">Police Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            !item.external && (pathname === item.href || pathname?.startsWith(`${item.href}/`))

          const linkClassName = `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive
              ? "bg-white/90 text-blue-800 border border-blue-200"
              : item.external
              ? "text-red-900/90 hover:bg-red-50 border border-red-200 bg-red-25"
              : "text-white/90 hover:bg-white/10"
          }`

          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
                onClick={() => mobile && setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={linkClassName}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t bg-white/70 backdrop-blur">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user.name?.split(" ").map(n => n[0]).join("") || "U"}
            </AvatarFallback>
          </Avatar>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-600">Badge #{user.badgeNumber}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs mb-3 w-full justify-center">
          {user.role}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar — soft vertical divider */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/10">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Topbar */}
        <div className="lg:hidden bg-gradient-to-r from-blue-900 via-blue-700 to-red-600 border-b border-white/10 px-4 py-3 flex items-center justify-between text-white">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/15 px-2 py-1 rounded-full">{user.role}</span>
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {user.name?.split(" ").map(n => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Topbar */}
        <div className="hidden lg:block sticky top-0 z-30 border-b border-white/10">
          <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-red-600 text-white">
            <div className="px-6 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold leading-none">{currentTitle}</h2>
                <p className="text-xs text-blue-100">Royal Papua New Guinea Constabulary</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                  Badge #{user.badgeNumber}
                </span>
                <span className="text-xs bg-green-600 px-3 py-1 rounded-full">On Duty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
