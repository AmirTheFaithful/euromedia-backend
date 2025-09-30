import request, { Response } from "supertest";
import { Application } from "express";
import speakeasy from "speakeasy";
import MockDate from "mockdate";

import app from "../../setup/app";
import {
  deinit2FA,
  fetchUser,
  setup2FA,
  verify2FA,
} from "../../utils/prepareAuthScenarios";

let testApp: Application;

// A JWTs that plays a crucial role in all test-cases.
let pending2FAToken: string;
let accessToken: string;

jest.setTimeout(16000); // Increase testing estimated timeout.

// Would be used everywhere in the file-scope.
const dummyCredentials = {
  firstname: "Hannah",
  lastname: "Cybermann",
  email: "hannah@test.euro.au",
  password: "Das_einfaches_leben_561",
};

const prepareScenario = async () => {
  // 1. Complete registration process.
  await request(testApp).post("/auth/register").send(dummyCredentials);

  // 2. Complete login process.
  const loginResponse: Response = await request(testApp)
    .post("/auth/login")
    .send({
      email: dummyCredentials.email,
      password: dummyCredentials.password,
    });

  // Retrieve access and refresh two Bearer tokens
  // First - from login response body.
  // Second - from cookies set when login proccess.
  accessToken = loginResponse.body.accessToken;

  // 3. Initiate 2FA.
  const twoFAInitializationResponse: Response = await request(testApp)
    .patch("/auth/2fa/initiate")
    .set({
      "X-access-token": "Bearer " + accessToken,
    });

  // Retrieve pending 2FA Bearer token and set it to the global same-named variable.
  pending2FAToken = twoFAInitializationResponse.body.pending2FAToken;
};

beforeAll(async () => {
  testApp = app();
  await prepareScenario();
});

