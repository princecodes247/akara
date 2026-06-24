import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import config from "../../lib/config";

export class AuthController {
  getGithubAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const url = authService.getGithubAuthUrl();
      res.redirect(url);
    } catch (error: any) {
      if (error.message === "GitHub Client ID not configured") {
        return res.status(500).json({ error: error.message });
      }
      next(error);
    }
  }

  async handleGithubCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ error: "No code provided" });
      }

      const token = await authService.handleGithubCallback(code);
      res.redirect(`${config.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error: any) {
      next(error);
    }
  }
}

export const authController = new AuthController();
