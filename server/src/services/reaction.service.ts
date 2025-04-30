import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import ReactionRepository from "../repositories/reaction.repo";
import { CreateReactionDTO, UpdateReactionDTO } from "../types/reaction.type";

/**
 * Responsible on operations over reactions.
 *
 * Provides methods for retrieving, updating and deleting reactions.
 */
@injectable()
export default class ReactionService {
  constructor(
    @inject(ReactionRepository) private readonly repo: ReactionRepository
  ) {}

  /**
   * Retrieves a reaction by its unique ID identifier.
   *
   * @param {ObjectId} id - The ID of the reaction.
   * @returns {Promise<Reaction | null>} - The corresponding reaction or null if not found.
   */
  public async getReactionById(id: ObjectId) {
    return this.repo.getReactionById(id);
  }

  /**
   * Retrieves all reactions associated with a specific content unit
   * (e.g. a post, a comment), regardless of the author.
   *
   * @param {ObjectId} id - The ID of the target content.
   * @returns {Promise<Reactions>} - An array of matching reactions.
   */
  public async getReactionsByTargetId(id: ObjectId) {
    return this.repo.getReactionsByTargetId(id);
  }

  /**
   * Retrieves all reactions made by a specific author, across any content.
   *
   * @param {ObjectId} id - The ID of the author..
   * @returns {Promise<Reactions>} - An array of the author's reactions.
   */
  public async getReactionsByAuthorId(id: ObjectId) {
    return this.repo.getReactionsByAuthorId(id);
  }

  /**
   * Retrieves a reaction lef by a specific author on a specific content unit.
   *
   * @param {ObjectId} targetId - The ID of the target content.
   * @param {ObjectId} authorId - The ID of the author.
   * @returns {Promise<Reaction | null>} - The matching reaction or null if not found.
   */
  public async getReactionByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ) {
    return this.repo.getReactionByTargetIdAndAuthorId(targetId, authorId);
  }

  /**
   * Creates a new reaction in the database.
   *
   * @param {CreateReactionDTO} data - The payload containing the reaction data.
   * @returns {Promise<Reaction>} - The newly created reaction.
   */
  public async createNewReaction(data: CreateReactionDTO) {
    return this.repo.createNewReaction(data);
  }

  /**
   * Updates an existing reaction by its ID.
   *
   * @param {ObjectId} id - The ID of the reaction to update.
   * @param {UpdateReactionDTO} data - The updated reaction fields.
   * @returns {Promise<Reaction | null>} - The updated reaction or null if not found.
   */
  public async updateReactionById(id: ObjectId, data: UpdateReactionDTO) {
    return this.repo.updateReactionById(id, data);
  }

  /**
   * Updates a reaction by target and auhtor identifiers.
   *
   * @param {ObjectId} targetId - The ID of the content the reaction is related to.
   * @param {ObjectId} authorId - The ID of the user who made the reaction.
   * @param {Promise<Reaction | null>} data - The updated reaction fields.
   * @returns {Promise<Reaction | null>} - The updated reaction or null if not found.
   */
  public async updateReactionByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId,
    data: UpdateReactionDTO
  ) {
    return this.repo.updateReactionByTargetIdAndAuthorId(
      targetId,
      authorId,
      data
    );
  }

  /**
   * Deletes a reaction by its ID.
   *
   * @param {ObjectId} id - The ID of the reaction to delete.
   * @returns {Promise<Reaction | null>} - The deleted reaction or null if not found.
   */
  public async deleteReactionById(id: ObjectId) {
    return this.repo.deleteReactionById(id);
  }

  /**
   * Deletes a reaction using the target and author IDs.
   *
   * @param {ObjectId} targetId - The ID of the content the reaction is related to.
   * @param {ObjectId} authorId - The ID of the user who made the reaction.
   * @returns {Promise<Reaction | null>} - The deleted reaction or null if not found.
   */
  public async deleteReactionByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ) {
    return this.repo.deleteReactionByTargetIdAndAuthorId(targetId, authorId);
  }
}
