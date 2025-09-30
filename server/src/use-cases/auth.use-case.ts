import { z, ZodError } from "zod";
import { injectable, inject } from "inversify";
import { genSalt, hash, compare } from "bcrypt";
import { createTransport } from "nodemailer";
import { ObjectId } from "mongodb";
import { Error } from "mongoose";
import { sign, verify, JwtPayload } from "jsonwebtoken";
import { IncomingHttpHeaders } from "http";

import { User, CreateUserDTO } from "../types/user.type";
import { Params, LoginRequestBody } from "../types/auth.type";
import UserService from "../services/user.service";
import {
  ConflictError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/http-errors";
import { sys, jwt, eml } from "../config/env";

@injectable()
export class AuthUseCase {
  protected user: User | null = null;
  protected readonly loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  constructor(@inject(UserService) protected readonly service: UserService) {}

  protected async checkExistance(
    key: string,
    keyType: "id" | "email",
    issue: "conflict" | "absence"
  ): Promise<User> {
    let existingUser: User | null;

    if (keyType === "id") {
      if (ObjectId.isValid(key)) {
        existingUser = await this.service.getUserById(new ObjectId(key));
      } else {
        throw new BadRequestError("Invalid id value.");
      }
    } else {
      existingUser = await this.service.getUserByEmail(key);
    }

    if (issue === "conflict") {
      if (existingUser) {
        throw new ConflictError();
      }
    } else {
      if (issue === "absence") {
        if (!existingUser) {
          throw new NotFoundError("User not found.");
        }
      }
    }

    return existingUser!;
  }

  protected generateTokens(id: ObjectId): {
    refreshToken: string;
    accessToken: string;
  } {
    const refreshToken: string = sign({ id, type: "refresh-token" }, jwt.rfs, {
      expiresIn: "30d",
    });
    const accessToken: string = sign({ id, type: "access-token" }, jwt.acs, {
      expiresIn: "300s",
    });

    return { refreshToken, accessToken };
  }

  protected async hashPassword(password: string): Promise<string> {
    const saltRounds: number = 12;
    const salt: string = await genSalt(saltRounds);
    return await hash(password, salt);
  }

  /**
   * Extracts and validates a bearer token from the given authorization header.
   *
   * @protected
   * @param {string | undefined} header - The raw `Authorization` header value (e.g. `"Bearer <token>"`).
   * @returns {string} The extracted token if the header is valid.
   *
   * @throws {BadRequestError} If the header is missing, not a string, does not use the `Bearer` scheme, or
   *                           does not contain a token.
   */
  protected readAuthHeader(header: string | undefined): string {
    if (!header || typeof header !== "string") {
      throw new BadRequestError("Invalid header.");
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new BadRequestError("Invalid header scheme or missing token.");
    }

    return token;
  }

  /**
   * Decodes and validates a user ID from the pending 2FA token.
   *
   * @protected
   * @param {string} token The pending 2FA JWT token.
   * @param {"access-token" | "refresh-token" | "2fa_pending"} expectedType System-defined type of the given JWT token.
   * @returns {string} Extracted user ID.
   * @throws {BadRequestError} If the token is invalid or not of type `2fa_pending`.
   */
  protected decodeUserId(
    token: string,
    expectedType: "access-token" | "refresh-token" | "2fa_pending"
  ): string {
    try {
      // Select the correct secret key based on the expected token type.
      // - `access-token` → signed with `jwt.acs`
      // - `2fa_pending` → signed with `jwt.p2a`
      // - `refresh-token` not handled here (validated elsewhere in the auth flow)
      let jwt_key: string = "";
      if (expectedType === "access-token") {
        jwt_key = jwt.acs;
      } else if (expectedType === "2fa_pending") {
        jwt_key = jwt.p2a;
      }

      const payload: JwtPayload = verify(token, jwt_key) as JwtPayload;
      if (payload.type !== expectedType) {
        throw new UnauthorizedError("Wrong token type.");
      }

      return payload.id;
    } catch (error: any) {
      throw new UnauthorizedError(
        `Token verification error: ${error.name} - "${error.message}"`
      );
    }
  }
}

export class RegisterUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: CreateUserDTO): Promise<void> {
    // Parse and validate provided request body.
    const parsed = this.parseInput(input);
    const { email } = parsed;

    // Check if provided email is already registered.
    await this.checkExistance(email, "email", "conflict");

    // Create a new user account into DB:
    const newUserID = await this.createInstance(parsed);

