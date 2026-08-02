import test from "node:test";
import {
  getLiveTestSkipReason,
  getProviderIds,
  loadPayloadTemplate,
  runStreamProviderTest,
} from "./anthropic-messages-live.js";

const skip = getLiveTestSkipReason();

// Flat tests (no nested t.test) — Bun's node:test polyfill does not support nesting.
for (const providerId of getProviderIds()) {
  test(
    `live proxy streams messages: ${providerId}`,
    { skip },
    async () => {
      const payloadTemplate = await loadPayloadTemplate();
      const result = await runStreamProviderTest(providerId, payloadTemplate);
      const firstChunk =
        typeof result.firstChunkMs === "number"
          ? `${result.firstChunkMs}ms`
          : "no chunks";
      console.log(
        `  model=${result.model} status=${result.status} first-chunk=${firstChunk} total=${result.totalDurationMs}ms`,
      );
    },
  );
}
