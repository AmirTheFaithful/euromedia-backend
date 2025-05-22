import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import CommentService from "../services/comment.service";
import {
  Comment,
  Comments,
  CreateCommentDTO,
  UpdateCommentDTO,
  CreateCommentDTOInput,
} from "../types/comment.type";
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
  constructor(
    @inject(CommentService) private readonly service: CommentService
  ) {
    super();
  }

  public async execute(queries: SubentityQueries): Promise<Comment | Comments> {
    const data: Comment | Comments | null = await this.handleQueryStrategy(
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

  /**
   * Determines the appropriate fetch strategy based on the provided query parameters
   * and retrieves the corresponding comment(s) from the service layer.
   *
   * @param {SubentityQueries} query - An object containing query parameters such as `id`, `targetId`, and `authorId`.
   * @returns {Promise<Comment | Comments | null>} A single comment, multiple comments, or `null` if nothing is found.
   * @throws {BadRequestError} If none of the expected query parameters are provided.
   */
  protected async handleQueryStrategy(
    queries: SubentityQueries
  ): Promise<Comment | Comments | null> {
    const { id, targetId, authorId } = queries;

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
}

/**
 * Use case class responsible for creating new comments.
 *
 * Extends the base CommentUseCase and uses CommentService
 * to handle the creation logic of comments in the system.
 *
 * Designed for use with dependency injection.
 */
@injectable()
export class CreateCommentUseCase extends CommentUseCase {
  constructor(
    @inject(CommentService) private readonly service: CommentService
  ) {
    super();
  }

  public async execute(input: CreateCommentDTOInput): Promise<Comment> {
    return this.performCreation(input);
  }

  /**
   * Validates the structure and contents of the comment creation DTO.
   * Ensures all required fields are present and that identifiers are valid ObjectIds.
   *
   * @private
   * @param {CreateCommentDTOInput} dto - The raw input data for creating a comment.
   * @returns {CreateCommentDTO} A validated and normalized DTO with converted ObjectId values.
   * @throws {BadRequestError} If required fields are missing or contain invalid values.
   */
  private validateDTO(dto: CreateCommentDTOInput): CreateCommentDTO {
    const { authorId, targetId, content } = dto;

    // Check all required fields for presence.
    if (
      !authorId ||
      !targetId ||
      !content ||
      !content.content ||
      !content.type
    ) {
      throw new BadRequestError();
    }

    // Check targetId and authorId to be valid ObjectId's
    return {
      content,
      targetId: this.validateObjectId(targetId),
      authorId: this.validateObjectId(authorId),
    };
  }

  /**
   * Performs the actual creation of a comment after validating the input DTO.
   *
   * @private
   * @param {CreateCommentDTOInput} dto - The raw data for the comment to be created.
   * @returns {Promise<Comment>} The created comment document.
   */
  private async performCreation(dto: CreateCommentDTOInput): Promise<Comment> {
    const data: CreateCommentDTO = this.validateDTO(dto);

    const newComment = this.service.createComment(data);
    await newComment.save();

    return newComment;
  }
}

/**
 * Use case class responsible for updating comments.
 *
 * Extends the base CommentUseCase and leverages CommentService
 * to perform update operations following business logic.
 *
 * Designed to be used with dependency injection.
 */
@injectable()
export class UpdateCommentUseCase extends CommentUseCase {
  constructor(
    @inject(CommentService) private readonly service: CommentService
  ) {
    super();
  }

  public async execute(
    queries: SubentityQueries,
    dto: UpdateCommentDTO
  ): Promise<Comment> {
    const validData = this.validateDTO(dto);
    const updatedComment = await this.handleQueryStrategy(queries, validData);
    this.assertObjectIsFound(updatedComment);
    await updatedComment.save();
    return updatedComment;
  }

  /**
   * Updates a comment by its unique identifier.
   *
   * @param {string} query - The string representation of the comment ID.
   * @param {UpdateCommentDTO} data - The data to update the comment with.
   * @returns {Promise<Comment | null>} A promise resolving to the updated comment, or null if not found.
   */
  private async updateById(
    query: string,
    data: UpdateCommentDTO
  ): Promise<Comment | null> {
    const id = this.validateObjectId(query);
    const updatedComment = await this.service.updateCommentById(id, data);
    return updatedComment;
  }

  /**
   * Updates a comment identified by both target ID and author ID.
   *
   * @param {string} targetQuery - The string representation of the target entity ID.
   * @param {string} authorQuery - The string representation of the author ID.
   * @param {UpdateCommentDTO} data - The data to update the comment with.
   * @returns {Promise<Comment | null>} A promise resolving to the updated comment, or null if not found.
   */
  private async updateByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string,
    data: UpdateCommentDTO
  ): Promise<Comment | null> {
    const [targetId, authorId] = this.validateQueries(targetQuery, authorQuery);
    const updatedComment =
      await this.service.updateCommentByTargetIdAndAuthorId(
        targetId,
        authorId,
        data
      );
    return updatedComment;
  }

  /**
   * Validates the update data transfer object (DTO).
   *
   * Ensures required fields are present; throws an error if validation fails.
   *
   * @param {UpdateCommentDTO} dto - The update DTO to validate.
   * @returns {UpdateCommentDTO} The validated DTO.
   * @throws {BadRequestError} If the `content` field is missing.
   */
  private validateDTO(dto: UpdateCommentDTO): UpdateCommentDTO {
    const { content } = dto;

    if (!content) {
      throw new BadRequestError();
    }

    return { content };
  }

  /**
   * Determines and executes the appropriate update strategy based on provided query parameters.
   *
   * If an `id` is provided, it performs an update by ID.
   * If both `targetId` and `authorId` are provided, it updates by their combination.
   * Throws an error if neither condition is met.
   *
   * @param {SubentityQueries} queries - The query object containing one of: `id`, `targetId`, or `authorId`.
   * @param {UpdateCommentDTO} data - The data used to update the comment.
   * @returns {Promise<Comment | null>} A promise resolving to the updated comment, or null if not found.
   * @throws {BadRequestError} If no valid query combination is provided.
   */
  protected async handleQueryStrategy(
    queries: SubentityQueries,
    data: UpdateCommentDTO
  ): Promise<Comment | null> {
    const { id, targetId, authorId } = queries;

    if (id) {
      return this.updateById(id, data);
    }

    if (targetId && authorId) {
      return this.updateByTargetIdAndAuthorId(targetId, authorId, data);
    }

    throw new BadRequestError(
      "No queries provided. Either 'id', 'targetId' or 'authorId' should be provided."
    );
  }
}

/**
 * Use case class responsible for handling comment deletion logic.
 *
 * Acts as an application layer abstraction over the CommentService,
 * coordinating deletion of comments by ID or by (targetId + authorId) strategy.
 *
 * Designed for use in a dependency injection context.
 */
@injectable()
export class DeleteCommentUseCase extends CommentUseCase {
  constructor(
    @inject(CommentService) private readonly service: CommentService
  ) {
    super();
  }

  public async execute(queries: SubentityQueries): Promise<Comment> {
    const deletedComment: Comment | null = await this.handleQueryStrategy(
      queries
    );
    this.assertObjectIsFound(deletedComment);
    return deletedComment;
  }

  /**
   * Deletes a comment by its string-based identifier after validating it as a valid ObjectId.
   *
   * @private
   * @param {string} query - The string representing the comment's ID.
   * @returns {Promise<Comment | null>} A promise resolving to the deleted comment, or null if not found.
   * @throws {BadRequestError} Thrown if the ID is invalid.
   */
  private async deleteById(query: string): Promise<Comment | null> {
    const id = this.validateObjectId(query);
    return await this.service.deleteCommentById(id);
  }

  /**
   * Deletes a comment by validating and using both the target ID and author ID provided as strings.
   *
   * @private
   * @param {string} targetQuery - The string representing the target entity's ID.
   * @param {string} authorQuery - The string representing the author's ID.
   * @returns {Promise<Comment | null>} A promise resolving to the deleted comment, or null if not found.
   * @throws {BadRequestError} Thrown if either ID is invalid.
   */
  private async deleteByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string
  ): Promise<Comment | null> {
    const [targetId, authorId] = this.validateQueries(targetQuery, authorQuery);
    return await this.service.deleteCommentByTargetIdAndAuthorId(
      targetId,
      authorId
    );
  }

  /**
   * Determines and executes the appropriate deletion strategy for a comment based on the provided query parameters.
   *
   * Accepts flexible query input and chooses whether to delete by ID or by a combination of target ID and author ID.
   * If neither strategy is applicable, throws a BadRequestError.
   *
   * @protected
   * @param {SubentityQueries} queries - An object potentially containing `id`, `targetId`, and `authorId`.
   * @returns {Promise<Comment | null>} A promise resolving to the deleted comment, or null if not found.
   * @throws {BadRequestError} Thrown if neither a valid `id` nor a valid pair of `targetId` and `authorId` is provided.
   */
  protected async handleQueryStrategy(
    queries: SubentityQueries
  ): Promise<Comment | null> {
    const { id, targetId, authorId } = queries;

    if (id) {
      return this.deleteById(id);
    }

    if (targetId && authorId) {
      return this.deleteByTargetIdAndAuthorId(targetId, authorId);
    }

    throw new BadRequestError(
      "No queries provided. Either 'id', 'targetId' or 'authorId' should be provided."
    );
  }
}
