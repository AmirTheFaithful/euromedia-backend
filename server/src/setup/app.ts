import express, { Application } from "express";

import { setupMiddlewares } from "./middlewares";
import { setupRoutes } from "./routes";

export default (): Application => {
  const app: Application = express();

  setupMiddlewares(app);
  setupRoutes(app);

  return app;
};
