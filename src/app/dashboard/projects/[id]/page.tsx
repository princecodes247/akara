"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Server, GitMerge } from "lucide-react";
import { config } from "@/lib/config";
import { ReleaseCard } from "@/components/ReleaseCard";

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    fetchProjectData();
  }, [id]);

  const handleUpdateMapping = async (releaseId: number, data: { status?: "draft" | "public", isCurrent?: boolean, releaseData?: any }) => {
    try {
      const token = localStorage.getItem("akara_token");
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`${config.apiUrl}/projects/${id}/releases/${releaseId}/mapping`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update mapping");
      
      // Update local state without refetching to be snappy
      setReleases(prev => prev.map(r => {
        if (r.id === releaseId) {
          return { ...r, ...data };
        }
        if (data.isCurrent && r.id !== releaseId) {
          return { ...r, isCurrent: false }; // Ensure only one is current
        }
        return r;
      }));
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500 flex flex-col h-full items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-accent mb-4" />
        <p className="font-mono text-foreground/60 uppercase tracking-wider">Syncing Revisions...</p>
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
          <h1 className="text-4xl font-black uppercase tracking-tighter truncate" title={project.name}>{project.name}</h1>
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
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent shrink-0 w-24">Target</span>
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

      {/* Main Content Area */}
      <div className="p-8 md:p-12 flex-1 max-w-7xl mx-auto w-full">
        <div className="mb-8 border-b border-border pb-4 flex justify-between items-end">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Aggregated Releases</h2>
          <span className="font-mono text-sm text-foreground/50 uppercase">{releases.length} found</span>
        </div>

        {releases.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-border border-dashed bg-surface/10">
            <Server size={32} className="text-foreground/30 mb-4" />
            <h3 className="font-mono font-bold text-lg mb-2 uppercase tracking-wide">No Releases Found</h3>
            <p className="text-sm font-mono text-foreground/50 text-center max-w-md">
              We couldn't find any releases in the mapped source repositories. Create a release on GitHub to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {releases.map(release => (
              <ReleaseCard 
                key={`${release.sourceRepo}-${release.id}`} 
                release={release} 
                onUpdateMapping={handleUpdateMapping}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
