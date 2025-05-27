import { ObjectId } from "mongodb";

import { NotFoundError, BadRequestError } from "../errors/http-errors";

/**
 * Abstract base class for API-layer use cases.
 *
 * Serves as a foundational utility for implementing API-oriented business logic.
 * Provides standardized validation methods for working with MongoDB ObjectIDs
 * and consistent error handling for common failure scenarios such as invalid identifiers or missing resources.
 *
 * Designed to be extended by concrete use case classes that interact with data entities
 * and require safe, validated access to identifiers and entity references.
 *
 * @abstract
 *
 * @example
 * class GetUserUseCase extends APIUseCase {
 *   async execute(id: string) {
 *     const objectId = this.validateObjectId(id);
 *     const user = await this.userRepository.findById(objectId);
 *     this.assertObjectIsFound(user);
 *     return user;
 *   }
 * }
 */
export abstract class APIUseCase {
  /**
   * Convert a string to a valid ObjectID instance, if the provided value is valid.
   *
   * @protected
   * @param {string} id - Value to be converted to the ObjectID.
   * @returns {ObjectID} - An instance of the ObjectID.
   * @throws {BadRequestError} - Exception if the invalid vale has been provided.
   */
  protected validateObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError(`Identifier '${id}' is not valid ObjectId.`);
    }

    return new ObjectId(id);
  }

  /**
   * Asserts that the provided object is not null or undefined.
   *
   * @protected
   * @template T - The type of the object being checked.
   * @param {T} object The object to check for existence.
   * @throws {NotFoundError} If the object is null or undefined.
   * @asserts object is T. Ensures the object is defined after this call.
   */
  protected assertObjectIsFound<T>(object: T | null): asserts object is T {
    if (!object) {
      throw new NotFoundError("Object not found.");
    }
  }
}

/**
 * Abstract base class for use cases involving nested or subordinate entities.
 *
 * Extends `APIUseCase` by reusing its validation utilities in contexts where
 * both a parent (target) and a child (author or actor) identifier are required.
 * Typically used in scenarios such as comments, replies, or other sub-structures
 * that are tightly coupled to a primary entity.
 *
 * Meant to be subclassed by domain-specific use cases that operate on such sub-entities
 * and require consistent ID validation and error feedback mechanisms.
 *
 * @abstract
 *
 * @example
 * class AddCommentUseCase extends SubEntityUseCase {
 *   async execute(postId: string, authorId: string, content: string) {
 *     const [validatedPostId, validatedAuthorId] = this.validateQueries(postId, authorId);
 *     const post = await this.postRepository.findById(validatedPostId);
 *     this.assertObjectIsFound(post);
 *     return this.commentRepository.create({
 *       postId: validatedPostId,
 *       authorId: validatedAuthorId,
 *       content
 *     });
 *   }
 * }
 */
export abstract class SubEntityUseCase extends APIUseCase {
  /**
   * Validates and converts the provided `targetId` and `authorId` strings into MongoDB ObjectId instances.
   *
   * @protected
   * @param {string} targetId - The identifier of the target entity to be validated.
   * @param {string} authorId - The identifier of the author entity to be validated.
   * @returns {[ObjectId, ObjectId]} A tuple containing validated ObjectId instances for the target and author.
   * @throws {BadRequestError} If either `targetId` or `authorId` is not a valid ObjectId string.
   */
  protected validateQueries(
    targetId: string,
    authorId: string
  ): [ObjectId, ObjectId] {
    return [this.validateObjectId(targetId), this.validateObjectId(authorId)];
  }
}
