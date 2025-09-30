import { CookieOptions } from "express";

import { sys } from "./env";

/**
 * Standard cookie options used throughout the backend for session
 * and token storage.
 *
 * @remarks
 * - `httpOnly` ensures that cookies cannot be accessed via client-side JavaScript.
 * - `secure` flag is enabled only in production to require HTTPS.
 * - `sameSite: 'strict'` prevents CSRF attacks by restricting cross-site requests.
 * - `maxAge` sets cookie lifetime to 30 days (in milliseconds).
 * - `path` makes the cookie available throughout the domain.
 */
export const standardCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: sys.node_env === "production",
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days.
  path: "/",
};
