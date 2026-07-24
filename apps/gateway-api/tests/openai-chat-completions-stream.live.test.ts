import test from "node:test";
import {
  getLiveTestSkipReason,
  getProviderIds,
  loadPayloadTemplate,
  runStreamProviderTest,
} from "./openai-chat-completions-live.js";

const skip = getLiveTestSkipReason();

test(
  "live proxy streams chat completions for each OpenAI-compatible provider",
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
