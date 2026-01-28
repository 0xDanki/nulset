# NulSet AI Rules (Hackathon Mode)

## Goals
- Keep the repo runnable at all times.
- Prefer minimal diffs; avoid dependency sprawl.
- Optimize for demo reliability over perfection.

## Output format when implementing features
1) Brief plan (max 8 bullets)
2) Patch (multi-file if needed)
3) Exact commands to run + expected output
4) If something is uncertain, propose 2 options and pick the safest.

## Guardrails
- Do not invent Noir/JS APIs. Verify names and types in the repo.
- Never hardcode secrets; use .env + .env.example.
- Any circuit change must keep `nargo compile` passing.
- Any TS change must keep `pnpm -r dev` working.

## Repo conventions
- TypeScript strict
- Use zod for request validation in API
- Keep endpoints small + logged
