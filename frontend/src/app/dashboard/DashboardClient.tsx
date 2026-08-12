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
      {/* Page Header */}
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-border flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">Projects</h1>
          <p className="text-foreground-muted text-sm mt-1.5">Manage mapped repositories and orchestration rules.</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="btn-primary"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      <div className="p-6 md:p-10 flex-1 max-w-7xl mx-auto w-full">
        {loading ? (
          <DashboardSkeleton />
        ) : !projects || projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col items-center justify-center p-16 text-center border-dashed"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-5 text-foreground-muted">
              <FolderGit2 size={28} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
            <p className="text-foreground-muted text-sm mb-8 max-w-md">
              Initialize your first project mapping to begin orchestrating releases.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="btn-primary"
            >
              <Plus size={16} />
              Create project
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {projects.map((project, idx) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link href={`/dashboard/projects/${project._id}`} className="block h-full group">
                  <div className="card p-6 h-full flex flex-col transition-all hover:border-[#2a2a2a]">
                    <h3 className="font-display text-xl font-normal tracking-tight text-foreground mb-5">
                      {project.name}
                    </h3>

                    <div className="flex-1 space-y-5">
                      <div>
                        <span className="text-xs text-foreground-muted block mb-2">Source repos</span>
                        <div className="flex flex-col gap-1.5">
                          {project.sourceRepos.map((repo: string) => (
                            <span key={repo} className="text-sm font-mono bg-surface/80 px-3 py-1.5 rounded-lg text-foreground/70 border border-border inline-flex items-center w-fit">
                              {repo}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-foreground-muted block mb-2">Target repo</span>
                        {project.targetRepo ? (
                          <span className="text-sm font-mono bg-accent/5 px-3 py-1.5 rounded-lg text-accent border border-accent/15 inline-flex items-center w-fit">
                            {project.targetRepo}
                          </span>
                        ) : (
                          <span className="text-sm text-foreground-muted/60 italic">
                            Internal only
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-foreground-muted group-hover:text-foreground text-sm transition-colors">
                      <span>Manage releases</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
