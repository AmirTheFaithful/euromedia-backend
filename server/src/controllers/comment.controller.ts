import { Request, Response } from "express";

import Container from "../containers";
import { getCachedKey } from "../utils/getCachedKey";
import { asyncHandler } from "../utils/asyncHandler";
import { FetchCommentsUseCase } from "../use-cases/comment.use-case";
import { SubentityQueries } from "../types/queries.type";
import { ResponseBody } from "../types/api.type";
import { Comment, Comments } from "../types/comment.type";
import { cache } from "../config/lru";

class CommentController {
  constructor(private readonly container = Container()) {}

  public getComments = asyncHandler(
    async (
      req: Request<
        any,
        ResponseBody<Comment | Comments>,
        any,
        SubentityQueries
      >,
      res: Response<ResponseBody<Comment | Comments>>
    ) => {
      const fetchCommentsUseCase = this.container.get(FetchCommentsUseCase);
      const data: Comment | Comments = await fetchCommentsUseCase.execute(
        req.query
      );

      const cachedKey: string | undefined = getCachedKey(req.query);
      const isCached = cache.has(cachedKey);

      res.setHeader("X-Cache-Status", isCached ? "HIT" : "MISS");

      if (cachedKey && data && !isCached) {
        cache.set(cachedKey, data);
      }

      const message: string = `Fetch success ${isCached ? "(cached)" : ""}.`;
      res.status(200).json({ data, message });
    }
  );
}

export default new CommentController();
