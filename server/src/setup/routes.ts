import { Application } from "express";

import { centralRouter } from "../routes";

export const setupRoutes = (app: Application): void => {
  app.use("/", centralRouter());
};
