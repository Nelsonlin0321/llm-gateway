export type ChildKeyTags = Record<string, string>;

/** Claims embedded in a signed child API key JWT (`sk_<jwt>`). */
export type ChildKeyJwtPayload = {
  key_id: string;
  name: string;
  policy_id?: string;
  tags: ChildKeyTags;
  user_email: string;
  creator_email: string;
  /** Unix timestamp (seconds). Changes on each key rotation. */
  issued_at: number;
  /**
   * Optional absolute expiry (Unix seconds).
   * When present, tokens past this time are rejected.
   */
  exp?: number;
};

export type ChildKeyAuthSuccess = {
  ok: true;
  plainApiKey: string;
  payload: ChildKeyJwtPayload;
};

export type ChildKeyAuthFailure = {
  ok: false;
  status: 401 | 403;
  error: {
    message: string;
    type: "authentication_error" | "invalid_request_error";
  };
};

export type ChildKeyAuthResult = ChildKeyAuthSuccess | ChildKeyAuthFailure;
