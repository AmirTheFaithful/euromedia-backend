import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import {
  FetchPostUseCase,
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
} from "../use-cases/post.use-case";
import { ResponseBody } from "../types/api.type";
import { MediaEntityQueries } from "../types/queries.type";
import { CreatePostDTO, UpdatePostDTO, Post, Posts } from "../types/post.type";
import { cache } from "../config/lru";

class PostController {
  constructor(private readonly container = Container()) {}

  public getPosts = asyncHandler(
    async (
      req: Request<any, Post | Posts, any, MediaEntityQueries>,
      res: Response<ResponseBody<Post | Posts>>
    ) => {
      const fetchPostUseCase = this.container.get(FetchPostUseCase);
      const data: Post | Posts = await fetchPostUseCase.execute(req.query);

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

  public createPost = asyncHandler(
    async (
      req: Request<any, Post, CreatePostDTO>,
      res: Response<ResponseBody<Post>>
    ) => {
      const createPostUseCase = this.container.get(CreatePostUseCase);
      const newPost: Post = await createPostUseCase.execute(req.body);
      res.status(201).json({ data: newPost, message: "Post success." });
    }
  );

  public updatePost = asyncHandler(
    async (
      req: Request<any, Post, UpdatePostDTO, { id?: string }>,
      res: Response<ResponseBody<Post>>
    ) => {
      const updatePostUseCase = this.container.get(UpdatePostUseCase);
      const updatedPost: Post = await updatePostUseCase.execute(
        req.query,
        req.body
      );
      res.status(200).json({ data: updatedPost, message: "Update Success." });
    }
  );
}

export default new PostController();
