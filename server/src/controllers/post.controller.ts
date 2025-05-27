import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import { FetchPostUseCase } from "../use-cases/post.use-case";
import { ResponseBody } from "../types/api.type";
import { MediaEntityQueries } from "../types/queries.type";
import { Post, Posts } from "../types/post.type";
import { cache } from "../config/lru";

class PostController {
  constructor(private readonly container = Container()) {}

  public getPosts = asyncHandler(
    async (
      req: Request<any, Post | Posts, any, MediaEntityQueries>,
      res: Response<ResponseBody<Post | Posts>>
    ) => {
      const fetchPostUseCase = this.container.get(FetchPostUseCase);
      const data: Post | Posts = await fetchPostUseCase.execute(req.body);

      const cachedKey: string | undefined = req.query.id ?? req.query.authorId;
      const isCached = cachedKey && cache.has(cachedKey);

      res.setHeader("X-Cache-Status", isCached ? "HIT" : "MISS");

      // If query is provided and a cached post was fetched - reflect that in the response and send a specific header.
      if (cachedKey && !isCached && !Array.isArray(data)) {
        cache.set(cachedKey, data);
      }

      const responseMessage: string = `Fetch success${
        isCached ? " (cached)" : ""
      }`;

      res.status(200).json({ data, message: responseMessage }).end();
    }
  );
}

export default new PostController();
