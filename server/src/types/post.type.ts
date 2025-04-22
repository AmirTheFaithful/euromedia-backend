import { Document } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * Represents a single block of content within a post.
 * A block could be a paragraph, an image, or any other chunk of content.
 * The 'type' field defines what kind of block this is, and 'content' contains the actual data.
 *
 * @typedef {Object} PostBlock
 * @property {string} type - The type of the content block (e.g., 'text', 'image').
 * @property {string} content - The actual content of the block (e.g., text, URL, etc.).
 */
export type PostBlock = {
  type: string;
  content: string;
};

/**
 * Represents a post in the system.
 * The 'Post' extends the Mongoose Document, meaning it will contain methods like `.save()` and `.remove()`.
 *
 * The 'meta' field holds metadata about the post (author, creation time, update status, etc.),
 * and 'content' holds the actual content of the post (title and blocks).
 *
 * @interface Post
 * @extends Document
 * @property {Object} meta - Metadata associated with the post.
 * @property {ObjectId} meta.authorId - The ID of the author of the post.
 * @property {Date} meta.createdAt - The date the post was created.
 * @property {boolean} meta.updated - Flag indicating if the post has been updated.
 * @property {Date} meta.updatedAt - The date the post was last updated.
 * @property {Array<string>} meta.tags - Tags associated with the post.
 * @property {Object} content - The actual content of the post.
 * @property {string} content.title - The title of the post.
 * @property {Array<PostBlock>} content.blocks - An array of content blocks in the post.
 */
export interface Post extends Document {
  meta: {
    authorId: ObjectId;
    createdAt: Date;
    updated: boolean;
    updatedAt: Date;
    tags: Array<string>;
  };
  content: {
    title: string;
    blocks: Array<PostBlock>;
  };
}
