import { Response } from "supertest";
import { Application } from "express";
import speakeasy from "speakeasy";

import app from "../../setup/app";
import {
  deinit2FA,
  fetchUser,
  setup2FA,
  verify2FA,
  prepareRegisterScenario,
} from "../../utils/prepareAuthScenarios";
import { cache } from "../../config/lru";

let testApp: Application;

// A JWTs that plays a crucial role in all test-cases.
let pending2FAToken: string;
let accessToken: string;
let refreshToken: string;

jest.setTimeout(16000); // Increase testing estimated timeout.

// Would be used everywhere in the file-scope.
const dummyCredentials = {
  firstname: "Francois",
  lastname: "De Blanches",
  email: "franco@test.euro",
  password: "xyz123abc789",
};

// Connect to the test DB before any tests:
beforeAll(async (): Promise<void> => {
  testApp = app();
  const result = await prepareRegisterScenario(testApp, dummyCredentials);
  accessToken = result.accessToken;
  pending2FAToken = result.pending2FAToken;
});

jest.setTimeout(16000); // Increase testing estimated timeout.

describe("POST /auth/2fa/setup", (): void => {
  it("Should set up 2FA for a user.", async (): Promise<void> => {
    // 4. Finally, set up the 2FA.
    const twoFASetUpResponse: Response = await setup2FA(
      testApp,
      pending2FAToken
    );

    expect(twoFASetUpResponse.statusCode).toBe(200);
    expect(twoFASetUpResponse.body.message).toBe("2FA setup success.");
    expect(twoFASetUpResponse.body).toHaveProperty("otpAuthURL");
    expect(twoFASetUpResponse.body).toHaveProperty("recoveryCodes");
    expect(Array.isArray(twoFASetUpResponse.body.recoveryCodes)).toBe(true);
    expect(twoFASetUpResponse.body.recoveryCodes.length).toBe(10);

    // 5. Check if the user has created earlier 2FA data.
    const user: Response = await fetchUser(testApp, dummyCredentials.email);

    expect(user.statusCode).toBe(200);
    expect(user.body.data.twoFA.twoFASecret).toBeDefined();
    expect(user.body.data.twoFA.recoveryCodes.length).toBe(10);
    expect(user.body.data.twoFA.failed2FAAttempts).toBe(0);
  });

  it("Should refuse if 2FA is already set up.", async () => {
    // 1. First set up the 2FA.
    const twoFASetUpResponse: Response = await setup2FA(
      testApp,
      pending2FAToken
    );

    // Retrieve necessary for second step TOTP-Auth URL.
    const otpAuthURL: string = twoFASetUpResponse.body.otpAuthURL
      .split("?secret=")[1]
      .split("&issuer=")[0];

    // Parse to a twoFACode which is ready to be sent.
    const twoFACode: string = speakeasy.totp({
      secret: otpAuthURL,
      encoding: "base32",
      digits: 6,
      step: 30,
    });

    // 2. Verify 2FA for a first time to achieve is2FASetup: true.
    await verify2FA(testApp, pending2FAToken, twoFACode);

    // 3. Request verify again to give
    const second2FASetUpResponse: Response = await setup2FA(
      testApp,
      pending2FAToken
    );

    expect(second2FASetUpResponse.statusCode).toBe(400);
    expect(second2FASetUpResponse.body.message).toBe("2FA is already setup.");
  });

  it("Should refuse if pending2FAToken has been expired.", async () => {
    // First, deinit 2FA for this test case.
    await deinit2FA(testApp, accessToken);

    // Intentionally "invalidate" the pending2FAToken by adding an x-tra symbol.
    let invalidToken: string = pending2FAToken + "&";

    // Set up the 2FA again, but with fail desire.
    const twoFASetUpResponse: Response = await setup2FA(testApp, invalidToken);

    expect(twoFASetUpResponse.statusCode).toBe(401);
    expect(twoFASetUpResponse.body.message).toBe(
      'Token verification error: JsonWebTokenError - "invalid token"'
    );

    // Clear the LRU-cache, as previous test GET request has cached this user object.
    cache.clear();

    // Check if the user has not 2FA data.
    const user: Response = await fetchUser(testApp, dummyCredentials.email);

    expect(user.body.data.twoFA.twoFASecret).toBeUndefined();
    expect(user.body.data.twoFA.recoveryCodes.length).toBe(0);
    expect(user.body.data.twoFA.failed2FAAttempts).toBe(0); // Counted only on failed 2FA verification scenario.
  });
});
