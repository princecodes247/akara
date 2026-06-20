"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { RepoSelector } from "@/components/RepoSelector";

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
    if (!name || !targetRepo) {
      setError("Name and Target Repo are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("akara_token");
      const res = await fetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl"
    >
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-foreground/60 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
      <p className="text-foreground/60 mb-10">Set up a mapping between your private source repositories and a public target repository.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 glass-card p-8 rounded-2xl">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Project Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Mobile App Releases"
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <RepoSelector 
          label="Target Repository (Public)"
          description="The repository where releases will be published."
          multiSelect={false}
          allowCustom={true}
          selected={targetRepo}
          onChange={(val) => setTargetRepo(val as string)}
        />

        <RepoSelector 
          label="Source Repositories (Private)"
          description="Select multiple private repositories to sync releases from."
          multiSelect={true}
          allowCustom={false}
          selected={sourceRepos}
          onChange={(val) => setSourceRepos(val as string[])}
        />

        {sourceRepos.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-foreground/80">Selected Sources</label>
            {sourceRepos.map(repo => (
              <div key={repo} className="flex items-center justify-between bg-surface border border-border px-4 py-2 rounded-lg">
                <span className="text-sm">{repo}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveSource(repo)}
                  className="text-foreground/50 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Project
          </button>
        </div>
      </form>
    </motion.div>
  );
}
