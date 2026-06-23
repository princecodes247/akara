"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, GitBranch, Settings, LogOut, Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("akara_token");
    if (!token) {
      router.push("/");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const navItems = [
    { name: "Projects", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Releases", href: "/dashboard/releases", icon: <GitBranch size={18} /> },
    { name: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ];

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent mb-4" size={48} />
        <p className="font-mono text-sm text-foreground/70 uppercase tracking-widest">Verifying Authorization...</p>
      </div>
    );
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
              localStorage.removeItem("akara_token");
              window.location.href = "/";
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
