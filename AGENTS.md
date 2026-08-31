# AGENTS.md

## Project snapshot

This repository contains the IIT (BHU) Hockey platform. The current code lives in [backend](backend), while the frontend is planned separately and is not part of the current repo layout. Planning and API docs live under [docs](docs).

Final stack:
- Node.js + TypeScript
- Express
- MongoDB + Mongoose
- Zod
- Argon2id
- ImageKit
- Helmet
- CORS
- Rate limiting
- Prettier
- ESLint
- ES modules with `"type": "module"` in [backend/package.json](backend/package.json)
- NodeNext conventions

Frontend/backend boundary:
- Frontend belongs to React + Vite, React Router, Axios, Tailwind CSS, shadcn/ui, Lucide React, and React Hook Form.
- Backend work should remain Node.js + Express + TypeScript unless explicitly requested.
- Do not add frontend work to this backend area unless the task specifically asks for it.

## Working conventions

- Treat [backend](backend) as the active project root for package scripts and backend-only changes.
- Use the existing TypeScript config and module conventions in [backend/tsconfig.json](backend/tsconfig.json): ESM, strict mode, NodeNext compatibility.
- Keep import paths consistent with NodeNext semantics; in TypeScript source files, use `.js` in import specifiers when importing local modules.
- Prefer small, focused files and follow the folder responsibilities already described in [docs/BACKEND_FOLDER_GUIDE.md](docs/BACKEND_FOLDER_GUIDE.md).
- Match the naming and structure already used in the existing models, middleware, and config files.
- Keep controllers thin; services own business logic; models define MongoDB schemas; routes define endpoints; middleware handles auth, errors, validation, rate limiting, and 404s; validators handle Zod validation.

## Architecture and boundaries

Follow these layering rules when adding backend features:

1. Routes define endpoints and attach middleware.
2. Controllers read request data and delegate business logic.
3. Services handle business logic and database operations.
4. Models define Mongoose schemas and data constraints.
5. Validators enforce request payload/query/params rules with Zod.
6. Middleware handles auth, error handling, validation, rate limiting, and 404s.

Keep controllers thin. Do not place large business logic inside controller functions.

## Authentication guidance

- Current MVP uses admin-only, secure server-side cookie/session authentication.
- Do not add JWT, OAuth, social auth, or alternative auth flows unless explicitly requested.
- Protect admin routes with server-side authentication and authorization checks.

## Database and storage guidance

- [docs/MONGODB_COLLECTIONS_FINAL.md](docs/MONGODB_COLLECTIONS_FINAL.md) is the MongoDB schema source of truth. Resolve conflicts in its favor.
- Do not add unrequested collections or fields.
- Final media/storage decision:
  - ImageKit stores the actual images/media.
  - MongoDB stores image/file URLs or references and related metadata.
  - MongoDB never stores image binaries.
  

## Implementation guidance

- Use the existing app setup in [backend/src/app.ts](backend/src/app.ts) and [backend/src/server.ts](backend/src/server.ts) as the baseline for middleware, middleware ordering, and startup behavior.
- Add database connectivity in [backend/src/config/database.ts](backend/src/config/database.ts); do not bypass the established connection pattern.
- Reuse `AppError` and async wrapping utilities from [backend/src/utils](backend/src/utils) instead of inventing custom error patterns.
- Errors should be handled centrally via the middleware chain in [backend/src/middleware](backend/src/middleware).
- For admin authentication and password workflows, align with the roadmap in [docs/BACKEND_DEVELOPMENT_ROADMAP.md](docs/BACKEND_DEVELOPMENT_ROADMAP.md).
- Keep API behavior consistent with [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md), [docs/API_STANDARDS_AND_CONVENTIONS.md](docs/API_STANDARDS_AND_CONVENTIONS.md), and [docs/API_REQUEST_RESPONSE_STRUCTURES.md](docs/API_REQUEST_RESPONSE_STRUCTURES.md).

## Commands

Use these commands from the workspace root when verifying backend work:

- Install dependencies: `npm --prefix backend install`
- Start dev server: `npm --prefix backend run dev`
- Type-check: `npm --prefix backend run type-check`
- Build: `npm --prefix backend run build`
- Lint: `npm --prefix backend run lint`
- Format: `npm --prefix backend run format`

## Documentation to consult

For deeper project context, use these docs instead of re-deriving conventions:

- [docs/TECH_STACK.md](docs/TECH_STACK.md)
- [docs/BACKEND_FOLDER_GUIDE.md](docs/BACKEND_FOLDER_GUIDE.md)
- [docs/BACKEND_DEVELOPMENT_ROADMAP.md](docs/BACKEND_DEVELOPMENT_ROADMAP.md)
- [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)
- [docs/API_STANDARDS_AND_CONVENTIONS.md](docs/API_STANDARDS_AND_CONVENTIONS.md)
- [docs/API_REQUEST_RESPONSE_STRUCTURES.md](docs/API_REQUEST_RESPONSE_STRUCTURES.md)
- [docs/MONGODB_COLLECTIONS_FINAL.md](docs/MONGODB_COLLECTIONS_FINAL.md)

## Expectations for AI agents

- Prefer minimal, correct changes that fit the existing project structure.
- Before adding a new feature, inspect the relevant model, validator, service, route, and doc files to match the established patterns.
- Keep API and storage behavior aligned with the project documentation and final decisions.
- Do not add unrelated frameworks or dependencies unless clearly required by the task.
- When the task touches the backend, keep changes scoped to the backend and its docs unless the user explicitly asks for broader repo changes.
