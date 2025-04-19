import { connect, connection } from "mongoose";
import request, { Response } from "supertest";

import app from "../setup/app";
import { mongo } from "../config/env";
import UserModel from "../models/user.model";
import { User } from "../types/user.type";

// Initialize mock app and model.
const testApp = app();
const testModel = new UserModel().model;
let dummyUser: User;

jest.setTimeout(16000); // Increase testing estimated timeout to survive slow asynchronous operations.

// Connect to the test DB and set a dummy user object to the cluster.
beforeAll(async (): Promise<void> => {
  await connect(mongo.test_uri);

  dummyUser = await new testModel({
    meta: {
      firstname: "John",
      lastname: "Doe",
    },
    auth: {
      email: "john_doe@mock.com",
      password: "mock_mock_john",
      verified: false,
    },
  }).save();
});

// Cleanup the cluster after all tests.
afterAll(async (): Promise<void> => {
  await testModel.deleteMany();
  await connection.close();
});

const baseURL: string = "/api/users";

// Tests using id as query:
describe("GET user by id.", () => {
  it("should return a user by id (uncached).", async () => {
    const response: Response = await request(testApp).get(
      `${baseURL}?id=${dummyUser._id}`
    );

    expect(response.headers["x-cache-status"]).toBe("MISS");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Fetch success.");
    expect(response.body.data.meta).toEqual(dummyUser.meta);
    expect(response.body.data.auth).toEqual(dummyUser.auth);
  });

  it("should return a user by id (cached).", async () => {
    // Fetch for first time, to make sure it is cached.
    await request(testApp).get(`${baseURL}?id=${dummyUser._id}`);

    // Now test the cached fetch.
    const response: Response = await request(testApp).get(
      `${baseURL}?id=${dummyUser._id}`
    );

    expect(response.headers["x-cache-status"]).toBe("HIT");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Fetch success. (cached)");
    expect(response.body.data.meta).toEqual(dummyUser.meta);
    expect(response.body.data.auth).toEqual(dummyUser.auth);
  });

  it("should return '404 not found' error, when taken non-existing id.", async () => {
    const response: Response = await request(testApp).get(
      `${baseURL}?id=87ec8a652a039bd820856e3a`
    );

    expect(response.statusCode).toBe(404);
  });
});

// Tests using email as query:
describe("GET user by email.", () => {
  it("should return a user by email (uncached).", async () => {
    const response: Response = await request(testApp).get(
      `${baseURL}?email=${dummyUser.auth.email}`
    );

    expect(response.headers["x-cache-status"]).toBe("MISS");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Fetch success.");
    expect(response.body.data.meta).toEqual(dummyUser.meta);
    expect(response.body.data.auth).toEqual(dummyUser.auth);
  });

  it("should return a user by email (cached).", async () => {
    // Fetch for first time, to make sure it is cached.
    await request(testApp).get(`${baseURL}?email=${dummyUser.auth.email}`);

    // Now test the cached fetch.
    const response: Response = await request(testApp).get(
      `${baseURL}?email=${dummyUser.auth.email}`
    );

    expect(response.headers["x-cache-status"]).toBe("HIT");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Fetch success. (cached)");
    expect(response.body.data.meta).toEqual(dummyUser.meta);
    expect(response.body.data.auth).toEqual(dummyUser.auth);
  });

  it("should return '404 not found' error, when taken non-existing email.", async () => {
    const response: Response = await request(testApp).get(
      `${baseURL}?email=fake-mail@fake-service.com`
    );

    expect(response.statusCode).toBe(404);
  });
});
