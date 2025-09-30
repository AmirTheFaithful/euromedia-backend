import dotenv from "dotenv";

dotenv.config();

export const app = {
  name: process.env.APP_NAME!,
};

export const sys = {
  servPort: process.env.SERVER_PORT!,
  clntPort: process.env.CLIENT_PORT!,
  host: process.env.HOST!,
  node_env: process.env.NODE_ENV!,
  log_level: process.env.LOG_LEVEL!,
};

export const mongo = {
  uri: process.env.MONGO_URI!,
  test_uri: process.env.TEST_MONGO_URI!,
};

export const eml = {
  adr: process.env.EMAIL_ADDRESS!,
  pas: process.env.EMAIL_PASSWORD!,
};

export const twoFA = {
  mst_key: process.env.TWO_FA_MASTER_KEY!,
  key_ecd: process.env.TWO_FA_KEY_ENCODING!,
  enc_alg: process.env.TWO_FA_ENC_ALGORITHM!,
  enc_dig: process.env.TWO_FA_ENC_DIGEST!,
};

export const jwt = {
  acs: process.env.JWT_ACCESS_SECRET!,
  rfs: process.env.JWT_REFRESH_SECRET!,
  p2a: process.env.JWT_PENDING_2FA_SECRET!,
  eml: process.env.JWT_EMAIL_SECRET!,
};
