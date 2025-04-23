import { Schema, model, Model } from "mongoose";
import { injectable } from "inversify";

import { Post, PostBlock } from "../types/post.type";

/**
 * Mongoose schema definition for a single content block within a post.
 *
 * Each block represents a structured unit of post content, allowing flexible rendering.
 * Common types may include "paragraph", "header", "quote", etc.
 */
const PostBlockSchema = new Schema<PostBlock>({
  type: { type: String, required: true },
  content: { type: String, required: true },
});

/**
 * Mongoose schema definition for the Post entity.
 *
 * This schema organizes post-related data into meaningful groups:
 * - `meta`: metadata about the post, such as authorship and timestamps.
 * - `content`: main textual and block-based content of the post.
 */
// Explicit generic <Post> is intentionally omitted due to potential recursive type inference issues in complex document structures.
const PostSchema = new Schema({
  // ID of the post's author (required).
  authorId: { type: Schema.Types.ObjectId, required: true },
  // createdAt defaults to the current date.
  createdAt: { type: Date, default: Date.now },
  // A flag indicating whether the post has been updated.
  updated: { type: Boolean, default: false },
  // updatedAt defaults to the current date.
  updatedAt: { type: Date, default: Date.now },
  // tags is an array of strings, defaults to an empty array.
  tags: { type: [String], default: [] },
  // Content blocks are required.
  blocks: { type: [PostBlockSchema], required: true },
});

// @injectable() decorator indicates that this class can be injected via Dependency Injection (DI)
@injectable()
export default class PostModel {
  public instance: Model<Post>;

  constructor() {
    // Creating the model based on the Post schema
    this.instance = model<Post>("Post", PostSchema);
  }
}
