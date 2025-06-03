import { BadRequestError } from "../errors/http-errors";
import { SubentityQueries } from "../types/queries.type";

/**
 * Determines a unique cache key based on query parameters.
 *
 * - If `id` is provided, uses the reaction's own ID.
 * - If `targetId` and `authorId` are provided, uses both to build the key.
 * - If only `targetId` is provided, uses it alone.
 * - Throws if none of the above patterns match.
 *
 * @param {SubentityQueries} query - Request query parameters
 * @returns {string} A string representing the cache key
 * @throws {BadRequestError} if the query parameters are invalid
 */
export const getCachedKey = (query: SubentityQueries): string => {
  // Determine the appropriate cache key based on available identifiers.

  // Reaction's own id:
  if (typeof query.id === "string") return `reaction:id:${query.id}`;

  // Target and author ids:
  if (typeof query.targetId === "string" && typeof query.authorId === "string")
    return `reaction:target:${query.targetId}:author:${query.authorId}`;

  // Only target id:
  if (typeof query.targetId === "string" && typeof query.authorId !== "string")
    return `reaction:target:${query.targetId}`;

  throw new BadRequestError("Invalid query string parameters.");
};
