import { Request, Response, NextFunction } from "express";

export type AsyncAction<T = void> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;
