import type { Role } from "../generated/prisma/client.js";

export enum AuthErrorCode {
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  EMAIL_OR_MOBILE_EXISTS = "EMAIL_OR_MOBILE_EXISTS",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  MISSING_REFRESH_TOKEN = "MISSING_REFRESH_TOKEN",
  MISSING_TOKEN = "MISSING_TOKEN",
  USER_DISABLED = "USER_DISABLED",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR"
}

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthTokenPayload = {
  id: string;
  email: string;
  role: Role;
  tokenVersion: number;
  jti: string;
};

export type RefreshTokenPayload = AuthTokenPayload & {
  type: "refresh";
};

export type AccessTokenPayload = AuthTokenPayload & {
  type: "access";
};
