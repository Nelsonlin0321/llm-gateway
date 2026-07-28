export type ParsedModel = {
  providerId: string;
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
  /** Body ready to forward (bare model + stream_options forced when streaming). */
  upstreamBody: JsonBody;
};

export type PrepareResult =
  | { ok: true; value: PreparedPayload }
  | { ok: false; error: PayloadError };
