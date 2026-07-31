/** Redis Stream used as the request-log buffer before database ingest. */
export const REQUEST_LOG_STREAM = "llm-gateway-request-logs";

/** Default consumer group for the ingest worker. */
export const REQUEST_LOG_CONSUMER_GROUP = "gateway-ingest";
