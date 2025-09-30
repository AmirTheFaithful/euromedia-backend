import pino from "pino";
import { resolve } from "path";

import { sys } from "./env";

const transport = pino.transport({
  targets: [
    {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:dd/mm/yyyy HH:MM:ss",
        ignore: "pid.hostname.responseTime",
        messageFormat: "{msg}",
      },
    },
    {
      target: "pino/file",
      level: "info",
      options: {
        destination: resolve(__dirname, "../../logs/output.log"),
        mkdir: true,
      },
    },
    {
      target: "pino/file",
      level: "error",
      options: {
        destination: resolve(__dirname, "../../logs/exception.log"),
        mkdir: true,
      },
    },
  ],
});

// Central logger.
export const logger = pino({ level: sys.log_level, base: null }, transport);
