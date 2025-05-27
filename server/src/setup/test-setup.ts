import { connect, connection } from "mongoose";

import { mongo } from "../config/env";

beforeAll(async () => {
  if (connection.readyState === 0) {
    await connect(mongo.test_uri);
  }
});

afterAll(async () => {
  await connection.dropDatabase();
  await connection.close();
});
