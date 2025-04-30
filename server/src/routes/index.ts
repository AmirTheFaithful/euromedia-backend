import { Router } from "express";

import { userRoutes } from "./user.routes";
import { authRoutes } from "./auth.routes";
import { postRoutes } from "./post.routes";

const router: Router = Router();

export const centralRouter = (): Router => {
  userRoutes(router);
  authRoutes(router);
  postRoutes(router);

  return router;
};
