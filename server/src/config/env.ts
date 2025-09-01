import dotenv from "dotenv";

dotenv.config();

export const app = {
  name: process.env.APP_NAME!,
};

export const sys = {
  servPort: process.env.SERVER_PORT!,
  clntPort: process.env.CLIENT_PORT!,
  host: process.env.HOST!,
};

export const mongo = {
  uri: process.env.MONGO_URI!,
  test_uri: process.env.TEST_MONGO_URI!,
};

export const eml = {
  adr: process.env.EMAIL_ADDRESS!,
  pas: process.env.EMAIL_PASSWORD!,
};

export const jwt = {
  acs: process.env.JWT_ACCESS_SECRET!,
  rfs: process.env.JWT_REFRESH_SECRET!,
  eml: process.env.JWT_EMAIL_SECRET!,
};
