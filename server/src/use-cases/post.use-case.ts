import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";
import { z } from "zod";

import PostService from "../services/post.service";
import {
  Post,
  Posts,
  PostBlocks,
  CreatePostDTO,
  UpdatePostDTO,
} from "../types/post.type";
import { APIUseCase } from "./APIUseCase";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { cache } from "../config/lru";

/**
 * Represents a object of request's queries.
 *
 * @interface Queries
 * @property {string=} id - Optional parameter that threated as an ID of the post to be found.
 * @property {string=} authorId - Optional parameter that threated as an ID of the user to find all their posts.
 * @property {string[]=} tags - Optional parameter that is treated as a list of tags used to filter posts.
 */
export interface Queries {
  id?: string;
  authorId?: string;
  tags?: object;
}

/**
 * Abstract base class for all post-related use cases.
 *
 * Intended to be extended by specific post use case implementations.
 * Provides common validation logic and inherits core API use case behavior.
 *
 * To be used only in the application layer (use cases), not in controllers or infrastructure.
 *
 * @abstract
 * @class
 * @extends APIUseCase
 */
abstract class PostUseCase extends APIUseCase {
  protected assertIdIsString(id: string | undefined): asserts id is string {
    // Not presented; Is not type of string; Is not convertable to ObjectId;
    if (!id || typeof id !== "string" || id.length !== 24) {
      throw new BadRequestError("Query 'id' is not valid identifier.");
    }
  }

  constructor() {
    super();
  }
}

/**
 * Fetch use case for retrieving posts.
 *
 * Supports fetching post/s by their ID or author's ID or retrieving all posts.
 *
 * @extends PostUseCase
 */
@injectable()
export class FetchPostUseCase extends PostUseCase {
  constructor(@inject(PostService) private readonly service: PostService) {
    super();
  }

  public async execute(input: Queries): Promise<Post | Posts> {
    const data: Post | Posts | null = await this.handleQueryStrategy(input);
    this.assertObjectIsFound(data);
    return data;
  }

  private async handleQueryStrategy(
    queries: Queries
  ): Promise<Post | Posts | null> {
    const { authorId, tags, id } = queries;

    if (id) {
      return await this.getById(id);
    }

    if (authorId) {
      return await this.getByAuthorId(authorId);
    }

    if (tags) {
      return await this.getByTags(tags);
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
  private async getById(query: string): Promise<Post | null> {
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
  private async getByAuthorId(query: string): Promise<Posts | null> {
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
   * Fetch all posts by provided specific tags, targeting to them.
   *
   * @param {string[]} tags - Arrray of tags.
   * @throws {BadRequestError} - Error of invalid queries, which doesn't contain any specified tag.
   * @returns {Promise<Posts>} - Array of posts found by the tags, otherwise an empty array.
   */
  private async getByTags(tags: object): Promise<Posts> {
    const array: string[] = Object.values(tags);
    console.log(array);
    if (array.length === 0) {
      throw new BadRequestError("'tags' query parameter missing.");
    }

    return this.service.getPostsByTags(array);
  }

  /**
   * Fetch all posts from the DB as an array.
   *
   * @returns {Promise<Post[]>} = An array of posts.
   */
  private async getAllPosts(): Promise<Posts> {
    return this.service.getAllPosts();
  }
}

/**
 * Create post use case for creating instances of new posts.
 *
 * Performs assembling, validation operations on the posts and saving them to the DB.
 *
 * @extends PostUseCase
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

/**
 * Update post use case for modification of posts.
 *
 * Performs basic-level data validation to be updated and saves changes to the DB.
 *
 * @extends PostUseCase
 */
@injectable()
export class UpdatePostUseCase extends PostUseCase {
  private readonly postBlockSchema = z
    .object({
      type: z.enum([
        "text",
        "blockquote",
        "imageURL",
        "videoURL",
        "imageGroupURL",
        "videoGroupURL",
      ]),
      content: z.string(),
    })
    .strict();

  private readonly postBlocksSchema = z.array(this.postBlockSchema);

  private readonly tagsSchema = z.array(z.string().optional());

  private readonly updateSchema = z
    .object({
      tags: this.tagsSchema.optional(),
      blocks: this.postBlocksSchema.min(1).optional(),
    })
    .refine((data) => data.blocks || data.tags, {
      message: "Required post fields missing.",
    });

  constructor(@inject(PostService) private readonly service: PostService) {
    super();
  }

  /**
   * Only outside-accessible method of this class - it's entry point.
   *
   * @param {{ id: string }} query - Object containing post's unique identifier, which should come from the controller's req.params object..
   * @param {UpdatePostDTO} body - Data fields of the post to updated.
   * @returns {Promise<Post>} - Updated post.
   */
  public async execute(
    query: { id?: string },
    body: UpdatePostDTO
  ): Promise<Post> {
    this.assertIdIsString(query.id);
    const id: ObjectId = this.validateObjectId(query.id);
    const validData = this.updateSchema.parse(body) as UpdatePostDTO;

    return this.performPostUpdate(id, validData);
  }

  /**
   * Updates selected to modify fields of post's content and saves changes to the DB.
   *
   * @param {ObjectId} id - Post's specific identifier.
   * @param {UpdatePostDTO} body - data to updated.
   * @returns {Promise<Post>} - Updated post instance.
   */
  private async performPostUpdate(
    id: ObjectId,
    body: UpdatePostDTO
  ): Promise<Post> {
    const updatedPost: Post | null = await this.service.updatePostById(
      id,
      body
    );

    if (!updatedPost)
      throw new NotFoundError(`The post with 'id' ${id} - were not found.`);

    await updatedPost.save();
    return updatedPost;
  }
}

/**
 * Delete post use case for performing deletion process of posts by their unique ID.
 *
 * Performs validation of the query 'id' parameter and deletes a post from the DB.
 *
 * @extends PostUseCase
 */
@injectable()
export class DeletePostUseCase extends PostUseCase {
  constructor(@inject(PostService) private readonly service: PostService) {
    super();
  }

  public async execute(query: { id?: string }): Promise<Post> {
    this.assertIdIsString(query.id);
    const id: ObjectId = this.validateObjectId(query.id);
    return this.performDeletionRequest(id);
  }

  /**
   * Performs deletion request of the specified post and checks for its existing.
   *
   * @param {ObjectId} id - Unique identifier of the post to be deleted.
   * @throws {NotFoundError} - Error indicating that the post is not exist in the DB.
   * @returns {Promise<Post>} - Deleted post instance will be returned after successfull deletion process.
   */
  private async performDeletionRequest(id: ObjectId): Promise<Post> {
    const deletedPost: Post | null = await this.service.deletePostById(id);

    if (!deletedPost) {
      throw new NotFoundError(`Post with id '${id}' were not found.`);
    }

    return deletedPost;
  }
}
