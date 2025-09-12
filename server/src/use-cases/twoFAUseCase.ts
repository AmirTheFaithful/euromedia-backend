import { z } from "zod";
import { inject } from "inversify";
import speakeasy, { GeneratedSecret, Encoding } from "speakeasy";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import { ObjectId } from "mongodb";

import { AuthUseCase } from "./auth.use-case";
import UserService from "../services/user.service";
import { sign, verify, JwtPayload } from "jsonwebtoken";
import { app, twoFA, jwt } from "../config/env";
import { BadRequestError, UnauthorizedError } from "../errors/http-errors";
import { User } from "../types/user.type";

/**
 * @interface SetupInputData
 *
 * Input data for 2FA setup use case.
 *
 * @property {string} panding2FAToken Pending 2FA JWT token issued to the user for verification before setup.
 */
interface SetupInputData {
  authHeader: string | undefined;
}

/**
 * @interface SetupOutputData
 *
 * Output data returned after 2FA setup initialization.
 *
 * @property {string} OTP Auth URL (otpauth://) that can be rendered as a QR code on the client.
 */
interface SetupOutputData {
  otpAuthURL: string;
}

/**
 * Represents the encrypted form of a sensitive value using AES-GCM.
 *
 * @interface EncryptionData
 *
 * @property {string} ciphertext - The AES-GCM encrypted text, encoded as a string.
 * @property {string} iv - The initialization vector (IV) used for encryption, encoded as a string.
 * @property {string} tag - The authentication tag from AES-GCM, used to verify integrity, encoded as a string.
 *
 * @remarks
 * - All fields are required to correctly decrypt and validate the encrypted data.
 * - This structure is intended for securely storing secrets such as 2FA keys.
 */
interface EncryptionData {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Use case responsible for setting up Multi-Factor Authentication (2FA)
 * using TOTP secrets and OTP Auth URLs.
 *
 * The flow includes:
 * 1. Validating the input data via Zod schema.
 * 2. Verifying the pending 2FA token.
 * 3. Generating and securely storing a hashed TOTP secret for the user.
 * 4. Returning an `otpauth://` URL that can be rendered as a QR code on the client.
 *
 * @remarks
 * - This class relies on `UserService` to fetch and update user entities.
 * - The `schema` ensures `pending2FAToken` is a non-empty string.
 * - All private methods follow single responsibility and are easily unit-testable.
 *
 * @example
 * ```ts
 * const useCase = new Setup2FAUseCase(userService);
 * const result = await useCase.execute({ pending2FAToken: token });
 * console.log(result.otpAuthURL); // otpauth://totp/...
 * ```
 */
export class Setup2FAUseCase extends AuthUseCase {
  /**
   * Zod schema for validating the input data to `execute()`.
   *
   * @private
   */
  private readonly schema = z.object({
    /** Pending 2FA JWT token issued to the user for verification. */
    authHeader: z.string(),
  });

  /**
   * Creates a new instance of Setup2FAUseCase.
   *
   * @param {UserService} service - The user service used for user retrieval and persistence.
   */
  constructor(@inject(UserService) protected readonly service: UserService) {
    super(service);
  }

  /**
   * Executes the 2FA setup flow:
   * 1. Validates input data.
   * 2. Retrieves verified user object by providing pending 2FA token.
   * 3. Generates and stores into DB a hashed 2FA secret.
   * 4. Returns an OTP Auth URL.
   *
   * @param {SetupInputData} data - Input containing the pending 2FA JWT token.
   * @returns {Promise<SetupOutputData>} Object with the OTP Auth URL.
   * @throws {BadRequestError} If token verification fails or user does not exist.
   */
  public async execute(data: SetupInputData): Promise<SetupOutputData> {
    const parsed: SetupInputData = this.schema.parse(data);
    const pending2FAToken: string = this.readAuthHeader(parsed.authHeader);
    const user: User = await this.getVerifiedUser(pending2FAToken);
    const base32Secret: string = await this.createAndStoreSecret(user);
    const otpAuthURL: string = this.generateOTPAuthURL(
      base32Secret,
      this.formatUsername(user)
    );

    return { otpAuthURL };
  }

