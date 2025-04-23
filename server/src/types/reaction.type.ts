import { Document } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * Represents a user's reaction to a unit of content (e.g., a post, comment, etc...).
 *
 * This interface extends Mongoose's `Document` type, enabling access to built-in methods
 * such as `.save()`, `.remove()`, and versioning metadata.
 *
 * Fields:
 * - `authorId`: MongoDB ObjectId of the user who created the reaction.
 * - `targetId`: MongoDB ObjectId of the content unit (e.g., a post, an comment, etc...), this reaction related to.
 * - `emoji`: The emoji symbol used as the reaction (e.g., "👍", "🔥").
 * - `updated`: Flag indicating whether the reaction was edited or changed post-creation.
 * - `createdAt`: Timestamp when the reaction was initially created.
 * - `updatedAt`: Timestamp of the last update to the reaction.
 */
export interface Reaction extends Document {
  authorId: ObjectId;
  targetId: ObjectId;
  emoji: string;
  updated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An array of `Reaction` documents.
 * Useful for representing collections of reactions in response aggregations,
 * analytics, or batch operations.
 */
export type Reactions = Reaction[];
