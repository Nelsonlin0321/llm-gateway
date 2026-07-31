export {
  extractAutoclaimEntries,
  extractStreamEntries,
  fieldsArrayToRecord,
  type ExtractedStreamEntry,
} from "./extract.js";
export {
  ensureConsumerGroup,
  type EnsureGroupInput,
  type EnsureGroupResult,
} from "./ensure-group.js";
export {
  buildXAutoClaimArgs,
  buildXReadGroupArgs,
  readGroupEntries,
  XAUTOCLAIM_START_ID,
  type ReadGroupInput,
  type ReadGroupResult,
} from "./read-group.js";
export {
  ackEntries,
  type AckEntriesInput,
  type AckEntriesResult,
} from "./ack.js";
