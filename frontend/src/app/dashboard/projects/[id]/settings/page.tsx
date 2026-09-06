"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Save, Trash2, Loader2, Key, Copy, Check, RefreshCw, Eye, EyeOff } from "lucide-react";
import { RepoSelector } from "@/components/RepoSelector";
import { config } from "@/lib/config";
import { useProject, useUpdateProject, useDeleteProject, useRegenerateApiKey } from "@/lib/api/hooks/useProjects";
import { SettingsSkeleton } from "@/components/ui/Skeleton";

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

  const { data: project, isLoading: loading, error: fetchError } = useProject(id);
  const updateProjectMutation = useUpdateProject(id);
  const deleteProjectMutation = useDeleteProject();
  const regenerateApiKeyMutation = useRegenerateApiKey(id);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setSlug(project.slug || "");
      setSeoTitle(project.seoTitle || "");
      setSeoDescription(project.seoDescription || "");
      setIsPublic(project.isPublic ?? true);
      setOriginalName(project.name);
      setSourceRepos(project.sourceRepos || []);
      setTargetRepo(project.targetRepo || "");
    }
    if (fetchError) {
      setError(fetchError.message);
    }
  }, [project, fetchError]);

  const handleRemoveSource = (repo: string) => {
    setSourceRepos(sourceRepos.filter(r => r !== repo));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProjectMutation.mutateAsync({ name, targetRepo, sourceRepos, slug, seoTitle, seoDescription, isPublic });
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
      await deleteProjectMutation.mutateAsync(id);
      alert("Project deleted successfully.");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-border">
        <Link
          href={`/dashboard/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to project
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">Settings</h1>
        <p className="text-foreground-muted text-sm mt-1.5">{originalName}</p>
      </div>

      <div className="p-6 md:p-10 flex-1 max-w-3xl mx-auto w-full space-y-10">
        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-8">
          <div className="card-lg p-6 md:p-8 space-y-8">
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
                URL slug
              </label>
              <p className="text-foreground-muted text-sm mb-4">
                Used for public release URLs (e.g. akara.com/p/<strong>{slug || 'your-slug'}</strong>)
              </p>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. core-engine"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            <div className="border-t border-border pt-8">
              <h3 className="text-sm font-medium text-foreground mb-4">Visibility & access</h3>
              <div className="flex items-center justify-between bg-surface/50 border border-border p-4 rounded-xl">
                <div>
                  <h4 className="font-medium text-sm text-foreground">Public access</h4>
                  <p className="text-xs text-foreground-muted mt-0.5">If disabled, public pages, OTA updates, and asset downloads will be blocked.</p>
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
              <h3 className="text-sm font-medium text-foreground mb-4">SEO & metadata</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-2">
                    SEO title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={`e.g. ${name || 'Project'} Releases`}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-2">
                    SEO description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={`Download official releases for ${name || 'this project'}.`}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all min-h-[100px] resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Source repositories
              </label>
              <p className="text-foreground-muted text-sm mb-4">
                Select the repositories that act as the source of truth for your release assets.
              </p>

              <RepoSelector
                label="Search source repositories"
                selected={sourceRepos}
                onChange={(selected) => setSourceRepos(selected as string[])}
                multiSelect={true}
              />

              {sourceRepos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-xs text-foreground-muted">Active sources</span>
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
                The repository where curated releases will be published. If empty, releases remain internal to Akara.
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || deleting}
              className="btn-primary text-base px-8 py-3"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        {/* API Key & CI/CD */}
        <div className="card-surface p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-5">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Key size={20} className="text-primary" />
              Project API Key & CI/CD
            </h2>
            <p className="text-foreground-muted text-sm mt-1">
              Use this secret key to publish releases and update tracks from GitHub Actions or automated build pipelines.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Secret Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-background border border-border rounded-lg px-3.5 py-2.5 font-mono text-sm">
                  <span className="flex-1 select-all overflow-hidden text-ellipsis">
                    {showKey ? (project?.apiKey || "No API key configured") : (project?.apiKey ? `${project.apiKey.slice(0, 12)}••••••••••••••••••••••••••••••••` : "••••••••••••••••")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-foreground-muted hover:text-foreground ml-2 transition-colors p-1"
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (project?.apiKey) {
                      navigator.clipboard.writeText(project.apiKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }
                  }}
                  className="btn-secondary flex items-center gap-2 px-4 py-2.5"
                  title="Copy to clipboard"
                >
                  {copiedKey ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  disabled={regeneratingKey}
                  onClick={async () => {
                    if (confirm("Are you sure you want to regenerate this project's API key? Existing CI/CD workflows using the old key will fail.")) {
                      setRegeneratingKey(true);
                      try {
                        await regenerateApiKeyMutation.mutateAsync();
                        alert("API key regenerated successfully!");
                      } catch (err: any) {
                        alert(err.message || "Failed to regenerate API key");
                      } finally {
                        setRegeneratingKey(false);
                      }
                    }
                  }}
                  className="btn-secondary text-amber-400 hover:text-amber-300 flex items-center gap-2 px-4 py-2.5"
                  title="Regenerate key"
                >
                  <RefreshCw size={16} className={regeneratingKey ? "animate-spin" : ""} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <div className="bg-background/60 border border-border/80 rounded-lg p-4 space-y-2">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider block">
                GitHub Actions Usage Example
              </span>
              <pre className="text-xs font-mono text-foreground/90 overflow-x-auto p-2 bg-background rounded border border-border/50">
{`- name: Register Release with Akara
  run: |
    curl -X POST "https://api.akara.prnce.xyz/v1/public/projects/${slug || id}/releases" \\
      -H "Authorization: Bearer \${{ secrets.AKARA_API_KEY }}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "platform": "android",
        "packageName": "com.madebytrident.qlip",
        "version": "\${{ github.ref_name }}",
        "track": "internal",
        "status": "published"
      }'`}
              </pre>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/15 bg-red-500/3 p-6 md:p-8 space-y-5 rounded-xl">
          <div>
            <h2 className="text-base font-medium text-red-400 flex items-center gap-2">
              <Trash2 size={18} />
              Danger zone
            </h2>
            <p className="text-foreground-muted text-sm mt-1">
              Actions here are irreversible and will delete this project along with all release staging data.
            </p>
          </div>

          <div className="pt-4 border-t border-red-500/10 space-y-3">
            <label className="block text-sm text-foreground/80">
              To verify, type the project name <span className="text-red-400 font-medium">"{originalName}"</span> below:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type project name to confirm"
                className="flex-1 bg-background border border-red-500/15 focus:border-red-500/40 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground-muted/40 transition-colors"
              />
              <button
                type="button"
                disabled={deleting || saving || deleteConfirmText !== originalName}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {deleting ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
