"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Download, Calendar, GitBranch, Terminal } from "lucide-react";
import { config } from "@/lib/config";
import ReactMarkdown from "react-markdown";

export default function PublicReleasePage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<{ project: any; releases: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/public/projects/${id}`);
        if (!res.ok) {
          throw new Error("Project not found or an error occurred.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 size={48} className="animate-spin text-accent mb-4" />
        <p className="font-mono text-foreground/60 uppercase tracking-wider">Syncing Release Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-12">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-8 font-mono max-w-lg w-full text-center">
          <Terminal size={32} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold uppercase mb-2">Error</h2>
          <p>{error || "Could not load project releases."}</p>
        </div>
      </div>
    );
  }

  const project = data.project;
  const releases = data.releases;

  // Find explicitly marked current release, or fallback to the newest one
  const explicitCurrent = releases.find(r => r.isCurrent);
  const currentRelease = explicitCurrent || (releases.length > 0 ? releases[0] : null);
  
  // Previous releases are all other releases
  const previousReleases = releases.filter(r => r.id !== currentRelease?.id);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-4xl border-b border-border p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end bg-surface/30">
        <div>
          <span className="text-accent font-mono text-xs font-bold tracking-wider uppercase mb-2 block">Official Releases For</span>
          <h1 className="text-5xl font-black uppercase tracking-tighter truncate">{project.name}</h1>
        </div>
        {project.targetRepo && (
          <div className="flex items-center gap-2 font-mono text-xs text-foreground/60 bg-background border border-border px-3 py-2 mt-4 md:mt-0 uppercase font-bold tracking-wider">
            <GitBranch size={14} />
            {project.targetRepo}
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl p-8 md:p-12 flex-1">
        {/* Current Release */}
        {currentRelease ? (
          <div className="mb-16">
            <h2 className="text-sm font-mono font-bold text-accent uppercase tracking-widest mb-6 border-l-2 border-accent pl-3">
              🔝 Current Release
            </h2>
            
            <div className="border border-border bg-surface/10 p-8 md:p-12 brutalist-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-foreground text-background font-mono font-black text-xl px-3 py-1 uppercase tracking-tight">
                      {currentRelease.tag}
                    </span>
                    {(currentRelease.draft || currentRelease.prerelease) && (
                      <span className="text-xs font-mono font-bold px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 uppercase tracking-widest">
                        {currentRelease.draft ? "Draft" : "Pre-release"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground/90">
                    {currentRelease.title || currentRelease.tag}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-foreground/50 font-mono text-sm uppercase font-bold shrink-0">
                  <Calendar size={16} />
                  {currentRelease.publishedAt 
                    ? new Date(currentRelease.publishedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
                    : "Not Published"
                  }
                </div>
              </div>

              {/* Assets / Downloads */}
              {currentRelease.assets && currentRelease.assets.length > 0 && (
                <div className="mb-8 border-b border-border pb-8">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/60 block mb-4">Downloads</span>
                  <div className="flex flex-wrap gap-4">
                    {currentRelease.assets.map((asset: any) => (
                      <a 
                        key={asset.id} 
                        href={asset.url}
                        className="flex items-center gap-3 border border-border bg-background hover:border-accent hover:text-accent transition-colors px-4 py-3 font-mono text-sm group"
                      >
                        <Download size={16} className="text-foreground/50 group-hover:text-accent" />
                        <span className="font-bold">{asset.name}</span>
                        <span className="text-xs text-foreground/40">({asset.downloadCount} dl)</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Release Notes */}
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/60 block mb-4">Release Notes</span>
                <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-li:font-mono prose-li:text-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-a:text-accent prose-code:text-accent">
                  {currentRelease.body ? (
                    <ReactMarkdown>{currentRelease.body}</ReactMarkdown>
                  ) : (
                    <p className="italic text-foreground/50">No release notes provided.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-border border-dashed p-12 text-center text-foreground/50 font-mono uppercase tracking-wider mb-16">
            No official releases found.
          </div>
        )}

        {/* Previous Releases */}
        {previousReleases.length > 0 && (
          <div>
            <h2 className="text-sm font-mono font-bold text-foreground/60 uppercase tracking-widest mb-6 border-l-2 border-border pl-3">
              📜 Previous Releases
            </h2>
            
            <div className="flex flex-col gap-4">
              {previousReleases.map((release) => (
                <div key={release.id} className="flex flex-col md:flex-row justify-between md:items-center p-6 border border-border bg-surface/20 hover:border-foreground transition-colors group">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <span className="font-mono font-bold text-lg w-24 shrink-0 group-hover:text-accent transition-colors">
                      {release.tag}
                    </span>
                    <h4 className="font-bold uppercase tracking-tight text-foreground/80 line-clamp-1">
                      {release.title || release.tag}
                    </h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-xs text-foreground/40 uppercase whitespace-nowrap">
                      {release.publishedAt 
                        ? new Date(release.publishedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
                        : "Draft"
                      }
                    </span>
                    {release.assets && release.assets.length > 0 && (
                      <span className="font-mono text-xs font-bold border border-border px-2 py-1 text-foreground/60 uppercase">
                        {release.assets.length} Asset{release.assets.length !== 1 && 's'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
