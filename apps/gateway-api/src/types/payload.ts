export type ParsedModel = {
  providerName: string;
  model: string;
};

export type JsonBody = Record<string, unknown>;

export type PayloadError = {
  status: 400;
  error: {
    message: string;
    type: string;
    param?: string;
  };
};

export type PreparedPayload = {
  parsed: ParsedModel;
  /** Body with validated client input; proxy may still replace `model` before forwarding. */
  upstreamBody: JsonBody;
};

export type PrepareResult =
  | { ok: true; value: PreparedPayload }
  | { ok: false; error: PayloadError };
