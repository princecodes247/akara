import { Calendar, Tag, GitBranch, Box, CheckCircle, Globe, Edit3, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface ReleaseCardProps {
  release: {
    id: number;
    tag: string;
    title: string;
    body: string;
    draft: boolean;
    prerelease: boolean;
    publishedAt: string;
    url: string;
    sourceRepo: string;
    assets: any[];
    status?: "draft" | "public";
    isCurrent?: boolean;
  };
  projectId?: string;
  onUpdateMapping?: (releaseId: number, data: { status?: "draft" | "public", isCurrent?: boolean, releaseData?: any }) => Promise<void>;
}

export function ReleaseCard({ release, projectId, onUpdateMapping }: ReleaseCardProps) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (data: { status?: "draft" | "public", isCurrent?: boolean, releaseData?: any }) => {
    if (!onUpdateMapping) return;
    setUpdating(true);
    try {
      // Include the current release data so the backend can cache it
      await onUpdateMapping(release.id, { ...data, releaseData: release });
    } finally {
      setUpdating(false);
    }
  };

  const publishedDate = release.publishedAt 
    ? new Date(release.publishedAt).toLocaleDateString("en-US", { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })
    : "Draft / Not Published";

  return (
    <div className="bg-background border border-border flex flex-col group hover:border-accent transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-border bg-surface/30">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold font-mono tracking-tight text-foreground group-hover:text-accent transition-colors">
            {release.title || release.tag}
          </h2>
          <div className="flex items-center gap-2">
            {release.draft && (
              <span className="text-[10px] font-mono font-bold px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 uppercase">
                Draft
              </span>
            )}
            {release.prerelease && (
              <span className="text-[10px] font-mono font-bold px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/30 uppercase">
                Pre-release
              </span>
            )}
            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-surface text-foreground/80 border border-border uppercase">
              {release.tag}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0 text-foreground/50 font-mono text-sm">
          <Calendar size={14} />
          {publishedDate}
        </div>
      </div>

      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase font-bold tracking-wider mb-4 border border-accent/20 bg-accent/5 px-3 py-2 w-fit">
          <GitBranch size={14} />
          {release.sourceRepo}
        </div>
        
        <div className="text-foreground/70 text-sm font-mono whitespace-pre-wrap line-clamp-3">
          {release.body || "No description provided."}
        </div>
      </div>

      <div className="p-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between bg-surface/30 gap-4">
        <div className="flex items-center gap-2 font-mono text-xs text-foreground/60 uppercase">
          <Box size={14} />
          {release.assets?.length || 0} Assets
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <a 
            href={release.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-xs font-bold text-foreground hover:text-accent uppercase tracking-wider transition-colors mr-2"
          >
            View on GitHub
          </a>

          {onUpdateMapping && (
            <div className="flex items-center gap-2 border-l border-border pl-4">
              {updating && <Loader2 size={14} className="animate-spin text-accent" />}
              
              <button
                disabled={updating}
                onClick={() => handleUpdate({ status: release.status === "public" ? "draft" : "public" })}
                className={`flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                  release.status === "public" 
                    ? "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20" 
                    : "bg-surface text-foreground/70 border-border hover:text-foreground"
                }`}
              >
                <Globe size={14} />
                {release.status === "public" ? "Public" : "Draft"}
              </button>

              <button
                disabled={updating || release.isCurrent}
                onClick={() => handleUpdate({ isCurrent: true, status: "public" })} // Auto-public when making current
                className={`flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                  release.isCurrent 
                    ? "bg-accent/10 text-accent border-accent/30 cursor-not-allowed" 
                    : "bg-surface text-foreground/70 border-border hover:text-accent hover:border-accent/30"
                }`}
              >
                <CheckCircle size={14} />
                {release.isCurrent ? "Current" : "Set Current"}
              </button>

              {projectId && (
                <Link
                  href={`/dashboard/projects/${projectId}/releases/${release.id}/edit`}
                  className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 border border-border bg-surface text-foreground/70 hover:text-accent hover:border-accent/30 transition-colors"
                >
                  <Edit3 size={14} />
                  Edit Staging
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
