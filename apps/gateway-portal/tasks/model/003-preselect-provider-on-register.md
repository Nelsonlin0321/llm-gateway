# 003 — Preselect provider when registering a model

## Summary

Opening **Add model** on `/org/[organizationId]/models?provider={providerId}` now selects that provider in the Register model dialog. Edit still uses the model’s own provider. An unknown provider id falls back to the first provider in the list.

## Files touched

- `components/models/model-form-modal.tsx` — `defaultProviderId` for create mode
- `components/models/model-management-client.tsx` — pass `query.providerId` into the dialog

## How to verify

1. Open `/org/{organizationId}/models?provider={providerId}` for a provider that is not first in the list.
2. Click **Add model**.
3. Confirm the Provider dropdown shows that provider.
4. Open **Add model** with no `provider` query and confirm the first provider is still selected.
5. Edit an existing model and confirm its own provider stays selected.

## Follow-ups / next steps

- None
