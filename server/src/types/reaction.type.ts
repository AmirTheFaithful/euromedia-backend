import { Document } from "mongoose";
import { ObjectId } from "mongodb";

import { Replace } from "./utils.type";

/**
 * Describes the kind of reaction or emotion of the user to a content unit (e.g., a post, comment, etc.).
 *
 * Each category of reactions contiains four separate reaction units to describe user's emotion.
 * Categories:
 * - {@link PositiveReactions}
 * - {@link AttractiveReactions}
 * - {@link SadReactions}
 * - {@link NegativeReactions}
 *
 * @typedef {PositiveReactions | AttractiveReactions | SadReactions | NegativeReactions} ReactionType
 */
export type ReactionType =
  | PositiveReactions
  | AttractiveReactions
  | SadReactions
  | NegativeReactions;

/**
 * Positive reactions expressing joy, humor, or general approval.
 *
 * @typedef {"like" | "smile" | "fun" | "laugh"} PositiveReactions
 */
export type PositiveReactions = "like" | "smile" | "fun" | "laugh";

/**
 * Reactions expressing strong positive emotions or excitement.
 *
 * @typedef {"love" | "happy" | "amazed" | "scared"} AttractiveReactions
 */
export type AttractiveReactions = "love" | "happy" | "amazed" | "scared";

/**
 * Reactions representing sadness, boredom, or emotional vulnerability.
 *
 * @typedef {"bored" | "sad" | "cry" | "sigh"} SadReactions
 */
export type SadReactions = "bored" | "sad" | "cry" | "sigh";

/**
 * Negative reactions expressing dissatisfaction or disapproval.
 *
 * @typedef {"dislike" | "angry" | "hate" | "shame"} NegativeReactions
 */
export type NegativeReactions = "dislike" | "angry" | "hate" | "shame";

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
  type: ReactionType;
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

/**
 * Represents an object with fields required to create a new reaction.
 *
 * @typedef {Omit<Reaction, "updated" | "createdAt">} CreateReactionDTO.
 */
export type CreateReactionDTO = Pick<
  Reaction,
  "type" | "targetId" | "authorId"
>;

/**
 * Input DTO for creating a new reaction, as received from the client.
 *
 * Based on {@link CreateReactionDTO}, but replaces `targetId` and `authorId`
 * with `string` types, since client-side input comes as plain strings (e.g. query strings parameters).
 * These fields are expected to be converted to `ObjectId` before being used
 * in service, repository, or database layers.
 *
 * @typedef {CreateReactionInputDTO}
 *
 * @property {string} targetId - The ID of the target entity (e.g., post or comment) as a string.
 * @property {string} authorId - The ID of the user who authored the reaction, as a string.
 * @property {"like" | "dislike" | ...} type - The type of reaction, following the {@link ReactionType}.
 */
export type CreateReactionInputDTO = Replace<
  CreateReactionDTO,
  { targetId: string; authorId: string }
>;

/**
 * Represents an object with fields allowed to be modified.
 *
 * @typedef {Pick<Reaction, "type" | "updated" | "updatedAt">} UpdateReactionDTO
 */
export type UpdateReactionDTO = Pick<Reaction, "type">;
