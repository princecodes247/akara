"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal, Network, Settings } from "lucide-react";
import { config } from "@/lib/config";

export default function Home() {
  const handleLogin = () => {
    window.location.href = `${config.apiUrl}/auth/github`;
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Top Header / Nav */}
      <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm z-50 p-6 flex justify-between items-center">
        <div className="font-mono text-xl font-bold tracking-tighter text-foreground">
          AKARA<span className="text-accent">_</span>
        </div>
        <button 
          onClick={handleLogin}
          className="font-mono text-sm border border-border px-4 py-2 hover:bg-surface transition-colors"
        >
          [LOGIN]
        </button>
      </header>

      <main className="z-10 flex flex-col flex-1 px-6 md:px-24 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="font-mono text-accent text-sm mb-6 flex items-center gap-2">
            <Terminal size={14} />
            <span>sys.init("release_orchestration")</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            CONTROL YOUR <br />
            <span className="text-accent">RELEASES.</span>
          </h1>
          <p className="text-xl text-foreground/70 mb-12 max-w-2xl font-mono text-sm leading-relaxed">
            &gt; Sync private repositories to public targets.<br/>
            &gt; Curate changelogs before they go live.<br/>
            &gt; Automate asset transfers via background workers.
          </p>

          <button
            onClick={handleLogin}
            className="group relative inline-flex items-center justify-between gap-6 bg-foreground text-background px-8 py-4 font-bold text-lg brutalist-shadow"
          >
            <span className="font-mono uppercase tracking-wider">Initialize Session</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-32 border-y border-border"
        >
          <div className="p-8 border-b md:border-b-0 md:border-r border-border hover:bg-surface transition-colors">
            <Network className="text-accent mb-6" size={32} />
            <h3 className="font-mono font-bold text-lg mb-3 uppercase tracking-tight">Sync Repos</h3>
            <p className="text-foreground/60 text-sm font-mono">Automated mirroring of private source releases to public facing repositories.</p>
          </div>
          <div className="p-8 border-b md:border-b-0 md:border-r border-border hover:bg-surface transition-colors">
            <Settings className="text-accent mb-6" size={32} />
            <h3 className="font-mono font-bold text-lg mb-3 uppercase tracking-tight">Transform Data</h3>
            <p className="text-foreground/60 text-sm font-mono">Strip internal notes, edit titles, and curate changelogs prior to publishing.</p>
          </div>
          <div className="p-8 hover:bg-surface transition-colors">
            <Terminal className="text-accent mb-6" size={32} />
            <h3 className="font-mono font-bold text-lg mb-3 uppercase tracking-tight">Asset Transfer</h3>
            <p className="text-foreground/60 text-sm font-mono">Seamlessly move compiled binaries and assets across repos via background jobs.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
