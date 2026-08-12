"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, GitBranch, Settings, LogOut } from "lucide-react";
import { config } from "@/lib/config";
import { AuthSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setAuthorized(true);
  }, [router]);

  const navItems = [
    { name: "Projects", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Releases", href: "/dashboard/releases", icon: <GitBranch size={18} /> },
    { name: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ];

  if (!authorized) {
    return <AuthSkeleton />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-background border-r border-border fixed h-full flex-col hidden md:flex z-40">
        <div className="p-6 pb-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-cream/10 flex items-center justify-center">
              <span className="text-cream text-xs font-bold font-display">a</span>
            </div>
            <span className="text-foreground text-sm font-medium tracking-tight">akara</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "bg-surface text-foreground font-medium"
                    : "text-foreground-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => {
              window.location.href = `${config.apiUrl}/auth/logout`;
            }}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-foreground-muted hover:bg-surface hover:text-foreground transition-colors rounded-lg text-left"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        <div className="w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
