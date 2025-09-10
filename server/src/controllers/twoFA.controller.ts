import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import {
  Setup2FAUseCase,
  Initiate2FAUseCase,
  Verify2FAUseCase,
} from "../use-cases/twoFAUseCase";

class TwoFAController {
  constructor(private readonly container = Container()) {}

  public setup = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Setup2FAUseCase);
    const payload = await usecase.execute({
      authHeader: req.headers["authorization"],
    });
    res.status(200).json({
      otpAuthURL: payload.otpAuthURL,
      message: "2FA setup success.",
    });
  });

  public verify = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Verify2FAUseCase);
    const { accessToken, refreshToken } = await usecase.execute(
      req.headers["authorization"],
      req.body.twoFACode
    );
    res.cookie("refresh-token", refreshToken);
    res.status(200).json({ accessToken });
  });

  public initiate = asyncHandler(async (req: Request, res: Response) => {
    const usecase = this.container.get(Initiate2FAUseCase);
    const pending2FAToken: string = await usecase.execute(
      req.headers["x-access-token"]
    );
    res.status(200).json({ pending2FAToken });
  });
}

export default new TwoFAController();
