import { Router } from "express";

import reactionController from "../controllers/reaction.controller";

const baseURL: string = "/api/reactions";

export const reactionRoutes = (router: Router): void => {
  router.get(baseURL, reactionController.getReactions);
  router.post(baseURL, reactionController.createReaction);
  router.patch(baseURL, reactionController.updateReaction);
};
