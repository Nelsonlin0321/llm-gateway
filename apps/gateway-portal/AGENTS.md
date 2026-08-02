<!-- BEGIN: LLM-Gateway-Portal-APP-DESCRIPTION -->

# Gateway Portal

## What We Are Building

`gateway-portal` is a Next.js open source application that acts as the self-service control plane for an LLM gateway platform.

The product is for individual users or organizations that need to:

- configure upstream provider connections with a master API URL and API key
- manage model pricing for input and output token cost calculation
- create child API keys for teams, users, projects, and applications
- apply controls such as rate limits, model access, and spending budgets
- analyze usage, tokens, requests, and cost across multiple business dimensions

This application is the management and analytics layer between upstream AI providers and downstream consumers.

## Core Product Areas

The portal should eventually include these main areas:

1. Authentication with Better Auth using username and password
2. Provider management for master API URL, provider metadata, and master API key
3. Model pricing management for input and output token costs
4. Child API key creation and lifecycle management
5. Policy configuration for rate limits, model access, and budget controls
6. Analytics dashboards for metrics, tokens, cost, errors, and trends
7. Audit logging for sensitive administrative actions

## Main Users

- Platform admins who manage providers, pricing, policies, and analytics
- Team admins who manage child keys and budgets within a team
- Developers or application owners who consume assigned child keys
- Finance or operations users who review spend and usage allocation

## Key Data Dimensions

Analytics and management workflows should support these dimensions where relevant:

- provider
- model
- team
- user
- project
- application
- api key
- time range

## Important Domain Concepts

- A **master provider credential** connects the gateway to an upstream provider.
- A **child API key** is a downstream credential issued to a team, user, project, or application.
- **Pricing configuration** maps model usage to cost using token prices.
- **Policies** define allowed models, rate limits, and budget constraints.
- **Analytics** report requests, tokens, latency, errors, and cost by multiple dimensions.

## Product Expectations

When working in this app, optimize for:

- secure handling of secrets and authenticated routes
- clean admin workflows for configuration and governance
- accurate cost calculation using model pricing metadata
- extensible support for multiple providers
- dashboards that make usage and spend easy to understand

## Recommended Tech Stack

When adding features to this app, prefer this stack by default:

- UI:
  - Tailwind CSS
  - shadcn/ui components: How to install component:
    if you're working on the root directory of the project, run `npx shadcn@latest add card -c apps/gateway-portal`
- State management: React Context for simple shared state, TanStack React Query for server state, and Zustand for client-side app state where Context becomes cumbersome
- ORM: Drizzle
- Auth: Better Auth
- Backend integration: prefer Server Actions first when the workflow fits Next.js well

## Current State

This app currently starts from a minimal Next.js scaffold. New work should move it toward a production-ready admin portal for LLM gateway management rather than a generic demo site.

<!-- END: LLM-Gateway-Portal-APP-DESCRIPTION -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Work Log Rule

When you complete any meaningful change (feature, fix, refactor, test, documentation, configuration), you must record what was done in a Markdown file.

## Requirements

- Location: under the most relevant `tasks/**` folder in `apps/gateway-portal/`.
- Filename prefix: a three-digit, zero-padded sequence number that increases over time within that folder.
  - Examples: `001-auth-flow.md`, `002-provider-loading-states.md`
- Content: include at minimum:
  - Summary of changes
  - Files touched
  - How to verify (commands/tests run)
  - Follow-ups / next steps (if any)
