import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import { FetchReactionUseCase } from "../use-cases/reaction.use-case";
import { cache } from "../config/lru";
import { Reaction, Reactions } from "../types/reaction.type";
import { ResponseBody } from "../types/api.type";
import { SubentityQueries } from "../types/queries.type";
import { BadRequestError } from "../errors/http-errors";

class ReactionController {
  constructor(private readonly container = Container()) {}

  /**
   * Generates a unique cache key based on query parameters.
   *
   * - If `id` is provided, uses the reaction's own ID.
   * - If `targetId` and `authorId` are provided, uses both to build the key.
   * - If only `targetId` is provided, uses it alone.
   * - Throws if none of the above patterns match.
   *
   * @param {SubentityQueries} query - Request query parameters
   * @returns A string representing the cache key
   * @throws BadRequestError if the query parameters are invalid
   */
  private getCachedKey(query: SubentityQueries): string {
    /* The key is... */

    // Reaction's own id:
    if (typeof query.id === "string") return `reaction:id:${query.id}`;

    // Target and author ids:
    if (
      typeof query.targetId === "string" &&
      typeof query.authorId === "string"
    )
      return `reaction:target:${query.targetId}:author:${query.authorId}`;

    // Only target id:
    if (
      typeof query.targetId === "string" &&
      typeof query.authorId !== "string"
    )
      return `reaction:target:${query.targetId}`;

    throw new BadRequestError("Invalid query string parameters.");
  }

  public getReactions = asyncHandler(
    async (
      req: Request<unknown, unknown, unknown, SubentityQueries>,
      res: Response<ResponseBody<Reaction | Reactions>>
    ) => {
      // Resolve the use case from the DI container.
      const fetchReactionUseCase = this.container.get(FetchReactionUseCase);
      const data: Reaction | Reactions = await fetchReactionUseCase.execute(
        req.query
      );

      // Get special key value for retrieving cached value, based on query type.
      const cachedKey: string = this.getCachedKey(req.query);

      // Decide if the value has been cached earlier, then based on cache status send a special header.
      const isCached: boolean = cache.has(cachedKey);
      res.setHeader("X-Cache-Status", isCached ? "HIT" : "MISS");

      // Cache the single reaction result if not already cached.
      if (cachedKey && data && !isCached) {
        // Store into the cache.
        cache.set(cachedKey, data);
      }

      // Form a message for client-side based on the cache status and finally send it as a response.
      const responseMessage: string = isCached
        ? "Fetch success (cached)."
        : "Fetch success.";
      res.status(200).json({ data, message: responseMessage });
    }
  );
}

export default new ReactionController();
