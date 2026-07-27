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
} from "./service.js";
export type {
  ChildKeyAuthzResult,
  ChildKeyDbRecord,
} from "./service.js";
export { requireChildKeyAuth } from "./middleware.js";
export type { ChildKeyAuthVariables } from "./middleware.js";
export type {
  ChildKeyAuthFailure,
  ChildKeyAuthResult,
  ChildKeyAuthSuccess,
  ChildKeyJwtPayload,
} from "./types.js";
