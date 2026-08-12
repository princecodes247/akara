"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft, Server, GitMerge, FileCode, CheckCircle, Edit3, Trash2, Globe, Sparkles, Eye, EyeOff, Settings, Package, Rocket, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { config } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/lib/api/hooks/useProjects";
import { useReleases, useUpdateReleaseMapping, useDeleteReleaseMapping } from "@/lib/api/hooks/useReleases";
import { ProjectDetailSkeleton } from "@/components/ui/Skeleton";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading: loadingProject, error: projectError } = useProject(id);
  const { data: releases = [], isLoading: loadingReleases, error: releasesError } = useReleases(id);
  const loading = loadingProject || loadingReleases;
  const error = projectError?.message || releasesError?.message || "";

  const [activeTab, setActiveTab] = useState<"artifacts" | "releases" | "integrations">("releases");

  // Track which artifact's assets are expanded
  const [expandedArtifacts, setExpandedArtifacts] = useState<Record<string, boolean>>({});

  const toggleArtifactExpanded = (key: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setExpandedArtifacts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateMappingMutation = useUpdateReleaseMapping(id);
  const deleteMappingMutation = useDeleteReleaseMapping(id);

  const handleSetCurrent = async (releaseId: number) => {
    try {
      await updateMappingMutation.mutateAsync({ _releaseId: releaseId.toString(), isCurrent: true, status: "public" });

      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || id })
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleVisibility = async (releaseId: number, currentStatus: string) => {
    const newStatus = currentStatus === "public" ? "draft" : "public";
    try {
      await updateMappingMutation.mutateAsync({ _releaseId: releaseId.toString(), status: newStatus });

      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || id })
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRelease = async (releaseId: number) => {
    if (!confirm("Are you sure you want to delete this custom release mapping? This will unpublish the release from GitHub if it is currently public.")) return;

    try {
      await deleteMappingMutation.mutateAsync(releaseId.toString());

      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || id })
      });
    } catch (err: any) {
      alert(err.message);
    }
  };
  console.log({releases})
  // Filter lists based on Core UX definitions
  const artifacts = useMemo(() => {
    return [...releases].sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
      return dateB - dateA;
    });
  }, [releases]);

  const customReleases = useMemo(() => {
    return releases
      .filter(
        (r: any) => r.customTitle !== undefined || r.customBody !== undefined || r.customAssets !== undefined || r.isCurrent
      )
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
        return dateB - dateA;
      });
  }, [releases]);

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="p-10">
        <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-6 rounded-xl text-sm">
          Error: {error || "Project not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full bg-background min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 max-w-7xl mx-auto w-full">
          <div className="flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-3"
            >
              <ArrowLeft size={14} />
              Projects
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight text-foreground truncate" title={project.name}>
                {project.name}
              </h1>
              <Link
                href={`/dashboard/projects/${id}/settings`}
                className="text-foreground-muted hover:text-foreground transition-colors p-1.5 hover:bg-surface rounded-lg shrink-0"
                title="Project Settings"
              >
                <Settings size={18} />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-muted">Sources</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.sourceRepos?.map((repo: string) => (
                    <span key={repo} className="text-xs font-mono bg-surface px-2.5 py-1 rounded-md text-foreground/70 border border-border inline-flex items-center gap-1.5">
                      <Server size={10} className="opacity-50" />
                      {repo}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-muted">Target</span>
                {project.targetRepo ? (
                  <span className="text-xs font-mono bg-accent/5 px-2.5 py-1 rounded-md text-accent border border-accent/15 inline-flex items-center gap-1.5">
                    <GitMerge size={10} />
                    {project.targetRepo}
                  </span>
                ) : (
                  <span className="text-xs text-foreground-muted/60 italic">Internal only</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 md:px-10 pt-5 pb-3 max-w-7xl mx-auto w-full overflow-x-auto">
        <div className="flex gap-1 bg-surface/60 p-1 rounded-xl w-fit border border-border min-w-max">
          {[
            { id: "releases", label: "Releases", count: customReleases.length, icon: Rocket },
            { id: "artifacts", label: "Artifacts", count: artifacts.length, icon: Package },
            { id: "integrations", label: "Integrations", count: 1, icon: FileCode }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2 ${
                activeTab === tab.id ? "text-foreground" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-surface rounded-lg border border-border shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon size={15} />
                {tab.label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-foreground/10 text-foreground" : "text-foreground-muted/60"}`}>
                  {tab.count}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-10 pb-12 flex-1 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "artifacts" ? (
            <motion.div
              key="artifacts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-4"
            >
              <div className="mb-4">
                <h2 className="text-lg font-medium text-foreground">Raw artifacts</h2>
                <p className="text-sm text-foreground-muted mt-0.5">Found in source repositories. Use these to build a release.</p>
              </div>

              {artifacts.length === 0 ? (
                <div className="text-center p-12 card border-dashed text-foreground-muted text-sm">
                  No artifacts found in source repositories.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {artifacts.map(art => {
                    const key = `${art.sourceRepo}-${art.id}`;
                    const isExpanded = !!expandedArtifacts[key];
                    const assetsCount = art.assets?.length || 0;

                    return (
                      <div
                        key={key}
                        className="group card hover:border-[#2a2a2a] transition-all overflow-hidden cursor-pointer"
                        onClick={() => toggleArtifactExpanded(key)}
                      >
                        <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-semibold text-lg text-foreground tracking-tight">{art.tag}</span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface text-foreground-muted border border-border">
                                {art.sourceRepo}
                              </span>
                            </div>
                            <div className="text-xs text-foreground-muted mt-1.5 flex items-center gap-4">
                              <span>Published: {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : "Draft"}</span>
                              <span className="flex items-center gap-1 text-foreground-muted"><FileCode size={12}/> {assetsCount} assets</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                            <Link
                              href={`/dashboard/projects/${id}/releases/${art.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="btn-secondary text-xs"
                            >
                              <Plus size={12} />
                              Compose
                            </Link>
                            <button
                              onClick={(e) => toggleArtifactExpanded(key, e)}
                              className="p-2 text-foreground-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border bg-background/50 p-4 md:p-5">
                                <div className="text-xs font-medium text-foreground-muted mb-3 flex items-center gap-2">
                                  <Package size={13} /> Available assets
                                </div>
                                {assetsCount > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {art.assets.map((asset: any) => (
                                      <div key={asset.id} className="flex items-center gap-3 p-3 bg-surface/60 rounded-lg border border-border text-xs text-foreground/70 hover:border-[#2a2a2a] transition-colors">
                                        <div className="p-1.5 bg-background rounded-md text-foreground-muted"><FileCode size={12} /></div>
                                        <span className="truncate" title={asset.name}>{asset.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-foreground-muted/60 italic">No asset files linked to this artifact.</p>
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
            <motion.div
              key="releases"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-4"
            >
              <div className="mb-4">
                <h2 className="text-lg font-medium text-foreground">Akara releases</h2>
                <p className="text-sm text-foreground-muted mt-0.5">Curated and staged releases ready for your users.</p>
              </div>

              {customReleases.length === 0 ? (
                <div className="text-center p-16 card border-dashed flex flex-col items-center justify-center">
                  <Rocket className="text-foreground-muted/30 mb-4" size={40} />
                  <h3 className="font-medium text-foreground text-lg mb-2">No releases yet</h3>
                  <p className="text-sm text-foreground-muted max-w-md mb-6">
                    You haven't customized any releases yet. Go to the "Artifacts" tab to select raw elements and compose a release.
                  </p>
                  <button
                    onClick={() => setActiveTab("artifacts")}
                    className="btn-secondary"
                  >
                    Browse artifacts
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {customReleases.map(rel => (
                    <div key={rel.id} className="card p-5 md:p-6 flex flex-col gap-5 relative overflow-hidden">
                      {rel.isCurrent && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                      )}

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5 z-10">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
                            <h3 className="font-display text-xl md:text-2xl font-normal tracking-tight text-foreground break-words w-full md:w-auto">
                              {rel.customTitle || rel.title || rel.name}
                            </h3>
                            <div className="flex gap-2">
                              {rel.isCurrent && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/15">
                                  Current
                                </span>
                              )}
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize border ${
                                rel.status === "public"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                              }`}>
                                {rel.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-foreground-muted mt-2 flex items-center gap-4">
                            <span>Tag: {rel.tag}</span>
                            {rel.status === "public" && (
                              <>
                                <span className="text-foreground-muted/30">·</span>
                                <a
                                  href={`/p/${project.slug || id}${rel.isCurrent ? '' : `/releases/${rel.id}`}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:text-accent/80 transition-colors flex items-center gap-1.5 font-medium"
                                >
                                  <Globe size={12} />
                                  View page
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full md:w-auto">
                          <Link
                            href={`/dashboard/projects/${id}/releases/${rel.id}/edit`}
                            className="btn-secondary text-xs justify-center"
                          >
                            <Edit3 size={13} />
                            Edit
                          </Link>

                          <div className="flex gap-2 flex-1 sm:flex-none">
                            <button
                              onClick={() => handleToggleVisibility(rel.id, rel.status)}
                              className="btn-secondary text-xs flex-1 sm:flex-none justify-center"
                            >
                              {rel.status === "public" ? (
                                <><EyeOff size={13} /> Draft</>
                              ) : (
                                <><Eye size={13} /> Public</>
                              )}
                            </button>

                            <button
                              onClick={() => handleSetCurrent(rel.id)}
                              disabled={rel.isCurrent}
                              className={`btn-secondary text-xs flex-1 sm:flex-none justify-center ${
                                rel.isCurrent ? "opacity-40 cursor-not-allowed" : "hover:text-emerald-400 hover:border-emerald-500/20"
                              }`}
                            >
                              <CheckCircle size={13} />
                              {rel.isCurrent ? "Current" : "Set current"}
                            </button>

                            <button
                              onClick={() => handleDeleteRelease(rel.id)}
                              className="btn-secondary text-xs text-red-400/70 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 flex-none justify-center"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Custom assets */}
                      {rel.customAssets && rel.customAssets.length > 0 && (
                        <div className="z-10">
                          <button
                            onClick={(e) => toggleArtifactExpanded(`release-${rel.id}`, e)}
                            className="flex items-center justify-between w-full text-xs text-foreground-muted hover:text-foreground transition-colors group"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              <Package size={13} className="group-hover:text-accent transition-colors" />
                              Release assets ({rel.customAssets.length})
                            </span>
                            {expandedArtifacts[`release-${rel.id}`] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>

                          <AnimatePresence>
                            {expandedArtifacts[`release-${rel.id}`] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
                                  {rel.customAssets.map((asset: any) => (
                                    <div key={asset.id} className="border border-border bg-background/50 rounded-lg p-3 flex flex-col gap-2 text-xs hover:border-[#2a2a2a] transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                                          <FileCode size={13} className="text-foreground-muted shrink-0" />
                                          <span className="font-medium truncate text-foreground/80">{asset.name}</span>
                                        </div>
                                        {asset.tag && (
                                          <span className="text-[9px] shrink-0 font-medium px-1.5 py-0.5 rounded bg-surface text-foreground-muted border border-border">
                                            {asset.tag}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[10px] text-foreground-muted/60 truncate">
                                          src: {asset.sourceRepo} @ {asset.sourceReleaseId}
                                        </span>
                                        {rel.downloadCounts && rel.downloadCounts[asset.id] !== undefined && (
                                          <div className="flex items-center gap-1 text-[10px] text-accent/80 font-mono font-medium bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10">
                                            <Download size={10} />
                                            {rel.downloadCounts[asset.id]}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Integrations */
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-4"
            >
              <div className="mb-4">
                <h2 className="text-lg font-medium text-foreground">OTA integrations</h2>
                <p className="text-sm text-foreground-muted mt-0.5">Connect your applications to Akara to receive over-the-air updates.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="card p-6">
                  <h3 className="font-medium text-base text-foreground mb-1.5 flex items-center gap-2">
                    <FileCode size={18} className="text-accent" /> Tauri (v1 / v2)
                  </h3>
                  <p className="text-sm text-foreground-muted mb-5">
                    Tauri requires an updater endpoint that returns a specific JSON format containing the updater bundle URL and cryptographic signature. Use this endpoint in your <code className="bg-surface px-1.5 py-0.5 rounded text-accent text-xs">tauri.conf.json</code>.
                  </p>

                  <div className="bg-background border border-border rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-xs text-foreground/70 leading-relaxed">
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
                  <div className="mt-4 p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-start gap-3">
                    <Sparkles className="text-accent shrink-0 mt-0.5" size={15} />
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      <strong className="text-foreground">Platform tag matching:</strong> Ensure the platform tags you enter in the release builder (e.g. <code className="text-accent">darwin-aarch64</code> or <code className="text-accent">windows-x86_64</code>) match the <code className="text-accent">{'{{target}}'}</code> placeholders Tauri sends automatically.
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
