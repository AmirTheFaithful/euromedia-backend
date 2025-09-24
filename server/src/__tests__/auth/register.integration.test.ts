import request, { Response } from "supertest";
import { Application } from "express";

import app from "../../setup/app";

// Initialize an instance of Express's app for mocking.
let testApp: Application;

// Set endpoint url for all register request.
const baseURL: string = "/auth/register";

// Connect to the test DB before any tests:
beforeAll(async (): Promise<void> => {
  testApp = app();
});

jest.setTimeout(16000); // Increase testing estimated timeout.

describe("POST auth/register", () => {
  it("Registers a new user and makes it fetchable by email", async () => {
    const validCredentials = {
      firstname: "Alex",
      lastname: "Mustermann",

      email: "alex_mustermann_1992@gmail.com",
      password: "Ich_bin_von_Wien",
      verified: false,
    };
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
    const validCredentials = {
      firstname: "",
      lastname: "Bright",

      email: "elsa_bright012@bt.uk",
      password: "Birmingham_2012",
      verified: false,
    };

    // await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Bad Request (firstname should be at least two characters-long)."
    );
  });

  it("Refuses to register due to invalid lastname", async () => {
    const validCredentials = {
      firstname: "Samuell",
      lastname: "",

      email: "sam_bilbao@ex.es",
      password: "Bilbao_2017",
      verified: false,
    };

    // await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.lastname = "";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Bad Request (lastname should be at least two characters-long)."
    );
  });

  it("Refuses to register due to invalid email", async () => {
    const validCredentials = {
      firstname: "Jan",
      lastname: "Jansen",

      email: "jj1987@wolke.nl",
      password: "JansenGraagGedaan",
      verified: false,
    };

    // await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.email = "abc";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Bad Request (invalid email).");
  });

  it("Refuses to register due to invalid password (too short)", async () => {
    const validCredentials = {
      firstname: "Francois",
      lastname: "Le Broeot",

      email: "franc_paris@express.fr",
      password: "Bonjour2016",
      verified: false,
    };

    // await testModel.deleteOne({ "auth.email": validCredentials.email });

    // Clone valid user credentials only for this testing case:
    const invalidCredentials = Object.assign({}, validCredentials);

    // Now invalidate them by setting empty string as firstname:
    invalidCredentials.password = "abc";

    const response: Response = await request(testApp)
      .post(baseURL)
      .send(invalidCredentials);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Bad Request (the password is too short and simple)."
    );
  });

  it("Refuses to register due to conflict between the same emails", async () => {
    const validCredentials = {
      firstname: "Rasul",
      lastname: "Ibn Khorezmi",

      email: "Musqat_2006@al-dawla.om",
      password: "Bonjour2016",
      verified: false,
    };

    // First, register a user with the same email as the next one:
    await request(testApp).post(baseURL).send(validCredentials);

    // Now invalidate them by setting empty string as firstname:
    const response: Response = await request(testApp)
      .post(baseURL)
      .send(validCredentials);

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe("Document exists.");
  });
});
