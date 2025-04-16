import { CorsOptions } from "cors";

import { sys } from "./env";

export const corsOptions = (): CorsOptions => {
  return {
    origin: `${sys.host}:${sys.clntPort}`,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
};
