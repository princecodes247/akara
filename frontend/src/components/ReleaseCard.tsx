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
    <div className="card flex flex-col group hover:border-[#2a2a2a] transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border-b border-border bg-surface/30 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-normal tracking-tight text-foreground group-hover:text-accent transition-colors">
            {release.title || release.tag}
          </h2>
          <div className="flex items-center gap-1.5">
            {release.draft && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/15">
                Draft
              </span>
            )}
            {release.prerelease && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
                Pre-release
              </span>
            )}
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface text-foreground-muted border border-border">
              {release.tag}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 md:mt-0 text-foreground-muted text-sm">
          <Calendar size={13} />
          {publishedDate}
        </div>
      </div>

      <div className="p-5 flex-1">
        <div className="flex items-center gap-2 text-foreground-muted text-xs mb-3">
          <GitBranch size={13} />
          <span className="font-mono">{release.sourceRepo}</span>
        </div>

        <div className="text-foreground/60 text-sm whitespace-pre-wrap line-clamp-3 leading-relaxed">
          {release.body || "No description provided."}
        </div>
      </div>

      <div className="p-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between bg-surface/20 gap-3 rounded-b-2xl">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Box size={13} />
          {release.assets?.length || 0} assets
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors mr-1"
          >
            View on GitHub
          </a>

          {onUpdateMapping && (
            <div className="flex items-center gap-2 border-l border-border pl-3">
              {updating && <Loader2 size={13} className="animate-spin text-accent" />}

              <button
                disabled={updating}
                onClick={() => handleUpdate({ status: release.status === "public" ? "draft" : "public" })}
                className={`btn-secondary text-xs py-1 px-2.5 ${
                  release.status === "public"
                    ? "text-emerald-400 border-emerald-500/15"
                    : ""
                }`}
              >
                <Globe size={13} />
                {release.status === "public" ? "Public" : "Draft"}
              </button>

              <button
                disabled={updating || release.isCurrent}
                onClick={() => handleUpdate({ isCurrent: true, status: "public" })}
                className={`btn-secondary text-xs py-1 px-2.5 ${
                  release.isCurrent
                    ? "text-accent border-accent/15 opacity-50 cursor-not-allowed"
                    : "hover:text-accent hover:border-accent/15"
                }`}
              >
                <CheckCircle size={13} />
                {release.isCurrent ? "Current" : "Set current"}
              </button>

              {projectId && (
                <Link
                  href={`/dashboard/projects/${projectId}/releases/${release.id}/edit`}
                  className="btn-secondary text-xs py-1 px-2.5 hover:text-accent hover:border-accent/15"
                >
                  <Edit3 size={13} />
                  Edit
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
