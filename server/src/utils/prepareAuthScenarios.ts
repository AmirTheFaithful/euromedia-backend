import request, { Response } from "supertest";
import { Application } from "express";

import { cache } from "../config/lru";
import { CreateUserDTO } from "../types/user.type";

/**
 * Sends a request to finalize and enable 2FA for a user
 * using a valid pending 2FA token.
 *
 * @param testApp - The Express application instance under test.
 * @param pending2FAToken - The pending 2FA JWT token required to complete setup.
 * @returns The HTTP response from the 2FA setup endpoint.
 */
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

/**
 * Sends a request to verify the 2FA setup or login attempt for a user.
 *
 * @param testApp - The Express application instance under test.
 * @param pending2FAToken - The pending 2FA JWT token required for verification.
 * @param twoFACode - Optional one-time 2FA verification code.
 * @param recoveryCode - Optional recovery code used if the 2FA code is unavailable.
 * @returns The HTTP response from the 2FA verification endpoint.
 */
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

/**
 * Sends a request to initiate 2FA setup for the authenticated user.
 *
 * @param testApp - The Express application instance under test.
 * @param accessToken - Optional access token for authentication.
 * @returns The HTTP response from the 2FA initiation endpoint.
 */
export const initiate2FA = async (
  testApp: Application,
  accessToken?: string
): Promise<Response> => {
  return await request(testApp)
    .patch("/auth/2fa/initiate")
    .set({ "X-access-token": "Bearer " + accessToken });
};

/**
 * Sends a request to deinitialize 2FA for the authenticated user.
 *
 * @param testApp - The Express application instance under test.
 * @param accessToken - Optional access token for authentication.
 * @returns The HTTP response from the 2FA deinitialization endpoint.
 */
export const deinit2FA = async (
  testApp: Application,
  accessToken?: string
): Promise<Response> => {
  return await request(testApp)
    .patch("/auth/2fa/deinit")
    .set({ "X-access-token": "Bearer " + accessToken });
};

/**
 * Fetches a user entity by email from the test application.
 *
 * @param testApp - The Express application instance under test.
 * @param email - The email address of the user to retrieve.
 * @returns The HTTP response containing the user data, if found.
 */
export const fetchUser = async (
  testApp: Application,
  email: string
): Promise<Response> => {
  cache.clear();
  return await request(testApp).get(`/api/users?email=${email}`);
};

/**
 * Prepares a fully registered and logged-in user scenario for integration tests.
 *
 * This function performs the following steps:
 * 1. Registers a user with the provided credentials.
 * 2. Logs the user in and retrieves an access token.
 * 3. Initiates the 2FA process and retrieves a pending 2FA token.
 *
 * @param testApp - The Express application under test.
 * @param dummyCredentials - The user credentials used for registration and login.
 * @returns An object containing:
 * - `accessToken`: The JWT access token obtained after login.
 * - `pending2FAToken`: The pending 2FA JWT obtained after 2FA initiation.
 */
export const prepareRegisterScenario = async (
  testApp: Application,
  dummyCredentials: CreateUserDTO
) => {
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
  const accessToken = loginResponse.body.accessToken;

  // 3. Initiate 2FA.
  const twoFAInitializationResponse: Response = await request(testApp)
    .patch("/auth/2fa/initiate")
    .set({
      "X-access-token": "Bearer " + accessToken,
    });

  // Retrieve pending 2FA Bearer token and set it to the global same-named variable.
  const pending2FAToken = twoFAInitializationResponse.body.pending2FAToken;
  return { accessToken, pending2FAToken };
};
