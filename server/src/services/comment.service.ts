import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import CommentRepo from "../repositories/comment.repo";
import { CreateCommentDTO, UpdateCommentDTO } from "../types/comment.type";

/**
 * Service layer responsible for business logic related to comments.
 *
 * Provides high-level operations for creating, retrieving, updating, and deleting comments,
 * abstracting away the underlying repository implementation.
 *
 * Designed for use in dependency injection contexts.
 */
@injectable()
export default class CommentService {
  constructor(@inject(CommentRepo) private readonly repo: CommentRepo) {}

  /**
   * Retrieves a single comment by its unique identifier.
   *
   * @param {ObjectId} id - The unique identifier of the comment.
   * @returns {Promise<Comment | null>} A promise resolving to the comment, if found.
   */
  public async getCommentById(id: ObjectId) {
    return this.repo.getCommentById(id);
  }

  /**
   * Retrieves a comment authored by a specific user for a specific target entity.
   *
   * @param {ObjectId} targetId - The identifier of the target entity.
   * @param {ObjectId} authorId - The identifier of the author.
   * @returns {Promise<Comment | null>} A promise resolving to the matching comment, if found.
   */
  public async getCommentByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ) {
    return this.repo.getCommentByTargetIdAndAuthorId(targetId, authorId);
  }

  /**
   * Retrieves all comments associated with a given target entity.
   *
   * @param {ObjectId} id - The identifier of the target entity.
   * @returns {Promise<Comments>} A promise resolving to an array of comments.
   */
  public async getCommentsByTargetId(id: ObjectId) {
    return this.repo.getCommentsByTargetId(id);
  }

  /**
   * Creates a new comment based on the provided data transfer object.
   *
   * @param {CreateCommentDTO} data - The data required to create a new comment.
   * @returns {Promise<Comment>} A promise resolving to the created comment.
   */
  public async createComment(data: CreateCommentDTO) {
    return this.repo.createComment(data);
  }

  /**
   * Updates a comment identified by its unique ID with the provided data.
   *
   * @param {ObjectId} id - The unique identifier of the comment.
   * @param {UpdateCommentDTO} data - The data to update the comment with.
   * @returns {Promise<Comment | null>} A promise resolving to the updated comment, or null if not found.
   */
  public async updateCommentById(id: ObjectId, data: UpdateCommentDTO) {
    return this.repo.updateCommentById(id, data);
  }

  /**
   * Updates a comment identified by both target and author identifiers.
   *
   * @param {ObjectId} targetId - The identifier of the target entity.
   * @param {ObjectId} authorId - The identifier of the author.
   * @param {UpdateCommentDTO} data - The data to update the comment with.
   * @returns {Promise<Comment | null>} A promise resolving to the updated comment, or null if not found.
   */
  public async updateCommentByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId,
    data: UpdateCommentDTO
  ) {
    return this.repo.updateCommentByTargetIdAndAuthorId(
      targetId,
      authorId,
      data
    );
  }

  /**
   * Deletes a comment by its unique identifier.
   *
   * @param {ObjectId} id - The unique identifier of the comment.
   * @returns {Promise<boolean>} A promise resolving to true if the comment was deleted.
   */
  public async deleteCommentById(id: ObjectId) {
    return this.repo.deleteCommentById(id);
  }

  /**
   * Deletes a comment identified by both target and author identifiers.
   *
   * @param {ObjectId} targetId - The identifier of the target entity.
   * @param {ObjectId} authorId - The identifier of the author.
   * @returns {Promise<boolean>} A promise resolving to true if the comment was deleted.
   */
  public async deleteCommentByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ) {
    return this.repo.deleteCommentByTargetIdAndAuthorId(targetId, authorId);
  }
}
