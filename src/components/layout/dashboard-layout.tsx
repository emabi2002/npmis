// /src/components/layout/dashboard-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  Home,
  Users,
  FileText,
  Phone,
  Shield,
  BarChart3,
  Database,
  Car,
  Settings,
  LogOut,
  Menu,
  AlertTriangle,
  Clock,
  User as UserIcon,
  BookOpen,
  Lock,
  History,
  Monitor,
  ExternalLink,
  MapPin,
  Briefcase,
  Scale,
} from "lucide-react";
import type { User } from "@/types/user";
import { CYBERCRIME_URL } from "@/lib/urls";
import { ShellContext, useIsInsideShell } from "./shell-context";

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
  { name: "Cybercrime Unit", href: CYBERCRIME_URL, icon: Monitor, external: true },
];

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
  "/fleet": "Fleet Management",
};

export function DashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  // If there's already a shell above, act as a no-op (prevents double shells / flicker)
  const nested = useIsInsideShell();
  if (nested) return <>{children}</>;

  const router = useRouter();
  const pathname = usePathname();

  // Fast init from localStorage to avoid spinner flash
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [router, user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const basePath = "/" + (pathname?.split("/")[1] || "dashboard");
  const currentTitle = pageNames[basePath] ?? "Royal Papua New Guinea Constabulary";

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
          const isActive = !item.external && (pathname === item.href || pathname?.startsWith(`${item.href}/`));

          const linkClassName = `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive
              ? "bg-white/90 text-blue-800 border border-blue-200"
              : item.external
              ? "text-red-900/90 hover:bg-red-50 border border-red-200 bg-red-50"
              : "text-white/90 hover:bg-white/10"
          }`;

          // External links open in a new tab
          if (item.external) {
            const anchor = (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            );
            // Close the mobile drawer after tapping
            return mobile ? (
              <SheetClose asChild key={item.name}>{anchor}</SheetClose>
            ) : (
              <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                <item.icon className="w-4 h-4" />
                {item.name}
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            );
          }

          // Internal links
          const linkEl = (
            <Link
              href={item.href}
              prefetch={item.href === "/dashboard" ? false : undefined}
              className={linkClassName}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );

          return mobile ? (
            <SheetClose asChild key={item.name}>{linkEl}</SheetClose>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              prefetch={item.href === "/dashboard" ? false : undefined}
              className={linkClassName}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t bg-white/70 backdrop-blur">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-600">Badge #{user?.badgeNumber}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs mb-3 w-full justify-center">
          {user?.role}
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
  );

  return (
    <ShellContext.Provider value={true}>
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/10">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:pl-64">
          {/* Mobile Topbar with its own Sheet */}
          <div className="lg:hidden bg-gradient-to-r from-blue-900 via-blue-700 to-red-600 border-b border-white/10 px-4 py-3 flex items-center justify-between text-white">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar mobile />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/15 px-2 py-1 rounded-full">{user?.role}</span>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
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
                    Badge #{user?.badgeNumber}
                  </span>
                  <span className="text-xs bg-green-600 px-3 py-1 rounded-full">On Duty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
