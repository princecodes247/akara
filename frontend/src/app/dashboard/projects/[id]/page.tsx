"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft, Loader2, Server, GitMerge, FileCode, CheckCircle, Edit3, Trash2, Globe, Sparkles, Eye, EyeOff, Settings, Package, Rocket, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { config } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/lib/api/hooks/useProjects";
import { useReleases, useUpdateReleaseMapping, useDeleteReleaseMapping } from "@/lib/api/hooks/useReleases";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading: loadingProject, error: projectError } = useProject(id);
  const { data: releases = [], isLoading: loadingReleases, error: releasesError } = useReleases(id);
  const loading = loadingProject || loadingReleases;
  const error = projectError?.message || releasesError?.message || "";

  const [activeTab, setActiveTab] = useState<"artifacts" | "releases" | "integrations">("artifacts");
  
  // Track which artifact's assets are expanded
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<string, boolean>>({});

  const toggleArtifactExpanded = (key: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setExpandedArtifacts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateMappingMutation = useUpdateReleaseMapping(id, "");
  const deleteMappingMutation = useDeleteReleaseMapping(id, "");

  const handleSetCurrent = async (releaseId: number) => {
    try {
      const res = await fetch(`${config.apiUrl}/projects/${id}/releases/${releaseId}/mapping`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true, status: "public" }),
      });

      if (!res.ok) throw new Error("Failed to set release as current");
      
      // Update local state snappy-style (react query invalidate will also run if we used mutation, but let's just invalidate via mutation hook next time)
      
      // Revalidate frontend cache
      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || id })
      });

      alert("Release set as current successfully!");
      // We should probably rely on query client invalidation, so let's reload or just let it be since we didn't use the mutation here
      // But actually, it's better to use mutation.
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleVisibility = async (releaseId: number, currentStatus: string) => {
    const newStatus = currentStatus === "public" ? "draft" : "public";
    try {
      const res = await fetch(`${config.apiUrl}/projects/${id}/releases/${releaseId}/mapping`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to change release status");
      
      // Revalidate frontend cache
      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || id })
      });
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRelease = async (releaseId: number) => {
    if (!confirm("Are you sure you want to delete this custom release mapping? This will unpublish the release from GitHub if it is currently public.")) return;

    try {
      const res = await fetch(`${config.apiUrl}/projects/${id}/releases/${releaseId}/mapping`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete release mapping");

      // Revalidate frontend cache
      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || id })
      });
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };
console.log({releases})
  // Filter lists based on new Core UX definitions
  // 1. Artifacts: Raw GitHub releases, sorted newest first
  const artifacts = [...releases].sort((a: any, b: any) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
    return dateB - dateA;
  });

  // 2. Akara Releases: Curated releases with customTitle, customBody, or customAssets defined, or published, sorted newest first
  const customReleases = releases
    .filter(
      (r: any) => r.customTitle !== undefined || r.customBody !== undefined || r.customAssets !== undefined || r.isCurrent
    )
    .sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
      return dateB - dateA;
    });

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
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 font-mono rounded-xl">
          ERROR: {error || "Project not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full bg-background min-h-screen">
      {/* Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border/50 bg-surface/10">
        <Link 
          href="/dashboard"
          className="md:col-span-3 flex items-center justify-center p-5 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-border/50 bg-surface/30 hover:bg-surface/50 text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-sm">
            <ArrowLeft size={16} className="text-accent group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </div>
        </Link>
        <div className="md:col-span-4 p-5 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center bg-surface/10">
          <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter break-words" title={project.name}>{project.name}</h1>
            <Link
              href={`/dashboard/projects/${id}/settings`}
              className="text-foreground/40 hover:text-accent transition-colors shrink-0 p-2 hover:bg-surface/30 rounded-lg"
              title="Project Settings"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
        <div className="md:col-span-5 p-5 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent shrink-0 mt-1 w-24">Sources</span>
              <div className="flex flex-wrap gap-2">
                {project.sourceRepos?.map((repo: string) => (
                  <span key={repo} className="text-xs font-mono bg-surface/50 px-3 py-1.5 rounded-md text-foreground/80 border border-border/50 flex items-center shadow-sm">
                    <Server size={12} className="mr-2 opacity-70" />
                    {repo}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent shrink-0 w-24">Target Repo</span>
              {project.targetRepo ? (
                <span className="text-xs font-mono bg-accent/10 px-3 py-1.5 rounded-md text-accent border border-accent/20 flex items-center shadow-sm">
                  <GitMerge size={12} className="mr-2" />
                  {project.targetRepo}
                </span>
              ) : (
                <span className="text-xs font-mono bg-surface/30 px-3 py-1.5 rounded-md text-foreground/40 border border-border/50 flex items-center italic">
                  Internal Releases Only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Modern Animated Pills */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 max-w-7xl mx-auto w-full overflow-x-auto">
        <div className="flex gap-2 bg-surface/30 p-1.5 rounded-xl w-fit border border-border/50 min-w-max">
          {[
            { id: "artifacts", label: "Artifacts", count: artifacts.length, icon: Package },
            { id: "releases", label: "Releases", count: customReleases.length, icon: Rocket },
            { id: "integrations", label: "OTA Integrations", count: 1, icon: FileCode }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors rounded-lg flex items-center gap-2 ${
                activeTab === tab.id ? "text-background" : "text-foreground/60 hover:text-foreground hover:bg-surface/50"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-accent rounded-lg shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon size={16} />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-background/20 text-background" : "bg-surface text-foreground/50"}`}>
                  {tab.count}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 sm:px-8 pb-12 flex-1 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "artifacts" ? (
            /* ARTIFACTS SCREEN */
            <motion.div 
              key="artifacts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end mb-6 border-b border-border/30 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Raw Artifacts</h2>
                  <p className="font-mono text-xs text-foreground/50 mt-1">Found in source repositories. Use these to build a release.</p>
                </div>
              </div>

              {artifacts.length === 0 ? (
                <div className="text-center p-12 border border-border/50 border-dashed rounded-2xl font-mono text-foreground/50 bg-surface/5">
                  No artifacts found in source repositories.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {artifacts.map(art => {
                    const key = `${art.sourceRepo}-${art.id}`;
                    const isExpanded = !!expandedArtifacts[key];
                    const assetsCount = art.assets?.length || 0;
                    
                    return (
                      <div 
                        key={key} 
                        className="group border border-border/50 bg-surface/20 hover:bg-surface/30 rounded-xl transition-all overflow-hidden cursor-pointer shadow-sm hover:shadow-md"
                        onClick={() => toggleArtifactExpanded(key)}
                      >
                        <div className="p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-black text-xl text-foreground tracking-tight">{art.tag}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface text-foreground/60 uppercase border border-border/50">
                                {art.sourceRepo}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-foreground/40 mt-1.5 flex items-center gap-4">
                              <span>Published: {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : "Draft"}</span>
                              <span className="flex items-center gap-1 text-accent/80"><FileCode size={12}/> {assetsCount} Assets</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <Link
                              href={`/dashboard/projects/${id}/releases/${art.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-xs uppercase border border-border/50 hover:border-accent/50 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm flex-1 md:flex-none"
                            >
                              <Plus size={12} strokeWidth={2} />
                              Compose
                            </Link>
                            <button
                              onClick={(e) => toggleArtifactExpanded(key, e)}
                              className="p-2 text-foreground/40 hover:text-foreground transition-colors rounded-lg hover:bg-surface"
                            >
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable asset list */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border/30 bg-black/20 p-4 sm:p-6">
                                <div className="font-mono text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <Package size={14} /> Available Assets
                                </div>
                                {assetsCount > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {art.assets.map((asset: any) => (
                                      <div key={asset.id} className="flex items-center gap-3 p-3 bg-surface/40 rounded-lg border border-border/30 font-mono text-xs text-foreground/80 hover:border-border/60 transition-colors">
                                        <div className="p-1.5 bg-background rounded-md text-accent"><FileCode size={12} /></div>
                                        <span className="truncate" title={asset.name}>{asset.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="font-mono text-xs text-foreground/40 italic">No asset files linked to this artifact.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : activeTab === "releases" ? (
            /* AKARA RELEASES SCREEN */
            <motion.div 
              key="releases"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end mb-6 border-b border-border/30 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Akara Releases</h2>
                  <p className="font-mono text-xs text-foreground/50 mt-1">Curated and staged releases ready for your users.</p>
                </div>
              </div>

              {customReleases.length === 0 ? (
                <div className="text-center p-16 border border-border/50 border-dashed rounded-2xl flex flex-col items-center justify-center bg-surface/5">
                  <Rocket className="text-accent/30 mb-4" size={48} />
                  <h3 className="font-mono font-bold text-lg mb-2 uppercase tracking-wide">No Releases Created</h3>
                  <p className="text-sm font-mono text-foreground/50 max-w-md mb-6">
                    You haven't customized any releases yet. Go to the "Artifacts" tab to select raw elements and compose a Release.
                  </p>
                  <button 
                    onClick={() => setActiveTab("artifacts")}
                    className="font-mono text-sm uppercase bg-surface text-foreground px-6 py-3 rounded-xl border border-border hover:bg-surface/80 transition-colors"
                  >
                    Browse Artifacts
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {customReleases.map(rel => (
                    <div key={rel.id} className="border border-border/50 bg-surface/10 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-sm relative overflow-hidden">
                      {rel.isCurrent && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                      )}
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-5 z-10">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
                            <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase break-words w-full md:w-auto">
                              {rel.customTitle || rel.title || rel.name}
                            </h3>
                            <div className="flex gap-2">
                              {rel.isCurrent && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 uppercase">
                                  Current
                                </span>
                              )}
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                                rel.status === "public" 
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              }`}>
                                {rel.status}
                              </span>
                            </div>
                          </div>
                          <div className="font-mono text-xs text-foreground/40 mt-2 uppercase flex items-center gap-4">
                            <span>Target Tag: {rel.tag}</span>
                            {rel.status === "public" && (
                              <>
                                <span className="text-foreground/20">|</span>
                                <a
                                  href={`/p/${project.slug || id}${rel.isCurrent ? '' : `/releases/${rel.id}`}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:text-accent/80 transition-colors flex items-center gap-1.5 normal-case font-bold"
                                >
                                  <Globe size={14} />
                                  View Release Page
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full md:w-auto">
                          <Link
                            href={`/dashboard/projects/${id}/releases/${rel.id}/edit`}
                            className="font-mono text-xs border border-border/50 bg-background px-4 py-2.5 rounded-lg hover:bg-surface text-foreground hover:text-accent transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none"
                          >
                            <Edit3 size={14} />
                            Edit Release
                          </Link>
                          
                          <div className="flex gap-2 flex-1 sm:flex-none">
                            <button
                              onClick={() => handleToggleVisibility(rel.id, rel.status)}
                              className="font-mono text-xs border border-border/50 bg-background px-4 py-2.5 rounded-lg hover:bg-surface text-foreground hover:text-accent transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
                            >
                              {rel.status === "public" ? (
                                <>
                                  <EyeOff size={14} /> Make Draft
                                </>
                              ) : (
                                <>
                                  <Eye size={14} /> Make Public
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleSetCurrent(rel.id)}
                              disabled={rel.isCurrent}
                              className={`font-mono text-xs border px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none ${
                                rel.isCurrent 
                                  ? "bg-accent/5 border-accent/10 text-accent/40 cursor-not-allowed"
                                  : "border-border/50 bg-background hover:bg-emerald-500/10 text-foreground hover:text-emerald-500 hover:border-emerald-500/30"
                              }`}
                            >
                              <CheckCircle size={14} />
                              Set Current
                            </button>

                            <button
                              onClick={() => handleDeleteRelease(rel.id)}
                              className="font-mono text-xs border border-red-500/20 bg-background px-4 py-2.5 rounded-lg hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-colors flex items-center justify-center gap-2 flex-none"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Staged custom assets list */}
                      {rel.customAssets && rel.customAssets.length > 0 && (
                        <div className="z-10">
                          <span className="font-mono text-xs font-bold text-foreground/50 uppercase tracking-wider block mb-3">Release Assets ({rel.customAssets.length})</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rel.customAssets.map((asset: any) => (
                              <div key={asset.id} className="border border-border/40 bg-background/50 rounded-lg p-3 flex flex-col gap-2 font-mono text-xs hover:border-border/80 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                                    <FileCode size={14} className="text-accent shrink-0" />
                                    <span className="font-bold truncate text-foreground/90">{asset.name}</span>
                                  </div>
                                  {asset.tag && (
                                    <span className="text-[9px] shrink-0 font-bold px-1.5 py-0.5 rounded bg-surface text-accent/80 border border-border/50 uppercase">
                                      {asset.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[9px] text-foreground/40 font-normal truncate">
                                    src: {asset.sourceRepo} @ {asset.sourceReleaseId}
                                  </span>
                                  {rel.downloadCounts && rel.downloadCounts[asset.id] !== undefined && (
                                    <div className="flex items-center gap-1 text-[10px] text-accent/80 font-mono font-bold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                                      <Download size={10} />
                                      {rel.downloadCounts[asset.id]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* INTEGRATIONS SCREEN */
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end mb-6 border-b border-border/30 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">OTA Integrations</h2>
                  <p className="font-mono text-xs text-foreground/50 mt-1">Connect your applications to Akara to receive Over-The-Air updates.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="border border-border/50 bg-surface/10 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-black text-lg uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileCode size={20} className="text-accent" /> Tauri (v1 / v2)
                  </h3>
                  <p className="text-sm font-mono text-foreground/60 mb-6">
                    Tauri requires an updater endpoint that returns a specific JSON format containing the updater bundle URL and cryptographic signature. Use this endpoint in your <code className="bg-surface px-1.5 py-0.5 rounded text-accent">tauri.conf.json</code>.
                  </p>

                  <div className="bg-black/40 border border-border/30 rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-xs text-foreground/80 leading-relaxed">
{`{
  "updater": {
    "active": true,
    "endpoints": [
      "https://your-akara-domain.com/v1/public/projects/${project.slug || id}/ota/{{target}}/{{current_version}}?framework=tauri"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}`}
                    </pre>
                  </div>
                  <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-3">
                    <Sparkles className="text-accent shrink-0 mt-0.5" size={16} />
                    <p className="text-xs font-mono text-foreground/70 leading-relaxed">
                      <strong>Platform Tag Matching:</strong> Ensure the Platform Tags you enter in the Release Builder (e.g. <code className="text-accent">darwin-aarch64</code> or <code className="text-accent">windows-x86_64</code>) match the <code className="text-accent">{'{{target}}'}</code> placeholders Tauri sends automatically.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
