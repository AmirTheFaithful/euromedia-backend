import { Schema, Model, model } from "mongoose";
import { injectable } from "inversify";

import { Reaction } from "../types/reaction.type";

/**
 * Mongoose schema for representing a user reaction.
 *
 * This schema is designed to store lightweight interaction data such as emoji reactions.
 * Each reaction is associated with a user (authorId), a specific emoji, and metadata for auditing.
 *
 * Fields:
 * - `authorId`: The ObjectId of the user who made the reaction.
 * - `targetId`: The ObjectId of the content unit (e.g., a post, an comment, etc...), this reaction related to.
 * - `emoji`: The emoji used as a reaction.
 * - `updated`: Boolean flag to indicate if the reaction was updated after creation.
 * - `createdAt`: Timestamp when the reaction was created (defaults to `Date.now()`).
 * - `updatedAt`: Timestamp when the reaction was last modified (defaults to `Date.now()`).
 */
const ReactionSchema = new Schema<Reaction>({
  authorId: { type: Schema.Types.ObjectId, required: true, selected: true },
  targetId: { type: Schema.Types.ObjectId, required: true, selected: true },
  emoji: { type: String, required: true, selected: true },
  updated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

/**
 * Dependency-injectable wrapper around the Reaction Mongoose model.
 *
 * Provides access to the underlying Mongoose model through `this.instance`,
 * enabling interaction with the `Reaction` collection in the database.
 *
 * This class is marked with the `@injectable()` decorator to allow
 * for integration within an InversifyJS-based Dependency Injection container.
 */
@injectable()
export default class ReactionModel {
  public instance: Model<Reaction>;

  constructor() {
    this.instance = model<Reaction>("Reaction", ReactionSchema);
  }
}
