# Gateway Portal Project Description

## Overview

Gateway Portal is a Next.js application for organizations that operate an LLM gateway and need a secure self-service control plane for API access, cost governance, and usage analytics.

The portal allows a customer to configure one or more upstream provider accounts by storing a master API URL and API key, define model pricing for cost calculation, and create downstream child API keys for teams, users, projects, or applications. Each child key can be governed with limits such as rate limits, model access rules, and spending budgets. The product also provides analytics dashboards so administrators can understand token usage, request volume, latency, and cost across different business dimensions.

In short, Gateway Portal is the management layer between upstream model providers and downstream internal or external consumers.

## Problem Statement

Teams using multiple AI providers often struggle with:

- Scattered API keys and inconsistent credential management
- No central way to map upstream provider cost to downstream usage
- Weak controls for who can use which models and at what rate
- Poor visibility into spend by team, user, project, or application
- No clean way to issue child credentials with policy enforcement

Gateway Portal solves this by centralizing provider configuration, access management, policy enforcement, and analytics in one product.

## Product Goals

The application should:

1. Provide secure username/password authentication for portal users using Better Auth.
2. Let administrators register and manage master provider connections with API URL, provider metadata, and API keys.
3. Let administrators define pricing metadata for models, including input and output token prices, so cost can be calculated consistently.
4. Let administrators create child API keys for different ownership scopes such as team, user, project, and application.
5. Let administrators apply governance policies to child keys, including rate limits, model allowlists, and budget controls.
6. Provide analytics dashboards that break down traffic, tokens, and cost by provider, model, team, user, project, application, and time range.

## Primary Users

- Platform Admin: manages providers, master credentials, pricing, policies, and global analytics
- Team Admin: manages child keys and budgets for a team or business unit
- Developer / Application Owner: views assigned keys, quotas, usage, and cost for their project or application
- Finance / Operations: reviews aggregate spend, trends, and cost allocation

## Core Functional Areas

### 1. Authentication and Access

The portal uses Better Auth with basic username and password authentication.

Key capabilities:

- Sign up or invite-based account creation, depending on business policy
- Login and logout
- Session management
- Password reset and credential recovery
- Role-based access control for admin and non-admin users

### 2. Master Provider Management

Administrators can configure upstream providers that the gateway will use.

Each provider record should support:

- Provider name
- Base API URL / master API URL
- Master API key or credential reference
- Provider type and status
- Notes or description
- Connection validation status

Examples of providers may include OpenAI-compatible endpoints, Anthropic, Azure OpenAI, Google, or internal proxy providers.

### 3. Model Pricing Configuration

Because billing and analytics depend on accurate cost data, the portal should allow admins to configure model pricing for each provider.

Pricing fields should include:

- Provider
- Model name / model identifier
- Input token price
- Output token price
- Optional cached input or special token price fields
- Currency
- Effective date or version

This pricing metadata is used to calculate estimated or actual cost in the analytics dashboard and budget enforcement flows.

### 4. Child API Key Management

Administrators can create child API keys that represent controlled access for downstream consumers.

A child key can be issued for:

- Team
- User
- Project
- Application
- Environment or other logical tenant scope

Each child key should include:

- Key name
- Key value or generated secret
- Owner type and owner reference
- Status
- Creation date
- Expiration date if applicable
- Associated provider or routing policy

### 5. Policy and Budget Configuration

Each child API key should support configurable guardrails.

Policy controls should include:

- Request rate limits
- Token-per-minute or requests-per-minute limits
- Allowed or blocked models
- Provider restrictions
- Maximum budget over a time window
- Alert thresholds for budget usage
- Optional expiration or temporary suspension

These controls help enforce governance while still enabling flexible self-service access.

### 6. Analytics and Reporting

The portal should provide dashboards and filtered reports that help users understand operational and financial usage.

Important analytics dimensions include:

- Time range
- Provider
- Model
- Team
- User
- Project
- Application
- API key

Important metrics include:

- Number of requests
- Input tokens
- Output tokens
- Total tokens
- Estimated or actual cost
- Error rate
- Latency trends
- Budget consumption

The dashboard should support both high-level executive summaries and deeper drill-down analysis.

## Suggested Information Architecture

Recommended top-level portal areas:

- Authentication
- Dashboard
- Providers
- Models and Pricing
- Child API Keys
- Policies and Budgets
- Analytics
- Settings
- Audit Logs

## Key Entities

The product is centered around these main entities:

- User
- Role
- Provider
- Master Credential
- Model Pricing
- Child API Key
- Team
- Project
- Application
- Policy
- Budget
- Usage Record
- Cost Record
- Audit Event

## Security and Compliance Expectations

Because the system stores and governs API credentials, security is a first-class concern.

Important expectations:

- Store secrets securely and never expose raw master API keys after creation
- Encrypt sensitive credentials at rest
- Protect all authenticated routes
- Log security-sensitive actions in audit logs
- Support least-privilege access by role and ownership scope
- Prevent unauthorized access to analytics across tenant boundaries

## Non-Functional Expectations

- Fast and responsive admin experience built with Next.js
- Clear and reliable cost calculations
- Good observability for provider failures and usage anomalies
- Scalable data model for high-volume usage records
- Extensible provider model for additional upstream vendors

## MVP Scope

The first production-ready milestone should include:

1. Better Auth username/password login
2. Admin management for providers and master API credentials
3. Model pricing management for cost calculation
4. Child API key creation and lifecycle management
5. Basic policy controls for rate limiting, model access, and budget caps
6. Analytics dashboard for requests, tokens, and cost by provider, model, team, user, and project
7. Audit log for key administrative actions

## Future Enhancements

Possible next-phase capabilities:

- SSO and enterprise identity providers
- Multi-organization tenancy
- Approval workflows for new child keys
- Budget alerts by email, Slack, or webhook
- Usage forecasting and anomaly detection
- Invoice export and cost allocation reporting
- Provider health dashboard
- Fine-grained quota templates

## Success Criteria

The project will be successful when a customer can:

- Sign into the portal securely
- Register upstream provider credentials
- Define pricing for supported models
- Issue child API keys to downstream owners
- Apply governance rules to those keys
- See accurate usage and cost across multiple reporting dimensions

## Summary

Gateway Portal is the operational control plane for a multi-provider LLM gateway. It combines authentication, provider credential management, model pricing, child API key provisioning, policy enforcement, and analytics into one centralized product so organizations can safely scale AI usage with visibility and cost control.
