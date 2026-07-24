import test from "node:test";
import {
  getLiveTestSkipReason,
  getProviderIds,
  loadPayloadTemplate,
  runStreamProviderTest,
} from "./anthropic-messages-live.js";

const skip = getLiveTestSkipReason();

test(
  "live proxy streams messages for each Anthropic-compatible provider",
  { skip },
  async (t) => {
    const payloadTemplate = await loadPayloadTemplate();

    for (const providerId of getProviderIds()) {
      await t.test(providerId, async (t) => {
        const result = await runStreamProviderTest(providerId, payloadTemplate);
        const firstChunk =
          typeof result.firstChunkMs === "number"
            ? `${result.firstChunkMs}ms`
            : "no chunks";

        t.diagnostic(
          `model=${result.model} status=${result.status} first-chunk=${firstChunk} total=${result.totalDurationMs}ms`,
        );
      });
    }
  },
);
