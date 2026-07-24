# Work Log Rule

When you complete any meaningful change (feature, fix, refactor, test, documentation, configuration), you must record what was done in a Markdown file.

## Requirements

- Location: under the most relevant `tasks/**` folder (e.g. `apps/gateway-api/tasks/ai/` or `apps/gateway-api/tasks/human/`).
- Filename prefix: a three-digit, zero-padded sequence number that increases over time within that folder.
  - Examples: `001-anthropic-proxy.md`, `002-streaming-tests.md`
- Content: include at minimum:
  - Summary of changes
  - Files touched
  - How to verify (commands/tests run)
  - Follow-ups / next steps (if any)
