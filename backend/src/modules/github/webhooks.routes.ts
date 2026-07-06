import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "crypto";

export const webhooksRouter = Router();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "fallback_secret_for_dev";

webhooksRouter.post("/github", async (req: Request, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string;
  const event = req.headers["x-github-event"] as string;

  if (!signature) {
    return res.status(401).json({ error: "No signature found on request" });
  }

  // Verify signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  if (signature !== digest) {
    // Note: In production we should use crypto.timingSafeEqual
    console.warn("Webhook signature mismatch", { signature, digest });
    return res.status(401).json({ error: "Invalid signature" });
  }

  if (event === "release") {
    const payload = req.body;
    if (payload.action === "published") {
      const repoFullName = payload.repository.full_name;
      const releaseId = payload.release.id;

      console.log(`Webhook received: Release ${releaseId} published in ${repoFullName}`);

      // TODO: Logic to find projects with this sourceRepo and create draft release mappings
      const { projectsService } = await import("../projects/projects.service");
      const { db } = await import("../../db");

      try {
        // Find projects that have this repo in sourceRepos
        const projects = await db.collections.projects.find({});
        const relevantProjects = projects.filter((p: any) => p.sourceRepos?.includes(repoFullName));

        for (const project of relevantProjects) {
          // Check if a staged release already exists
          const existing = await db.collections.stagedReleases.findOne({
            projectId: project._id,
            sourceReleaseId: String(releaseId)
          });

          if (!existing) {
            console.log(`Auto-creating draft mapping for project ${project.name}`);
            // Save the release data for future reference to avoid github API calls
            const releaseData = {
              id: releaseId,
              tag: payload.release.tag_name,
              title: payload.release.name,
              body: payload.release.body,
              draft: payload.release.draft,
              prerelease: payload.release.prerelease,
              publishedAt: payload.release.published_at,
              sourceRepo: repoFullName
            };

            await projectsService.updateReleaseMapping(
              project._id.toString(),
              String(releaseId),
              {
                status: "draft",
                releaseData,
                customTitle: payload.release.name,
                customBody: payload.release.body
              }
            );
          }
        }
      } catch (err) {
        console.error("Error processing webhook payload:", err);
      }
    }
  }

  res.status(200).json({ received: true });
});
