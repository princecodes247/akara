import { Router } from "express";
import { authController } from "./auth.controller";

export const authRouter = Router();

// 1. Redirect to GitHub OAuth
authRouter.get("/github", authController.getGithubAuthUrl);

// 2. Handle GitHub OAuth Callback
authRouter.get("/github/callback", authController.handleGithubCallback);

// 3. Logout
authRouter.get("/logout", authController.logout);

// 4. Device Auth
authRouter.post("/device/code", authController.createDeviceCode);
authRouter.post("/device/verify", authController.verifyDeviceCode);
authRouter.post("/device/status", authController.checkDeviceCodeStatus);
