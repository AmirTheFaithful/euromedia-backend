import { Document } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * Represents a user's reaction to a unit of content (e.g., a post, comment, etc.).
 *
 * Extends Mongoose's `Document` interface to inherit model methods and metadata.
 *
 * @interface Reaction
 * @extends Document
 *
 * @property {ObjectId} authorId - The MongoDB ObjectId of the user who created the reaction.
 * @property {ObjectId} targetId - The MongoDB ObjectId of the content item being reacted to (e.g., post, comment).
 * @property {string} emoji - The emoji used for the reaction (e.g., "👍", "🔥").
 * @property {boolean} updated - Indicates whether the reaction was edited after creation.
 * @property {Date} createdAt - Timestamp indicating when the reaction was created.
 * @property {Date} updatedAt - Timestamp of the last time the reaction was updated.
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
 * Represents a collection of `Reaction` documents.
 *
 * Useful for handling multiple reactions in aggregations, analytics, or batch operations.
 *
 * @typedef {Reaction[]} Reactions
 */
export type Reactions = Reaction[];
