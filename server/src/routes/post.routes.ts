import { Router } from "express";

import postController from "../controllers/post.controller";

const baseURL: string = "/api/posts/";

export const postRoutes = (router: Router): void => {
  router.get(baseURL, postController.getPosts);
  router.post(baseURL, postController.createPost);
  router.patch(baseURL, postController.updatePost);
  router.delete(baseURL, postController.deletePost);
};
