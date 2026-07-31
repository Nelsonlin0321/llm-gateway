export {
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
  buildXReadGroupArgs,
  readGroupEntries,
  type ReadGroupInput,
  type ReadGroupResult,
} from "./read-group.js";
