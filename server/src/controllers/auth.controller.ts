import { Request, Response } from "express";

import Container from "../containers/";
import { asyncHandler } from "../utils/asyncHandler";
import {
  RegisterUseCase,
  LoginUseCase,
  VerifyEmailUseCase,
  ResetPasswordRequestUseCase,
  ResetPasswordUseCase,
} from "../use-cases/auth.use-case";

class AuthController {
  constructor(private readonly container = Container()) {}

  public register = asyncHandler(async (req: Request, res: Response) => {
    const container = this.container.get(RegisterUseCase);
    await container.execute(req.body);
    res.status(201).json({ message: "Register success." });
  });

  public login = asyncHandler(async (req: Request, res: Response) => {
    const container = this.container.get(LoginUseCase);
    const tokens = await container.execute(req.body);
    res.cookie("refresh-token", tokens.refreshToken);
    res
      .status(200)
      .json({ data: tokens.accessToken, message: "Login success." });
  });

  public verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const container = this.container.get(VerifyEmailUseCase);
    const tokens = await container.execute(req.params);
    res.cookie("refresh-token", tokens.refreshToken);
    res
      .status(200)
      .json({ data: tokens.accessToken, message: "Email verify success." });
  });

  public resetPasswordRequest = asyncHandler(
    async (req: Request, res: Response) => {
      const container = this.container.get(ResetPasswordRequestUseCase);
      await container.execute(req.body);
      res
        .status(200)
        .json({ message: "Resetting password rquest accepted." })
        .end();
    }
  );

  public resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const container = this.container.get(ResetPasswordUseCase);
    await container.execute(req.body);
    res.status(200).json({ message: "Password reset success." }).end();
  });
}

export default new AuthController();
