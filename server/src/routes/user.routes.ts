import { Router } from "express";

import userController from "../controllers/user.controller";

export const userRoutes = (router: Router): void => {
  const baseURL: string = "/api/users";
  router.get(baseURL, userController.getUsers);
  router.patch(baseURL, userController.updateUser);
};