describe("POST /auth/2fa/verify", () => {
  it("Should complete 2FA verification process by using2FACode.", async () => {
    // 1. Set up the 2FA.
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

    // 2. Verify 2FA.
    const verify2FACodeResponse: Response = await verify2FA(
      testApp,
      pending2FAToken,
      twoFACode
    );

    expect(verify2FACodeResponse.statusCode).toBe(200);
    expect(verify2FACodeResponse.body.accessToken).toBeDefined();
    expect(verify2FACodeResponse.headers["set-cookie"]).toBeDefined();
    expect(verify2FACodeResponse.headers["set-cookie"].length).toBe(1);

    // Check if user finally has set up 2FA.
    const user: Response = await fetchUser(testApp, dummyCredentials.email);

    expect(user.statusCode).toBe(200);
    expect(user.body.data.twoFA.is2FASetUp).toBe(true);
  });

  it("Should complete 2FA verification process by using recovery code.", async () => {
    // 1. First, deinit 2FA after previous set up.
    await deinit2FA(testApp, accessToken);

    // 2. Set up the 2FA.
    const setup2FAResponse = await setup2FA(testApp, pending2FAToken);

    // Get an recovery code.
    const recoveryCode: string = setup2FAResponse.body.recoveryCodes[0];

    // 3. Verify 2FA.
    const verify2FACodeResponse: Response = await verify2FA(
      testApp,
      pending2FAToken,
      undefined,
      recoveryCode
    );

    expect(verify2FACodeResponse.statusCode).toBe(200);
    expect(verify2FACodeResponse.body.accessToken).toBeDefined();
    expect(verify2FACodeResponse.headers["set-cookie"]).toBeDefined();
    expect(verify2FACodeResponse.headers["set-cookie"].length).toBe(1);

    // Check if user finally has set up 2FA.
    const user: Response = await fetchUser(testApp, dummyCredentials.email);

    expect(user.statusCode).toBe(200);
    expect(user.body.data.twoFA.is2FASetUp).toBe(true);
    expect(user.body.data.twoFA.recoveryCodes.length).toBe(9);
  });

  it("Should complete verification when pending2FAToken is almost expired.", async () => {
    // 1. Deinit and setup.
    await deinit2FA(testApp, accessToken);
    const setupResponse = await setup2FA(testApp, pending2FAToken);

    const otpAuthURL: string = setupResponse.body.otpAuthURL
      .split("?secret=")[1]
      .split("&issuer=")[0];

    MockDate.set(new Date(Date.now() + 5 * 59 * 1000));

    // 2. Generate a OTP code.
    const twoFACode: string = speakeasy.totp({
      secret: otpAuthURL,
      encoding: "base32",
      digits: 6,
      step: 30,
    });

    // 3. First verification should succeed.
    const verificationResponse: Response = await verify2FA(
      testApp,
      pending2FAToken,
      twoFACode
    );

    // Return to real time.
    MockDate.reset();

    expect(verificationResponse.statusCode).toBe(200);
    expect(verificationResponse.body.message).toBe("2FA verification success.");
  });

  it("Should refuse 2FA verification process due to invalid twoFACode.", async () => {
    // 1. First, deinit 2FA after previous set up.
    await deinit2FA(testApp, accessToken);

    // 2. Set up the 2FA.
    await setup2FA(testApp, pending2FAToken);

    // Invalid twoFACode as it contains same digits.
    const invalidTwoFACode: string = "999999";

    // 3. Verify 2FA.
    const verify2FACodeResponse: Response = await verify2FA(
      testApp,
      pending2FAToken,
      invalidTwoFACode
    );

    expect(verify2FACodeResponse.statusCode).toBe(401);
    expect(verify2FACodeResponse.body.message).toBe("Wrong 2FA token.");
    expect(verify2FACodeResponse.body.accessToken).toBeUndefined();
    expect(verify2FACodeResponse.headers["set-cookie"]).toBeUndefined();

    // Check if user finally has set up 2FA.
    const user: Response = await fetchUser(testApp, dummyCredentials.email);

    expect(user.statusCode).toBe(200);
    expect(user.body.data.twoFA.is2FASetUp).toBe(false);
    expect(user.body.data.twoFA.recoveryCodes.length).toBe(10);
  });

  it("Should refuse 2FA verification process due to invalid recovery code.", async () => {
    // 1. First, deinit 2FA after previous set up.
    await deinit2FA(testApp, accessToken);

    // 2. Set up the 2FA.
    await setup2FA(testApp, pending2FAToken);

    // Invalid recovery code as it's lowercase.
    const invalidRecoveryCode: string = "abc123def4";

    // 3. Verify 2FA.
    const verify2FACodeResponse: Response = await verify2FA(
      testApp,
      pending2FAToken,
      undefined,
      invalidRecoveryCode
    );

    expect(verify2FACodeResponse.statusCode).toBe(401);
    expect(verify2FACodeResponse.body.message).toBe("Invalid recovery code.");
    expect(verify2FACodeResponse.body.accessToken).toBeUndefined();
    expect(verify2FACodeResponse.headers["set-cookie"]).toBeUndefined();

    // Check if user finally has set up 2FA.
    const user: Response = await fetchUser(testApp, dummyCredentials.email);

    expect(user.statusCode).toBe(200);
    expect(user.body.data.twoFA.is2FASetUp).toBe(false);
    expect(user.body.data.twoFA.recoveryCodes.length).toBe(10);
  });

  it("Should refuse 2FA verification process due to reusing a used recovery code.", async () => {
    // 1. First, deinit 2FA after previous verification.
    await deinit2FA(testApp, accessToken);

    // 2. Set up the 2FA.
    const setup2FAResponse = await setup2FA(testApp, pending2FAToken);

    // Get an recovery code.
    const recoveryCode: string = setup2FAResponse.body.recoveryCodes[0];

    // 3. Verify 2FA.
    await verify2FA(testApp, pending2FAToken, undefined, recoveryCode);

    // 4. Reuse the same recovery code.
    const verify2FACodeResponse: Response = await verify2FA(
      testApp,
      pending2FAToken,
      undefined,
      recoveryCode
    );

    expect(verify2FACodeResponse.statusCode).toBe(401);
    expect(verify2FACodeResponse.body.message).toBe("Invalid recovery code.");
    expect(verify2FACodeResponse.body.accessToken).toBeUndefined();
    expect(verify2FACodeResponse.headers["set-cookie"]).toBeUndefined();
  });

  it("Should refuse verification if 2FA was never set up.", async () => {
    await deinit2FA(testApp, accessToken);

    // No setup2FA call here, we go straight to verify.
    const response = await verify2FA(testApp, pending2FAToken, "123456");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("2FA is not set up.");
    expect(response.body.accessToken).toBeUndefined();
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("Should refuse verification after all recovery codes are exhausted.", async () => {
    await deinit2FA(testApp, accessToken);
    const setupTwoFAResponse: Response = await setup2FA(
      testApp,
      pending2FAToken
    );

    const recoveryCodes: string[10] = setupTwoFAResponse.body.recoveryCodes;

    for (const code of recoveryCodes) {
      const verify2FAResponse: Response = await verify2FA(
        testApp,
        pending2FAToken,
        undefined,
        code
      );
      expect(verify2FAResponse.statusCode).toBe(200);
      expect(verify2FAResponse.body.message).toBe("2FA verification success.");
    }

    // 3. Attempt again with one of the old codes.
    const reused = await verify2FA(
      testApp,
      pending2FAToken,
      undefined,
      recoveryCodes[0]
    );
    expect(reused.statusCode).toBe(401);
    expect(reused.body.message).toBe("Invalid recovery code.");

    // 4. Attempt with some fake code after exhaustion.
    const fake = await verify2FA(
      testApp,
      pending2FAToken,
      undefined,
      "-FAKECODE-"
    );
    expect(fake.statusCode).toBe(401);
    expect(fake.body.message).toBe("Invalid recovery code.");
  });

  it("Should refuse verification if TOTP code is expired.", async () => {
    // 1. Deinit and setup again.
    await deinit2FA(testApp, accessToken);
    const setupResponse = await setup2FA(testApp, pending2FAToken);

    const otpAuthURL: string = setupResponse.body.otpAuthURL
      .split("?secret=")[1]
      .split("&issuer=")[0];

    // 2. Generate a valid code but wait until it expires.
    const expiredCode: string = speakeasy.totp({
      secret: otpAuthURL,
      encoding: "base32",
      digits: 6,
      step: 30,
    });

    // Sleep for 40s to force expiration, as verification has window of 1.
    MockDate.set(new Date(Date.now() + 40 * 1000));

    // 3. Attempt verification with expired code.
    const response = await verify2FA(testApp, pending2FAToken, expiredCode);

    // Return to the real time.
    MockDate.reset();

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Wrong 2FA token.");
  });

  it("Should refuse verification if both twoFACode and recoveryCode are provided.", async () => {
    // 1. Deinit and setup.
    await deinit2FA(testApp, accessToken);
    await setup2FA(testApp, pending2FAToken);

    // 2. Try verify with both fields at once.
    const response = await request(testApp)
      .post("/auth/2fa/verify")
      .set("Authorization", "Bearer " + pending2FAToken)
      .send({ twoFACode: "123456", recoveryCode: "-RECOVERY-" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Provide only single kind of code.");
  });

  it("Should refuse verification if pending2FAToken has been expired.", async () => {
    // 1. Deinit and setup.
    await deinit2FA(testApp, accessToken);
    const setupResponse = await setup2FA(testApp, pending2FAToken);

    const otpAuthURL: string = setupResponse.body.otpAuthURL
      .split("?secret=")[1]
      .split("&issuer=")[0];

    // 2. Generate a OTP code.
    const twoFACode: string = speakeasy.totp({
      secret: otpAuthURL,
      encoding: "base32",
      digits: 6,
      step: 30,
    });

    // 3. First verification should succeed.
    await verify2FA(testApp, pending2FAToken, twoFACode);

    MockDate.set(new Date(Date.now() + 5 * 60 * 1000));

    // 4. Reuse the same pending2FAToken.
    const reusedResponse = await verify2FA(testApp, pending2FAToken, twoFACode);

    // Return to real time.
    MockDate.reset();

    expect(reusedResponse.statusCode).toBe(401);
    expect(reusedResponse.body.message).toBe(
      'Token verification error: TokenExpiredError - "jwt expired"'
    );
  });

  it("Should lock the user after 5 failed 2FA attempts", async () => {
    await deinit2FA(testApp, accessToken);
    await setup2FA(testApp, pending2FAToken);

    const invalidCode = "000000";

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await verify2FA(testApp, pending2FAToken, invalidCode).catch(() => {});
    }

    // 6th attempt triggers lock
    const response = await verify2FA(testApp, pending2FAToken, invalidCode);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch("Wrong 2FA token.");

    // Fetch user and check lockedUntil is set
    const userResponse = await fetchUser(testApp, dummyCredentials.email);
    expect(
      new Date(userResponse.body.data.twoFA.lockedUntil).getTime()
    ).toBeGreaterThan(Date.now());
  });
});
