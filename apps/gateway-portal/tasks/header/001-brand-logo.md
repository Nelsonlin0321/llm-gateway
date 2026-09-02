# 001 — Portal header brand lockup

## Summary of changes

Replaced the header “GW / Gateway” placeholder with the `public/logo.jpg` mark and the `llm-gateway.io` wordmark.

- Home link aria-label is `llm-gateway.io home`.
- Wordmark is hidden below the `sm` breakpoint so GitHub / Sign in / Open console stay on one row.

## Files touched

- `apps/gateway-portal/components/portal-header.tsx`

## How to verify

With the portal running (`bun run dev` in `apps/gateway-portal`):

```bash
curl -sS http://localhost:3000/ | rg 'llm-gateway.io|/logo.jpg'
```

Check `/`, `/sign-in`, and `/sign-up` at desktop and mobile widths: logo in the header, `llm-gateway.io` visible from `sm` up, header actions not clipped.

## Follow-ups / next steps

- Optional: apply the same lockup on auth shells, emails, and footer copy that still say “Gateway”.
