"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Copy, GitBranch, Package, Zap } from "lucide-react";
import { config } from "@/lib/config";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isLoggedIn: boolean;
}

export default function ClientPage({ isLoggedIn }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleAction = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      window.location.href = `${config.apiUrl}/auth/github`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("npx akara init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Nav */}
      <header className="w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-cream/10 flex items-center justify-center">
            <span className="text-cream text-xs font-bold font-display">a</span>
          </div>
          <span className="text-foreground text-sm font-medium tracking-tight">akara</span>
        </div>
        <button
          onClick={handleAction}
          className="btn-secondary text-sm"
        >
          {isLoggedIn ? "Dashboard" : "Sign in"}
          <ArrowUpRight size={14} />
        </button>
      </header>

      {/* Hero */}
      <main className="z-10 flex flex-col flex-1 px-6 md:px-24 pt-16 md:pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-4xl"
        >
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.92] text-foreground mb-8">
            Stage your<br />
            releases,{" "}
            <span className="italic">curated.</span>
          </h1>

          <p className="text-foreground-muted text-base md:text-lg max-w-lg mb-12 leading-relaxed">
            Sync private repositories to public targets. Curate changelogs
            before they go live. Automate asset transfers.
          </p>

          {/* CTA Pair */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleAction}
              className="btn-primary text-base px-8 py-3.5"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started"}
              <ArrowUpRight size={16} />
            </button>

            <button
              onClick={handleCopy}
              className="terminal-chip py-3 px-5 cursor-pointer hover:border-[#2a2a2a] transition-colors"
            >
              <span className="terminal-accent">$</span>
              <span>npx akara init</span>
              <Copy size={14} className={copied ? "text-accent" : "text-foreground-muted/50"} />
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-32 max-w-5xl"
        >
          {[
            {
              icon: <GitBranch size={20} />,
              title: "Sync repositories",
              description: "Automated mirroring of private source releases to public-facing repositories.",
            },
            {
              icon: <Package size={20} />,
              title: "Transform data",
              description: "Strip internal notes, edit titles, and curate changelogs prior to publishing.",
            },
            {
              icon: <Zap size={20} />,
              title: "Asset transfer",
              description: "Seamlessly move compiled binaries and assets across repos via background jobs.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="card p-6 md:p-8 group hover:border-[#2a2a2a] transition-colors"
            >
              <div className="text-foreground-muted mb-4 group-hover:text-accent transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-foreground font-medium text-base mb-2">{feature.title}</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
