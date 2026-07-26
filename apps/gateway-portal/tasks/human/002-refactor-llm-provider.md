feat(llm-providers): refactor llm provider management

Add full end-to-end LLM provider management capabilities:

- server-rendered management section with data fetching via server actions
- interactive client component for listing providers with overview statistics
- modal forms for creating and editing providers with Zod validation
- secure handling of encrypted API keys (existing keys are never exposed to clients)
- support for soft deleting providers and toggling their active status
- pre-built loading skeleton UI for the management page
- refactor existing provider component imports to the new llm-providers directory
