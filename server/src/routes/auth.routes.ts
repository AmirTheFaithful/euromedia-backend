import { Router } from "express";

import AuthController from "../controllers/auth.controller";

export const authRoutes = (router: Router): void => {
  const baseURL: string = "/auth/";
  router.post(baseURL + "register", AuthController.register);
  router.post(baseURL + "login", AuthController.login);
  router.get(baseURL + "verify-email/:token", AuthController.verifyEmail);
  router.patch(
    baseURL + "to-reset-password",
    AuthController.resetPasswordRequest
  );
  router.patch(baseURL + "reset-password", AuthController.resetPassword);
};
