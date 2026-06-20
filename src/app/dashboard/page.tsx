"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderGit2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { config } from "@/lib/config";

interface Project {
  _id: string;
  name: string;
  sourceRepos: string[];
  targetRepo: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("akara_token");
        const res = await fetch(`${config.apiUrl}/projects`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-foreground/60">Manage your synced repositories and release workflows.</p>
        </div>
        
        <Link 
          href="/dashboard/projects/new"
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          New Project
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 rounded-2xl h-48 animate-pulse bg-surface" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card flex flex-col items-center justify-center p-16 text-center rounded-2xl border-dashed border-2 border-border/50"
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 text-accent">
            <FolderGit2 size={32} />
          </div>
          <h3 className="text-xl font-bold mb-3">No projects yet</h3>
          <p className="text-foreground/60 mb-8 max-w-md">
            Create a project to map your private source repositories to a public target repository and start syncing releases.
          </p>
          <Link 
            href="/dashboard/projects/new"
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <Plus size={18} />
            Create Your First Project
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <motion.div 
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={`/dashboard/projects/${project._id}`} className="block h-full">
                <div className="glass-card p-6 rounded-2xl h-full flex flex-col transition-all hover:-translate-y-1 hover:shadow-accent/10">
                  <h3 className="text-xl font-bold mb-4">{project.name}</h3>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50 block mb-1">Source Repos</span>
                      <div className="flex flex-wrap gap-2">
                        {project.sourceRepos.map(repo => (
                          <span key={repo} className="text-xs bg-surface px-2 py-1 rounded text-foreground/80 border border-border">
                            {repo}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50 block mb-1">Target Repo</span>
                      <span className="text-sm text-blue-400">{project.targetRepo}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-accent group">
                    <span className="text-sm font-medium">Manage Releases</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
