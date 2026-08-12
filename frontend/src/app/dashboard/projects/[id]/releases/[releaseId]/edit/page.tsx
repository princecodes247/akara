"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send, Trash2, Edit2, Box, Tag, Sparkles, Check, ChevronDown, ChevronUp, FileCode, Search, MousePointerClick, RefreshCw, Eye } from "lucide-react";
import { config } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useProject } from "@/lib/api/hooks/useProjects";
import { useReleases, useUpdateReleaseMapping, useSyncReleaseAssets } from "@/lib/api/hooks/useReleases";
import { EditReleaseSkeleton } from "@/components/ui/Skeleton";

interface CustomAsset {
  id: string | number;
  name: string;
  tag?: string;
  signature?: string;
  sourceRepo: string;
  sourceReleaseId: string;
}

export default function EditReleasePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const releaseId = params.releaseId as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: allReleases = [], isLoading: releasesLoading } = useReleases(projectId);
  const loading = projectLoading || releasesLoading;

  const currentRelease = allReleases.find((r: any) => String(r.id) === releaseId);

  // Custom edit state
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<CustomAsset[]>([]);
  const [isCurrent, setIsCurrent] = useState(false);

  // UI states
  const [activeArtifactIds, setActiveArtifactIds] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const PLATFORMS = [
    "macOS-x64",
    "macOS-arm64",
    "Windows-x64",
    "Windows-arm64",
    "Linux-x64",
    "Linux-arm64",
    "Android",
    "iOS"
  ];

  useEffect(() => {
    if (!loading && allReleases.length > 0 && currentRelease && !hasInitialized) {
      setCustomTitle(currentRelease.customTitle || currentRelease.title || currentRelease.name || currentRelease.tag || "");
      let initialBody = "";
      if (currentRelease.customBody !== undefined) {
        initialBody = currentRelease.customBody;
      } else if (currentRelease.body) {
        initialBody = currentRelease.body;
      } else {
        const sortedRels = [...allReleases].sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
          return dateB - dateA;
        });
        const previousRelease = sortedRels.find((r: any) => String(r.id) !== releaseId && (r.customBody || r.body));
        if (previousRelease) {
          initialBody = previousRelease.customBody || previousRelease.body || "";
        }
      }
      setCustomBody(initialBody);
      const assets = currentRelease.customAssets || [];
      setSelectedAssets(assets);
      setIsCurrent(currentRelease.isCurrent || false);

      const activeIds = new Set<string>();
      if (assets.length > 0) {
        assets.forEach((a: CustomAsset) => {
          activeIds.add(String(a.sourceReleaseId));
        });
      } else {
        activeIds.add(String(currentRelease.id));
      }
      setActiveArtifactIds(activeIds);
      setHasInitialized(true);
    } else if (!loading && !currentRelease) {
      alert("Release not found in this project");
      router.push(`/dashboard/projects/${projectId}`);
    }
  }, [loading, allReleases, currentRelease, hasInitialized, projectId, releaseId, router]);

  const toggleArtifactActive = (id: string) => {
    setActiveArtifactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const inferPlatformTag = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.includes("mac") || lower.includes("darwin") || lower.endsWith(".dmg") || lower.endsWith(".pkg")) {
      if (lower.includes("arm64") || lower.includes("aarch64") || lower.includes("m1")) return "macOS-arm64";
      return "macOS-x64";
    }
    if (lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi")) {
      if (lower.includes("arm64")) return "Windows-arm64";
      return "Windows-x64";
    }
    if (lower.includes("linux") || lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm") || lower.endsWith(".tar.gz")) {
      if (lower.includes("arm64") || lower.includes("aarch64")) return "Linux-arm64";
      return "Linux-x64";
    }
    if (lower.endsWith(".apk") || lower.includes("android")) return "Android";
    if (lower.endsWith(".ipa") || lower.includes("ios")) return "iOS";
    return "";
  };

  const handleAssetToggle = (asset: any, sourceRepo: string, sourceRelId: string) => {
    setSelectedAssets(prev => {
      const exists = prev.some(a => String(a.id) === String(asset.id));
      if (exists) {
        return prev.filter(a => String(a.id) !== String(asset.id));
      } else {
        return [
          ...prev,
          {
            id: asset.id,
            name: asset.name,
            tag: inferPlatformTag(asset.name),
            sourceRepo,
            sourceReleaseId: String(sourceRelId)
          }
        ];
      }
    });
  };

  const handleAssetPropChange = (assetId: string | number, field: "name" | "tag" | "signature", value: string) => {
    setSelectedAssets(prev =>
      prev.map(a => (String(a.id) === String(assetId) ? { ...a, [field]: value } : a))
    );
  };

  const getReleaseTag = (sourceRelId: string | number) => {
    const found = allReleases.find(r => String(r.id) === String(sourceRelId));
    return found ? found.tag : `v${sourceRelId}`;
  };

  const updateMappingMutation = useUpdateReleaseMapping(projectId, releaseId);
  const syncAssetsMutation = useSyncReleaseAssets(projectId, releaseId);

  const handleSave = async (status: "draft" | "public") => {
    if (selectedAssets.length === 0) {
      alert("A release must contain at least 1 selected asset.");
      return;
    }

    setSaving(true);
    try {
      await updateMappingMutation.mutateAsync({
        customTitle,
        customBody,
        customAssets: selectedAssets,
        status,
        isCurrent,
        releaseData: currentRelease
      });

      await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project?.slug || projectId })
      });

      alert(status === "public" ? "Release published successfully!" : "Draft saved successfully!");
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      await syncAssetsMutation.mutateAsync();
      alert("Assets synced successfully from GitHub!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !currentRelease) {
    return <EditReleaseSkeleton />;
  }

  const artifacts = useMemo(() => {
    return [...allReleases].sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
      return dateB - dateA;
    });
  }, [allReleases]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface/30 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors text-foreground-muted hover:text-foreground group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="border-l border-border h-5 hidden md:block mx-1"></div>
          <div>
            <h1 className="text-base font-medium text-foreground flex items-center gap-2">
              <Sparkles size={15} className="text-accent" />
              Release builder
            </h1>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Base artifact: <span className="text-foreground font-mono font-medium">{currentRelease.tag}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-secondary text-xs"
          >
            {previewMode ? <Edit2 size={13} /> : <Eye size={13} />}
            {previewMode ? "Editor" : "Preview"}
          </button>

          <button
            disabled={syncAssetsMutation.isPending}
            onClick={handleSync}
            className="btn-secondary text-xs"
          >
            <RefreshCw size={13} className={syncAssetsMutation.isPending ? "animate-spin" : ""} />
            Sync
          </button>

          <button
            disabled={saving}
            onClick={() => handleSave("draft")}
            className="btn-secondary text-xs"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            Save draft
          </button>

          <button
            disabled={saving || selectedAssets.length === 0}
            onClick={() => handleSave("public")}
            className="btn-primary text-xs"
          >
            <Send size={13} />
            Publish
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {previewMode ? (
              <div className="flex flex-col h-full card-lg p-6 md:p-8">
                <span className="text-xs font-medium text-foreground-muted mb-5 pb-3 border-b border-border flex items-center gap-2">
                  <Eye size={14} /> Preview
                </span>
                <div className="prose prose-invert max-w-none text-sm text-foreground/80 flex-1">
                  <h1 className="font-display text-3xl font-light tracking-tight mb-6 !text-foreground">{customTitle || "Untitled Release"}</h1>
                  {customBody ? <div dangerouslySetInnerHTML={{ __html: customBody }} /> : <p className="italic text-foreground-muted text-xs">No release notes written yet.</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Details */}
                <div className="card-lg p-6 md:p-8">
                  <h3 className="text-sm font-medium text-foreground mb-5 pb-3 border-b border-border flex items-center gap-2">
                    <Edit2 size={14} className="text-accent" /> 1. Release details
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-foreground-muted mb-2">
                        Release title
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Version 2.0 Stable Build"
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-lg font-medium text-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-foreground-muted/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground-muted mb-2">
                        Release notes
                      </label>
                      <RichTextEditor
                        content={customBody}
                        onChange={setCustomBody}
                        placeholder="Describe changes, enhancements, and bug fixes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Assets */}
                <div className="card-lg p-6 md:p-8">
                  <h3 className="text-sm font-medium text-foreground mb-5 pb-3 border-b border-border flex items-center gap-2">
                    <Box size={14} className="text-accent" /> 2. Selected assets
                    <span className="ml-auto text-xs text-foreground-muted bg-surface px-2 py-0.5 rounded-md">{selectedAssets.length}</span>
                  </h3>

                  {selectedAssets.length === 0 ? (
                    <div className="border border-border border-dashed rounded-xl p-8 text-center bg-background/50">
                      <MousePointerClick size={28} className="mx-auto text-foreground-muted/30 mb-3" />
                      <p className="text-sm text-foreground-muted">No assets selected yet.</p>
                      <p className="text-xs text-foreground-muted/60 mt-1">Select assets from the artifacts manager on the right.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {selectedAssets.map((asset) => {
                          const originalAsset = allReleases
                            .find(r => String(r.id) === String(asset.sourceReleaseId))
                            ?.assets?.find((a: any) => String(a.id) === String(asset.id));

                          return (
                            <motion.div
                              key={asset.id}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="border border-border bg-background rounded-xl p-4 space-y-4"
                            >
                              <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="p-2 bg-surface rounded-lg shrink-0 text-foreground-muted"><FileCode size={14} /></div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground/90 truncate font-mono">
                                      {asset.name}
                                    </div>
                                    <div className="text-[10px] text-foreground-muted mt-0.5 truncate">
                                      from <span className="text-foreground/60 font-medium">{originalAsset?.name || asset.name}</span> <span className="opacity-50">({getReleaseTag(asset.sourceReleaseId)})</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssetToggle(asset, asset.sourceRepo, asset.sourceReleaseId)}
                                  className="text-foreground-muted hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors p-1.5 shrink-0"
                                  title="Remove asset"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-medium text-foreground-muted mb-1.5">
                                    Display filename
                                  </label>
                                  <input
                                    type="text"
                                    value={asset.name}
                                    onChange={(e) => handleAssetPropChange(asset.id, "name", e.target.value)}
                                    className="w-full bg-surface/60 border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent/50 transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-foreground-muted mb-1.5">
                                    Platform tag
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      list="platform-suggestions"
                                      value={asset.tag || ""}
                                      onChange={(e) => handleAssetPropChange(asset.id, "tag", e.target.value)}
                                      className="w-full bg-surface/60 border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent/50 transition-colors"
                                      placeholder="e.g. darwin-aarch64"
                                    />
                                    <datalist id="platform-suggestions">
                                      <option value="darwin-x86_64" />
                                      <option value="darwin-aarch64" />
                                      <option value="windows-x86_64" />
                                      <option value="linux-x86_64" />
                                      {PLATFORMS.map(plat => (
                                        <option key={plat} value={plat} />
                                      ))}
                                    </datalist>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-medium text-foreground-muted mb-1.5">
                                  Cryptographic signature (OTA)
                                </label>
                                <textarea
                                  value={asset.signature || ""}
                                  onChange={(e) => handleAssetPropChange(asset.id, "signature", e.target.value)}
                                  placeholder="Paste .sig file contents here..."
                                  className="w-full bg-surface/60 border border-border rounded-lg px-3 py-2 font-mono text-[10px] text-foreground/80 outline-none focus:border-accent/50 transition-colors min-h-[50px] resize-y"
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Publish Settings */}
                <div className="card-lg p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Set as current release</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">Make this the primary active bundle on the public page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCurrent(!isCurrent)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isCurrent ? 'bg-accent' : 'bg-surface border border-border'}`}
                    role="switch"
                    aria-checked={isCurrent}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCurrent ? 'translate-x-6' : 'translate-x-1'} mt-[3px]`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Artifact Manager */}
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-[80px] max-h-[calc(100vh-100px)] flex flex-col card-lg overflow-hidden">
              <div className="p-5 border-b border-border bg-surface/30 backdrop-blur-sm z-10">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Box size={15} className="text-accent" /> Artifacts manager
                </h3>
                <p className="text-[11px] text-foreground-muted mt-1">Expand an artifact to extract assets for this release.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {artifacts.length === 0 ? (
                  <div className="p-8 text-center text-foreground-muted text-xs">No artifacts found.</div>
                ) : (
                  artifacts.map(art => {
                    const isActive = activeArtifactIds.has(String(art.id));
                    const artAssets = art.assets || [];
                    const selectedCount = artAssets.filter((a: any) => selectedAssets.some(sa => String(sa.id) === String(a.id))).length;

                    return (
                      <div key={art.id} className="border border-border bg-background rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleArtifactActive(String(art.id))}
                          className={`w-full p-3.5 flex items-center justify-between text-left transition-colors ${isActive ? "bg-surface/60" : "hover:bg-surface/30"}`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="font-medium text-sm tracking-tight truncate flex items-center gap-2">
                              {art.tag}
                              {selectedCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] border border-accent/15">
                                  {selectedCount} selected
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-foreground-muted mt-0.5 truncate">{art.sourceRepo}</div>
                          </div>
                          <div className="shrink-0 text-foreground-muted">
                            {isActive ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3.5 pt-0 border-t border-border bg-surface/20">
                                {artAssets.length === 0 ? (
                                  <p className="text-[10px] text-foreground-muted/60 italic py-3 text-center">No assets in this artifact.</p>
                                ) : (
                                  <div className="space-y-1.5 mt-3">
                                    {artAssets.map((asset: any) => {
                                      const isSelected = selectedAssets.some(a => String(a.id) === String(asset.id));
                                      return (
                                        <label
                                          key={asset.id}
                                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                            isSelected ? "bg-accent/5 border-accent/20" : "bg-background border-border hover:border-[#2a2a2a]"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isSelected}
                                            onChange={() => handleAssetToggle(asset, art.sourceRepo, art.id)}
                                          />
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected ? "bg-accent border-accent text-background" : "border-border bg-surface/50"
                                          }`}>
                                            {isSelected && <Check size={11} strokeWidth={3} />}
                                          </div>
                                          <div className="font-mono text-xs text-foreground/80 truncate flex-1">
                                            {asset.name}
                                          </div>
                                          {asset.size && (
                                            <div className="text-[9px] font-mono text-foreground-muted shrink-0">
                                              {(asset.size / (1024 * 1024)).toFixed(1)} MB
                                            </div>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
