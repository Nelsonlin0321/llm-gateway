A feature that allow user to register a new model under a specific llm provider.
Implement this feature by following below instructions:

- Add the models menu item on the left side bar: apps/gateway-portal/components/workspace/workspace-sidebar.tsx
- add the page at `/workspace/[providerId]/models`
- in `/workspace/[providerId]/models`, view registered models, add new model by specifying the model name, input price, output price. price per 1M token, input price per 1M cached token
- Security:
  - Only allow the provider creator to view this page.
  - Validate the model name input price, output price, price per 1M token, input price per 1M cached token are required and must be positive numbers.
  - The model name could not be unique.

This is the prisma schema for the model table:

```prisma
model Model {
  id              String      @id
  name            String // upstream model name
  alias           String // downstream model name - route to this name
  inputPrice      Float
  outputPrice     Float
  inputCachePrice Float
  providerId      String
  provider        LLMProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  @@index([providerId])
}
```
