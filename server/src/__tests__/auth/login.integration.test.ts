import request, { Response } from "supertest";
import { Application } from "express";

import app from "../../setup/app";

let testApp: Application;

const baseURL = "/auth/login";

beforeAll(async () => {
  testApp = app();
});

jest.setTimeout(16000); // Increase testing estimated timeout.

describe("POST auth/login", () => {
  it("Logs in an registered user.", async () => {
    const dummyUser = {
      firstname: "John",
      lastname: "Doe",
      email: "john_doe_LA2018@oakland.ca",
      password: "just_doe_it!",
    };

    // First, register a user.
    await request(testApp).post("/auth/register").send(dummyUser);

    const loginCredentials = {
      email: dummyUser.email,
      password: dummyUser.password,
    };

    // Now, test the login process itself.
    const loginResponse: Response = await request(testApp)
      .post(baseURL)
      .send(loginCredentials);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.message).toBe("Login success.");
  });

  it("Refuses to log in a user with wrong password", async () => {
    const dummyUser = {
      firstname: "Jane",
      lastname: "Doe",
      email: "jane092718@gmail.com",
      password: "91283Los-Angeles",
    };

    // First, register a user.
    await request(testApp).post("/auth/register").send(dummyUser);

    const loginCredentials = {
      email: dummyUser.email,
      password: dummyUser.password + "abc",
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
      password: "19123891249",
    };

    const loginResponse: Response = await request(testApp)
      .post(baseURL)
      .send(loginCredentials);

    expect(loginResponse.statusCode).toBe(404);
    expect(loginResponse.body.message).toBe("User not found.");
  });
});
