import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import ReactionModel from "../models/reaction.model";
import {
  Reaction,
  Reactions,
  CreateReactionDTO,
  UpdateReactionDTO,
} from "../types/reaction.type";

/**
 * ReactionRepository: Repository for handling DB operations on reaction units (likes).
 *
 * @injectable() decorator indicates that this class can be injected via Dependency Injection (DI)
 */
@injectable()
export default class ReactionRepository {
  constructor(@inject(ReactionModel) private readonly model: ReactionModel) {}

  /**
   * Fetch reaction by its ID.
   *
   * @param {ObjectId} id - Specific reaction identifier.
   * @returns {Promise<Reaction | null>} - Reaction or null value if no reaction were found.
   */
  public async getReactionById(id: ObjectId): Promise<Reaction | null> {
    return this.model.instance.findById(id);
  }

  /**
   * Fetch reactions by their target ID.
   *
   * @param {ObjectId} id - Specific target (post, comment, etc.) identifier.
   * @returns {Promise<Reactions>} - Array of reactions.
   */
  public async getReactionsByTargetId(id: ObjectId): Promise<Reactions> {
    return this.model.instance.find({ targetId: id });
  }

  /**
   * Fetch reactions by their author ID.
   *
   * @param {ObjectId} id - Specific author (user account) identifier.
   * @returns {Promise<Reactions>} - Array of reactions.
   */
  public async getReactionsByAuthorId(id: ObjectId): Promise<Reactions> {
    return this.model.instance.find({ authorId: id });
  }

  /**
   * Fetch a reaction by its author's and target's IDs.
   *
   * @param {ObjectId} targetId - Specific target (post, comment, etc.) identifier.
   * @param {ObjectId} authorId - Specific author (user account) identifier.
   * @returns {Promise<Reaction | null>} - Reaction or a null value if no reaction were found.
   */
  public async getReactionByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ): Promise<Reaction | null> {
    return this.model.instance.findOne({ targetId, authorId });
  }

  /**
   * Create new reaction with provided data.
   *
   * @param {CreateReactionDTO} data - Data of a new reaction (type of emoji, category of emotion).
   * @returns {Promise<Reaction>} - A new reaction document.
   */
  public async createNewReaction(data: CreateReactionDTO): Promise<Reaction> {
    return new this.model.instance(data);
  }

  /**
   * Update an reaction by its ID and providing data to be changed.
   *
   * @param {ObjectId} id - Specific identifier of the reaction document.
   * @param {UpdateReactionDTO} data - Data fields to be updated (type of emoji, category of emotion).
   * @returns {Promise<Reaction | null>} - Reaction or a null value if the reaction were not found.
   */
  public async updateReactionById(
    id: ObjectId,
    data: UpdateReactionDTO
  ): Promise<Reaction | null> {
    return this.model.instance.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Update a reaction by its target and its author IDs.
   *
   * @param {ObjectId} targetId - Specific target (post, comment, etc.) identifier.
   * @param {ObjectId} authorId - Specific author (user account) identifier.
   * @param {UpdateReactionDTO} data - Data fields to be updated (type of emoji, category of emotion).
   * @returns {Promise<Reaction | null>} - Reaction or a null value if the reaction were not found.
   */
  public async updateReactionByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId,
    data: UpdateReactionDTO
  ): Promise<Reaction | null> {
    return this.model.instance.findOneAndUpdate({ targetId, authorId }, data, {
      new: true,
    });
  }

  /**
   * Delete a reaction by its ID.
   *
   * @param {ObjectId} id - Specific reaction document ID.
   * @returns {Promise<Reaction | null>} - Reaction or a null value if the reaction were not found.
   */
  public async deleteReactionById(id: ObjectId): Promise<Reaction | null> {
    return this.model.instance.findByIdAndDelete(id);
  }

  /**
   * Delete a reaction by its target's and author's IDs.
   *
   * @param {ObjectId} targetId - Specific target (post, comment, etc.) identifier.
   * @param {ObjectId} authorId - Specific author (user account) identifier.
   * @returns {Promise<Reaction | null>} - Reaction or a null value if the reaction were not found.
   */
  public async deleteReactionByTargetIdAndAuthorId(
    targetId: ObjectId,
    authorId: ObjectId
  ): Promise<Reaction | null> {
    return this.model.instance.findOneAndDelete({ targetId, authorId });
  }
}
