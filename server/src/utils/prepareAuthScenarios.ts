import request, { Response } from "supertest";
import { Application } from "express";

import { cache } from "../config/lru";

export const setup2FA = async (
  testApp: Application,
  pending2FAToken: string
): Promise<Response> => {
  // 2. Set up the 2FA.
  return await request(testApp)
    .post("/auth/2fa/setup")
    .set({
      Authorization: "Bearer " + pending2FAToken,
    });
};

export const verify2FA = async (
  testApp: Application,
  pending2FAToken: string,
  twoFACode?: string,
  recoveryCode?: string
): Promise<Response> => {
  return await request(testApp)
    .post("/auth/2fa/verify")
    .set("Authorization", "Bearer " + pending2FAToken)
    .send({ twoFACode })
    .send({ recoveryCode });
};

export const deinit2FA = async (
  testApp: Application,
  accessToken: string
): Promise<Response> => {
  return await request(testApp)
    .patch("/auth/2fa/deinit")
    .set({ "X-access-token": "Bearer " + accessToken });
};

export const fetchUser = async (
  testApp: Application,
  email: string
): Promise<Response> => {
  cache.clear();
  return await request(testApp).get(`/api/users?email=${email}`);
};
