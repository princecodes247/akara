"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import { RepoSelector } from "@/components/RepoSelector";
import { config } from "@/lib/config";

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetRepo, setTargetRepo] = useState("");
  const [sourceRepos, setSourceRepos] = useState<string[]>([]);
  const [currentSource, setCurrentSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddSource = () => {
    if (currentSource && !sourceRepos.includes(currentSource)) {
      setSourceRepos([...sourceRepos, currentSource]);
      setCurrentSource("");
    }
  };

  const handleRemoveSource = (repo: string) => {
    setSourceRepos(sourceRepos.filter(r => r !== repo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Project Name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${config.apiUrl}/projects`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, targetRepo, sourceRepos })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
        <div className="md:col-span-4 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center bg-surface/30">
          <h1 className="text-4xl font-black uppercase tracking-tighter">New Project</h1>
        </div>
        <div className="md:col-span-5 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center">
          <p className="text-foreground/60 font-mono text-sm uppercase">Configure how private repositories map to public releases.</p>
        </div>
        <Link 
          href="/dashboard"
          className="md:col-span-3 flex items-center justify-center p-8 md:p-12 bg-surface hover:bg-foreground hover:text-background text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-sm">
            <ArrowLeft size={16} className="text-accent group-hover:text-background" />
            Back to Projects
          </div>
        </Link>
      </div>

      <div className="p-8 md:p-12 flex-1 max-w-4xl mx-auto w-full">

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 font-mono text-sm">
            ERROR: {error}
          </div>
        )}

        <div className="glass-card p-8">
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold font-mono text-foreground mb-2 uppercase tracking-wider">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Core Engine Releases"
                className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <div className="border-t border-border pt-8">
              <label className="block text-sm font-bold font-mono text-foreground mb-2 uppercase tracking-wider">
                Source Repositories
              </label>
              <p className="text-foreground/60 text-sm mb-4 font-mono">
                Select the repositories that will act as the source of truth for your releases.
              </p>
              
              <RepoSelector 
                label="Search Source Repositories"
                selected={sourceRepos}
                onChange={(selected) => setSourceRepos(selected as string[])}
                multiSelect={true}
              />

              {sourceRepos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">Selected Sources:</span>
                  <div className="flex flex-col gap-2">
                    {sourceRepos.map(repo => (
                      <div key={repo} className="flex items-center justify-between bg-surface border border-border px-4 py-2">
                        <span className="font-mono text-sm text-foreground/80">{repo}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSource(repo)}
                          className="text-foreground/40 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-8">
              <label className="block text-sm font-bold font-mono text-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                Target Repository <span className="text-[10px] text-accent border border-accent px-1 py-0.5">OPTIONAL</span>
              </label>
              <p className="text-foreground/60 text-sm mb-4 font-mono">
                The repository where curated releases will be published. If left blank, releases will remain internal to Akara.
              </p>
              
              <RepoSelector 
                label="Search or Create Target Repository"
                selected={targetRepo}
                onChange={(selected) => setTargetRepo(selected as string)}
                multiSelect={false}
                allowCustom={true}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-3 bg-foreground text-background px-8 py-4 font-bold font-mono uppercase tracking-wider brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "INITIALIZING..." : "SAVE PROJECT"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
