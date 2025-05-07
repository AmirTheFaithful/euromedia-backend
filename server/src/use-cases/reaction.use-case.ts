import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import ReactionService from "../services/reaction.service";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { Reaction, Reactions, CreateReactionDTO } from "../types/reaction.type";

interface Queries {
  id?: string;
  special?: {
    authorId: string;
    targetId: string;
  };
}

export class ReactionUseCase {
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

  protected assertReactionIsFound(
    reaction: Reaction | null
  ): asserts reaction is Reaction {
    if (!reaction) {
      throw new NotFoundError("Reaction not found.");
    }
  }
}

@injectable()
export class FetchReactionUseCase extends ReactionUseCase {
  constructor(
    @inject(ReactionService) private readonly service: ReactionService
  ) {
    super();
  }

  public async execute(input: Queries): Promise<Reaction | Reactions> {
    return await this.controllFetch(input);
  }

  private async controllFetch(queries: Queries): Promise<Reaction | Reactions> {
    if (queries.id) {
      return this.fetchById(queries.id);
    }

    if (queries.special) {
      return this.fetchByTargetIdAndAuthorId(
        queries.special.targetId,
        queries.special.authorId
      );
    }

    throw new BadRequestError(
      "No queries provided. Either 'id' or 'special' (targetId and authorId) should be provided."
    );
  }

  private async fetchById(query: string): Promise<Reaction> {
    const id = this.validateObjectId(query);
    const reaction: Reaction | null = await this.service.getReactionById(id);

    this.assertReactionIsFound(reaction);
    return reaction;
  }

  private async fetchByTargetIdAndAuthorId(
    targetQuery: string,
    authorQuery: string
  ): Promise<Reaction> {
    const targetId = this.validateObjectId(targetQuery);
    const authorId = this.validateObjectId(authorQuery);

    const reaction: Reaction | null =
      await this.service.getReactionByTargetIdAndAuthorId(targetId, authorId);

    this.assertReactionIsFound(reaction);
    return reaction;
  }
}

@injectable()
export class CreateReactionUseCase extends ReactionUseCase {
  constructor(
    @inject(ReactionService) private readonly service: ReactionService
  ) {
    super();
  }

  public async execute(input: CreateReactionDTO): Promise<Reaction> {
    this.assertDataIsValid(input);
    return this.createReaction(input);
  }

  private assertDataIsValid(
    data: CreateReactionDTO
  ): asserts data is CreateReactionDTO {
    let { targetId, authorId, type } = data;
    targetId = this.validateObjectId(data.targetId as unknown as string);
    authorId = this.validateObjectId(data.authorId as unknown as string);

    if (!type) {
      throw new BadRequestError("The 'type' field is required.");
    }
  }

  private async createReaction(data: CreateReactionDTO): Promise<Reaction> {
    const newReaction: Reaction = await this.service.createNewReaction(data);

    await newReaction.save();
    return newReaction;
  }
}
