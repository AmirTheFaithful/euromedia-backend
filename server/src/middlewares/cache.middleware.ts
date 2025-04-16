import { Request, Response, NextFunction } from "express";

import { cache } from "../config/lru";

export const cacheMiddleware = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const key: string = req.originalUrl;
  const cachedData = cache.get(key);

  if (cachedData) {
    return res.json(cachedData);
  }
};
