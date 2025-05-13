import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import ReactionService from "../services/reaction.service";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import {
  Reaction,
  CreateReactionInputDTO,
  CreateReactionDTO,
  UpdateReactionDTO,
} from "../types/reaction.type";
import { SubentityQueries } from "../types/queries.type";

/**
 * Abstract base class for all reaction-related use cases.
 *
 * Provides access to the core reaction service and shared logic
 * for concrete implementations such as create, update, fetch, or delete operations.
 *
 * @abstract
 */
export abstract class ReactionUseCase {
  protected constructor(protected readonly service: ReactionService) {}

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

  protected validateQueries(
    targetId: string,
    authorId: string
  ): [ObjectId, ObjectId] {
    return [this.validateObjectId(targetId), this.validateObjectId(authorId)];
  }
}

/**
 * Use case for retrieving a single reaction or a group of reactions
 * based on various query parameters (id, targetId, authorId).
 *
 * Delegates the fetching logic to the appropriate service methods
 * depending on the provided query combination.
 */
@injectable()
export class FetchReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(queries: SubentityQueries) {
    const data = await this.decideByQuery(queries);
    this.assertObjectIsFound(data);
    return data;
  }

  /**
   * Distribute operation flow by queries.
   *
   * @param {SubentityQueries} queries - A unique identifier or the group of identifiers of the specific reaction.
   * @throws {BadRequestError} - When no queries were provided.
   * @returns {Promise<Reaction | Reactions>} - A specific reaction or an array of reactions, if target's all reactions ordered.
   * */
  private async decideByQuery(queries: SubentityQueries) {
    const { id, targetId, authorId } = queries;

    // By reaction's own identifier.
    if (id) {
      return await this.fetchById(id);
    }

    // By reaction target's and author's identifiers.
    else if (targetId && authorId) {
      return await this.fetchByTargetIdAndAuthorId(targetId, authorId);
    }

    // Only by target's ID.
    else if (targetId && !authorId) {
      return await this.fetchByTargetId(targetId);
    }

    throw new BadRequestError(
      "No queries provided. Either 'id', 'targetId' or 'authorId' should be provided."
    );
  }

  /**
   * Finds a specific reaction by its unique ID.
   *
   * @param {string} query - Reaction's unique ID.
   * @returns {Promise<Reaction | null>} - Fetched reaction or null if it weren't found.
   */
  private async fetchById(query: string) {
    const id = this.validateObjectId(query);
    return await this.service.getReactionById(id);
  }

  /**
   * Finds a specific reaction by target's and author's identifiers.
   *
   * @param {string} targetQuery - Target's unique identifier.
   * @param {string} authorQuery - Author's unique identifier.
   * @returns {Promise<Reaction | null>} - Fetched reaction or null if it weren't found.
   */
  private async fetchByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string
  ) {
    const [targetId, authorId] = this.validateQueries(targetQuery, authorQuery);
    return await this.service.getReactionByTargetIdAndAuthorId(
      targetId,
      authorId
    );
  }

  /**
   * Finds a specific reaction by target's identifier.
   *
   * @param {string} targetQuery - Target's unique identifier.
   * @returns {Promise<Reactions>} - Array of fetched reactions. If there's no reactions - the array will be empty.
   */
  private async fetchByTargetId(targetQuery: string) {
    const targetId: ObjectId = this.validateObjectId(targetQuery);
    return await this.service.getReactionsByTargetId(targetId);
  }
}

/**
 * Use case for creating a new reaction.
 *
 * Validates the input payload and delegates the creation logic to the service.
 */
@injectable()
export class CreateReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(input: CreateReactionInputDTO): Promise<Reaction> {
    const validData = this.validateDTO(input);
    return this.createReaction(validData);
  }

  /**
   * Validates required fields and ensures targetId and authorId are valid ObjectIds.
   *
   * @param {CreateReactionInputDTO} data - Input DTO to validate
   * @returns {CreateReactionDTO} A normalized and validated DTO ready for persistence
   * @throws {BadRequestError} If required fields are missing
   */
  private validateDTO(data: CreateReactionInputDTO): CreateReactionDTO {
    let { targetId, authorId, type } = data;

    if (!targetId || !authorId || !type) {
      throw new BadRequestError(
        "The 'type', 'authorId' and 'targetId' fields are required."
      );
    }

    return {
      type,
      targetId: this.validateObjectId(targetId),
      authorId: this.validateObjectId(authorId),
    };
  }

  /**
   * Persists a new reaction based on the validated input.
   *
   * @param {CreateReactionDTO} data - Validated data used to create the reaction
   * @returns {Promise<Reaction>} The newly created and saved reaction
   */
  private async createReaction(data: CreateReactionDTO): Promise<Reaction> {
    const newReaction: Reaction = await this.service.createNewReaction(data);

    await newReaction.save();
    return newReaction;
  }
}

