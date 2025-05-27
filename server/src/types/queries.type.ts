/**
 * Defines the structure of query parameters used to retrieve a subentity.
 *
 * A subentity is typically a user-generated item such as a comment, reaction, or report
 * that is attached to a parent entity (e.g. a post or another comment).
 *
 * @typedef {Object} SubentityQueries
 * @property {string} id - Optional unique identifier of the subentity itself.
 * @property {string} authorId - Optional user ID of the creator of the subentity.
 * @property {string} targetId - Optional ID of the entity (e.g. post, comment) the subentity is attached to.
 */
export interface SubentityQueries {
  id?: string;
  authorId?: string;
  targetId?: string;
}

/**
 * Defines the structure of query parameters used to retrieve a media unit.
 *
 * A media entity typically represents user-generated content such as a post,
 * photo, or video, which may serve as the parent of subentities like comments or reactions.
 *
 * @typedef {Object} MediaEntityQueries
 * @property {string} id - Optional unique identifier of the media entity.
 * @property {string} authorId - Optional user ID of the creator of the media entity.
 */
export interface MediaEntityQueries {
  id?: string;
  authorId?: string;
}