  /**
   * Verifies a pending 2FA token and retrieves the corresponding user.
   *
   * @private
   * @param {string} pending2FAToken - JWT token issued for 2FA setup.
   * @returns {Promise<User>} - The verified user entity.
   * @throws {BadRequestError} If the token is invalid or the user does not exist.
   */
  private async getVerifiedUser(pending2FAToken: string): Promise<User> {
    const userId: string = this.decodeUserId(pending2FAToken, "2fa_pending");
    const user: User = await this.checkExistance(userId, "id", "absence");
    return user;
  }

  /**
   * Generates a new TOTP secret for the user, hashes and stores it,
   * then returns the plain Base32-encoded secret.
   *
   * @private
   * @param {User} user - The user entity for whom to create the 2FA secret.
   * @returns {string} - The plain Base32-encoded secret.
   */
  private async createAndStoreSecret(user: User): Promise<string> {
    const base32Secret: string = this.generate2FASecret(
      this.formatUsername(user)
    ).base32;
    await this.storeSecret(user, base32Secret);
    return base32Secret;
  }

  /**
   * Formats the user's full name for labeling purposes.
   *
   * @private
   * @param {User} user - The user entity.
   * @returns {string} - Formatted full name (firstname + lastname).
   */
  private formatUsername(user: User): string {
    return `${user.meta.firstname} ${user.meta.lastname}`;
  }

  /**
   * Generates a new TOTP secret for the given username.
   *
   * @param {string} username - Full name of the user for labeling.
   * @returns {GeneratedSecret} Speakeasy `GeneratedSecret` object.
   */
  private generate2FASecret(username: string): GeneratedSecret {
    return speakeasy.generateSecret({
      name: `${app.name} - (${username})`,
      issuer: app.name,
    });
  }

  /**
   * Encrypts a plain 2FA secret using AES in GCM mode.
   *
   * @private
   * @param {string} secret - The raw TOTP secret (e.g., Base32-decoded string) to encrypt.
   * @returns {EncryptionData} An object containing:
   * - `ciphertext`: The encrypted secret in the specified encoding.
   * - `iv`: The initialization vector used for this encryption (randomly generated, 12 bytes).
   * - `tag`: The GCM authentication tag to ensure ciphertext integrity.
   *
   * @remarks
   * - AES-GCM provides both confidentiality (encryption) and integrity (auth tag).
   * - The IV must be unique per encryption; it is generated randomly here and stored alongside the ciphertext.
   * - The master key (`twoFA.mst_key`) must remain secret and secure (e.g., in environment variables or KMS).
   */
  private encrypt2FASecret(secret: string): EncryptionData {
    const encoding = twoFA.key_ecd as BufferEncoding;
    // Generate 12-byte random sequence, to be used as initialization vector.
    const iv = randomBytes(12);
    // Initialize a AES cipher with GCM mode.
    const cipher = createCipheriv(
      twoFA.enc_alg,
      Buffer.from(twoFA.mst_key, encoding),
      iv
    ) as CipherGCM;
    // Encrypt the secret value.
    let ciphertext: string = cipher.update(secret, "utf-8", encoding);
    ciphertext += cipher.final(encoding);
    // Ciphertext malformation or invalidity mark.
    const tag: string = cipher.getAuthTag().toString(encoding);

    return { ciphertext, iv: iv.toString(encoding), tag };
  }

  /**
   * Stores a encrypted version of the user's 2FA secret.
   *
   * @param {User} user - User entity to update.
   * @param {string} base32Secret - The plain Base32-encoded secret before hashing.
   * @returns {Promise<void>}
   */
  private async storeSecret(user: User, base32Secret: string): Promise<void> {
    const encryptedSecret = this.encrypt2FASecret(base32Secret);
    user.twoFA.twoFASecret = encryptedSecret;
    await user.save();
  }

