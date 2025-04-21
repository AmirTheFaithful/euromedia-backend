import { Request, Response, NextFunction } from "express";

import { AsyncAction } from "../types/asyncAction.type";

export const asyncHandler = <T = unknown>(
  fn: AsyncAction<T>
): AsyncAction<void | Awaited<T>> => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(error.statusCode ?? 500).json({ message: error.message });
      next;
    });
  };
};
