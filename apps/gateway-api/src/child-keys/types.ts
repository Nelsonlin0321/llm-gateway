/** Claims embedded in a signed child API key JWT (`sk_<jwt>`). */
export type ChildKeyJwtPayload = {
  name: string;
  key_id: string;
  creator_id: string;
  /** Unix timestamp (seconds). Changes on each key rotation. */
  issued_at: number;
  exp?: number;
};

export type ChildKeyAuthSuccess = {
  ok: true;
  plainApiKey: string;
  payload: ChildKeyJwtPayload;
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
