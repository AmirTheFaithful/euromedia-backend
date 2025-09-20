import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";

import { UnauthorizedError } from "../errors/http-errors";
import { jwt } from "../config/env";

/**
 * Middleware to check the Access Token in the `x-access-token` header.
 *
 * Steps:
 * 1. Check header existence.
 * 2. Split into scheme and token (`Bearer <token>`).
 * 3. Verify JWT.
 * 4. Check token type (`access-token`).
 * 5. Call `next()` if valid, otherwise throw UnauthorizedError.
 *
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export const checkAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 🔑 Get the Access Token header
  const accessTokenHeader = req.headers["x-access-token"] as string | undefined;
  if (!accessTokenHeader) {
    throw new UnauthorizedError("Access token header missing.");
  }

  // 🧩 Split into scheme and token
  const [scheme, token] = accessTokenHeader.trim().split(/\s+/);
  if (!token || scheme !== "Bearer") {
    throw new UnauthorizedError("Missing or invalid access token.");
  }

  try {
    // 🔐 Verify JWT
    const payload = verify(token, jwt.acs) as JwtPayload & { type: string };
    if (payload.type !== "access-token") {
      throw new UnauthorizedError("Invalid token type.");
    }
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token.");
  }

  // 🚀 Everything OK, move to next middleware
  next();
};