    // Send verification token as link to the user's email:
    await this.sendVerificationEmail(newUserID as ObjectId, email);
  }

  private parseInput(input: CreateUserDTO): CreateUserDTO {
    // Parsing provided request body may throw some error
    try {
      return this.schema.parse(input);
    } catch (error: any) {
      // User data validation error
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          throw new BadRequestError(issue.message);
        }
      }

      // Any other errors will be handled by asyncHandler on the controller.
      throw error;
    }
  }

  private async createInstance(data: CreateUserDTO): Promise<ObjectId | void> {
    try {
      const newUser = await this.service.createNewUser({
        ...data,
        password: await this.hashPassword(data.password),
      });

      await newUser.save();

      return newUser._id as ObjectId;
    } catch (error: any) {
      if (error instanceof Error.ValidationError) {
        Object.values(error.errors).forEach((err) => {
          throw new BadRequestError(
            `${error.name}: Field '${err.path}' is required.`
          );
        });
      }
    }
  }

  // Validate request body with customized Zod error messages:
  private readonly schema = z.object({
    firstname: z
      .string({
        required_error: "Bad Request (firstname field is required).",
      })
      .min(
        2,
        "Bad Request (firstname should be at least two characters-long)."
      ),
    lastname: z
      .string({
        required_error: "Bad Request (lastname field is required).",
      })
      .min(2, "Bad Request (lastname should be at least two characters-long)."),
    email: z
      .string({ required_error: "Bad Request (email field is required)." })
      .email("Bad Request (invalid email)."),
    password: z
      .string({ required_error: "Bad Request (password field is required)." })
      .min(8, "Bad Request (the password is too short and simple)."),
  });

  private readonly transporter = createTransport({
    service: "Gmail",
    auth: {
      user: eml.adr,
      pass: eml.pas,
    },
  });

  private async sendVerificationEmail(
    id: ObjectId,
    userEmail: string
  ): Promise<void> {
    const verificationToken: string = sign({ id }, jwt.eml, {
      expiresIn: "1h",
    });

    const verifyLink: string = `${sys.host}:${sys.servPort}/auth/verify-email/${verificationToken}`;

    await this.transporter.sendMail({
      from: eml.adr,
      to: userEmail,
      subject: "Registration verification",
      html: `<p>Click <a href="${verifyLink}">here</a> to confirm registration process.</p>`,
    });
  }
}

export class VerifyEmailUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: Params) {
    const { token } = input;

    if (!token) {
      throw new BadRequestError("Verification token missing.");
    }

    const decodedId = await this.verifyToken(token);

    const tokens = this.generateTokens(decodedId);

    return tokens;
  }

  private async verifyToken(token: string): Promise<ObjectId> {
    const payload = verify(token, jwt.eml) as JwtPayload;
    const decodedId: ObjectId = payload.id;

    const user = await this.service.getUserById(decodedId);

    if (!user) {
      throw new NotFoundError(`User with id ${decodedId} not found.`);
    }

    user.auth.verified = true;
    await user.save();

    return decodedId;
  }
}

export class ResetPasswordRequestUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: { email: string }): Promise<string> {
    const { email } = this.schema.parse(input);

    // If the user exists, assign to global user object and continue, throw "not found" error otherwise.
    this.user = await this.checkExistance(email, "email", "absence");

    // Generate token to be verified on password reset.
    const token: string = sign({ id: this.user._id }, jwt.eml, {
      expiresIn: "1h",
    });

    this.sendResetPasswordEmail(email);
    return token;
  }

  private async sendResetPasswordEmail(email: string): Promise<void> {
    const resetPasswordLink: string = `${sys.host}:${sys.servPort}/auth/reset-password`;

    await this.transporter.sendMail({
      from: eml.adr,
      to: email,
      subject: "Reset password.",
      html: ``,
    });
  }

  private readonly schema = z.object({
    email: z.string().email(),
  });

  private readonly transporter = createTransport({
    service: "Gmail",
    auth: {
      user: eml.adr,
      pass: eml.pas,
    },
  });
}

export class ResetPasswordUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: LoginRequestBody, headers: IncomingHttpHeaders) {
    const { email, password } = this.loginSchema.parse(input);
    const emailUser: User = await this.checkExistance(
      email,
      "email",
      "absence"
    );

    if (!emailUser) {
      throw new NotFoundError(`User not found with email '${email}'.`);
    }

    const token = headers["authorization"] as string;

    if (!token) {
      throw new UnauthorizedError("Verification token missing.");
    }

    const payload = verify(token.split(" ")[1], jwt.eml) as JwtPayload;
    const id: ObjectId = payload.id;

    const idUser = await this.service.getUserById(id);

    if (!idUser) {
      throw new NotFoundError("User not found.");
    }

    const hash = await this.hashPassword(password);

    idUser.auth.password = hash;
    await idUser.save();
  }
}

export class LoginUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: LoginRequestBody) {
    const { email, password } = this.loginSchema.parse(input);

    this.user = await this.checkExistance(email, "email", "absence");

    await this.comparePasswords(password, this.user.auth.password);

    return this.decideStrategy();
  }

  private async comparePasswords(
    password: string,
    hash: string
  ): Promise<never | void> {
    const match: boolean = await compare(password, hash);

    if (!match) {
      throw new UnauthorizedError("Incorrect password.");
    }
  }

  private decideStrategy() {
    let payload: string | { accessToken: string; refreshToken: string };

    if (this.user?.twoFA.is2FASetUp) {
      payload = sign({ id: this.user._id, type: "2fa_pending" }, jwt.p2a, {
        expiresIn: "420s",
      });
    } else {
      payload = this.generateTokens(this.user?._id as ObjectId);
    }

    return payload;
  }
}

export class RefreshAccessToken extends AuthUseCase {
  private readonly schema = z.string();

  constructor(@inject(UserService) protected readonly service: UserService) {
    super(service);
  }

  public async execute(refreshToken: string) {
    const parsedToken: string = this.schema.parse(refreshToken);

    try {
      const payload = verify(parsedToken, jwt.rfs) as JwtPayload;
      const userId: string = payload.id;
      const user: User = await this.checkExistance(userId, "id", "absence");
      if (!user) {
        throw new NotFoundError("User not found.");
      }

      return sign({ id: userId, type: "access-token" }, jwt.acs, {
        expiresIn: "300s",
      });
    } catch (error) {
      throw new UnauthorizedError("Token verification error.");
    }
  }
}
