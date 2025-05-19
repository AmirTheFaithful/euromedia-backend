import { ObjectId } from "mongodb";
import { injectable, inject } from "inversify";
import CommentModel from "../models/comment.model";
import {
  Comment,
  Comments,
  CreateCommentDTO,
  UpdateCommentDTO,
} from "../types/comment.type";

/**
 * Repository for managing Comment entities in the database.
 *
 * Provides methods for creating, retrieving, updating, and deleting comments.
 */
@injectable()
export default class CommentRepo {
  constructor(@inject(CommentModel) private readonly model: CommentModel) {}

  /**
   * Fetch a comment by its ID.
   *
   * @param {ObjectId} id - Unique identifier of the comment.
   * @returns {Promise<Comment | null>} - Comment or null if not found.
   */
  public async getCommentById(id: ObjectId): Promise<Comment | null> {
    return await this.model.instance.findById(id);
  }

  /**
   * Fetch a comment by target ID and author ID.
   *
   * @param {ObjectId} targetId - Identifier of the target entity the comment belongs to.
   * @param {ObjectId} authorId - Identifier of the comment's author.
   * @returns {Promise<Comment | null>} - Comment or null if not found.
   */
  public async getCommentByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ): Promise<Comment | null> {
    return await this.model.instance.findOne({ targetId, authorId });
  }

  /**
   * Fetch all comments for a specific target entity.
   *
   * @param {ObjectId} targetId - Identifier of the target entity.
   * @returns {Promise<Comments>} - List of comments related to the target.
   */
  public async getCommentsByTargetId(targetId: ObjectId): Promise<Comments> {
    return await this.model.instance.find({ targetId });
  }

  /**
   * Create a new comment.
   *
   * @param {CreateCommentDTO} comment - Data transfer object containing new comment data.
   * @returns {Promise<Comment>} - Newly created comment.
   */
  public async createComment(comment: CreateCommentDTO): Promise<Comment> {
    return await this.model.instance.create(comment);
  }

  /**
   * Update a comment by its ID.
   *
   * @param {ObjectId} id - Unique identifier of the comment to update.
   * @param {UpdateCommentDTO} data - Partial data for updating the comment.
   * @returns {Promise<Comment | null>} - Updated comment or null if not found.
   */
  public async updateCommentById(
    id: ObjectId,
    data: UpdateCommentDTO
  ): Promise<Comment | null> {
    return await this.model.instance.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Update a comment by its target ID and author ID.
   *
   * @param {ObjectId} targetId - Identifier of the target entity.
   * @param {ObjectId} authorId - Identifier of the comment's author.
   * @param {UpdateCommentDTO} data - Partial data for updating the comment.
   * @returns {Promise<Comment | null>} - Updated comment or null if not found.
   */
  public async updateCommentByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId,
    data: UpdateCommentDTO
  ): Promise<Comment | null> {
    return await this.model.instance.findOneAndUpdate(
      { targetId, authorId },
      data
    );
  }

  /**
   * Delete a comment by its ID.
   *
   * @param {ObjectId} id - Unique identifier of the comment to delete.
   * @returns {Promise<Comment | null>} - Deleted comment or null if not found.
   */
  public async deleteCommentById(id: ObjectId): Promise<Comment | null> {
    return await this.model.instance.findByIdAndDelete(id);
  }

  /**
   * Delete a comment by its target ID and author ID.
   *
   * @param {ObjectId} targetId - Identifier of the target entity.
   * @param {ObjectId} authorId - Identifier of the comment's author.
   * @returns {Promise<Comment | null>} - Deleted comment or null if not found.
   */
  public async deleteCommentByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ): Promise<Comment | null> {
    return await this.model.instance.findOneAndDelete({ targetId, authorId });
  }
}
