# IIT (BHU) Hockey Platform — API Standards & Conventions

## Purpose
Common rules for all APIs to keep behavior consistent and predictable.

## API Versioning
Use:
`/api/v1`

Example:
`/api/v1/players`

## HTTP Methods

| Method | Purpose |
|---|---|
| GET | Read |
| POST | Create |
| PATCH | Partial update |
| DELETE | Delete |

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Successful read/update |
| 201 | Successfully created |
| 204 | Successfully deleted with no body |
| 400 | Invalid request |
| 401 | Authentication required/failed |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict/duplicate |
| 422 | Validation error |
| 500 | Unexpected server error |

## Success Response

Use a consistent response structure.

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

For lists, include pagination metadata where needed:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {}
  }
}
```

Example error codes:
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_SERVER_ERROR`

Do not expose sensitive technical details.

## Pagination
Use:
`?page=1&limit=20`

Use pagination for potentially large collections such as gallery, matches, and player lists.

## Filtering
Use query parameters.

Examples:
- `?year=2025`
- `?status=current`
- `?category=SPARDHA`
- `?tournament=<id>`

Example:
`/api/v1/gallery?year=2025&category=SPARDHA`

## Sorting
Use:
`?sort=year&order=desc`

Allowed order values:
- `asc`
- `desc`

Only allow documented sortable fields.

## Search
Global search is not part of the current MVP. Do not design a site-wide search API yet.

Resource-specific filtering/search can be added later if required.

## Authentication
Public archive browsing is generally read-only.

Admin write operations require authentication.

Conceptually:
- Public: GET where appropriate
- Admin: GET + POST + PATCH + DELETE

The exact authentication mechanism will be selected during implementation.

## Authorization
Authentication = who the user is.

Authorization = what the user is allowed to do.

Authorization must be enforced server-side; hiding admin buttons is not sufficient.

## Validation
Validate every create/update request on the backend.

Validate:
- Required fields
- Data types
- Allowed values
- Relationships/references
- Duplicate/conflicting records
- Valid dates/years
- File metadata when applicable

## Historical Data Rules
This platform is a historical archive, so incomplete records are expected.

Never invent historical information.

Examples that may be unavailable:
- Match scores
- Individual statistics
- Jersey numbers
- Coach
- Captain/Vice-Captain
- Host institute
- Participating teams
- Awards
- Photographs
- Captions/descriptions

Distinguish:
- Missing historical information
- Invalid submitted data
- System/database failure

## Resource Naming
Prefer:
- `/api/v1/players`
- `/api/v1/teams`
- `/api/v1/tournament-editions`

Avoid action-based paths such as:
- `/api/v1/getPlayers`
- `/api/v1/createTeam`

## IDs & Relationships
Use:
`/players/:id`

Use references between related resources where appropriate.

Avoid unnecessary duplication of complete resource data.

## Public/Admin Separation
Use the same domain resources where possible.

Example:
- `GET /api/v1/teams` — public
- `POST /api/v1/teams` — authorized admin

Access control should distinguish them rather than creating duplicate admin resource families.

## Media Handling
Actual image files should be stored in a file/image-storage service.

API/database should normally manage:
- Image URL/reference
- Year
- Category
- Tournament
- Event
- Caption
- Description
- Tags
- Publication status

## Safe Operations
Prevent accidental duplicates with appropriate validation and `409 Conflict` where needed.

Destructive operations require confirmation in the Admin UI and authorization in the backend.

## Security
- Never return passwords/password hashes
- Keep secrets out of source code
- Validate incoming data
- Enforce authentication/authorization server-side
- Use safe public error messages
- Use HTTPS in production

## Checklist
- [ ] Versioning
- [ ] Resource naming
- [ ] HTTP methods
- [ ] Status codes
- [ ] Success response
- [ ] Error response
- [ ] Pagination
- [ ] Filtering
- [ ] Sorting
- [ ] Authentication
- [ ] Authorization
- [ ] Backend validation
- [ ] Historical missing-data behavior
- [ ] Media handling
- [ ] Security

## Scope Boundary
This is a planning reference. It does not define Mongoose schemas, controller code, middleware code, exact authentication libraries, exact storage provider, or deployment configuration.