  /**
   * Generates an OTP Auth URL that can be turned into a QR code by clients.
   *
   * @param {string} secret - Base32-encoded TOTP secret.
   * @param {string} username - Full name of the user for labeling.
   * @returns {string} The otpauth:// URL.
   */
  private generateOTPAuthURL(secret: string, username: string): string {
    return speakeasy.otpauthURL({
      secret,
      encoding: twoFA.key_ecd as Encoding,
      label: `${app.name} - ${username}`,
      issuer: app.name,
    });
  }
}

/**
 * Class responsible for verifying a user's 2FA TOTP code and
 * issuing authentication tokens upon successful verification.
 *
 * @extends AuthUseCase
 *
 * @remarks
 * - Uses Zod schema to validate input data.
 * - Ensures the `twoFACode` is exactly 6 characters long.
 * - Handles 2FA verification logic, including decryption of
 *   stored TOTP secret and updating user metadata.
 */
export class Verify2FAUseCase extends AuthUseCase {
  /**
   * Zod schema for validating the 2FA verification input.
   *
   * @private
   */
  private readonly schema = z.object({
    /** Authorization header containing the pending 2FA JWT token. */
    authHeader: z.string(),
    /** 6-digit TOTP code provided by the user. */
    twoFACode: z.string().length(6),
  });

  /**
   * Creates a new instance of the 2FA use case class.
   *
   * @param {UserService} service - The user service responsible for fetching
   *   and updating user entities in the database.
   *
   * @remarks
   * - The `service` is injected using InversifyJS.
   * - Passed to the base `AuthUseCase` constructor for shared authentication utilities.
   */
  constructor(@inject(UserService) protected readonly service: UserService) {
    super(service);
  }

  /**
   * Executes the 2FA verification flow for a user.
   *
   * @public
   * @param {string | undefined} authHeader - The pending 2FA JWT token sent in the Authorization header.
   * @param {string} twoFACode - The 6-digit TOTP code provided by the user.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} Newly generated JWT tokens upon successful verification.
   *
   * @throws {BadRequestError} If the `authHeader` is missing or invalid.
   * @throws {UnauthorizedError} If the provided TOTP code is incorrect.
   *
   * @remarks
   * - Validates input using Zod schema.
   * - Extracts and verifies the user from the pending 2FA token.
   * - Delegates to `verify2FACode` for TOTP verification and secret decryption.
   * - Upon success, resets failed attempts, marks 2FA as setup if first-time verification, and returns fresh JWTs.
   */
  public async execute(authHeader: string | undefined, twoFACode: string) {
    const parsed = this.schema.parse({ authHeader, twoFACode });
    const pending2FAToken: string = this.readAuthHeader(parsed.authHeader);
    const userId: string = this.decodeUserId(pending2FAToken, "2fa_pending");
    await this.verify2FACode(parsed.twoFACode, userId);
    return this.generateTokens(userId as unknown as ObjectId);
  }

  /**
   * Decrypts a previously AES-GCM encrypted 2FA secret.
   *
   * @private
   * @param {string} ciphertext - The encrypted secret string.
   * @param {string} iv - Initialization vector used during encryption.
   * @param {string} tag - GCM authentication tag for integrity verification.
   * @returns {string} The decrypted plain Base32-encoded 2FA secret.
   *
   * @remarks
   * - This method verifies the authenticity of the ciphertext using the GCM tag.
   * - Throws an error if the ciphertext is malformed or has been tampered with.
   */
  private decrypt2FASecret(
    ciphertext: string,
    iv: string,
    tag: string
  ): string {
    const encoding = twoFA.key_ecd as BufferEncoding;
    // Create a decipher.
    const decipher = createDecipheriv(
      twoFA.enc_alg,
      Buffer.from(twoFA.mst_key, encoding),
      Buffer.from(iv, encoding)
    ) as DecipherGCM;

    // Check the ciphertext for invalidity or malformation.
    decipher.setAuthTag(Buffer.from(tag, encoding));

    // Decrypt the secret value.
    let secret = decipher.update(ciphertext, encoding, "utf-8");
    secret += decipher.final("utf-8");

    return secret;
  }

