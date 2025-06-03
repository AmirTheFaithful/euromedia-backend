import { Request, Response } from "express";

import Container from "../containers";
import { getCachedKey } from "../utils/getCachedKey";
import { asyncHandler } from "../utils/asyncHandler";
import {
  FetchCommentsUseCase,
  CreateCommentUseCase,
} from "../use-cases/comment.use-case";
import { SubentityQueries } from "../types/queries.type";
import { ResponseBody } from "../types/api.type";
import {
  CreateCommentDTOInput,
  Comment,
  Comments,
} from "../types/comment.type";
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

  public createComment = asyncHandler(
    async (
      req: Request<any, ResponseBody<Comment>, CreateCommentDTOInput>,
      res: Response<ResponseBody<Comment>>
    ) => {
      const createCommentUseCase = this.container.get(CreateCommentUseCase);
      const data: Comment = await createCommentUseCase.execute(req.body);
      res.status(201).json({ data, message: "Post success." });
    }
  );
}

export default new CommentController();
