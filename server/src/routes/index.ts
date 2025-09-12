import { Router } from "express";

import { userRoutes } from "./user.routes";
import { authRoutes } from "./auth.routes";
import { twoFARoutes } from "./twoFA.routes";
import { postRoutes } from "./post.routes";
import { commentRoutes } from "./comment.routes";
import { reactionRoutes } from "./reaction.routes";

const router: Router = Router();

export const centralRouter = (): Router => {
  userRoutes(router);
  authRoutes(router);
  twoFARoutes(router);
  postRoutes(router);
  commentRoutes(router);
  reactionRoutes(router);

  return router;
};
