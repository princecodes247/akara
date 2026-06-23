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
    <div className="bg-surface/10 border border-border/50 flex flex-col group hover:border-border transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border-b border-border/40 bg-surface/20">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold font-mono tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">
            {artifact.title || artifact.tag}
          </h2>
          <div className="flex items-center gap-1.5">
            {artifact.draft && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase">
                Draft
              </span>
            )}
            {artifact.prerelease && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">
                Pre-release
              </span>
            )}
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-surface text-foreground/60 border border-border/50 uppercase">
              {artifact.tag}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0 text-foreground/45 font-mono text-xs">
          <Calendar size={12} />
          {publishedDate}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-foreground/60 font-mono text-xs uppercase font-bold tracking-wider mb-2">
            <GitBranch size={12} className="text-foreground/40" />
            {artifact.sourceRepo}
          </div>
          
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground/50 uppercase">
            <Box size={12} />
            {artifact.assets?.length || 0} Assets
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href={artifact.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-mono text-xs font-bold text-foreground/60 hover:text-foreground uppercase tracking-wider transition-colors mr-2"
          >
            View on GitHub
          </a>

          <Link
            href={`/dashboard/projects/${projectId}/releases/${artifact.id}/edit`}
            className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 border border-accent/30 bg-accent/5 text-accent hover:bg-accent hover:text-background transition-colors brutalist-shadow-sm"
          >
            <Edit3 size={12} />
            Use in Release
          </Link>
        </div>
      </div>
    </div>
  );
}
