import { Router } from "express";

import twoFAController from "../controllers/twoFA.controller";

const baseURL: string = "/auth/2fa/";

export const twoFARoutes = (router: Router): void => {
  router.post(baseURL + "setup", twoFAController.setup);
  router.post(baseURL + "verify", twoFAController.verify);
  router.patch(baseURL + "initiate", twoFAController.initiate);
};
