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
