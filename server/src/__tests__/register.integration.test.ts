import { connect, connection } from "mongoose";
import request, { Response } from "supertest";
import { Application } from "express";

import app from "../setup/app";
import { mongo } from "../config/env";
import UserModel from "../models/user.model";

// Initialize an instance of Express's app for mocking.
let testApp: Application;

// Create mock credentials.
const validCredentials = {
  firstname: "John",
  lastname: "Doe",

  email: "legoviking8@gmail.com",
  password: "mock_mock_johney",
  verified: false,
};

// Set endpoint url for all register request.
const baseURL: string = "/auth/register";

// Initialize a user model to be used for mocking.
const testModel = new UserModel().model;

// Connect to the test DB before any tests:
beforeAll(async (): Promise<void> => {
  await connect(mongo.test_uri);
  await testModel.deleteMany();

  testApp = app();
});

// Cleanup th cluster before each register response (even failed, because the registration system checks for the same email presence in the DB).
// beforeEach(async (): Promise<void> => {
//   await testModel.deleteMany();
// });

// Cleanup the cluster after all tests.
afterAll(async (): Promise<void> => {
  await testModel.deleteMany();
  await connection.close();
});

jest.setTimeout(16000); // Increase testing estimated timeout.

describe("POST auth/register", () => {
  it("Registers a new user and makes it fetchable by email", async () => {
    // First, test the registration process itself.

    // Send fully valid mock user credentials:
    const registrationResponse: Response = await request(testApp)
      .post(baseURL)
      .send(validCredentials);

    // Now test the incoming register response:
    expect(registrationResponse.statusCode).toBe(201);
    expect(registrationResponse.body.message).toBe("Register success.");

    // Now test if the registration controller actually added this user to the DB.

    // Send fetch response with mock email address as query:
    const fetchResponse: Response = await request(testApp).get(
      `/api/users?email=${validCredentials.email}`
    );

    // And finally check identity of the registered user and fetched one.
    expect(fetchResponse.statusCode).toBe(200);
    expect(fetchResponse.body.message).toBe("Fetch success.");
    expect(fetchResponse.body.data.meta).toEqual({
      firstname: validCredentials.firstname,
      lastname: validCredentials.lastname,
    });
    expect(fetchResponse.body.data.auth.email).toEqual(validCredentials.email);
  });

  it("Refuses to register due to invalid firstname", async () => {
    await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.firstname = "";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "User validation failed: meta.firstname: Path `meta.firstname` is required."
    );
  });

  it("Refuses to register due to invalid lastname", async () => {
    await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.lastname = "";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "User validation failed: meta.lastname: Path `meta.lastname` is required."
    );
  });

  it("Refuses to register due to invalid email", async () => {
    await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.email = "abc";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(500);
    // expect(response.body.message).toBe("Invalid email");
  });

  it("Refuses to register due to invalid password (too short)", async () => {
    await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.password = "abc";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(500);
    // expect(response.body.message).toBe("Invalid email");
  });

  it("Refuses to register due to conflict between the same emails", async () => {
    // First, register a user with the same email as the next one:
    const registrationResponse: Response = await request(testApp)
      .post(baseURL)
      .send(validCredentials);

    // Now invalidate them by setting empty string as firstname:
    const response: Response = await request(testApp)
      .post(baseURL)
      .send(validCredentials);

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe("User exists.");
  });
});
