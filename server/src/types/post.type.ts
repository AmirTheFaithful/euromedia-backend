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
 * An array of PostBlock elements.
 * Used for representing multiple structured content units within a post.
 */
export type PostBlocks = PostBlock[];

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
 * @property {PostBlocks} content.blocks - An array of content blocks in the post.
 */
export interface Post extends Document {
  authorId: ObjectId;
  createdAt: Date;
  updated: boolean;
  updatedAt: Date;
  tags: Array<string>;
  blocks: PostBlocks;
}

/**
 * An array of posts entites.
 * Useful for batch operations and query results.
 */
export type Posts = Post[];

/**
 * Data Transfer Object for creating a new post.
 * Used when submitting data from the client to the server during post creation.
 *
 * @typedef {Object} CreatePostDTO
 * @property {ObjectId} authorId - The ID of the user creating the post.
 * @property {string} title - The title of the new post.
 * @property {PostBlocks} blocks - Content blocks comprising the body of the post.
 * @property {string[]=} tags - Optional tags to be associated with the post.
 */
export type CreatePostDTO = {
  authorId: ObjectId;
  title: string;
  blocks: PostBlocks;
  tags?: Array<string>;
};

/**
 * Data Transfer Object for updating an existing post.
 * All fields are optional, and 'authorId' is intentionally excluded.
 *
 * Typically used in PATCH requests to modify an existing post.
 */
export type UpdatePostDTO = Partial<Omit<CreatePostDTO, "authorId">>;
