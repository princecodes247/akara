"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send, Plus, Trash2, Eye, Edit2, Box, Tag, Folder } from "lucide-react";
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

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
          setSelectedAssets(rel.customAssets || []);
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

  const handleSave = async (status: "draft" | "public") => {
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
          status
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Editor Header */}
      <header className="border-b border-border bg-surface/30 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="flex items-center gap-2 font-mono text-xs font-bold text-foreground/60 hover:text-accent uppercase transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <div className="border-l border-border h-4 hidden md:block"></div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Staging Release Editor</h1>
            <p className="font-mono text-xs text-foreground/50 uppercase mt-0.5">
              Original tag: <span className="text-accent">{currentRelease.tag}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase border border-border px-4 py-2 hover:bg-surface transition-colors"
          >
            {previewMode ? <Edit2 size={14} /> : <Eye size={14} />}
            {previewMode ? "Edit Mode" : "Preview Notes"}
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
            disabled={saving}
            onClick={() => handleSave("public")}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase bg-accent text-background px-4 py-2 hover:bg-accent/80 transition-colors brutalist-shadow"
          >
            <Send size={14} />
            Publish Public
          </button>
        </div>
      </header>

      {/* Editor Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Markdown Editor / Title */}
        <div className={`lg:col-span-7 flex flex-col border-r border-border p-8 overflow-y-auto ${previewMode ? "hidden lg:flex" : ""}`}>
          <div className="mb-6">
            <label className="block font-mono text-xs font-bold text-accent uppercase tracking-wider mb-2">Curated Release Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Version 2.0 Stable Build"
              className="w-full bg-surface border border-border px-4 py-3 font-sans font-bold text-lg text-foreground focus:border-accent outline-none"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[400px]">
            <label className="block font-mono text-xs font-bold text-accent uppercase tracking-wider mb-2">Changelog Markdown Notes</label>
            <textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              placeholder="Write your public release notes here..."
              className="flex-1 w-full bg-surface border border-border p-4 font-mono text-sm text-foreground/90 focus:border-accent outline-none resize-none min-h-[350px]"
            />
          </div>
        </div>

        {/* Right Side: Markdown Preview OR Multi-Repo Asset Collector */}
        <div className={`lg:col-span-5 flex flex-col bg-surface/10 overflow-y-auto p-8`}>
          {previewMode ? (
            <div className="flex flex-col h-full">
              <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider mb-4 border-b border-border pb-2">Markdown Preview</span>
              <div className="prose prose-invert max-w-none font-mono text-sm text-foreground/80 flex-1">
                <h1 className="text-2xl font-black uppercase tracking-tight mb-4">{customTitle || "Untitled Release"}</h1>
                {customBody ? <ReactMarkdown>{customBody}</ReactMarkdown> : <p className="italic text-foreground/40">No notes written yet.</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Asset Bundling Collector Section */}
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider block mb-4 border-b border-border pb-2 flex items-center gap-2">
                  <Box size={14} />
                  Assemble Assets from Project Repos
                </span>
                
                <div className="space-y-6">
                  {project?.sourceRepos?.map((repo: string) => {
                    const repoReleases = allReleases.filter(r => r.sourceRepo === repo);
                    return (
                      <div key={repo} className="border border-border p-4 bg-surface/30">
                        <h3 className="font-mono text-xs font-black uppercase tracking-wider mb-3 text-foreground/75 flex items-center gap-1.5">
                          <Folder size={12} className="text-accent" />
                          {repo}
                        </h3>

                        {repoReleases.length === 0 ? (
                          <p className="font-mono text-[11px] text-foreground/40 italic">No releases in this repo.</p>
                        ) : (
                          <div className="space-y-4">
                            {repoReleases.map(rel => (
                              <div key={rel.id} className="border-t border-border/40 pt-3 first:border-0 first:pt-0">
                                <div className="font-mono text-[10px] font-bold text-accent/80 uppercase mb-2">
                                  Release: {rel.tag}
                                </div>
                                <div className="space-y-2">
                                  {rel.assets?.map((asset: any) => {
                                    const isSelected = selectedAssets.some(a => String(a.id) === String(asset.id));
                                    const customAsset = selectedAssets.find(a => String(a.id) === String(asset.id));

                                    return (
                                      <div key={asset.id} className="flex flex-col gap-2 p-2 bg-background border border-border/50 rounded-sm">
                                        <div className="flex items-center justify-between">
                                          <label className="flex items-center gap-2 cursor-pointer font-mono text-[11px] text-foreground/80 hover:text-foreground">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleAssetToggle(asset, repo, rel.id)}
                                              className="accent-accent cursor-pointer"
                                            />
                                            {asset.name}
                                          </label>
                                        </div>

                                        {/* Staging properties edit if selected */}
                                        {isSelected && customAsset && (
                                          <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-border/30">
                                            <div>
                                              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1">Public File Name</label>
                                              <input
                                                type="text"
                                                value={customAsset.name}
                                                onChange={(e) => handleAssetPropChange(asset.id, "name", e.target.value)}
                                                className="w-full bg-surface border border-border px-2 py-1 font-mono text-[10px] text-foreground outline-none focus:border-accent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-foreground/50 mb-1">Arch/OS Tag</label>
                                              <input
                                                type="text"
                                                value={customAsset.tag || ""}
                                                onChange={(e) => handleAssetPropChange(asset.id, "tag", e.target.value)}
                                                placeholder="e.g. macOS-arm64"
                                                className="w-full bg-surface border border-border px-2 py-1 font-mono text-[10px] text-foreground outline-none focus:border-accent"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
