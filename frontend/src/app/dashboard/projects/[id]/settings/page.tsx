"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save, Trash2, Loader2, Settings } from "lucide-react";
import { RepoSelector } from "@/components/RepoSelector";
import { config } from "@/lib/config";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [targetRepo, setTargetRepo] = useState("");
  const [sourceRepos, setSourceRepos] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [originalName, setOriginalName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/projects/${id}`, {
          credentials: "include"
        });

        if (!res.ok) throw new Error("Failed to load project details");
        const data = await res.json();
        setName(data.name);
        setSlug(data.slug || "");
        setSeoTitle(data.seoTitle || "");
        setSeoDescription(data.seoDescription || "");
        setIsPublic(data.isPublic ?? true);
        setOriginalName(data.name);
        setSourceRepos(data.sourceRepos || []);
        setTargetRepo(data.targetRepo || "");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleRemoveSource = (repo: string) => {
    setSourceRepos(sourceRepos.filter(r => r !== repo));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Project Name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${config.apiUrl}/projects/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, targetRepo, sourceRepos, slug, seoTitle, seoDescription, isPublic })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update project");
      }

      alert("Project settings updated successfully!");
      router.push(`/dashboard/projects/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== originalName) {
      alert("Verification text does not match the project name.");
      return;
    }

    if (!confirm(`Are you absolutely sure you want to delete ${originalName}? This action is irreversible and will delete all custom release stages.`)) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`${config.apiUrl}/projects/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project");
      }

      alert("Project deleted successfully.");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent mb-4" size={48} />
        <p className="font-mono text-sm text-foreground/60 uppercase">Loading Settings Context...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
        <div className="md:col-span-4 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center bg-surface/30">
          <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Settings className="text-accent" size={32} />
            Settings
          </h1>
          <span className="font-mono text-xs text-accent uppercase tracking-wider mt-1">{originalName}</span>
        </div>
        <div className="md:col-span-5 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center">
          <p className="text-foreground/60 font-mono text-sm uppercase">Manage project details, target releases and sources.</p>
        </div>
        <Link 
          href={`/dashboard/projects/${id}`}
          className="md:col-span-3 flex items-center justify-center p-8 md:p-12 bg-surface hover:bg-foreground hover:text-background text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-sm">
            <ArrowLeft size={16} className="text-accent group-hover:text-background" />
            Back to Project
          </div>
        </Link>
      </div>

      <div className="p-8 md:p-12 flex-1 max-w-4xl mx-auto w-full space-y-12">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 font-mono text-sm">
            ERROR: {error}
          </div>
        )}

        {/* Configurations Form */}
        <form onSubmit={handleSave} className="space-y-8">
          <div className="glass-card p-8 space-y-8">
            <div>
              <label className="block text-sm font-bold font-mono text-foreground mb-2 uppercase tracking-wider">
                Rename Project
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
                Project URL Slug
              </label>
              <p className="text-foreground/60 text-xs mb-4 font-mono">
                Used for public release URLs (e.g. akara.com/p/<b>{slug || 'your-slug'}</b>)
              </p>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. core-engine"
                className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="border-t border-border pt-8">
              <h3 className="text-sm font-bold font-mono text-foreground mb-4 uppercase tracking-wider border-l-2 border-accent pl-3">Visibility & Access</h3>
              <div className="flex items-center justify-between bg-surface/30 border border-border p-4 rounded-lg">
                <div>
                  <h4 className="font-bold font-mono text-sm uppercase tracking-wider text-foreground">Public Access</h4>
                  <p className="text-xs font-mono text-foreground/60 mt-1">If disabled, public pages, OTA updates, and asset downloads will be blocked.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-accent' : 'bg-surface border border-border'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <h3 className="text-sm font-bold font-mono text-foreground mb-4 uppercase tracking-wider border-l-2 border-accent pl-3">SEO & Metadata</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold font-mono text-foreground/80 mb-2 uppercase tracking-wider">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={`e.g. ${name || 'Project'} Releases`}
                    className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-accent transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono text-foreground/80 mb-2 uppercase tracking-wider">
                    SEO Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={`Download official releases for ${name || 'this project'}.`}
                    className="w-full bg-background border border-border px-4 py-3 font-mono text-foreground focus:outline-none focus:border-accent transition-colors text-sm min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <label className="block text-sm font-bold font-mono text-foreground mb-2 uppercase tracking-wider">
                Source Repositories
              </label>
              <p className="text-foreground/60 text-xs mb-4 font-mono">
                Select the repositories that act as the source of truth for your release assets.
              </p>
              
              <RepoSelector 
                label="Search Source Repositories"
                selected={sourceRepos}
                onChange={(selected) => setSourceRepos(selected as string[])}
                multiSelect={true}
              />

              {sourceRepos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">Active Sources:</span>
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
              <p className="text-foreground/60 text-xs mb-4 font-mono">
                The repository where curated releases will be published. If empty, releases remain internal to Akara.
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

          <div className="flex justify-end pt-6 border-t border-border">
            <button
              type="submit"
              disabled={saving || deleting}
              className="flex items-center gap-3 bg-foreground text-background px-8 py-4 font-bold font-mono uppercase tracking-wider brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "SAVING CONFIGS..." : "SAVE CHANGES"}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="border border-red-500/30 bg-red-500/5 p-8 space-y-6 rounded-sm">
          <div>
            <h2 className="text-lg font-black uppercase text-red-500 tracking-tight flex items-center gap-2">
              <Trash2 size={20} />
              Danger Zone
            </h2>
            <p className="text-foreground/60 font-mono text-xs uppercase mt-1">
              Actions here are irreversible and will delete this project along with all release staging data.
            </p>
          </div>

          <div className="pt-4 border-t border-red-500/20 space-y-4">
            <label className="block font-mono text-xs text-foreground/80 uppercase">
              To verify, type the project name <span className="text-red-500 font-bold">"{originalName}"</span> below:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type project name to confirm"
                className="flex-1 bg-background border border-red-500/30 focus:border-red-500 px-4 py-2 font-mono text-sm text-foreground outline-none"
              />
              <button
                type="button"
                disabled={deleting || saving || deleteConfirmText !== originalName}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold font-mono text-xs uppercase px-6 py-3 tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {deleting ? "DELETING..." : "DELETE PROJECT"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
