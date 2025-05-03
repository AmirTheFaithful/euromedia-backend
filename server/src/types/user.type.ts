import { Document } from "mongoose";

/**
 * Represents a registered user in the system.
 *
 * This interface extends Mongoose's `Document` to provide access to model methods.
 *
 * @interface User
 * @extends Document
 *
 * @property {UserMeta} meta - Public-facing profile information of the user.
 * @property {UserAuth} auth - Credentials and verification status.
 * @property {UserLocation} [location] - Optional geographical location of the user.
 */
export interface User extends Document {
  meta: UserMeta;
  auth: UserAuth;
  location?: UserLocation;
}

/**
 * Represents an array of `User` documents.
 *
 * Useful for query results and bulk operations.
 *
 * @typedef {User[]} Users
 */
export type Users = User[];

/**
 * Contains the user's name-related metadata.
 *
 * @interface UserMeta
 * @property {string} firstname - The user's given name.
 * @property {string} lastname - The user's family name.
 */
export interface UserMeta {
  firstname: string;
  lastname: string;
}

/**
 * Represents the user's authentication credentials.
 *
 * @interface UserAuth
 * @property {string} email - The user's unique login email.
 * @property {string} password - The user's hashed password.
 * @property {boolean} verified - Optional flag indicating whether the user's email is verified.
 */
export interface UserAuth {
  email: string;
  password: string;
  verified?: boolean;
}

/**
 * Optional geographical information for a user.
 *
 * @interface UserLocation
 * @property {string} country - Country of residence.
 * @property {string} city - City of residence.
 */
export interface UserLocation {
  country: string;
  city: string;
}

/**
 * Data Transfer Object (DTO) used when creating a new user.
 *
 * @interface CreateUserDTO
 * @property {string} firstname - Given name of the new user.
 * @property {string} lastname - Family name of the new user.
 * @property {string} email - Email used for login (must be unique).
 * @property {string} password - Raw or hashed password.
 */
export interface CreateUserDTO {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

/**
 * Data Transfer Object (DTO) used for updating an existing user.
 *
 * All properties are optional. The `email` field is intentionally omitted for safety.
 * Includes optional location fields.
 *
 * @typedef {Partial<Omit<CreateUserDTO, "email"> & UserLocation>} UpdateUserDTO
 */
export type UpdateUserDTO = Partial<
  Omit<CreateUserDTO, "email"> & UserLocation
>;
