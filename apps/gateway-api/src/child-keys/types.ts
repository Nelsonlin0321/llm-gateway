import type { ChildKey } from "../lib/db";

export type ChildKeyDbRecord = ChildKey;

/** Claims embedded in a signed child API key JWT (`sk_<jwt>`). */
export type ChildKeyJwtPayload = {
  key_id: string;
  issued_at: number;
  exp?: number;
};

export type ChildKeyAuthSuccess = {
  ok: true;
  record: ChildKeyDbRecord;
};

export type ChildKeyAuthFailure = {
  ok: false;
  status: 401 | 403 | 503;
  error: {
    message: string;
    type: "authentication_error" | "invalid_request_error" | "server_error";
  };
};

export type ChildKeyAuthResult = ChildKeyAuthSuccess | ChildKeyAuthFailure;
