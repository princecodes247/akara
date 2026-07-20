"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send, Trash2, Edit2, Box, Tag, Sparkles, Check, ChevronDown, ChevronUp, FileCode, Search, MousePointerClick, RefreshCw, Eye } from "lucide-react";
import { config } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useProject } from "@/lib/api/hooks/useProjects";
import { useReleases, useUpdateReleaseMapping, useSyncReleaseAssets } from "@/lib/api/hooks/useReleases";

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
      alert("Validation Error: A release must contain at least 1 selected asset.");
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

      // Revalidate frontend cache
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent mb-4" size={48} />
        <p className="font-mono text-sm text-foreground/60 uppercase">Loading Editor Context...</p>
      </div>
    );
  }

  const artifacts = [...allReleases].sort((a: any, b: any) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Editor Header */}
      <header className="border-b border-border/50 bg-surface/10 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface/50 hover:bg-surface border border-border/50 transition-colors text-foreground group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="border-l border-border/50 h-6 hidden md:block mx-2"></div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Release Builder
            </h1>
            <p className="font-mono text-[10px] text-foreground/50 uppercase mt-0.5 tracking-wider">
              Base Artifact: <span className="text-accent font-bold">{currentRelease.tag}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase border border-border/50 rounded-lg px-4 py-2 hover:bg-surface/50 transition-colors shadow-sm"
          >
            {previewMode ? <Edit2 size={14} /> : <Eye size={14} />}
            {previewMode ? "Editor Mode" : "Preview"}
          </button>

          <button
            disabled={syncAssetsMutation.isPending}
            onClick={handleSync}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase border border-border/50 rounded-lg px-4 py-2 hover:bg-surface/50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={syncAssetsMutation.isPending ? "animate-spin" : ""} />
            Sync
          </button>

          <button
            disabled={saving}
            onClick={() => handleSave("draft")}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase border border-border/50 rounded-lg px-4 py-2 bg-surface/30 hover:bg-surface text-foreground transition-colors shadow-sm"
          >
            {saving && <RefreshCw size={14} className="animate-spin" />}
            {!saving && <Save size={14} />}
            Save Draft
          </button>

          <button
            disabled={saving || selectedAssets.length === 0}
            onClick={() => handleSave("public")}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase rounded-lg bg-accent text-background px-6 py-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Publish
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Release Details Form */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {previewMode ? (
              <div className="flex flex-col h-full bg-surface/10 border border-border/50 rounded-2xl p-8 shadow-sm">
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider mb-6 border-b border-border/30 pb-3 flex items-center gap-2">
                  <Eye size={16} /> Markdown Preview
                </span>
                <div className="prose prose-invert max-w-none font-sans text-sm text-foreground/80 flex-1">
                  <h1 className="text-3xl font-black uppercase tracking-tighter mb-6">{customTitle || "Untitled Release"}</h1>
                  {customBody ? <div dangerouslySetInnerHTML={{ __html: customBody }} /> : <p className="italic text-foreground/40 font-mono text-xs">No release notes written yet.</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Basic Details Panel */}
                <div className="bg-surface/10 border border-border/50 rounded-2xl p-8 shadow-sm">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-6 pb-3 border-b border-border/30 flex items-center gap-2">
                    <Edit2 size={16} className="text-accent" /> 1. Release Details
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block font-mono text-[11px] font-bold text-foreground/60 uppercase tracking-wider mb-2">
                        Release Title
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Version 2.0 Stable Build"
                        className="w-full bg-background border border-border/50 rounded-lg px-4 py-3 font-sans text-lg font-bold text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] font-bold text-foreground/60 uppercase tracking-wider mb-2">
                        Release Notes
                      </label>
                      <RichTextEditor
                        content={customBody}
                        onChange={setCustomBody}
                        placeholder="Describe changes, enhancements, and bug fixes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Assets Panel */}
                <div className="bg-surface/10 border border-border/50 rounded-2xl p-8 shadow-sm">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-6 pb-3 border-b border-border/30 flex items-center gap-2">
                    <Box size={16} className="text-accent" /> 2. Selected Assets
                    <span className="ml-auto bg-surface px-2 py-0.5 rounded text-[10px] text-foreground/60">{selectedAssets.length} Assets</span>
                  </h3>

                  {selectedAssets.length === 0 ? (
                    <div className="border border-border/50 border-dashed rounded-xl p-8 text-center bg-background/50">
                      <MousePointerClick size={32} className="mx-auto text-foreground/20 mb-3" />
                      <p className="font-mono text-sm text-foreground/50">No assets selected yet.</p>
                      <p className="font-mono text-[10px] text-foreground/40 mt-1 uppercase">Select assets from the Artifacts Manager on the right.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                              className="border border-border/50 bg-background rounded-xl p-5 space-y-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-4 border-b border-border/30 pb-4">
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="p-2 bg-surface/50 rounded-lg shrink-0 text-accent"><FileCode size={16} /></div>
                                  <div>
                                    <div className="font-mono text-sm font-bold text-foreground/90 truncate">
                                      {asset.name}
                                    </div>
                                    <div className="font-mono text-[10px] text-foreground/40 mt-1 truncate">
                                      from <span className="text-foreground/60 font-bold">{originalAsset?.name || asset.name}</span> <span className="opacity-50">({getReleaseTag(asset.sourceReleaseId)})</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssetToggle(asset, asset.sourceRepo, asset.sourceReleaseId)}
                                  className="text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors p-2 shrink-0"
                                  title="Remove asset"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                                    Display Filename
                                  </label>
                                  <input
                                    type="text"
                                    value={asset.name}
                                    onChange={(e) => handleAssetPropChange(asset.id, "name", e.target.value)}
                                    className="w-full bg-surface/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent focus:bg-background transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                                    Platform Tag (OTA Updater / Installer)
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      list="platform-suggestions"
                                      value={asset.tag || ""}
                                      onChange={(e) => handleAssetPropChange(asset.id, "tag", e.target.value)}
                                      className="w-full bg-surface/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent focus:bg-background transition-colors"
                                      placeholder="e.g. darwin-aarch64 (for OTA) or macOS-arm64"
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
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                                  Cryptographic Signature (For OTA Updates)
                                </label>
                                <textarea
                                  value={asset.signature || ""}
                                  onChange={(e) => handleAssetPropChange(asset.id, "signature", e.target.value)}
                                  placeholder="Paste the contents of the .sig file here if this is an OTA updater bundle..."
                                  className="w-full bg-surface/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-[10px] text-foreground/80 outline-none focus:border-accent focus:bg-background transition-colors min-h-[60px] resize-y"
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
                <div className="bg-surface/10 border border-border/50 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">Set as Current Release</h3>
                    <p className="font-mono text-[10px] text-foreground/50 uppercase mt-1">Make this the primary active bundle on the public page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCurrent(!isCurrent)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isCurrent ? 'bg-accent' : 'bg-surface border-border/50'}`}
                    role="switch"
                    aria-checked={isCurrent}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCurrent ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Artifact Manager (Accordion) */}
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-[100px] max-h-[calc(100vh-120px)] flex flex-col bg-surface/10 border border-border/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Box size={16} className="text-accent" /> Artifacts Manager
                </h3>
                <p className="font-mono text-[10px] text-foreground/50 uppercase mt-1.5">Expand an artifact to extract assets for this release.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {artifacts.length === 0 ? (
                  <div className="p-8 text-center text-foreground/40 font-mono text-xs">No artifacts found.</div>
                ) : (
                  artifacts.map(art => {
                    const isActive = activeArtifactIds.has(String(art.id));
                    const artAssets = art.assets || [];
                    const selectedCount = artAssets.filter((a: any) => selectedAssets.some(sa => String(sa.id) === String(a.id))).length;

                    return (
                      <div key={art.id} className="border border-border/50 bg-background rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => toggleArtifactActive(String(art.id))}
                          className={`w-full p-4 flex items-center justify-between font-mono text-left transition-colors ${isActive ? "bg-surface/50" : "hover:bg-surface/30"}`}
                        >
                          <div className="min-w-0 pr-4">
                            <div className="font-bold text-sm tracking-tight truncate flex items-center gap-2">
                              {art.tag}
                              {selectedCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[9px] border border-accent/20">
                                  {selectedCount} selected
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-foreground/50 mt-1 truncate">{art.sourceRepo}</div>
                          </div>
                          <div className="shrink-0 text-foreground/40">
                            {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                              <div className="p-4 pt-0 border-t border-border/30 bg-surface/20">
                                {artAssets.length === 0 ? (
                                  <p className="font-mono text-[10px] text-foreground/40 italic py-2 text-center">No assets in this artifact.</p>
                                ) : (
                                  <div className="space-y-2 mt-4">
                                    {artAssets.map((asset: any) => {
                                      const isSelected = selectedAssets.some(a => String(a.id) === String(asset.id));
                                      return (
                                        <label 
                                          key={asset.id} 
                                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                            isSelected ? "bg-accent/5 border-accent/40 shadow-sm" : "bg-background border-border/40 hover:border-border/80"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isSelected}
                                            onChange={() => handleAssetToggle(asset, art.sourceRepo, art.id)}
                                          />
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected ? "bg-accent border-accent text-background" : "border-border/80 bg-surface/50"
                                          }`}>
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                          </div>
                                          <div className="font-mono text-xs text-foreground/90 truncate flex-1">
                                            {asset.name}
                                          </div>
                                          {asset.size && (
                                            <div className="text-[9px] font-mono text-foreground/40 shrink-0">
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
