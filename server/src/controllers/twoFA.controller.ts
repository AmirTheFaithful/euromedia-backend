import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import {
  Setup2FAUseCase,
  Verify2FAUseCase,
  Initiate2FAUseCase,
  Deinit2FAUseCase,
} from "../use-cases/twoFAUseCase";
import { standardCookieOptions } from "../config/cookies";

class TwoFAController {
  constructor(private readonly container = Container()) {}

  public setup = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Setup2FAUseCase);
    const payload = await usecase.execute({
      authHeader: req.headers["authorization"],
    });
    res.status(200).json({
      otpAuthURL: payload.otpAuthURL,
      recoveryCodes: payload.recoveryCodes,
      message: "2FA setup success.",
    });
  });

  public verify = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Verify2FAUseCase);
    const { accessToken, refreshToken } = await usecase.execute(
      req.headers["authorization"],
      req.body.twoFACode,
      req.body.recoveryCode
    );
    res.cookie("refresh-token", refreshToken, standardCookieOptions);
    res.status(200).json({ accessToken });
  });

  public initiate = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Initiate2FAUseCase);
    const pending2FAToken: string = await usecase.execute(
      req.headers["x-access-token"]
    );
    res.status(200).json({ pending2FAToken });
  });

  public deinit = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Deinit2FAUseCase);
    await usecase.execute(req.headers["x-access-token"]);
    res.status(200).json({ message: "2FA deinit success. " });
  });
}

export default new TwoFAController();
