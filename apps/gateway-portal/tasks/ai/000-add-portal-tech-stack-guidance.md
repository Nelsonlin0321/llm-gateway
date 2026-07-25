# Add Portal Tech Stack Guidance

## Summary

Added a recommended tech stack section to `apps/gateway-portal/AGENTS.md` so future work in the portal follows the intended UI, state management, ORM, auth, and backend approach.

## Files Touched

- `apps/gateway-portal/AGENTS.md`
- `apps/gateway-portal/tasks/ai/000-add-portal-tech-stack-guidance.md`

## What Changed

- Documented Tailwind CSS with shadcn/ui as the preferred UI stack
- Documented React Context, TanStack React Query, and Zustand usage guidance for state management
- Documented Prisma as the ORM
- Documented Better Auth as the auth solution
- Documented a Server Actions first approach for backend integration when appropriate

## How To Verify

From the repository root, review:

```bash
git diff -- apps/gateway-portal/AGENTS.md apps/gateway-portal/tasks/ai/000-add-portal-tech-stack-guidance.md
```

## Follow-ups

- Expand `AGENTS.md` further with concrete architecture and folder conventions once the portal implementation grows beyond the scaffold stage.
