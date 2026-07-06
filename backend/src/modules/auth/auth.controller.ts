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
      res.cookie("akara_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.redirect(`${config.FRONTEND_URL}/dashboard`);
    } catch (error: any) {
      next(error);
    }
  }

  logout(req: Request, res: Response) {
    res.clearCookie("akara_token", { path: "/" });
    res.redirect(`${config.FRONTEND_URL}/`);
  }
}

export const authController = new AuthController();
