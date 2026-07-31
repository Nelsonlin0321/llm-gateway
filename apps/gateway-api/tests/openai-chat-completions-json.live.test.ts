import test from "node:test";
import {
  getLiveTestSkipReason,
  getProviderIds,
  loadPayloadTemplate,
  runJsonProviderTest,
} from "./openai-chat-completions-live.js";

const skip = getLiveTestSkipReason();

// Flat tests (no nested t.test) — Bun's node:test polyfill does not support nesting.
for (const providerId of getProviderIds()) {
  test(
    `live proxy returns JSON chat completions: ${providerId}`,
    { skip },
    async () => {
      const payloadTemplate = await loadPayloadTemplate();
      const result = await runJsonProviderTest(providerId, payloadTemplate);
      console.log(
        `  model=${result.model} status=${result.status} latency=${result.latencyMs}ms`,
      );
    },
  );
}
