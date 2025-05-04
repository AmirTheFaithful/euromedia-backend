import { connect, connection } from "mongoose";
import request, { Response } from "supertest";
import { Application } from "express";

import app from "../setup/app";
import UserModel from "../models/user.model";
import { mongo } from "../config/env";

let testApp: Application;

const baseURL = "/auth/login";
const testModel = new UserModel().model;
const dummyUser = {
  firstname: "John",
  lastname: "Doe",
  email: "legoviking8@gmail.com",
  password: "just_doe_it!",
};

beforeAll(async (): Promise<void> => {
  await connect(mongo.test_uri);
  await testModel.deleteMany();

  testApp = app();
});

afterAll(async (): Promise<void> => {
  await testModel.deleteMany();
  await connection.close();
});

jest.setTimeout(16000); // Increase testing estimated timeout.

describe("POST auth/login", () => {
  it("Logs in an registered user.", async () => {
    // First, register a user.
    await request(testApp).post("/auth/register").send(dummyUser);

    const loginCredentials = {
      email: "legoviking8@gmail.com",
      password: "just_doe_it!",
    };

    // Now, test the login process itself.
    const loginResponse: Response = await request(testApp)
      .post(baseURL)
      .send(loginCredentials);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.message).toBe("Login success.");
  });

  it("Refuses to log in a user with wrong password", async () => {
    // First, register a user.
    await request(testApp).post("/auth/register").send(dummyUser);

    const loginCredentials = {
      email: "legoviking8@gmail.com",
      password: "some-incorrect-password",
    };

    const loginResponse: Response = await request(testApp)
      .post(baseURL)
      .send(loginCredentials);

    expect(loginResponse.statusCode).toBe(401);
    expect(loginResponse.body.message).toBe("Incorrect password.");
  });

  it("Refuses to log in a user with not existing email", async () => {
    const loginCredentials = {
      email: "unexisting-dummy-email@gmail.com",
      password: "just_doe_it!",
    };

    const loginResponse: Response = await request(testApp)
      .post(baseURL)
      .send(loginCredentials);

    expect(loginResponse.statusCode).toBe(404);
    expect(loginResponse.body.message).toBe("Not found.");
  });
});