/**
 * Use case for updating an existing reaction.
 *
 * Resolves the target reaction either by ID or by a (targetId and authorId) pair,
 * validates the input, and updates the reaction accordingly.
 */
@injectable()
export class UpdateReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(
    queries: SubentityQueries,
    data: UpdateReactionDTO
  ): Promise<Reaction> {
    this.assertDataIsValid(data);
    return await this.updateReaction(queries, data);
  }

  /**
   * Ensures that the update payload contains a valid `type`.
   *
   * @param {UpdateReactionDTO} data - Payload to validate
   * @throws {BadRequestError} If `type` is missing
   */
  private assertDataIsValid(
    data: UpdateReactionDTO
  ): asserts data is UpdateReactionDTO {
    if (!data.type) {
      throw new BadRequestError("The 'type' field is missing.");
    }
  }

  /**
   * Determines update strategy based on provided query.
   * Updates either by `id` or by `targetId` + `authorId`.
   *
   * @param {SubentityQueries} queries - Identifiers for the reaction
   * @param {UpdateReactionDTO} data - Update data
   * @returns {Promise<Reaction>} The updated and saved reaction
   */
  private async updateReaction(
    queries: SubentityQueries,
    data: UpdateReactionDTO
  ): Promise<Reaction> {
    const { id, targetId, authorId } = queries;

    let updatedReaction: Reaction | null = null;

    if (id) {
      updatedReaction = await this.updateReactionById(id, data);
    } else if (targetId && authorId) {
      updatedReaction = await this.updateReactionByTargetIdAndAuthorId(
        targetId,
        authorId,
        data
      );
    }

    this.assertObjectIsFound(updatedReaction);

    await updatedReaction.save();

    return updatedReaction;
  }

  /**
   * Updates a reaction using its MongoDB `_id`.
   *
   * @param {string} query - Raw reaction id to validate
   * @param {UpdateReactionDTO} data - Update payload
   * @returns {Promise<Reaction | null>} Updated reaction or null if not found
   */
  private async updateReactionById(query: string, data: UpdateReactionDTO) {
    const id = this.validateObjectId(query);
    return await this.service.updateReactionById(id, data);
  }

  /**
   * Updates a reaction using composite key: `targetId` and `authorId`.
   *
   * @param {string} targetQuery - Raw target id to validate
   * @param {string} authorQuery - Raw author id to validate
   * @param {UpdateReactionDTO} data - Update payload
   * @returns {Promise<Reaction | null>} Updated reaction or null if not found
   */
  private async updateReactionByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string,
    data: UpdateReactionDTO
  ) {
    const [targetId, authorId] = this.validateQueries(targetQuery, authorQuery);

    return await this.service.updateReactionByTargetIdAndAuthorId(
      targetId,
      authorId,
      data
    );
  }
}

/**
 * Use case for deleting a reaction.
 *
 * Supports deletion by reaction ID or by a combination of targetId and authorId.
 */
@injectable()
export class DeleteReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(input: SubentityQueries): Promise<Reaction> {
    return await this.decideByQuery(input);
  }

  /**
   * Determines the deletion strategy based on the query input.
   *
   * @param {SubentityQueries} queries - An object possibly containing `id`, `targetId`, and `authorId`.
   * @returns {Promise<Reaction>} - The deleted Reaction.
   * @throws {NotFoundError} - If no reaction is found.
   */
  private async decideByQuery(queries: SubentityQueries) {
    const { id, targetId, authorId } = queries;

    let deletedReaction: Reaction | null = null;

    if (id) {
      deletedReaction = await this.deleteReactionById(id);
    } else if (targetId && authorId) {
      deletedReaction = await this.deleteReactionByTargetIdAndAuthorId(
        targetId,
        authorId
      );
    }

    this.assertObjectIsFound(deletedReaction);

    return deletedReaction;
  }

  /**
   * Deletes a reaction by its unique identifier.
   *
   * @param {string} query - A string representing the reaction ID.
   * @returns {Promise<Reaction> | null} - The deleted Reaction or null.
   * @throws {ValidationError} If the ID is invalid.
   */
  private async deleteReactionById(query: string) {
    const id = this.validateObjectId(query);
    return await this.service.deleteReactionById(id);
  }

  /**
   * Deletes a reaction using a combination of target ID and author ID.
   *
   * @param {string} targetQuery - A string representing the target (e.g., post or comment) ID.
   * @param {string} authorQuery - A string representing the author's user ID.
   * @returns {Promise<Reaction> | null} The deleted Reaction or null.
   * @throws {ValidationError} if either ID is invalid.
   */
  private async deleteReactionByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string
  ) {
    const [targetId, authorId] = this.validateQueries(targetQuery, authorQuery);
    return await this.service.deleteReactionByTargetIdAndAuthorId(
      targetId,
      authorId
    );
  }
}
