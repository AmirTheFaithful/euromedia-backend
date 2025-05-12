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

interface Queries {
  id?: string;
  authorId?: string;
  targetId?: string;
}

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

@injectable()
export class FetchReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(queries: Queries) {
    const data = await this.decideQuery(queries);
    this.assertObjectIsFound(data);
    return data;
  }

  /**
   * Distribute operation flow by queries.
   *
   * @param {Queries} queries - A unique identifier or the group of identifiers of the specific reaction.
   * @throws {BadRequestError} - When no queries were provided.
   * @returns {Promise<Reaction | Reactions>} - A specific reaction or an array of reactions, if target's all reactions ordered.
   * */
  private async decideQuery(queries: Queries) {
    const { id, targetId, authorId } = queries;

    // By reaction's own identifier.
    if (id) {
      return await this.fetchById(id);
    }

    // By reaction target's and author's identifiers.
    else if (targetId && authorId) {
      return await this.fetchByTargetIdAndAuthorId(targetId, authorId);
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
}

@injectable()
export class CreateReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(input: CreateReactionInputDTO): Promise<Reaction> {
    const validData = this.validateDTO(input);
    return this.createReaction(validData);
  }

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

  private async createReaction(data: CreateReactionDTO): Promise<Reaction> {
    const newReaction: Reaction = await this.service.createNewReaction(data);

    await newReaction.save();
    return newReaction;
  }
}

@injectable()
export class UpdateReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(
    queries: Queries,
    data: UpdateReactionDTO
  ): Promise<Reaction> {
    this.assertDataIsValid(data);
    return await this.updateReaction(queries, data);
  }

  private assertDataIsValid(
    data: UpdateReactionDTO
  ): asserts data is UpdateReactionDTO {
    if (!data.type) {
      throw new BadRequestError("The 'type' field is missing.");
    }
  }

  private async updateReaction(
    queries: Queries,
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

  private async updateReactionById(query: string, data: UpdateReactionDTO) {
    const id = this.validateObjectId(query);
    return await this.service.updateReactionById(id, data);
  }

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

@injectable()
export class DeleteReactionUseCase extends ReactionUseCase {
  constructor(@inject(ReactionService) service: ReactionService) {
    super(service);
  }

  public async execute(input: Queries): Promise<Reaction> {
    return await this.decideQuery(input);
  }

  private async decideQuery(queries: Queries) {
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

  private async deleteReactionById(query: string) {
    const id = this.validateObjectId(query);
    return await this.service.deleteReactionById(id);
  }

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
