import { Metadata, ResolvingMetadata } from "next";
import { Download, Calendar, GitBranch, ArrowUpRight } from "lucide-react";
import { config as appConfig } from "@/lib/config";

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
type Props = {
  params: Promise<{ slug: string }>;
};

async function getProjectData(slug: string) {
  const res = await fetch(`${appConfig.apiUrl}/public/projects/${slug}`, {
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
  const { slug } = await params;
  try {
    const data = await getProjectData(slug);
    const { project, releases } = data;

    const explicitCurrent = releases.find((r: any) => r.isCurrent);
    const currentRelease = explicitCurrent || (releases.length > 0 ? releases[0] : null);

    const title = project.seoTitle || (currentRelease ? `${project.name} ${currentRelease.tag}` : `${project.name} Releases`);

    let fallbackDesc = `Download official releases and artifacts for ${project.name}.`;
    if (currentRelease) {
      fallbackDesc = `Download the latest release (${currentRelease.tag}) for ${project.name}.`;
      if (currentRelease.title && currentRelease.title !== currentRelease.tag) {
        fallbackDesc += ` ${currentRelease.title}`;
      }
    }

    const description = project.seoDescription || fallbackDesc;

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

export default async function PublicReleasePage({ params }: Props) {
  const { slug } = await params;
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
        <div className="card p-10 max-w-lg w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-lg">!</span>
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">Something went wrong</h2>
          <p className="text-foreground-muted text-sm">{error || "Could not load project releases."}</p>
        </div>
      </div>
    );
  }

  const project = data.project;
  const releases = data.releases;

  const explicitCurrent = releases.find((r: any) => r.isCurrent);
  const currentRelease = explicitCurrent || (releases.length > 0 ? releases[0] : null);

  const previousReleases = releases
    .filter((r: any) => r.id !== currentRelease?.id)
    .sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
      return dateB - dateA;
    });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl px-6 md:px-12 pt-12 pb-10 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="w-full overflow-hidden">
            <span className="text-accent text-xs font-medium tracking-wide mb-2 block">Releases</span>
            <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight text-foreground break-words">{project.name}</h1>
          </div>
          {project.targetRepo && (
            <div className="flex items-center gap-2 font-mono text-xs text-foreground-muted bg-surface border border-border px-3 py-2 rounded-lg shrink-0">
              <GitBranch size={13} />
              {project.targetRepo}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl px-6 md:px-12 py-10 flex-1">
        {/* Current Release */}
        {currentRelease ? (
          <div className="mb-16">
            <h2 className="text-xs font-medium text-foreground-muted mb-6">
              Current release
            </h2>

            <div className="card-lg p-6 md:p-10">
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-semibold text-xl text-foreground bg-surface px-3 py-1 rounded-lg border border-border">
                      {currentRelease.tag}
                    </span>
                    {currentRelease.status === "draft" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/15">
                        Draft
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-light tracking-tight text-foreground/90 break-words mt-3">
                    {currentRelease.title || currentRelease.tag}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-foreground-muted text-sm shrink-0">
                  <Calendar size={14} />
                  {currentRelease.publishedAt
                    ? new Date(currentRelease.publishedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
                    : "Not Published"
                  }
                </div>
              </div>

              {/* Downloads */}
              {currentRelease.assets && currentRelease.assets.length > 0 && (
                <div className="mb-8 border-b border-border pb-8">
                  <span className="text-xs font-medium text-foreground-muted block mb-4">Downloads</span>
                  <div className="flex flex-col md:flex-row md:flex-wrap gap-3">
                    {currentRelease.assets.map((asset: any) => (
                      <a
                        key={asset.id}
                        href={asset.url}
                        className="flex items-center justify-between gap-4 md:gap-6 card hover:border-[#2a2a2a] transition-all px-4 py-3 text-sm group w-full md:w-auto"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Download size={15} className="text-foreground-muted group-hover:text-accent shrink-0 transition-colors" />
                          <div className="flex flex-col items-start gap-0.5 min-w-0 w-full">
                            <span className="font-medium truncate w-full">{asset.name}</span>
                            <div className="flex items-center gap-2">
                              {asset.size !== undefined && (
                                <span className="text-[10px] text-foreground-muted">
                                  {formatBytes(asset.size)}
                                </span>
                              )}
                              {asset.tag && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface text-foreground-muted border border-border">
                                  {asset.tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Release Notes */}
              <div>
                <span className="text-xs font-medium text-foreground-muted block mb-4">Release notes</span>
                <div className="prose prose-invert prose-p:text-sm prose-li:text-sm max-w-none prose-headings:font-display prose-headings:font-light prose-a:text-accent prose-code:text-accent">
                  {currentRelease.body ? (
                    <div dangerouslySetInnerHTML={{ __html: currentRelease.body }} />
                  ) : (
                    <p className="italic text-foreground-muted text-sm">No release notes provided.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-dashed p-12 text-center text-foreground-muted text-sm mb-16">
            No official releases found.
          </div>
        )}

        {/* Previous Releases */}
        {previousReleases.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-foreground-muted mb-6">
              Other releases
            </h2>

            <div className="flex flex-col gap-3">
              {previousReleases.map((release: any) => (
                <div key={release.id} className="card flex flex-col md:flex-row justify-between p-4 md:p-5 hover:border-[#2a2a2a] transition-colors group">
                  <div className="flex items-start md:items-center gap-4 mb-3 md:mb-0 w-full md:w-auto">
                    <span className="font-mono font-medium text-base w-24 shrink-0 group-hover:text-accent transition-colors">
                      {release.tag}
                    </span>
                    <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                      <h4 className="font-medium text-foreground/80 break-words w-full text-sm">
                        {release.title || release.tag}
                      </h4>
                      <span className="text-xs text-foreground-muted">
                        {release.publishedAt
                          ? new Date(release.publishedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
                          : "Draft"
                        }
                      </span>
                    </div>
                  </div>

                  {release.assets && release.assets.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      {release.assets.map((asset: any) => (
                        <a
                          key={asset.id}
                          href={asset.url}
                          className="flex items-center gap-2 border border-border bg-background hover:border-[#2a2a2a] hover:text-accent transition-all px-3 py-1.5 rounded-lg text-xs"
                        >
                          <Download size={10} />
                          <span className="font-medium">{asset.name}</span>
                          {asset.size !== undefined && (
                            <span className="text-[9px] text-foreground-muted ml-0.5">
                              {formatBytes(asset.size)}
                            </span>
                          )}
                          {asset.tag && (
                            <span className="text-[8px] font-medium px-1 bg-surface text-foreground-muted border border-border rounded">
                              {asset.tag}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
