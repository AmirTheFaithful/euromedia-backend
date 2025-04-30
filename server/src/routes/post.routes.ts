import { Router } from "express";

import postController from "../controllers/post.controller";

const baseURL: string = "/api/posts/";

export const postRoutes = (router: Router): void => {
  router.get(baseURL, postController.getPosts);
};