  private getDecryptedSecret(user: User): string {
    const { ciphertext, iv, tag } = user.twoFA.twoFASecret;
    return this.decrypt2FASecret(ciphertext, iv, tag);
  }

  /**
   * Verifies a 2FA code for the given user ID.
   * Updates user's 2FA state on successful verification.
   *
   * @private
   * @param {string} code - The 6-digit TOTP code provided by the user.
   * @param {string} id - The user ID to verify against.
   * @throws {UnauthorizedError} If the code is invalid.
   */
  private async verify2FACode(code: string, id: string): Promise<void> {
    const user: User = await this.checkExistance(id, "id", "absence");
    const decryptedSecret: string = this.getDecryptedSecret(user);
    const result = speakeasy.totp.verify({
      secret: decryptedSecret,
      token: code,
      encoding: twoFA.key_ecd as Encoding,
      window: 1,
    });

    if (!result) {
      if (user.twoFA.failed2FAAttempts !== undefined)
        user.twoFA.failed2FAAttempts += 1;
      throw new UnauthorizedError("Wrong 2FA token.");
    }

    if (!user.twoFA.is2FASetUp) user.twoFA.is2FASetUp = true;
    user.twoFA.failed2FAAttempts = 0;
    user.twoFA.last2FAVerifiedAt = new Date();
    await user.save();
  }
}

/**
 * Use case for initiating the setup of Two-Factor Authentication (2FA).
 *
 * This use case validates the provided access token, ensures the user
 * does not already have 2FA enabled, and issues a short-lived
 * `2fa_pending` token which will be used in the 2FA setup process.
 *
 * @class Initiate2FAUseCase
 * @extends AuthUseCase
 */
export class Initiate2FAUseCase extends AuthUseCase {
  /**
   * Zod schema to validate the required access token header.
   * Ensures the token is present and is a string.
   */
  private readonly schema = z.object({
    accessTokenHeader: z.string(),
  });

  /**
   * Creates an instance of Initiate2FAUseCase.
   *
   * @param service - Injected user service to access and validate users.
   */
  constructor(@inject(UserService) protected readonly service: UserService) {
    super(service);
  }

  /**
   * Executes the process of turning on 2FA.
   *
   * @param accessTokenHeader - The raw `Authorization` header value from the client.
   * @returns A short-lived JWT (`2fa_pending`) used to complete the 2FA setup flow.
   * @throws {BadRequestError} If the user already has 2FA enabled or the token is invalid.
   */
  public async execute(accessTokenHeader: string | string[] | undefined) {
    // Validate header input with Zod.
    const parsed = this.schema.parse({ accessTokenHeader });
    // Extract and normalize the access token from the header.
    const accessToken = this.readAuthHeader(parsed.accessTokenHeader);
    // Decode and verify the user ID from the access token.
    const userId = this.decodeUserId(accessToken, "access-token");
    // Ensure the user exists in the database.
    const user: User = await this.checkExistance(userId, "id", "absence");

    // Prevent enabling 2FA if it's already active
    if (user.twoFA.is2FASetUp) {
      throw new BadRequestError("2FA is already setup.");
    }

    // Issue a temporary pending 2FA token to proceed with setup
    const pending2FAToken: string = sign(
      { id: userId, type: "2fa_pending" },
      jwt.p2a,
      { expiresIn: "720s" }
    );

    return pending2FAToken;
  }
}
