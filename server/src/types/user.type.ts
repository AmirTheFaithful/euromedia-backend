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
  twoFA: User2FA;
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
 * Represents the encrypted secret used for two-factor authentication (2FA),
 * stored using AES encryption.
 *
 * @interface TwoFASecret
 * @property {string} ciphertext - The encrypted value of the secret.
 * @property {string} iv - The initialization vector used during encryption.
 * @property {string} tag - The authentication tag for verifying data integrity.
 */
export interface TwoFASecret {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * User Two-Factor Authentication (2FA) settings.
 *
 * @interface User2FA
 * @property {boolean} is2FASetUp - Indicates if 2FA is completed.
 * @property {string} twoFASecret - Hashed TOTP secret.
 * @property {Date} last2FAVerifiedAt - Last successful 2FA verification timestamp.
 * @property {number} failed2FAAttempts - Consecutive failed 2FA attempts.
 * @property {string[]} recoveryCodes - Recovery codes for 2FA fallback.
 */
export interface User2FA {
  is2FASetUp?: boolean;
  twoFASecret: TwoFASecret;
  last2FAVerifiedAt?: Date;
  failed2FAAttempts?: number;
  recoveryCodes?: string[];
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
