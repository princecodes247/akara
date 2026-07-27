import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import config from "../../lib/config";
import { deviceAuthService } from "./device-auth.service";

export class AuthController {
  getGithubAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const returnTo = req.query.returnTo as string;
      if (returnTo) {
        res.cookie("akara_return_to", returnTo, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 10 * 60 * 1000,
          path: "/",
        });
      }
      
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

      let redirectUrl = `${config.FRONTEND_URL}/auth/callback?token=${token}`;
      const returnTo = req.cookies.akara_return_to;
      if (returnTo) {
        res.clearCookie("akara_return_to", { path: "/" });
        redirectUrl += `&returnTo=${encodeURIComponent(returnTo)}`;
      }

      res.redirect(redirectUrl);
    } catch (error: any) {
      next(error);
    }
  }

  logout(req: Request, res: Response) {
    res.clearCookie("akara_token", { path: "/" });
    res.redirect(`${config.FRONTEND_URL}/`);
  }

  async createDeviceCode(req: Request, res: Response, next: NextFunction) {
    try {
      const code = await deviceAuthService.createDeviceCode();
      const verificationUri = `${config.FRONTEND_URL}/auth/device`;
      res.json({ deviceCode: code, verificationUri });
    } catch (error) {
      next(error);
    }
  }

  async verifyDeviceCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const token = req.cookies.akara_token;

      if (!code) {
        return res.status(400).json({ error: "No code provided" });
      }
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const success = await deviceAuthService.verifyDeviceCode(code, token);
      if (!success) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async checkDeviceCodeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "No code provided" });
      }

      const result = await deviceAuthService.checkDeviceCodeStatus(code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
