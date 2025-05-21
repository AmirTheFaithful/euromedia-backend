import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import CommentService from "../services/comment.service";
import { Comment, Comments } from "../types/comment.type";
import { SubentityQueries } from "../types/queries.type";
import { NotFoundError, BadRequestError } from "../errors/http-errors";

/**
 * Abstract base class for all comment-related use cases.
 * Provides shared validation and assertion utilities for comment use case implementations.
 *
 * @abstract
 */
abstract class CommentUseCase {
  /**
   * Convert a string to a valid ObjectID instance, if the provided value is valid.
   *
   * @param {string} id - Value to be converted to the ObjectID.
   * @returns {ObjectID} - An instance of the ObjectID.
   * @throws {BadRequestError} - Exception if the invalid vale has been provided.
   */
  protected validateObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError(`Identifier '${id}' is not valid ObjectId.`);
    }

    return new ObjectId(id);
  }

  /**
   * Asserts that the provided object is not null or undefined.
   *
   * @template T - The type of the object being checked.
   * @param {T} object The object to check for existence.
   * @throws {NotFoundError} If the object is null or undefined.
   * @asserts object is T. Ensures the object is defined after this call.
   */
  protected assertObjectIsFound<T>(object: T | null): asserts object is T {
    if (!object) {
      throw new NotFoundError("Object not found.");
    }
  }

  /**
   * Validates and converts the provided `targetId` and `authorId` strings into MongoDB ObjectId instances.
   *
   * @param {string} targetId - The identifier of the target entity to be validated.
   * @param {string} authorId - The identifier of the author entity to be validated.
   * @returns {[ObjectId, ObjectId]} A tuple containing validated ObjectId instances for the target and author.
   * @throws {BadRequestError} If either `targetId` or `authorId` is not a valid ObjectId string.
   */
  protected validateQueries(
    targetId: string,
    authorId: string
  ): [ObjectId, ObjectId] {
    return [this.validateObjectId(targetId), this.validateObjectId(authorId)];
  }
}

@injectable()
export class FetchCommentsUseCase extends CommentUseCase {
  /**
   * Determines the appropriate fetch strategy based on the provided query parameters
   * and retrieves the corresponding comment(s) from the service layer.
   *
   * @param {SubentityQueries} query - An object containing query parameters such as `id`, `targetId`, and `authorId`.
   * @returns {Promise<Comment | Comments | null>} A single comment, multiple comments, or `null` if nothing is found.
   * @throws {BadRequestError} If none of the expected query parameters are provided.
   */
  protected async handleFetchStrategy(
    query: SubentityQueries
  ): Promise<Comment | Comments | null> {
    const { id, targetId, authorId } = query;

    if (id) {
      return this.fetchById(id);
    }

    if (targetId && authorId) {
      return this.fetchByTargetIdAndAuthorId(targetId, authorId);
    }

    if (targetId && !authorId) {
      return this.fetchByTargetId(targetId);
    }

    throw new BadRequestError(
      "No queries provided. Either 'id', 'targetId' or 'authorId' should be provided."
    );
  }

  constructor(
    @inject(CommentService) private readonly service: CommentService
  ) {
    super();
  }

  public async execute(queries: SubentityQueries): Promise<Comment | Comments> {
    const data: Comment | Comments | null = await this.handleFetchStrategy(
      queries
    );
    this.assertObjectIsFound(data);

    return data;
  }

  /**
   * Retrieves a single comment by its unique identifier.
   *
   * @param {string} query - The string representing the comment's ObjectId.
   * @returns {Promise<Comment | null>} The found comment or `null` if not found.
   * @throws {BadRequestError} If the provided `query` is not a valid ObjectId.
   */
  private async fetchById(query: string): Promise<Comment | null> {
    const id = this.validateObjectId(query);
    const comment: Comment | null = await this.service.getCommentById(id);
    return comment;
  }

  /**
   * Retrieves a single comment that matches both the target and author identifiers.
   *
   * @param {string} targetQuery - The string representing the target entity's ObjectId.
   * @param {string} authorQuery - The string representing the author's ObjectId.
   * @returns {Promise<Comment | null>} The found comment or `null` if no match is found.
   * @throws {BadRequestError} If either identifier is not a valid ObjectId.
   */
  private async fetchByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string
  ): Promise<Comment | null> {
    const [targetId, authorId] = this.validateQueries(targetQuery, authorQuery);
    const comment: Comment | null =
      await this.service.getCommentByTargetIdAndAuthorId(targetId, authorId);
    return comment;
  }

  /**
   * Retrieves all comments associated with the specified target identifier.
   *
   * @param {string} targetQuery - The string representing the target entity's ObjectId.
   * @returns {Promise<Comments>} An array of comments linked to the given target.
   * @throws {BadRequestError} If the `targetQuery` is not a valid ObjectId.
   */
  private async fetchByTargetId(targetQuery: string): Promise<Comments> {
    const targetId = this.validateObjectId(targetQuery);
    const comments: Comments = await this.service.getCommentsByTargetId(
      targetId
    );
    return comments;
  }
}
