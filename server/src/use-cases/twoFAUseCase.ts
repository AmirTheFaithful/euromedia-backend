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
import { JwtPayload, sign, verify } from "jsonwebtoken";
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
    const userId: string = this.decodeUserId(pending2FAToken);
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
   * Decodes and validates a user ID from the pending 2FA token.
   *
   * @param {string} token - The pending 2FA JWT token.
   * @returns {string} Extracted user ID.
   * @throws {BadRequestError} If the token is invalid or not of type `2fa_pending`.
   */
  private decodeUserId(token: string): string {
    try {
      const payload: JwtPayload = verify(token, jwt.p2a) as JwtPayload;
      if (payload.type !== "2fa_pending") {
        throw new BadRequestError("Wrong token type.");
      }

      return payload.id;
    } catch (error: any) {
      throw new BadRequestError(
        `Token verification error: ${error.name} - "${error.message}"`
      );
    }
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
