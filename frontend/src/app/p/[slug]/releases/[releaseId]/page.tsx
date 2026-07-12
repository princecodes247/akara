import { Metadata, ResolvingMetadata } from "next";
import { Download, Calendar, GitBranch, Terminal, ArrowLeft } from "lucide-react";
import { config as appConfig } from "@/lib/config";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string; releaseId: string }>;
};

async function getProjectData(slug: string) {
  const res = await fetch(`${appConfig.apiUrl}/public/projects/${slug}`, {
    // Next.js fetch caching options.
    next: { revalidate: 60, tags: [`project-${slug}`] }
  });
  if (!res.ok) {
    throw new Error("Project not found or an error occurred.");
  }
  return res.json();
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug, releaseId } = await params;
  try {
    const data = await getProjectData(slug);
    const { project, releases } = data;

    const release = releases.find((r: any) => r.id.toString() === releaseId);
    
    if (!release) {
      return {
        title: "Release Not Found | Akara",
        description: "Could not find the requested release.",
      };
    }

    const title = `${project.name} ${release.tag} Release`;
    let description = `Download ${release.tag} for ${project.name}.`;
    if (release.title && release.title !== release.tag) {
      description += ` ${release.title}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: "Akara",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    return {
      title: "Project Not Found | Akara",
      description: "Could not find the requested project releases.",
    };
  }
}

export default async function PublicSingleReleasePage({ params }: Props) {
  const { slug, releaseId } = await params;
  let data;
  let error = "";

  try {
    data = await getProjectData(slug);
  } catch (err: any) {
    error = err.message;
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
  const release = data.releases.find((r: any) => r.id.toString() === releaseId);

  if (!release) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-12">
        <div className="border border-border border-dashed p-12 text-center text-foreground/50 font-mono uppercase tracking-wider mb-16 max-w-lg w-full">
          Release not found.
          <div className="mt-6">
            <Link href={`/p/${slug}`} className="text-accent hover:underline flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Back to all releases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-4xl border-b border-border p-5 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end bg-surface/30">
        <div className="w-full overflow-hidden">
          <Link href={`/p/${slug}`} className="text-accent/80 hover:text-accent font-mono text-xs font-bold tracking-wider uppercase mb-4 flex items-center gap-2 transition-colors">
            <ArrowLeft size={14} /> Back to all releases
          </Link>
          <span className="text-accent font-mono text-xs font-bold tracking-wider uppercase mb-2 block">Release for</span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter break-words">{project.name}</h1>
        </div>
        {project.targetRepo && (
          <div className="flex items-center gap-2 font-mono text-xs text-foreground/60 bg-background border border-border px-3 py-2 mt-4 md:mt-0 uppercase font-bold tracking-wider">
            <GitBranch size={14} />
            {project.targetRepo}
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl p-5 sm:p-8 md:p-12 flex-1">
        <div className="mb-16">
          <div className="border border-border bg-surface/10 p-5 sm:p-8 md:p-12 brutalist-shadow">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-foreground text-background font-mono font-black text-xl px-3 py-1 uppercase tracking-tight">
                    {release.tag}
                  </span>
                  {release.isCurrent && (
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-accent/10 text-accent border border-accent/30 uppercase tracking-widest">
                      Current
                    </span>
                  )}
                  {release.status === "draft" && (
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 uppercase tracking-widest">
                      Draft
                    </span>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground/90 break-words mt-2">
                  {release.title || release.tag}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-foreground/50 font-mono text-sm uppercase font-bold shrink-0">
                <Calendar size={16} />
                {release.publishedAt 
                  ? new Date(release.publishedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
                  : "Not Published"
                }
              </div>
            </div>

            {/* Assets / Downloads */}
            {release.assets && release.assets.length > 0 && (
              <div className="mb-8 border-b border-border pb-8">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/60 block mb-4">Downloads</span>
                <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
                  {release.assets.map((asset: any) => (
                    <a 
                      key={asset.id} 
                      href={asset.url}
                      className="flex items-center justify-between gap-4 md:gap-6 border border-border bg-background hover:border-accent hover:text-accent transition-all px-4 py-3 font-mono text-sm group w-full md:w-auto"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Download size={16} className="text-foreground/50 group-hover:text-accent shrink-0" />
                        <div className="flex flex-col items-start gap-1 min-w-0 w-full">
                          <span className="font-bold truncate w-full">{asset.name}</span>
                          {asset.tag && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-surface text-accent/80 border border-border uppercase">
                              {asset.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Release Notes */}
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/60 block mb-4">Release Notes</span>
              <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-li:font-mono prose-li:text-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-a:text-accent prose-code:text-accent">
                {release.body ? (
                  <div dangerouslySetInnerHTML={{ __html: release.body }} />
                ) : (
                  <p className="italic text-foreground/50">No release notes provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
