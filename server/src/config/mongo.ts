import { connect, connection } from "mongoose";

import { mongo } from "./env";

let isConnected: boolean = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log("Already connected to DB.");
    return;
  }

  try {
    await connect(mongo.uri);

    console.log(
      `\x1b[32mSuccessfully connected to the DB. Host: \x1b[0m ${connection.host}`
    );
  } catch (error: any) {
    console.log(
      `\x1b[31mUnable to connect to the DB, due to\x1b[0m ${error.name}: ${error.message}`
    );
  }
};

// Logs message when the connection is down.
process.on("SIGINT", async (): Promise<void> => {
  await connection.close();
  console.log("\n\n\x1b[36mMongoDB connection closed.\x1b[0");
  process.exit(0);
});
