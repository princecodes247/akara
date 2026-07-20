"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderGit2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useProjects } from "@/lib/api/hooks/useProjects";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export interface Project {
  _id: string;
  name: string;
  sourceRepos: string[];
  targetRepo: string;
}

export default function DashboardClient() {
  const { data: projects, isLoading: loading } = useProjects();

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
        <div className="md:col-span-4 p-5 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center bg-surface/30">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Projects</h1>
        </div>
        <div className="md:col-span-5 p-5 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center">
          <p className="text-foreground/60 font-mono text-sm uppercase">Manage mapped repositories and orchestration rules.</p>
        </div>
        <Link 
          href="/dashboard/projects/new"
          className="md:col-span-3 flex items-center justify-center p-5 sm:p-8 md:p-12 bg-surface hover:bg-foreground hover:text-background text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider">
            <Plus size={18} className="text-accent group-hover:text-background" />
            New Project
          </div>
        </Link>
      </div>

      <div className="p-5 sm:p-8 md:p-12 flex-1 max-w-7xl mx-auto w-full">

      {loading ? (
        <DashboardSkeleton />
      ) : !projects || projects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-border/50"
        >
          <div className="w-16 h-16 flex items-center justify-center mb-6 text-accent">
            <FolderGit2 size={40} />
          </div>
          <h3 className="text-xl font-bold font-mono mb-3 uppercase tracking-wider">No projects found</h3>
          <p className="text-foreground/60 mb-8 max-w-md font-mono text-sm">
            Initialize your first project mapping to begin orchestrating releases.
          </p>
          <Link 
            href="/dashboard/projects/new"
            className="flex items-center gap-2 bg-foreground text-background px-6 py-3 font-mono font-bold hover:bg-gray-200 transition-colors brutalist-shadow"
          >
            <Plus size={18} />
            CREATE MAPPING
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project, idx) => (
            <motion.div 
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={`/dashboard/projects/${project._id}`} className="block h-full group">
                <div className="glass-card p-6 h-full flex flex-col transition-all group-hover:border-accent">
                  <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">{project.name}</h3>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent block mb-2">Source Repos</span>
                      <div className="flex flex-col gap-2">
                        {project.sourceRepos.map((repo: string) => (
                          <span key={repo} className="text-sm font-mono bg-surface px-3 py-2 text-foreground/80 border border-border flex items-center">
                            {repo}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent block mb-2">Target Repo</span>
                      {project.targetRepo ? (
                        <span className="text-sm font-mono bg-accent/10 px-3 py-2 text-accent border border-accent/30 flex items-center block w-fit">
                          {project.targetRepo}
                        </span>
                      ) : (
                        <span className="text-sm font-mono bg-surface px-3 py-2 text-foreground/40 border border-border flex items-center block w-fit italic">
                          None (Internal Only)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-foreground/60 group-hover:text-accent font-mono text-sm font-bold uppercase transition-colors">
                    <span>Manage Releases</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
