import { Schema, model, Model } from "mongoose";
import { ObjectId } from "mongodb";
import { injectable } from "inversify";

import { Post } from "../types/post.type";

// Defining the schema for the Post model:
const PostSchema = new Schema<Post>({
  meta: {
    // authorId is mandatory.
    authorId: { type: ObjectId, required: true },
    // createdAt defaults to the current date.
    createdAt: { type: Date, default: Date.now },
    // A flag indicating whether the post has been updated
    updated: { type: Boolean, default: false },
    // updatedAt defaults to the current date
    updatedAt: { type: Date, default: Date.now },
    // tags is an array of strings, defaults to an empty array
    tags: { type: [String], default: [] },
  },
  content: {
    // title is mandatory
    title: { type: String, required: true },
    // content of the block is required
    blocks: [
      {
        type: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
  },
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
