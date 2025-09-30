import { Response } from "supertest";
import { Application } from "express";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";

import app from "../../setup/app";
import {
  initiate2FA,
  setup2FA,
  deinit2FA,
  prepareRegisterScenario,
} from "../../utils/prepareAuthScenarios";
import { jwt } from "../../config/env";

let testApp: Application;

jest.setTimeout(16000); // Increase testing estimated timeout.

// Would be used everywhere in the file-scope.
const dummyCredentials = {
  firstname: "Aino",
  lastname: "Korhonen",
  email: "aino_korhonen@test.euro.fi",
  password: "Turku_2016",
};

let pending2FAToken: string;
let accessToken: string;

beforeAll(async () => {
  testApp = app();
  const result = await prepareRegisterScenario(testApp, dummyCredentials);
  accessToken = result.accessToken;
  pending2FAToken = result.pending2FAToken;
});

describe("POST /auth/2fa/initiate", () => {
  it("Should issue a pending 2FA token for a user without 2FA enabled", async () => {
    // 1. Ensure user has no 2FA enabled.
    await deinit2FA(testApp, accessToken);

    // 2. Call initiate 2FA.
    const response: Response = await initiate2FA(testApp, accessToken);

    // 3. Assertions.
    expect(response.statusCode).toBe(200);
    expect(response.body.pending2FAToken).toBeDefined();
    expect(typeof response.body.pending2FAToken).toBe("string");
  });

  it("Should fail if user already has 2FA enabled", async () => {
    // 1. Ensure 2FA is set up.
    await setup2FA(testApp, pending2FAToken);

    // 2. Try to initiate again.
    const response: Response = await initiate2FA(testApp, accessToken);

    // 3. Assertions.
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("2FA setup already in progress.");
  });

  it("Should fail if access token is missing", async () => {
    const response: Response = await initiate2FA(testApp, undefined);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/token/i);
  });

  it("Should fail if access token is invalid", async () => {
    const response: Response = await initiate2FA(testApp, "some.invalid.token");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/token/i);
  });

  it("Should fail if user not found in DB", async () => {
    const nonExistingId = new ObjectId();

    // 1. Forge access token with non-existing user id.
    const fakeAccessToken = sign(
      { id: nonExistingId, type: "access-token" },
      jwt.acs,
      {
        expiresIn: "300s",
      }
    );

    const response: Response = await initiate2FA(testApp, fakeAccessToken);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toMatch("User not found.");
  });

  it("Should return a valid 2fa_pending JWT", async () => {
    // 1. Ensure user has no 2FA enabled
    await deinit2FA(testApp, accessToken);

    // 2. Initiate 2FA
    const initiate2FAResponse: Response = await initiate2FA(
      testApp,
      accessToken
    );

    expect(initiate2FAResponse.statusCode).toBe(200);
    expect(initiate2FAResponse.body.pending2FAToken).toBeDefined();

    const pending2FAToken: string = initiate2FAResponse.body.pending2FAToken;

    const payload = verify(pending2FAToken, jwt.p2a) as JwtPayload;

    expect(payload.type).toBe("2fa_pending");
    expect(payload.id).toBeDefined();
  });
});
