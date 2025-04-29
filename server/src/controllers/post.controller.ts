import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import { FetchPostUseCase } from "../use-cases/post.use-case";
import { Post, Posts } from "../types/post.type";
import { cache } from "../config/lru";

interface Queries {
  id?: string;
  authorId?: string;
}

class PostController {
  constructor(private readonly container = Container()) {}

  public getPosts = asyncHandler(
    async (req: Request<any, Post | Posts, any, Queries>, res: Response) => {
      const fetchPostUseCase = this.container.get(FetchPostUseCase);
      let data: Post | Posts | null = await fetchPostUseCase.execute(req.body);

      let responseMessage: string = "fetch success";
      const cachedKey: string | undefined = req.query.id ?? req.query.authorId;

      if (cachedKey && cache.has(cachedKey)) {
        responseMessage += " (cached).";
        res.setHeader("X-Cache-Status", "HIT");
      } else if (cachedKey && !cache.has(cachedKey)) {
        responseMessage += ".";
        res.setHeader("X-Cache-Status", "MISS");
        cache.set(cachedKey, data);
      }

      res.status(200).json({ data, message: responseMessage }).end();
    }
  );
}

export default new PostController();
