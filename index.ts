import dotenv from "dotenv";
import { setupApp } from "./src/lib/app";
import { projectsRouter } from "./src/modules/projects/projects.routes";
import { authRouter } from "./src/modules/auth/auth.routes";

dotenv.config();

const port = process.env.PORT || 4000;

const app = setupApp({
  routes: [
    { path: "/api/projects", router: projectsRouter },
    { path: "/api/auth", router: authRouter }
  ]
});

async function start() {
  try {
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
}

start();