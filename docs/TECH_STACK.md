# IIT (BHU) Hockey Platform — Final Technology Stack

## 1. Project Approach

Build the platform as a **MERN application with TypeScript**.

Core architecture:

```text
React + Vite + TypeScript
        ↓
      Axios
        ↓
      REST API
        ↓
Node.js + Express + TypeScript
        ↓
     Mongoose
        ↓
    MongoDB Atlas

Images / Media
        ↓
    Cloudinary
```

---

# 2. Frontend

## React

**Purpose:** Build the public website and Admin Panel UI.

Used for:
- Home
- History
- Teams
- Tournaments
- Players & Alumni
- Achievements
- Gallery
- Admin Panel

## Vite

**Purpose:** Frontend development and build tooling.

## TypeScript

**Purpose:** Type safety and maintainable frontend/backend code.

## React Router

**Purpose:** Client-side page routing.

Examples:
- `/`
- `/history`
- `/teams`
- `/tournaments`
- `/roster`
- `/achievements`
- `/gallery`
- `/admin`

## Axios

**Purpose:** Make HTTP requests from the frontend to the backend API.

Used for:
- GET
- POST
- PATCH
- DELETE

## Tailwind CSS

**Purpose:** Styling and responsive layouts.

Supports the existing Figma/Stitch design system.

## shadcn/ui

**Purpose:** Reusable, customizable UI components.

Useful for:
- Dialogs
- Buttons
- Inputs
- Selects
- Tabs
- Tables
- Dropdowns
- Forms

## Lucide React

**Purpose:** Consistent interface icons.

## React Hook Form

**Purpose:** Manage Admin CRUD forms efficiently.

Useful for:
- Player forms
- Team forms
- Tournament forms
- Match forms
- Achievement forms
- History forms
- Gallery/media forms

## Zod

**Purpose:** Validate and type-check structured input.

Can be used for:
- Frontend form validation
- Backend request validation

---

# 3. Backend

## Node.js

**Purpose:** Server-side JavaScript/TypeScript runtime.

## Express.js

**Purpose:** Build the REST API and backend application.

## TypeScript

**Purpose:** Type-safe backend development.

## Mongoose

**Purpose:** MongoDB ODM.

Used for:
- Data models
- Schema definitions
- Validation
- Relationships/references
- Database queries

## Argon2id

**Purpose:** Securely hash administrator passwords before storing them.

## Helmet

**Purpose:** Add security-related HTTP headers.

Use in development and production.

## CORS

**Purpose:** Control which frontend origins can access the backend.

Important because frontend and backend may be deployed separately.

## Rate Limiting

**Purpose:** Limit excessive API requests and protect backend endpoints.

Especially important for:
- Authentication endpoints
- Public APIs
- Admin operations

---

# 4. Database

## MongoDB Atlas

**Purpose:** Store structured application data.

Current planned collections:

```text
players
teams
tournaments
tournamentEditions
matches
achievements
historyEvents
galleryItems
admins
```

The current project has a relatively small historical dataset, so MongoDB Atlas Free/M0 is the initial database target.

---

# 5. Media Storage

## Cloudinary

**Purpose:** Store and deliver actual images/media.

MongoDB stores:
- Cloudinary URL/reference
- Image metadata
- Relationships/tags

Cloudinary stores:
- Actual image files

---

# 6. Development Tools

## Cursor

**Purpose:** Primary AI code editor and development environment.

Use Cursor for:
- Project setup
- Backend development
- Frontend development
- Debugging
- Refactoring
- Code review assistance

## Git

**Purpose:** Version control.

## GitHub

**Purpose:**
- Remote repository
- Collaboration/version history
- Pull requests
- Issue tracking
- Future CI/CD

---

# 7. Optional Tools

These are intentionally optional and can be added when the project needs them.

## Zustand

Purpose:
Lightweight client-side global state.

**Current decision:** Not required initially.

Use React state/context unless a real global-state requirement appears.

## Pino

Purpose:
Structured backend logging.

**Current decision:** Optional.

Basic logging can be used initially; Pino can be introduced when production logging requirements justify it.

## Vitest

Purpose:
Unit/component-level testing.

## React Testing Library

Purpose:
Test React components from the user's perspective.

## Supertest

Purpose:
Test backend/API endpoints.

## Playwright

Purpose:
End-to-end browser testing.

## GitHub Actions

Purpose:
Automate linting, testing, builds, and deployment.

These testing/automation tools can be introduced after the core application is working.

---

# 8. Intentionally Not Used Initially

## TanStack Query

**Decision:** Do not use initially.

For the current project:
- Axios handles API requests.
- React state handles local fetched data.
- Additional server-state tooling can be introduced later if needed.

## Redux Toolkit

**Decision:** Not required.

The project does not currently justify a large global state-management layer.

---

# 9. Testing Strategy

Testing tools are optional during the first development iteration.

When testing is introduced:

```text
Vitest
   ↓
Unit / logic tests

React Testing Library
   ↓
React component tests

Supertest
   ↓
API tests

Playwright
   ↓
End-to-end browser tests
```

---

# 10. Future CI/CD

GitHub Actions is planned as an optional later addition:

```text
Git Push
   ↓
GitHub Actions
   ↓
Lint
   ↓
Tests
   ↓
Build
   ↓
Deployment
```

Do not make CI/CD a blocker for initial development.

---

# 11. Deployment — Initial Plan

## Frontend
**Vercel**

## Backend
**Render**

## Database
**MongoDB Atlas**

## Media
**Cloudinary**

## Repository
**GitHub**

---

# 12. Final Stack Summary

```text
FRONTEND
React
Vite
TypeScript
React Router
Axios
Tailwind CSS
shadcn/ui
Lucide React
React Hook Form
Zod

BACKEND
Node.js
Express.js
TypeScript
Mongoose
Zod
Argon2id
Helmet
CORS
Rate Limiting

DATABASE
MongoDB Atlas

MEDIA
Cloudinary

DEVELOPMENT
Cursor
Git
GitHub

OPTIONAL / LATER
Zustand
Pino
Vitest
React Testing Library
Supertest
Playwright
GitHub Actions

DEPLOYMENT
Vercel
Render
MongoDB Atlas
Cloudinary
```

---

# 13. Stack Decision Status

| Area | Decision |
|---|---|
| Architecture | MERN + TypeScript |
| Frontend | React + Vite |
| Routing | React Router |
| HTTP Client | Axios |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Forms | React Hook Form |
| Validation | Zod |
| Backend | Node.js + Express |
| ODM | Mongoose |
| Password hashing | Argon2id |
| Security headers | Helmet |
| Cross-origin access | CORS |
| API protection | Rate Limiting |
| Database | MongoDB Atlas |
| Media | Cloudinary |
| Code Editor | Cursor |
| Version control | Git + GitHub |
| Server-state library | Not used initially |
| Global state library | Not used initially |
| Testing | Optional/later |
| CI/CD | Optional/later |
| Frontend deployment | Vercel |
| Backend deployment | Render |

---

# 14. Important Boundary

This document freezes the **technology choices for initial development**.

It does not define:
- Exact package versions
- Environment variables
- Folder structure
- Installation commands
- Mongoose implementation schemas
- API implementation
- Authentication implementation
- Deployment configuration

Those are handled during the Development Setup and implementation stages.
