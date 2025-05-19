import { Document } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * Represents a block of content within a comment.
 *
 * @typedef {Object} CommentBlock
 * @property {"text" | "blockquote" | "imageURL"} type - The type of the comment block.
 * @property {string} content - The actual content of the block.
 */
export interface CommentBlock {
  type: "text" | "blockquote" | "imageURL";
  content: string;
}

/**
 * An array of CommentBlock objects, representing the full content of a comment.
 *
 * @typedef {CommentBlock[]} CommentBlocks
 */
export type CommentBlocks = CommentBlock[];

/**
 * Represents a comment document stored in the database.
 *
 * @typedef {Object} Comment
 * @property {ObjectId} authorId - Unique identifier of the comment's author.
 * @property {ObjectId} targetId - Unique identifier of the entity this comment is related to.
 * @property {CommentBlock} content - The content block of the comment.
 *
 * @extends Document
 */
export interface Comment extends Document {
  authorId: ObjectId;
  targetId: ObjectId;
  content: CommentBlock;
}

/**
 * An array of Comment documents.
 *
 * @typedef {Comment[]} Comments
 */
export type Comments = Comment[];

/**
 * Data Transfer Object for creating a new comment.
 * Same structure as the Comment interface.
 *
 * @typedef {Comment} CreateCommentDTO
 */
export type CreateCommentDTO = Comment;

/**
 * Data Transfer Object for updating an existing comment.
 * Contains only the fields that are allowed to be updated.
 *
 * @typedef {Object} UpdateCommentDTO
 * @property {CommentBlock} content - Updated content block of the comment.
 */
export type UpdateCommentDTO = Pick<Comment, "content">;
