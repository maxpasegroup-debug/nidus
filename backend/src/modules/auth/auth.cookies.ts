import crypto from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";

export const AUTH_COOKIE_NAME = "nidus_session";
export const REFRESH_COOKIE_NAME = "nidus_refresh";
export const AUTH_MARKER_COOKIE_NAME = "nidus_auth";
const ACCESS_MAX_AGE_MS = env.AUTH_ACCESS_TOKEN_MINUTES * 60 * 1000;
const REFRESH_MAX_AGE_MS = env.AUTH_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

function isSecureCookie() {
  return env.COOKIE_SECURE ?? (env.NODE_ENV === "production");
}

function sameSite(): CookieOptions["sameSite"] {
  return isSecureCookie() ? "none" : "lax";
}

function baseCookieOptions(): CookieOptions {
  return {
    domain: env.COOKIE_DOMAIN || undefined,
    secure: isSecureCookie(),
    sameSite: sameSite(),
    path: "/"
  };
}

export function setAuthCookies(res: Response, token: string, refreshToken: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: ACCESS_MAX_AGE_MS
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: REFRESH_MAX_AGE_MS
  });
  res.cookie(AUTH_MARKER_COOKIE_NAME, "1", {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: REFRESH_MAX_AGE_MS
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { ...baseCookieOptions(), httpOnly: true });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...baseCookieOptions(), httpOnly: true });
  res.clearCookie(AUTH_MARKER_COOKIE_NAME, { ...baseCookieOptions(), httpOnly: false });
}

export function parseCookies(req: Request) {
  const header = req.headers.cookie;
  if (!header) return new Map<string, string>();

  return new Map(
    header.split(";").map((part) => {
      const [rawKey, ...rawValue] = part.trim().split("=");
      return [rawKey, decodeURIComponent(rawValue.join("="))];
    })
  );
}

export function readAuthToken(req: Request) {
  const cookieToken = parseCookies(req).get(AUTH_COOKIE_NAME);
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];

  return undefined;
}

export function readRefreshToken(req: Request) {
  return parseCookies(req).get(REFRESH_COOKIE_NAME);
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function csrfCookieOptions(): CookieOptions {
  return {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: REFRESH_MAX_AGE_MS
  };
}
