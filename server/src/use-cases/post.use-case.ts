import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import PostService from "../services/post.service";
import { Post, Posts } from "../types/post.type";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { cache } from "../config/lru";

export interface Queries {
  id?: string;
  authorId?: string;
}

class PostUseCase {
  protected validateObjectId(id: string): ObjectId {
    if (!id || !ObjectId.isValid(id)) {
      throw new BadRequestError(`Query '${id}' is not valid id.`);
    }

    return new ObjectId(id);
  }
}

@injectable()
export class FetchPostUseCase extends PostUseCase {
  constructor(@inject(PostService) private readonly service: PostService) {
    super();
  }

  public async execute(input: Queries) {
    const { authorId, id } = input;

    if (id) {
      return await this.getById(id);
    }

    if (authorId) {
      return await this.getByAuthorId(authorId);
    }

    return await this.getAllPosts();
  }

  public async getById(query: string): Promise<Post | null> {
    const id = this.validateObjectId(query);
    let post: Post | null = cache.get(`postId:${query}`);

    if (!post) {
      post = await this.service.getPostById(id);
    }

    if (!post) {
      throw new NotFoundError(`Not found post with ID ${query}.`);
    }

    return post;
  }

  public async getByAuthorId(query: string): Promise<Posts | null> {
    const id = this.validateObjectId(query);
    let posts: Posts | null = cache.get(`postAuthorId:${query}`);

    if (!posts) {
      posts = await this.service.getPostsByAuthorId(id);
    }

    if (!posts) {
      throw new NotFoundError(`No posts were found by author ID ${query}.`);
    }

    return posts;
  }

  public async getAllPosts(): Promise<Posts> {
    return this.service.getAllPosts();
  }
}
