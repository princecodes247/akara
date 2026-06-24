"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Server, GitMerge, FileCode, CheckCircle, Edit3, Trash2, Globe, Sparkles, Folder, Eye, Settings } from "lucide-react";
import { config } from "@/lib/config";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"artifacts" | "releases">("artifacts");
  
  // Track which artifact's assets are expanded
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<string, boolean>>({});

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem("akara_token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch project details
      const projRes = await fetch(`${config.apiUrl}/projects/${id}`, { headers });
      if (!projRes.ok) throw new Error("Failed to fetch project details");
      const projData = await projRes.json();
      setProject(projData);

      // Fetch releases
      const relRes = await fetch(`${config.apiUrl}/projects/${id}/releases`, { headers });
      if (!relRes.ok) throw new Error("Failed to fetch releases");
      const relData = await relRes.json();
      setReleases(relData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const toggleArtifactExpanded = (key: string) => {
    setExpandedArtifacts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSetCurrent = async (releaseId: number) => {
    try {
      const token = localStorage.getItem("akara_token");
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`${config.apiUrl}/projects/${id}/releases/${releaseId}/mapping`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isCurrent: true, status: "public" }),
      });

      if (!res.ok) throw new Error("Failed to set release as current");
      
      // Update local state snappy-style
      setReleases(prev => prev.map(r => {
        if (r.id === releaseId) {
          return { ...r, isCurrent: true, status: "public" };
        }
        return { ...r, isCurrent: false };
      }));
      alert("Release set as current successfully!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRelease = async (releaseId: number) => {
    if (!confirm("Are you sure you want to delete this custom release mapping? This will unpublish the release from GitHub if it is currently public.")) return;

    try {
      const token = localStorage.getItem("akara_token");
      const res = await fetch(`${config.apiUrl}/projects/${id}/releases/${releaseId}/mapping`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete release mapping");
      
      // Reset local state mapping properties back to defaults
      setReleases(prev => prev.map(r => {
        if (r.id === releaseId) {
          return {
            ...r,
            status: "draft",
            isCurrent: false,
            customTitle: undefined,
            customBody: undefined,
            customAssets: undefined,
          };
        }
        return r;
      }));
      alert("Release deleted successfully!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter lists based on new Core UX definitions
  // 1. Artifacts: Raw GitHub releases
  const artifacts = releases;

  // 2. Akara Releases: Curated releases with customTitle, customBody, or customAssets defined, or published
  const customReleases = releases.filter(
    (r: any) => r.customTitle !== undefined || r.customBody !== undefined || r.customAssets !== undefined || r.isCurrent
  );

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500 flex flex-col h-full items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-accent mb-4" />
        <p className="font-mono text-foreground/60 uppercase tracking-wider">Syncing System Revision...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-12">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 font-mono">
          ERROR: {error || "Project not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      {/* Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
        <Link 
          href="/dashboard"
          className="md:col-span-3 flex items-center justify-center p-8 md:p-12 border-b md:border-b-0 md:border-r border-border bg-surface hover:bg-foreground hover:text-background text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-sm">
            <ArrowLeft size={16} className="text-accent group-hover:text-background" />
            Back to Projects
          </div>
        </Link>
        <div className="md:col-span-4 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center bg-surface/30">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter truncate" title={project.name}>{project.name}</h1>
            <Link
              href={`/dashboard/projects/${id}/settings`}
              className="text-foreground/40 hover:text-accent transition-colors shrink-0 p-2 border border-transparent hover:border-border hover:bg-background rounded-sm"
              title="Project Settings"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
        <div className="md:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-background">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent shrink-0 mt-1 w-24">Sources</span>
              <div className="flex flex-wrap gap-2">
                {project.sourceRepos?.map((repo: string) => (
                  <span key={repo} className="text-xs font-mono bg-surface px-2 py-1 text-foreground/80 border border-border flex items-center">
                    <Server size={12} className="mr-2" />
                    {repo}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent shrink-0 w-24">Target Repo</span>
              {project.targetRepo ? (
                <span className="text-xs font-mono bg-accent/10 px-2 py-1 text-accent border border-accent/30 flex items-center">
                  <GitMerge size={12} className="mr-2" />
                  {project.targetRepo}
                </span>
              ) : (
                <span className="text-xs font-mono bg-surface px-2 py-1 text-foreground/40 border border-border flex items-center italic">
                  Internal Releases Only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border flex bg-surface/10 px-8">
        <button
          onClick={() => setActiveTab("artifacts")}
          className={`px-6 py-4 font-mono text-sm uppercase tracking-wider border-b-2 font-bold transition-colors ${
            activeTab === "artifacts" ? "border-accent text-accent" : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          📦 Raw Artifacts ({artifacts.length})
        </button>
        <button
          onClick={() => setActiveTab("releases")}
          className={`px-6 py-4 font-mono text-sm uppercase tracking-wider border-b-2 font-bold transition-colors ${
            activeTab === "releases" ? "border-accent text-accent" : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          🚀 Akara Releases ({customReleases.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-8 md:p-12 flex-1 max-w-7xl mx-auto w-full">
        {activeTab === "artifacts" ? (
          /* 📦 ARTIFACTS SCREEN */
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Raw GitHub Artifacts</h2>
              <span className="font-mono text-xs text-foreground/50 uppercase">Fetched from GitHub API</span>
            </div>

            {artifacts.length === 0 ? (
              <div className="text-center p-12 border border-border border-dashed font-mono text-foreground/50">
                No artifacts found in source repositories.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {artifacts.map(art => {
                  const key = `${art.sourceRepo}-${art.id}`;
                  const isExpanded = !!expandedArtifacts[key];
                  
                  return (
                    <div key={key} className="border border-border bg-surface/10 hover:border-border/80 transition-colors p-6 flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg text-foreground">{art.tag}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 border border-border/80 bg-surface/50 text-foreground/70 uppercase">
                              {art.sourceRepo}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-foreground/40 mt-1">
                            Published: {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : "Draft"}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleArtifactExpanded(key)}
                            className="font-mono text-xs border border-border px-3 py-1.5 hover:bg-surface text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1.5"
                          >
                            <Eye size={12} />
                            {isExpanded ? "Hide Assets" : `View Assets (${art.assets?.length || 0})`}
                          </button>
                          
                          <Link
                            href={`/dashboard/projects/${id}/releases/${art.id}/edit`}
                            className="font-mono text-xs bg-accent text-background px-4 py-1.5 hover:bg-accent/80 transition-colors flex items-center gap-1.5 brutalist-shadow"
                          >
                            <Sparkles size={12} />
                            Use in Release
                          </Link>
                        </div>
                      </div>

                      {/* Expandable asset list */}
                      {isExpanded && (
                        <div className="border-t border-border/50 pt-4 mt-2">
                          <div className="font-mono text-xs font-bold text-accent uppercase mb-2">Available Assets:</div>
                          {art.assets && art.assets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {art.assets.map((asset: any) => (
                                <div key={asset.id} className="flex items-center gap-2 p-2 bg-surface/20 border border-border/40 font-mono text-xs text-foreground/75">
                                  <FileCode size={12} className="text-accent" />
                                  <span>{asset.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="font-mono text-xs text-foreground/40 italic">No asset files linked to this artifact.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* 🚀 AKARA RELEASES SCREEN */
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Akara Release Bundles</h2>
              <span className="font-mono text-xs text-foreground/50 uppercase">Staged & Curated Targets</span>
            </div>

            {customReleases.length === 0 ? (
              <div className="text-center p-16 border border-border border-dashed flex flex-col items-center justify-center bg-surface/5">
                <Sparkles className="text-accent/30 mb-4" size={40} />
                <h3 className="font-mono font-bold text-lg mb-2 uppercase">No Releases Created</h3>
                <p className="text-sm font-mono text-foreground/50 max-w-md mb-6">
                  You haven't customized any releases yet. Go to the "Artifacts" tab to select raw elements and compose a Release.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {customReleases.map(rel => (
                  <div key={rel.id} className="border border-border bg-surface/20 p-6 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-black tracking-tight text-foreground uppercase">
                            {rel.customTitle || rel.title || rel.name}
                          </h3>
                          <div className="flex gap-2">
                            {rel.isCurrent && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 uppercase">
                                Current
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase border ${
                              rel.status === "public" 
                                ? "bg-green-500/10 text-green-500 border-green-500/30" 
                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                            }`}>
                              {rel.status}
                            </span>
                          </div>
                        </div>
                        <div className="font-mono text-xs text-foreground/40 mt-1 uppercase flex items-center gap-4">
                          <span>Target Tag: {rel.tag}</span>
                          {rel.status === "public" && (
                            <>
                              <span className="text-foreground/20">|</span>
                              <a
                                href={`/p/${id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline flex items-center gap-1 normal-case font-bold"
                              >
                                <Globe size={12} />
                                View Public Page
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/projects/${id}/releases/${rel.id}/edit`}
                          className="font-mono text-xs border border-border px-3 py-1.5 hover:bg-surface text-foreground/80 hover:text-accent transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 size={12} />
                          Edit Staging
                        </Link>
                        
                        <button
                          onClick={() => handleSetCurrent(rel.id)}
                          disabled={rel.isCurrent}
                          className={`font-mono text-xs border px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                            rel.isCurrent 
                              ? "bg-accent/10 border-accent/20 text-accent/50 cursor-not-allowed"
                              : "border-border hover:bg-surface text-foreground hover:text-green-500 hover:border-green-500/30"
                          }`}
                        >
                          <CheckCircle size={12} />
                          Set Current
                        </button>

                        <button
                          onClick={() => handleDeleteRelease(rel.id)}
                          className="font-mono text-xs border border-red-500/20 px-3 py-1.5 hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Staged custom assets list */}
                    {rel.customAssets && rel.customAssets.length > 0 && (
                      <div>
                        <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider block mb-3">Merged Assets ({rel.customAssets.length})</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {rel.customAssets.map((asset: any) => (
                            <div key={asset.id} className="border border-border/60 bg-background/50 p-3 flex items-center justify-between font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <FileCode size={14} className="text-accent" />
                                <span className="font-bold">{asset.name}</span>
                                <span className="text-[10px] text-foreground/40 font-normal">
                                  (from {asset.sourceRepo} @ {asset.sourceReleaseId})
                                </span>
                              </div>
                              {asset.tag && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-surface text-accent/80 border border-border uppercase">
                                  {asset.tag}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
