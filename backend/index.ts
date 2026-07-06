import dotenv from "dotenv";
import { setupApp } from "./src/lib/app";
import { projectsRouter } from "./src/modules/projects/projects.routes";
import { authRouter } from "./src/modules/auth/auth.routes";

import { githubRouter } from "./src/modules/github/github.routes";
import { webhooksRouter } from "./src/modules/github/webhooks.routes";
import { publicRouter } from "./src/modules/public/public.routes";
import { initWorkers, scheduleReleaseSync } from "./src/modules/queue/queue.service";

dotenv.config();

const port = process.env.PORT || 4000;

const app = setupApp({
  routes: [
    {
      prefix: "/v1",
      routes: [
        { path: "/projects", router: projectsRouter },
        { path: "/auth", router: authRouter },
        { path: "/github", router: githubRouter },
        { path: "/webhooks", router: webhooksRouter },
        { path: "/public", router: publicRouter }
      ]
    }
  ]
});

async function start() {
  try {
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
      
      // Initialize background workers
      initWorkers();
      scheduleReleaseSync().catch(err => console.error("Failed to schedule sync:", err));
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
}

start();