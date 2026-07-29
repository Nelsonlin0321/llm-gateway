## Summary
- Ensured the provider edit modal pre-populates form fields from the selected provider whenever the modal opens or the provider/mode changes.
- Kept the API key field intentionally blank in edit mode for security.
- Implemented the reset behavior by keying an inner modal component so the form state remounts cleanly on open/provider changes.

## Files Touched
- [provider-form-modal.tsx](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-portal/components/llm-providers/provider-form-modal.tsx)

## How To Verify
- `npm --prefix apps/gateway-portal run lint`
- Open `/workspace/providers`, click “Edit” on an existing provider, and confirm name/API URL/compatibility/active fields are filled from the provider record.

## Follow-ups / Next Steps
- None.
