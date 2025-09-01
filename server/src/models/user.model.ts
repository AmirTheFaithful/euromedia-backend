import { Schema, model, Model } from "mongoose";
import { injectable } from "inversify";

import { User } from "../types/user.type";

/**
 * Mongoose schema definition for the User entity.
 *
 * This schema separates user data into logical domains:
 * - `meta`: personal information, excluded from default queries for privacy.
 * - `auth`: authentication data, some fields hidden for security.
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
  twoFA: {
    // Whether user has completed 2FA setup
    is2FASetUp: { type: Boolean, default: false, index: true },
    // Hashed TOTP secret (hidden from queries)
    twoFASecret: {
      type: String,
      select: false,
    },
    // Timestamp of last successful 2FA verification
    last2FAVerifiedAt: { type: Date },
    // Count of consecutive failed 2FA attempts
    failed2FAAttempts: { type: Number, default: 0 },
    // 2FA recovery codes (hidden from queries)
    recoveryCodes: { type: [String], select: false },
  },
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
