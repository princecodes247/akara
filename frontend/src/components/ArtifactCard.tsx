import { Calendar, Tag, GitBranch, Box, Edit3 } from "lucide-react";
import Link from "next/link";

interface ArtifactCardProps {
  artifact: {
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
  };
  projectId: string;
}

export function ArtifactCard({ artifact, projectId }: ArtifactCardProps) {
  const publishedDate = artifact.publishedAt
    ? new Date(artifact.publishedAt).toLocaleDateString("en-US", {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : "Not Published";

  return (
    <div className="card flex flex-col group hover:border-[#2a2a2a] transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-border bg-surface/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-base font-normal tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">
            {artifact.title || artifact.tag}
          </h2>
          <div className="flex items-center gap-1.5">
            {artifact.draft && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/15">
                Draft
              </span>
            )}
            {artifact.prerelease && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
                Pre-release
              </span>
            )}
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-surface text-foreground-muted border border-border">
              {artifact.tag}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0 text-foreground-muted text-xs">
          <Calendar size={12} />
          {publishedDate}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-foreground-muted text-xs mb-1.5">
            <GitBranch size={12} className="opacity-60" />
            <span className="font-mono">{artifact.sourceRepo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <Box size={12} />
            {artifact.assets?.length || 0} assets
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={artifact.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            View on GitHub
          </a>

          <Link
            href={`/dashboard/projects/${projectId}/releases/${artifact.id}/edit`}
            className="btn-primary text-xs py-1.5 px-3"
          >
            <Edit3 size={12} />
            Use in release
          </Link>
        </div>
      </div>
    </div>
  );
}
