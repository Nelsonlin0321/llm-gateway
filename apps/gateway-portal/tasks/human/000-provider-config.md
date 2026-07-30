Implement below feature: LLM provider management.

Create a page that allow user to create, manage their LLM provider.

A provider requires API URL, API Key, provider name as the prefix of model name, compatibility type, optional input price per 1M tokens, output price per 1M tokens, input price per 1m tokens cached.

The api key required to be encrypted in the database using the API_ENCRYPT_KEY in the .env file. the api key will be decrypted in the proxy layer.

Now implement this feature end by end, including the page, the server action, and the database schema etc.

Implement an end-to-end LLM provider configuration management feature with the following technical requirements, implementation steps, and success criteria:

### 1. Database Schema Design & Setup

below prisma table has been created.

```prisma
enum CompatibilityType {
  openai
  anthropic
}
```

```prisma
model LLMProvider {
  id                String            @id
  name              String
  apiUrl            String
  encryptedApiKey   String
  compatibilityType CompatibilityType
  inputPrice        Float? // input price per 1M tokens
  inputCachePrice   Float? // input cache price per 1M tokens
  outputPrice       Float? // output price per 1M tokens
  isActive          Boolean           @default(true)
  creatorId         String
  creator           User              @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}
```

### 2. Server Action Implementation

- Create the directory `/app/server-actions/llm-provider` to organize all LLM provider-related server actions
- Within this folder, create separate action files for each CRUD operation:
  - `create-provider.ts`: Implements create operation with input validation, API key encryption logic using the `API_ENCRYPT_KEY` environment variable from .env, and database persistence
  - `get-providers.ts`: Implements read operations to fetch all active providers, with decryption logic only exposed to the proxy layer (never return decrypted API keys to client-side code)
  - `update-provider.ts`: Implements update operation that re-encrypts the API key if modified, and preserves existing encryption for unmodified keys
  - `delete-provider.ts`: Implements soft delete logic (sets `is_active` to false) instead of permanent deletion for audit purposes
- Ensure all server actions include robust input validation using Zod, with error handling for duplicate provider names, invalid API URL formats, and missing required fields
- Implement AES-256-GCM encryption for all API keys before database storage; decryption logic is restricted exclusively to the application's proxy layer to maintain security

### 3. Frontend Configuration Page Development

- Build a dedicated, responsive admin page for LLM provider configuration management that includes:
  - A list view of all existing providers with key metadata (name, compatibility type, active status)
  - A create/edit modal form with the following validated input fields:
    - Required provider name input with regex validation to prevent invalid characters that break model routing
    - Required API URL input with URL format validation
    - Required API key input masked with password protection to prevent shoulder surfing
    - Compatibility type dropdown restricted to the two supported values (openai/anthropic)
    - Optional numeric input fields for all three token pricing metrics with min-value validation (cannot be negative)
    - Active status toggle to enable/disable providers
  - Delete functionality with confirmation prompts to prevent accidental removal of providers
- Add client-side form validation before submitting data to server actions, and display user-friendly error/success toast notifications for all operations
- Ensure the page never exposes unencrypted API keys to the client, even when editing existing configurations

### 4. Testing & Validation Requirements

- Write unit tests for all server actions to verify encryption/decryption works correctly.
- Verify API keys stored in the database are irrecoverable without the `API_ENCRYPT_KEY` environment variable, confirming encryption security

### 6. Deliverables

- Complete set of server actions in `/app/server-actions/llm-provider` for all CRUD operations
- Fully functional frontend configuration page with form validation and responsive design
- All unit and end-to-end tests passing, with no security vulnerabilities related to API key storage or exposure
