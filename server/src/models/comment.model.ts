import { model, Schema, Model } from "mongoose";
import { injectable } from "inversify";

import { CommentBlock, Comment } from "../types/comment.type";

/**
 * Mongoose schema for a single content block within a comment.
 *
 * Defines the type and content of the comment block, such as plain text,
 * a quoted section, or an external image URL.
 *
 * @constant {Schema<CommentBlock>} CommentBlockSchema
 */
const CommentBlockSchema = new Schema<CommentBlock>({
  type: { type: String, required: true },
  content: { type: String, required: true },
});

/**
 * Mongoose schema for the Comment entity.
 *
 * Represents a comment associated with a target entity and an author,
 * including its structured content block.
 *
 * @constant {Schema<Comment>} CommentSchema
 */
const CommentSchema = new Schema<Comment>({
  content: { type: CommentBlockSchema, required: true },
  authorId: { type: Schema.Types.ObjectId, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
});

/**
 * Injectable wrapper class around the Mongoose Comment model.
 *
 * Provides access to the model instance for database operations.
 *
 * @class CommentModel
 * @injectable
 */
@injectable()
export default class CommentModel {
  /**
   * The Mongoose model instance used to interact with the Comment collection.
   *
   * @type {Model<Comment>}
   */
  public instance: Model<Comment>;

  /**
   * Initializes the Comment model by binding the schema to Mongoose.
   *
   * @constructor
   */
  constructor() {
    this.instance = model<Comment>("Comment", CommentSchema);
  }
}
