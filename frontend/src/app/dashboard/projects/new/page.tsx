"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Save, Loader2 } from "lucide-react";
import { RepoSelector } from "@/components/RepoSelector";
import { config } from "@/lib/config";
import { useCreateProject } from "@/lib/api/hooks/useProjects";

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetRepo, setTargetRepo] = useState("");
  const [sourceRepos, setSourceRepos] = useState<string[]>([]);
  const [currentSource, setCurrentSource] = useState("");
  const [error, setError] = useState("");
  const createProjectMutation = useCreateProject();

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
      setError("Project name is required.");
      return;
    }

    try {
      await createProjectMutation.mutateAsync({ name, targetRepo, sourceRepos });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-border flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to projects
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">New project</h1>
          <p className="text-foreground-muted text-sm mt-1.5">Configure how private repositories map to public releases.</p>
        </div>
      </div>

      <div className="p-6 md:p-10 flex-1 max-w-3xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="card-lg p-6 md:p-8">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Core Engine Releases"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  required
                />
              </div>

              <div className="border-t border-border pt-8">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Source repositories
                </label>
                <p className="text-foreground-muted text-sm mb-4">
                  Select the repositories that will act as the source of truth for your releases.
                </p>

                <RepoSelector
                  label="Search source repositories"
                  selected={sourceRepos}
                  onChange={(selected) => setSourceRepos(selected as string[])}
                  multiSelect={true}
                />

                {sourceRepos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <span className="text-xs text-foreground-muted">Selected sources</span>
                    <div className="flex flex-col gap-1.5">
                      {sourceRepos.map(repo => (
                        <div key={repo} className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-2.5">
                          <span className="text-sm font-mono text-foreground/80">{repo}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSource(repo)}
                            className="text-foreground-muted hover:text-red-400 transition-colors p-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-8">
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Target repository
                  </label>
                  <span className="text-[10px] text-foreground-muted border border-border rounded px-1.5 py-0.5">Optional</span>
                </div>
                <p className="text-foreground-muted text-sm mb-4">
                  The repository where curated releases will be published. If left blank, releases will remain internal to Akara.
                </p>

                <RepoSelector
                  label="Search or create target repository"
                  selected={targetRepo}
                  onChange={(selected) => setTargetRepo(selected as string)}
                  multiSelect={false}
                  allowCustom={true}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="btn-primary text-base px-8 py-3"
            >
              {createProjectMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {createProjectMutation.isPending ? "Creating..." : "Save project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
