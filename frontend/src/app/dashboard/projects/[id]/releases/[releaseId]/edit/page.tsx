"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send, Trash2, Eye, Edit2, Box, Tag, Folder, Sparkles, Download, Check } from "lucide-react";
import { config } from "@/lib/config";
import ReactMarkdown from "react-markdown";

interface CustomAsset {
  id: string | number;
  name: string;
  tag?: string;
  sourceRepo: string;
  sourceReleaseId: string;
}

export default function EditReleasePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const releaseId = params.releaseId as string;

  const [project, setProject] = useState<any>(null);
  const [allReleases, setAllReleases] = useState<any[]>([]);
  const [currentRelease, setCurrentRelease] = useState<any>(null);
  
  // Custom edit state
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<CustomAsset[]>([]);
  const [isCurrent, setIsCurrent] = useState(false);
  
  // UI states
  const [activeArtifactIds, setActiveArtifactIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeDropdownAssetId, setActiveDropdownAssetId] = useState<string | number | null>(null);

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
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("akara_token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch project
        const projRes = await fetch(`${config.apiUrl}/projects/${projectId}`, { headers });
        if (!projRes.ok) throw new Error("Failed to fetch project");
        const projData = await projRes.json();
        setProject(projData);

        // Fetch all releases
        const relRes = await fetch(`${config.apiUrl}/projects/${projectId}/releases`, { headers });
        if (!relRes.ok) throw new Error("Failed to fetch releases");
        const relData = await relRes.json();
        setAllReleases(relData);

        // Find the release we are editing
        const rel = relData.find((r: any) => String(r.id) === releaseId);
        if (rel) {
          setCurrentRelease(rel);
          setCustomTitle(rel.customTitle || rel.title || rel.name || rel.tag || "");
          setCustomBody(rel.customBody !== undefined ? rel.customBody : (rel.body || ""));
          const assets = rel.customAssets || [];
          setSelectedAssets(assets);
          setIsCurrent(rel.isCurrent || false);

          // Auto-activate artifacts that have assets already selected
          const activeIds = new Set<string>();
          if (assets.length > 0) {
            assets.forEach((a: CustomAsset) => {
              activeIds.add(String(a.sourceReleaseId));
            });
          } else {
            // Otherwise, default to activating the current artifact being edited
            activeIds.add(String(rel.id));
          }
          setActiveArtifactIds(activeIds);
        } else {
          throw new Error("Release not found in this project");
        }
      } catch (err: any) {
        alert(err.message);
        router.push(`/dashboard/projects/${projectId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, releaseId, router]);

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
            tag: "",
            sourceRepo,
            sourceReleaseId: String(sourceRelId)
          }
        ];
      }
    });
  };

  const handleAssetPropChange = (assetId: string | number, field: "name" | "tag", value: string) => {
    setSelectedAssets(prev =>
      prev.map(a => (String(a.id) === String(assetId) ? { ...a, [field]: value } : a))
    );
  };

  const getReleaseTag = (sourceRelId: string | number) => {
    const found = allReleases.find(r => String(r.id) === String(sourceRelId));
    return found ? found.tag : `v${sourceRelId}`;
  };

  const handleSave = async (status: "draft" | "public") => {
    if (selectedAssets.length === 0) {
      alert("Validation Error: A release must contain at least 1 selected asset.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("akara_token");
      const res = await fetch(`${config.apiUrl}/projects/${projectId}/releases/${releaseId}/mapping`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customTitle,
          customBody,
          customAssets: selectedAssets,
          status,
          isCurrent
        })
      });

      if (!res.ok) throw new Error("Failed to save release mapping");
      
      alert(status === "public" ? "Release promoted successfully!" : "Draft saved successfully!");
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
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

  // Filter artifacts list (all releases act as artifacts)
  const artifacts = allReleases;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Editor Header */}
      <header className="border-b border-border bg-surface/30 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="flex items-center gap-2 font-mono text-xs font-bold text-foreground/60 hover:text-accent uppercase transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Project
          </Link>
          <div className="border-l border-border h-4 hidden md:block"></div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Release Builder Staging
            </h1>
            <p className="font-mono text-[10px] text-foreground/50 uppercase mt-0.5">
              Staging base artifact: <span className="text-accent">{currentRelease.tag}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase border border-border px-4 py-2 hover:bg-surface transition-colors"
          >
            {previewMode ? <Edit2 size={14} /> : <Eye size={14} />}
            {previewMode ? "Editor Mode" : "Preview Notes"}
          </button>

          <button
            disabled={saving}
            onClick={() => handleSave("draft")}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase border border-border px-4 py-2 bg-surface hover:bg-surface-hover text-foreground transition-colors"
          >
            <Save size={14} />
            Save Draft
          </button>

          <button
            disabled={saving || selectedAssets.length === 0}
            onClick={() => handleSave("public")}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase bg-accent text-background px-4 py-2 hover:bg-accent/80 transition-colors brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Publish Release
          </button>
        </div>
      </header>

      {/* Editor Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-68px)]">
        
        {/* Left Columns: 🧩 Asset Picker */}
        <div className="lg:col-span-7 border-r border-border grid grid-cols-1 md:grid-cols-12 bg-surface/5">
          
          {/* Left Panel: Selected Artifacts List */}
          <div className="md:col-span-4 border-r border-border/60 p-6 flex flex-col bg-surface/10">
            <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider block mb-4 pb-2 border-b border-border">
              1. Source Artifacts
            </span>
            <p className="text-[10px] font-mono text-foreground/50 uppercase mb-4">
              Toggle artifacts to view and pick assets to bundle:
            </p>
            <div className="space-y-2 overflow-y-auto max-h-[60vh] md:max-h-none flex-1 pr-1">
              {artifacts.map(art => {
                const isActive = activeArtifactIds.has(String(art.id));
                const assetsCount = art.assets?.length || 0;
                return (
                  <button
                    key={art.id}
                    onClick={() => toggleArtifactActive(String(art.id))}
                    className={`w-full text-left p-3 border font-mono text-xs transition-all flex items-center justify-between ${
                      isActive 
                        ? "border-accent bg-accent/5 text-foreground" 
                        : "border-border/60 bg-background/50 text-foreground/60 hover:border-border"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold truncate">{art.tag}</div>
                      <div className="text-[9px] opacity-60 truncate">{art.sourceRepo}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 bg-surface border border-border/80">
                        {assetsCount}
                      </span>
                      <div className={`w-3.5 h-3.5 border flex items-center justify-center ${isActive ? "border-accent bg-accent text-background" : "border-border"}`}>
                        {isActive && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Picker Panel: Assets Grouped by Selected Artifact */}
          <div className="md:col-span-8 p-6 flex flex-col overflow-y-auto">
            <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider block mb-4 pb-2 border-b border-border">
              2. Select Assets
            </span>
            
            {activeArtifactIds.size === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border border-border border-dashed font-mono text-xs text-foreground/40 text-center">
                <Folder size={24} className="mb-2 opacity-50" />
                Select at least one source artifact from the left column to view assets.
              </div>
            ) : (
              <div className="space-y-6 flex-1 pr-1">
                {artifacts
                  .filter(art => activeArtifactIds.has(String(art.id)))
                  .map(art => {
                    const artAssets = art.assets || [];
                    return (
                      <div key={art.id} className="border border-border/60 bg-surface/30 p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-mono text-xs font-black uppercase text-foreground/80 flex items-center gap-1.5">
                            <Folder size={12} className="text-accent" />
                            Artifact {art.tag}
                          </h4>
                          <span className="text-[9px] font-mono opacity-50 uppercase">{art.sourceRepo}</span>
                        </div>

                        {artAssets.length === 0 ? (
                          <p className="font-mono text-[10px] text-foreground/40 italic">No assets found in this artifact.</p>
                        ) : (
                          <div className="space-y-2">
                            {artAssets.map((asset: any) => {
                              const isSelected = selectedAssets.some(a => String(a.id) === String(asset.id));
                              return (
                                <div 
                                  key={asset.id} 
                                  className={`flex items-center justify-between p-3 bg-background border rounded-sm transition-all ${
                                    isSelected ? "border-accent/50" : "border-border/40"
                                  }`}
                                >
                                  <label className="flex items-center gap-3 cursor-pointer font-mono text-xs text-foreground/80 hover:text-foreground flex-1 min-w-0 mr-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleAssetToggle(asset, art.sourceRepo, art.id)}
                                      className="accent-accent cursor-pointer shrink-0"
                                    />
                                    <span className="font-bold truncate">{asset.name}</span>
                                  </label>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {asset.browser_download_url && (
                                      <a
                                        href={asset.browser_download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Download original file"
                                        className="p-1 text-foreground/40 hover:text-accent transition-colors"
                                      >
                                        <Download size={12} />
                                      </a>
                                    )}
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface text-foreground/50 border border-border/40">
                                      {asset.size ? `${(asset.size / (1024 * 1024)).toFixed(2)} MB` : "file"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 🚀 Release Builder Screen */}
        <div className="lg:col-span-5 flex flex-col p-8 bg-surface/10 overflow-y-auto">
          {previewMode ? (
            <div className="flex flex-col h-full">
              <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider mb-4 border-b border-border pb-2">
                Markdown Preview
              </span>
              <div className="prose prose-invert max-w-none font-mono text-sm text-foreground/80 flex-1">
                <h1 className="text-2xl font-black uppercase tracking-tight mb-4">{customTitle || "Untitled Release"}</h1>
                {customBody ? <ReactMarkdown>{customBody}</ReactMarkdown> : <p className="italic text-foreground/40">No notes written yet.</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider block mb-4 border-b border-border pb-2">
                  3. Customize Release Details
                </span>
                
                {/* Release Name */}
                <div className="mb-4">
                  <label className="block font-mono text-[10px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5">
                    Release Name / Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Version 2.0 Stable Build"
                    className="w-full bg-surface border border-border px-3 py-2 font-mono text-sm text-foreground focus:border-accent outline-none"
                  />
                </div>

                {/* Release Notes */}
                <div className="mb-6">
                  <label className="block font-mono text-[10px] font-bold text-foreground/60 uppercase tracking-wider mb-1.5">
                    Release Notes (Markdown)
                  </label>
                  <textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="Describe changes, enhancements, and bug fixes..."
                    className="w-full bg-surface border border-border p-3 font-mono text-xs text-foreground/90 focus:border-accent outline-none resize-none h-44"
                  />
                </div>

                {/* Selected Assets with metadata edits */}
                <div className="mb-6">
                  <label className="block font-mono text-[10px] font-bold text-foreground/60 uppercase tracking-wider mb-3">
                    Staged Release Assets ({selectedAssets.length})
                  </label>

                  {selectedAssets.length === 0 ? (
                    <div className="border border-border/80 border-dashed p-6 text-center text-[11px] font-mono text-accent uppercase">
                      ⚠️ A release must contain at least 1 asset.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedAssets.map((asset) => {
                        const originalAsset = allReleases
                          .find(r => String(r.id) === String(asset.sourceReleaseId))
                          ?.assets?.find((a: any) => String(a.id) === String(asset.id));

                        return (
                          <div key={asset.id} className="border border-border bg-background p-3 rounded-sm space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-mono text-xs font-bold text-foreground/90 truncate">
                                  {asset.name}
                                </div>
                                <div className="font-mono text-[10px] text-foreground/40 mt-0.5">
                                  provenance: <span className="text-foreground/60 font-bold">{originalAsset?.name || asset.name}</span> (from {getReleaseTag(asset.sourceReleaseId)})
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssetToggle(asset, asset.sourceRepo, asset.sourceReleaseId)}
                                className="text-foreground/40 hover:text-red-500 transition-colors p-1"
                                title="Remove asset"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                              <div>
                                <label className="block text-[8px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1">
                                  Public Filename
                                </label>
                                <input
                                  type="text"
                                  value={asset.name}
                                  onChange={(e) => handleAssetPropChange(asset.id, "name", e.target.value)}
                                  className="w-full bg-surface border border-border px-2 py-1 font-mono text-[10px] text-foreground outline-none focus:border-accent"
                                />
                              </div>
                              <div className="relative">
                                <label className="block text-[8px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1">
                                  Platform / OS Tag
                                </label>
                                <input
                                  type="text"
                                  value={asset.tag || ""}
                                  onChange={(e) => handleAssetPropChange(asset.id, "tag", e.target.value)}
                                  onFocus={() => setActiveDropdownAssetId(asset.id)}
                                  onBlur={() => {
                                    // Delay to let onMouseDown handler select the option before closing
                                    setTimeout(() => setActiveDropdownAssetId(null), 150);
                                  }}
                                  placeholder="e.g. macOS-x64, Linux"
                                  className="w-full bg-surface border border-border px-2 py-1 font-mono text-[10px] text-foreground outline-none focus:border-accent"
                                />
                                {activeDropdownAssetId === asset.id && (
                                  <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border py-1 shadow-xl max-h-36 overflow-y-auto font-mono text-[10px]">
                                    {PLATFORMS.map((plat) => (
                                      <div
                                        key={plat}
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevents blur event from firing too early
                                          handleAssetPropChange(asset.id, "tag", plat);
                                          setActiveDropdownAssetId(null);
                                        }}
                                        className="px-2 py-1 hover:bg-accent hover:text-background cursor-pointer transition-colors"
                                      >
                                        {plat}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Current toggle checkbox */}
                <div className="pt-4 border-t border-border/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCurrent}
                      onChange={(e) => setIsCurrent(e.target.checked)}
                      className="accent-accent cursor-pointer w-4 h-4"
                    />
                    <div className="font-mono text-xs">
                      <span className="font-bold uppercase block">Set as Current Release</span>
                      <span className="text-[10px] text-foreground/50 uppercase">Mark this custom release bundle as active on the public page</span>
                    </div>
                  </label>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
