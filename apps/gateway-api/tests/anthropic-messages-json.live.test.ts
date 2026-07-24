import test from "node:test";
import {
  getLiveTestSkipReason,
  getProviderIds,
  loadPayloadTemplate,
  runJsonProviderTest,
} from "./anthropic-messages-live.js";

const skip = getLiveTestSkipReason();

test(
  "live proxy returns JSON messages for each Anthropic-compatible provider",
  { skip },
  async (t) => {
    const payloadTemplate = await loadPayloadTemplate();

    for (const providerId of getProviderIds()) {
      await t.test(providerId, async (t) => {
        const result = await runJsonProviderTest(providerId, payloadTemplate);
        t.diagnostic(
          `model=${result.model} status=${result.status} latency=${result.latencyMs}ms`,
        );
      });
    }
  },
);
