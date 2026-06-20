"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, GitCommit, Settings } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const handleLogin = () => {
    // Redirect to backend OAuth route
    window.location.href = "http://localhost:4000/api/auth/github";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <main className="z-10 flex flex-col items-center text-center max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-accent/30 text-accent-hover text-sm font-medium mb-6">
            <Zap size={14} />
            <span>Release Orchestration Redefined</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Control your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">releases.</span>
            <br /> Without the chaos.
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Akara is the control layer for GitHub releases. Sync from private to public, edit drafts, and transfer assets—all from one beautiful dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <button
            onClick={handleLogin}
            className="w-full group relative inline-flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-xl font-medium text-lg transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {/* <Github size={22} /> */}
            Continue with GitHub
            <ArrowRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-foreground/50 mt-6">
            We only request access to the repositories you choose.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full"
        >
          <div className="glass-card p-6 rounded-2xl">
            <GitCommit className="text-accent mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Sync Repositories</h3>
            <p className="text-foreground/60 text-sm">Automatically mirror releases from your internal private repositories to public facing ones.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <Settings className="text-blue-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Transform Data</h3>
            <p className="text-foreground/60 text-sm">Strip internal notes, edit titles, and curate the changelog before it goes live to customers.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <Zap className="text-yellow-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Asset Transfer</h3>
            <p className="text-foreground/60 text-sm">Move compiled binaries and assets across repositories effortlessly with background jobs.</p>
          </div>
        </motion.div>
      </main>

      {/* Global CSS for shimmer animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
