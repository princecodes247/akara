import { Calendar, Tag, GitBranch, Box } from "lucide-react";

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
  };
}

export function ReleaseCard({ release }: ReleaseCardProps) {
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

      <div className="p-4 border-t border-border flex items-center justify-between bg-surface/30">
        <div className="flex items-center gap-2 font-mono text-xs text-foreground/60 uppercase">
          <Box size={14} />
          {release.assets?.length || 0} Assets
        </div>
        <a 
          href={release.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-xs font-bold text-foreground hover:text-accent uppercase tracking-wider transition-colors"
        >
          {/* <Github size={14} /> */}
          View on GitHub
        </a>
      </div>
    </div>
  );
}
