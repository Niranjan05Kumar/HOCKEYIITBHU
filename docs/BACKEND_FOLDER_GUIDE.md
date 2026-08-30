# IIT (BHU) Hockey Platform — Backend Folder Guide

## Backend Structure

```text
backend/
└── src/
    ├── config/
    ├── models/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── middleware/
    ├── validators/
    ├── utils/
    ├── app.ts
    └── server.ts
```

---

## 1. `config/`

**Purpose:** Store application and external-service configuration.

Typical examples:
- `database.ts` — MongoDB connection/configuration.
- `cloudinary.ts` — Cloudinary configuration.

**Simple idea:** `config/` = How the application connects to external services.

---

## 2. `models/`

**Purpose:** Define MongoDB data structures using Mongoose.

Planned models:
- `player.model.ts`
- `team.model.ts`
- `tournament.model.ts`
- `tournamentEdition.model.ts`
- `match.model.ts`
- `achievement.model.ts`
- `historyEvent.model.ts`
- `galleryItem.model.ts`
- `admin.model.ts`

Models define:
- Fields
- Data types
- Required/optional fields
- Defaults
- Enums
- References
- Embedded data
- Timestamps
- Schema-level validation

**Simple idea:** `models/` = What our database data looks like.

---

## 3. `routes/`

**Purpose:** Define API endpoints and connect requests to controllers.

Examples:
- `auth.routes.ts`
- `player.routes.ts`
- `team.routes.ts`
- `tournament.routes.ts`
- `tournamentEdition.routes.ts`
- `match.routes.ts`
- `achievement.routes.ts`
- `history.routes.ts`
- `gallery.routes.ts`

Typical flow:

```text
Request
↓
Route
↓
Middleware
↓
Controller
```

**Simple idea:** `routes/` = Where requests go.

---

## 4. `controllers/`

**Purpose:** Handle HTTP requests and responses.

A controller typically:
1. Reads request data.
2. Calls the appropriate service.
3. Receives the result.
4. Sends the HTTP response.
5. Sets the appropriate status code.

Typical flow:

```text
GET /api/v1/players
↓
Player Controller
↓
Player Service
```

Controllers should not contain large amounts of business logic.

**Simple idea:** `controllers/` = Handle the request and response.

---

## 5. `services/`

**Purpose:** Contain business logic and reusable application operations.

Possible services:
- `auth.service.ts`
- `player.service.ts`
- `team.service.ts`
- `tournament.service.ts`
- `tournamentEdition.service.ts`
- `match.service.ts`
- `achievement.service.ts`
- `history.service.ts`
- `gallery.service.ts`

Examples of service responsibilities:
- Database operations
- Business rules
- Relationship handling
- Duplicate checks
- Data transformation
- Reusable operations

Typical flow:

```text
Controller
↓
Service
↓
Model
↓
MongoDB
```

**Simple idea:** `services/` = What the application needs to do.

---

## 6. `middleware/`

**Purpose:** Process or check requests during the request-response cycle.

Typical middleware:
- `auth.middleware.ts`
- `error.middleware.ts`
- `notFound.middleware.ts`
- `validate.middleware.ts`

Possible responsibilities:
- Authentication
- Authorization
- Validation integration
- Error handling
- Rate limiting

Example:

```text
Request
↓
Authentication
↓
Validation
↓
Controller
```

**Simple idea:** `middleware/` = Check/process the request as it moves through the application.

---

## 7. `validators/`

**Purpose:** Define Zod validation rules for incoming data.

Possible validators:
- `auth.validator.ts`
- `player.validator.ts`
- `team.validator.ts`
- `tournament.validator.ts`
- `tournamentEdition.validator.ts`
- `match.validator.ts`
- `achievement.validator.ts`
- `history.validator.ts`
- `gallery.validator.ts`

Validate:
- Request body
- Route parameters
- Query parameters
- Required fields
- Data types
- Enum/allowed values

Typical flow:

```text
Request
↓
Zod Validation
↓
Valid?
├── No → Validation Error
└── Yes
     ↓
Controller
```

**Simple idea:** `validators/` = Is the incoming data valid?

---

## 8. `utils/`

**Purpose:** Store small reusable helper functions that are not specific to one feature.

Possible examples:
- `asyncHandler.ts`
- `apiResponse.ts`
- `generateToken.ts`
- Other genuinely reusable helpers

Keep this folder small. Feature-specific logic should remain in services/controllers rather than being placed in `utils/`.

**Simple idea:** `utils/` = Reusable helper functions.

---

## 9. `app.ts`

**Purpose:** Create and configure the Express application.

Typical responsibilities:

```text
Create Express app
↓
Helmet
↓
CORS
↓
Rate limiting
↓
Body parsing
↓
Routes
↓
404 handler
↓
Global error handler
```

`app.ts` should configure the application but should not normally call `app.listen()`.

**Simple idea:** `app.ts` = Build/configure the Express application.

---

## 10. `server.ts`

**Purpose:** Start the application and initialize infrastructure.

Typical flow:

```text
Load environment
↓
Connect MongoDB
↓
Start Express server
↓
app.listen(...)
```

`server.ts` is the application entry point.

**Simple idea:** `server.ts` = Start the application.

---

# How Everything Connects

Main request flow:

```text
Client
↓
Route
↓
Middleware
↓
Controller
↓
Service
↓
Model
↓
MongoDB
```

Supporting parts:

```text
config/       → External/application configuration
validators/   → Input validation
utils/        → Reusable helpers
app.ts        → Assemble/configure Express
server.ts     → Start the application
```

---

# One-Line Memory Guide

```text
Config       = Connect
Models       = Data
Routes       = Where
Middleware   = Check
Validators   = Validate
Controllers  = Request/Response
Services     = Logic
Utils        = Helpers
app.ts       = Configure
server.ts    = Start
```

---

# Important Architecture Rule

Keep responsibilities separated.

For example:

**Do not put database/business logic directly inside routes.**

Prefer:

```text
Route
↓
Middleware
↓
Controller
↓
Service
↓
Model
```

This makes the backend easier to test, maintain, and extend as the project grows.
