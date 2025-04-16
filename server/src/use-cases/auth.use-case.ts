import { z } from "zod";
import { injectable, inject } from "inversify";
import { genSalt, hash, compare } from "bcrypt";
import { createTransport } from "nodemailer";
import { ObjectId } from "mongodb";
import { sign, verify, JwtPayload } from "jsonwebtoken";

import { User, CreateUserDTO } from "../types/user.type";
import { Params, LoginRequestBody } from "../types/auth.type";
import UserService from "../services/user.service";
import {
  ConflictError,
  BadRequestError,
  NotFoundError,
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

  protected async checkExistence(
    email: string,
    issue: "conflict" | "absence"
  ): Promise<never | User> {
    const existingUser = await this.service.getUserByEmail(email);

    if (issue === "conflict") {
      if (existingUser) {
        throw new ConflictError();
      }
    } else {
      if (issue === "absence") {
        if (!existingUser) {
          throw new NotFoundError();
        }
      }
    }

    return existingUser!;
  }

  protected generateTokens(id: ObjectId): {
    refreshToken: string;
    accessToken: string;
  } {
    const refreshToken: string = sign({ id }, jwt.rfs, { expiresIn: "30d" });
    const accessToken: string = sign({ id }, jwt.acs, { expiresIn: "15m" });

    return { refreshToken, accessToken };
  }

  protected async hashPassword(password: string): Promise<string> {
    const saltRounds: number = 12;
    const salt: string = await genSalt(saltRounds);
    return await hash(password, salt);
  }
}

export class RegisterUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: CreateUserDTO): Promise<void> {
    const { firstname, lastname, email, password } = this.schema.parse(input);

    // Check if provided email is already registered.
    await this.checkExistence(email, "conflict");

    // Create a new user account into DB:
    const newUser = await this.service.createNewUser({
      meta: {
        firstname,
        lastname,
      },
      auth: {
        email,
        password: await this.hashPassword(password),
        verified: false,
      },
    });

    await newUser.save();

    // Send verification token as link to the user's email:
    await this.sendVerificationEmail(newUser._id as ObjectId, email);
  }

  // Validate request body:
  private readonly schema = z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
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

  public async execute(input: { email: string }) {
    const { email } = this.schema.parse(input);

    // If the user exists, assign to global user object and continue, throw "not found" error otherwise.
    this.user = await this.checkExistence(email, "absence");

    // Generate token to be verified on password reset.
    const token: string = sign({ id: this.user._id }, jwt.eml, {
      expiresIn: "1h",
    });

    this.sendResetPasswordEmail(email, token);
  }

  private async sendResetPasswordEmail(
    email: string,
    token: string
  ): Promise<void> {
    const resetPasswordLink: string = `${sys.host}:${sys.servPort}/auth/reset-password/${token}`;

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

  public async execute(input: LoginRequestBody) {
    const { email, password } = this.loginSchema.parse(input);

    const hash = await this.hashPassword(password);
    const user: User = await this.checkExistence(email, "absence");

    user.auth.password = hash;
    await user.save();
  }
}

export class LoginUseCase extends AuthUseCase {
  constructor(@inject(UserService) service: UserService) {
    super(service);
  }

  public async execute(input: LoginRequestBody) {
    const { email, password } = this.loginSchema.parse(input);

    this.user = await this.checkExistence(email, "absence");

    await this.comparePasswords(password, this.user.auth.password);

    const tokens = this.generateTokens(this.user._id as ObjectId);

    return tokens;
  }

  private async comparePasswords(
    password: string,
    hash: string
  ): Promise<never | void> {
    const match: boolean = await compare(password, hash);

    if (!match) {
      throw new BadRequestError("Incorrect password.");
    }
  }
}
