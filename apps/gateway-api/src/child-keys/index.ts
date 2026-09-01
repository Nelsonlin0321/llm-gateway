export {
  authenticateChildApiKey,
  authorizeChildKey,
  decryptApiKeyForProxy,
  decryptChildKey,
  encryptApiKey,
  extractBearerToken,
  requirePlainChildApiKey,
  CHILD_KEY_PREFIX,
  decodeChildKeyToken,
  verifyChildKeyToken,
} from "./service";
export type { ChildKeyAuthzResult } from "./service";
export { requireInjectChildKeyAuth } from "./middleware";
export type { ChildKeyAuthVariables } from "./middleware";
export {
  consumeChildKeyRateLimit,
  createChildKeyRateLimitMiddleware,
} from "./rate-limit";
export type {
  ChildKeyAuthFailure,
  ChildKeyAuthResult,
  ChildKeyAuthSuccess,
  ChildKeyDbRecord,
  ChildKeyJwtPayload,
} from "./types";
