# EasyInventory SaaS

Modern React/Next.js rebuild of the Appsmith EasyInventory workflows.

## Local development

```bash
npm install
npm run dev
```

The app is immediately usable in local demo mode. Production authentication is wired through Auth0 when the variables in `.env.example` are present.

Auth0 callback/logout URLs for local development:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000`

## Verification

```bash
npm run typecheck
npm run test
npm run build
```

## Docker

Copy `.env.example` to `.env`, fill production secrets, then from the repository root:

```bash
docker compose up --build
```
