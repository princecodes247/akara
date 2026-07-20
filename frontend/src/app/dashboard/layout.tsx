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
    // We rely on the Server Component to handle authentication
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
      <aside className="w-64 bg-background border-r border-border fixed h-full flex flex-col hidden md:flex z-40">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold font-mono tracking-tighter text-foreground">
            AKARA<span className="text-accent">_</span>
          </h2>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-4 font-mono text-sm transition-colors border-l-2 ${
                  isActive 
                    ? "border-accent bg-surface text-foreground" 
                    : "border-transparent text-foreground/60 hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {item.icon}
                <span className="uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border">
          <button 
            onClick={() => {
              // Wait, to actually clear an HttpOnly cookie we should have a logout endpoint.
              // For now, redirecting to / will just redirect back to /dashboard which checks the cookie.
              // We should probably hit a logout endpoint. 
              window.location.href = `${config.apiUrl}/auth/logout`; // Or just let's create a logout logic if it doesn't exist. Actually, let's just clear the cookie if we had it, but it's HttpOnly. We need a backend route or we just set document.cookie.
              // For now we'll do what we can on the client if it was not HttpOnly, but since it is, we really need a logout endpoint. We will redirect to /v1/auth/logout.
              window.location.href = `${config.apiUrl}/auth/logout`;
            }}
            className="flex items-center gap-3 px-6 py-4 w-full font-mono text-sm text-foreground/60 hover:bg-surface hover:text-accent transition-colors uppercase tracking-wider text-left"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen border-l border-border/50 flex flex-col">
        <div className="w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
