import { Schema, model, Model } from "mongoose";
import { injectable } from "inversify";

import { User, User2FA, TwoFASecret } from "../types/user.type";

/**
 * Mongoose schema definition for the encrypted Two-Factor Authentication (2FA) secret.
 *
 * This schema stores the encrypted TOTP secret and associated encryption metadata:
 * - `ciphertext`: the encrypted secret itself.
 * - `iv`: initialization vector used during encryption.
 * - `tag`: authentication tag to verify integrity of the ciphertext.
 */
const TwoFASecretSchema = new Schema<TwoFASecret>({
  ciphertext: String,
  iv: String,
  tag: String,
});

/**
 * Mongoose schema definition for the Two-Factor Authentication (2FA) state.
 *
 * This schema tracks the user’s 2FA lifecycle and metadata:
 * - `is2FASetUp`: indicates if 2FA setup has been successfully completed.
 * - `twoFASecret`: holds the encrypted TOTP secret and its encryption metadata.
 * - `last2FAVerifiedAt`: timestamp of the last successful verification event.
 * - `recoveryCodes`: hashed recovery codes, used as backup when TOTP is unavailable.
 * - `failed2FAAttempts`: counter of consecutive failed verifications, useful for security throttling.
 *
 * @remarks
 * Ensures that sensitive fields like `twoFASecret` and `recoveryCodes` are excluded
 * from default queries to uphold security and privacy by design.
 */
const TwoFASchema = new Schema<User2FA>({
  // Whether user has completed 2FA setup
  is2FASetUp: { type: Boolean, default: false },
  // Hashed TOTP secret (hidden from queries)
  twoFASecret: TwoFASecretSchema,
  // Timestamp of last successful 2FA verification
  last2FAVerifiedAt: Date,
  // Unless this date is not reached, user can't set up the 2FA.
  lockedUntil: { type: Date, default: null },
  // 2FA recovery codes (hidden from queries)
  recoveryCodes: { type: [String], default: [] },
  // Count of consecutive failed 2FA attempts
  failed2FAAttempts: { type: Number, default: 0 },
});

/**
 * Mongoose schema definition for the User entity.
 *
 * This schema separates user data into logical domains:
 * - `meta`: personal information, excluded from default queries for privacy.
 * - `auth`: authentication data, some fields hidden for security.
 * - `twoFA`: data existent only if 2FA is set up.
 * - `location`: optional geographic metadata, hidden from default fetches.
 */
const UserSchema = new Schema<User>({
  meta: {
    // First name of the user (required but not returned by default for privacy)
    firstname: { type: String, required: true, selected: false },
    // Last name of the user (required but not returned by default for privacy)
    lastname: { type: String, required: true, selected: false },
  },
  auth: {
    // Unique and required email used for login and identification
    email: { type: String, required: true, unique: true },
    // Hashed password, required and excluded from query results for security
    password: { type: String, required: true, selected: false },
    // Indicates whether the user has verified their account (e.g., email confirmation)
    verified: { type: Boolean, default: false },
  },
  twoFA: { type: TwoFASchema, default: () => ({}) },
  location: {
    // Optional country field (excluded from selection to avoid exposing location data by default)
    country: { type: String, required: false, selected: false },
    // Optional city field (also excluded from default query results)
    city: { type: String, required: false, selected: false },
  },
});

/**
 * Injectable Mongoose UserModel wrapper.
 *
 * This class serves as a dependency-injectable abstraction over the native Mongoose model,
 * enabling better testability and separation of concerns in the application architecture.
 */
@injectable()
export default class UserModel {
  /**
   * The underlying Mongoose model instance for the User.
   */
  public model: Model<User>;

  constructor() {
    // Binding the schema to the "User" collection
    this.model = model<User>("User", UserSchema);
  }
}
