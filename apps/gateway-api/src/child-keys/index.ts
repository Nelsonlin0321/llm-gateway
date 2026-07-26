export {
  authenticateChildApiKey,
  decryptApiKeyForProxy,
  decryptChildKey,
  encryptApiKey,
  extractBearerToken,
  requirePlainChildApiKey,
  CHILD_KEY_PREFIX,
  decodeChildKeyToken,
  verifyChildKeyToken,
} from "./service.js";
export { signChildKeyToken } from "./sign.js";
export { requireChildKeyAuth } from "./middleware.js";
export type { ChildKeyAuthVariables } from "./middleware.js";
export type {
  ChildKeyAuthFailure,
  ChildKeyAuthResult,
  ChildKeyAuthSuccess,
  ChildKeyJwtPayload,
  ChildKeyTags,
} from "./types.js";
