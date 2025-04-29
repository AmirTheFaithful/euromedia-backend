import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import PostService from "../services/post.service";
import {
  Post,
  Posts,
  PostBlocks,
  CreatePostDTO,
  UpdatePostDTO,
} from "../types/post.type";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { cache } from "../config/lru";

/**
 * Represents a object of request's queries.
 *
 * @interface Queries
 * @property {string=} id - Optional parameter that threated as an ID of the post to be found.
 * @property {string=} authorId - Optional parameter that threated as an ID of the user to find all their posts.
 */
export interface Queries {
  id?: string;
  authorId?: string;
}

/**
 * Abstract base class for post-related use-cases.
 *
 * Provides utility methods such as ObjectId validation.
 */
class PostUseCase {
  /**
   * Convert a string to a valid ObjectID instance, if the provided value is valid.
   *
   * @param {string} id - value to be converted to the ObjectID.
   * @returns {ObjectID} - An instance of the ObjectID.
   * @throws {BadRequestError} - Exception if the invalid vale has been provided.
   */
  protected validateObjectId(id: string): ObjectId {
    if (!id || !ObjectId.isValid(id)) {
      throw new BadRequestError(`Query '${id}' is not valid id.`);
    }

    return new ObjectId(id);
  }
}

/**
 * Fetch use case for retrieving posts.
 *
 * Supports fetching post/s by their ID or author's ID or retrieving all posts.
 */
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

  /**
   * Fetch a post by its ID, either from cache or the DB.
   *
   * @param {string} query - The ID of the post to fetch.
   * @returns {Promise<Post | null>} - A post or null if there's nothing on cache or the DB.
   * @throws {NotFoundError} - Exception throwen whe user by provided ID wasn't found.
   */
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

  /**
   * Fetch all posts of an author by their ID.
   *
   * @param {string} query - The ID of the post to fetch.
   * @returns {Promise<Post[] | null>} - Array of posts or null if no posts were found for the specified author ID.
   * @throws {NotFoundError} - Exception throws when no user has been found by specified ID.
   */
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

  /**
   * Fetch all posts from the DB as an array.
   *
   * @returns {Promise<Post[]>} = An array of posts.
   */
  public async getAllPosts(): Promise<Posts> {
    return this.service.getAllPosts();
  }
}

/**
 * Create post use case for creating instances of new posts.
 *
 * Performs assembling, validation operations on the posts and saving them to the DB.
 */
@injectable()
export class CreatePostUseCase extends PostUseCase {
  constructor(@inject(PostService) private readonly service: PostService) {
    super();
  }

  public async execute(input: CreatePostDTO): Promise<Post> {
    this.validatePostData(input.authorId, input.blocks);
    return this.createPost(input);
  }

  /**
   * Creates a new post with provided data and saves it to the DB.
   *
   * @param {CreatePostDTO} input - data to be set into the new post.
   * @returns {Promise<Post>} - A new Post instance.
   */
  private async createPost(input: CreatePostDTO): Promise<Post> {
    const newPost: Post = await this.service.createNewPost(input);

    // Save into DB.
    await newPost.save();
    return newPost;
  }

  /**
   * Checks if the provided data fully complains to a new post.
   *
   * @param {ObjectId} authorId - Specific author (user account) identifier.
   * @param {PostBlocks} blocks - Array of the content slices.
   * @throws {BadRequestError} - Error of invalid provided data.
   */
  private validatePostData(authorId: ObjectId, blocks: PostBlocks): void {
    if (!authorId || blocks.length === 0 || !blocks) {
      throw new BadRequestError("Required post fields missing.");
    }
  }
}
