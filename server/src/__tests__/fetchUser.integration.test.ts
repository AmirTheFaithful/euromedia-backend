import { connect, connection } from "mongoose";
import request, { Response } from "supertest";
import { Application } from "express";

import app from "../setup/app";
import { mongo } from "../config/env";
import UserModel from "../models/user.model";
import { User } from "../types/user.type";

// Initialize mock app and model.
let testApp: Application;
const testModel = new UserModel().model;
const baseURL: string = "/api/users";
let dummyUser: User;

jest.setTimeout(16000); // Increase testing estimated timeout to survive slow asynchronous operations.

// Connect to the test DB and set a dummy user object to the cluster.
beforeAll(async (): Promise<void> => {
  await connect(mongo.test_uri);
  await testModel.deleteMany();

  testApp = app();

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
  await connection.close();
});

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

  it("should return '400 bad request' error, when taken invalid id", async () => {
    const response: Response = await request(testApp).get(
      `${baseURL}?id=something-as-a-wrong-id`
    );

    expect(response.statusCode).toBe(400);
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

  it("should return '400 bad request' error, when taken invalid email", async () => {
    const response: Response = await request(testApp).get(
      `${baseURL}?email=something-as-a-wrong-email`
    );

    expect(response.statusCode).toBe(400);
  });
});

describe("GET all users present in the DB.", () => {
  it("should return all users in the DB.", async (): Promise<void> => {
    const response = await request(testApp).get(baseURL);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Fetch success.");
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].meta).toEqual(dummyUser.meta);
    expect(response.body.data[0].auth).toEqual(dummyUser.auth);
  });

  it("should return empty array.", async (): Promise<void> => {
    // Cleanup the cluster to make sure that DB is completelly empty.
    await testModel.deleteMany();

    const response = await request(testApp).get(baseURL);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Fetch success.");
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(0);
  });
});
