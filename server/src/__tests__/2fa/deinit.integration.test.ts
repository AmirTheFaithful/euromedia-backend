import { Response } from "supertest";
import { Application } from "express";
import { sign } from "jsonwebtoken";
import { ObjectId } from "mongodb";

import app from "../../setup/app";
import {
  deinit2FA,
  fetchUser,
  setup2FA,
  prepareRegisterScenario,
} from "../../utils/prepareAuthScenarios";
import { jwt } from "../../config/env";

let testApp: Application;

jest.setTimeout(16000); // Increase testing estimated timeout.

// Would be used everywhere in the file-scope.
const dummyCredentials = {
  firstname: "Sebastian",
  lastname: "Graciola",
  email: "sebastiano@test.euro.es",
  password: "Barcelona_217",
};

let accessToken: string;
let pending2FAToken: string;

beforeAll(async () => {
  testApp = app();
  const result = await prepareRegisterScenario(testApp, dummyCredentials);

  // Assigning the tokens.
  accessToken = result.accessToken;
  pending2FAToken = result.pending2FAToken;
});

describe("PATCH /auth/2fa/deinit", () => {
  it("Should deinitialize 2FA for a user with active 2FA", async () => {
    // 1. Ensure 2FA is active
    await setup2FA(testApp, pending2FAToken);

    // 2. Deinit 2FA
    const response: Response = await deinit2FA(testApp, accessToken);

    expect(response.statusCode).toBe(200);

    // 3. Check user in DB
    const user: Response = await fetchUser(testApp, dummyCredentials.email);
    expect(user.body.data.twoFA.is2FASetUp).toBe(false);
    expect(user.body.data.twoFA.twoFASecret).toBeUndefined();
    expect(user.body.data.twoFA.recoveryCodes.length).toBe(0);
    expect(user.body.data.twoFA.failed2FAAttempts).toBe(0);
  });

  it("Should fail if 2FA is already inactive", async () => {
    // Ensure 2FA is already deinitialized
    await deinit2FA(testApp, accessToken);

    const response: Response = await deinit2FA(testApp, accessToken);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("2FA is already inactive.");
  });

  it("Should fail if access token is missing", async () => {
    const response: Response = await deinit2FA(testApp, undefined);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/token/i);
  });

  it("Should fail if access token is invalid", async () => {
    const response: Response = await deinit2FA(testApp, "some.invalid.token");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/token/i);
  });

  it("Should fail if user does not exist", async () => {
    const fakeAccessToken = sign(
      { id: new ObjectId(), type: "access-token" },
      jwt.acs,
      { expiresIn: "300s" }
    );

    const response: Response = await deinit2FA(testApp, fakeAccessToken);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toMatch(/user not found/i);
  });
});
