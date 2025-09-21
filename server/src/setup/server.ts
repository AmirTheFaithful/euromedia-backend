import { Server, createServer } from "http";

import app from "./app";
import { sys } from "../config/env";
import { connectDB } from "../config/mongo";
import { logger } from "../config/logger";

const server: Server = createServer(app());

// Logging unhandled exceptions.
process.on("uncaughtException", (error: Error) => logger.fatal(error));
process.on("unhandledRejection", (error: Error) => logger.fatal(error));

const startServer = async (): Promise<void> => {
  await connectDB();
  server.listen(sys.servPort, () => {
    console.log(`Serving API requests at ${sys.host}:${sys.servPort}.`);
  });
};

const run = (): void => {
  startServer().catch((error: Error) => {
    logger.error(
      `An ${error.name} occurred when connecting to the DB: ${error.message}.`
    );
    process.exit(1);
  });
};

export default run;
