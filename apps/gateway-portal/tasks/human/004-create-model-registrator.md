A feature that allow user to register a new model under a specific llm provider.
Implement this feature by following below instructions:

- Add the models menu item on the left side bar: apps/gateway-portal/components/workspace/workspace-sidebar.tsx
- add the page at `/workspace/[providerId]/models`
- in `/workspace/[providerId]/models`, view registered models, add new model by specifying the model name, input price, output price. price per 1M token, input price per 1M cached token
- Security:
  - Only allow the provider creator to view this page.
  - Validate the model name input price, output price, price per 1M token, input price per 1M cached token are required and must be positive numbers.
  - The model name could not be unique.
