import { Request, Response } from "express";

import Container from "../containers/";
import { asyncHandler } from "../utils/asyncHandler";
import {
  RegisterUseCase,
  LoginUseCase,
  VerifyEmailUseCase,
  ResetPasswordRequestUseCase,
  ResetPasswordUseCase,
  RefreshAccessToken,
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
    const payload = await container.execute(req.body);
    if (typeof payload === "string") {
      res.status(200).json({ data: payload });
      return;
    }

    res.cookie("refresh-token", payload.refreshToken);
    res
      .status(200)
      .json({ accessToken: payload.accessToken, message: "Login success." });
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

      // Retrieve verification token from the use-case,
      const token = await container.execute(req.body);

      // And send it as response.
      res
        .status(200)
        .json({ message: "Resetting password rquest accepted.", token });
    }
  );

  public resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const container = this.container.get(ResetPasswordUseCase);

    // Provide request headers as well as body to the use-case to verify the token.
    await container.execute(req.body, req.headers);
    res.status(200).json({ message: "Password reset success." }).end();
  });

  public refresh = asyncHandler(async (req: Request, res: Response) => {
    const container = this.container.get(RefreshAccessToken);

    const refreshToken: string = req.cookies["refresh-token"];
    const accessToken = await container.execute(refreshToken);
    res.status(200).json({ accessToken });
  });
}

export default new AuthController();
