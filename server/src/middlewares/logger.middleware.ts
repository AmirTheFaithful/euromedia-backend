import { Request, Response, NextFunction } from "express";

import { logger } from "../config/logger";

/**
 * Middleware for logging HTTP requests and their response times.
 *
 * Records the request method, path, response status code, and duration in milliseconds.
 * Uses a high-resolution timer to measure precise request handling time.
 *
 * @param {Request} req - The incoming Express request object.
 * @param {Response} res - The outgoing Express response object.
 * @param {NextFunction} next - The callback to pass control to the next middleware.
 *
 * @returns {void} This middleware does not return a value.
 */
export const httpLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start: bigint = process.hrtime.bigint();

  res.on("finish", (): void => {
    const end: bigint = process.hrtime.bigint();
    const durationMs: number = Number(end - start) / 1_000_000;

    logger.info(
      `${req.method} ${req.path} ${res.statusCode} - ${durationMs.toFixed(
        2
      )} ms`
    );
  });

  // Move on to the next middleware.
  next();
};
