import { Application } from "express";

// Middlewares imports;
import { json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

import { httpLogger } from "../middlewares/logger.middleware";

import { corsOptions } from "../config/cors";

export const setupMiddlewares = (app: Application): void => {
  app.use(json());
  app.use(urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(httpLogger);
};
