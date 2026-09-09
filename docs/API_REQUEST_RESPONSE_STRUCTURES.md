# IIT (BHU) Hockey Platform — API Request & Response Structures

## Purpose
Planning-level reference for API request bodies, success responses, error responses, pagination, partial updates, and historical-data handling.

## 1. Common Success Responses

### Single resource
```json
{
  "success": true,
  "data": {
    "id": "..."
  },
  "message": "Resource fetched successfully"
}
```

### Collection / list
```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "message": "Resources fetched successfully"
}
```

## 2. Common Error Response

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

Common error codes:
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_SERVER_ERROR`

## 3. Authentication

Base: `/api/v1/auth`

### Login
`POST /api/v1/auth/login`

Request:
```json
{
  "email": "admin@example.com",
  "password": "********"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin",
      "email": "admin@example.com"
    }
  },
  "message": "Login successful"
}
```

### Current Admin
`GET /api/v1/auth/me`

### Logout
`POST /api/v1/auth/logout`

## 4. Players

Base: `/api/v1/players`

### Create
`POST /api/v1/players`

Example:
```json
{
  "name": "...",
  "profilePhoto": "...",
  "playingPosition": "Midfielder",
  "status": "former",
  "playingYears": [2022, 2023, 2024]
}
```

`playingPosition` allowed values: `Forward`, `Defender`, `Midfielder`, `Goalkeeper`.

### Read
- `GET /api/v1/players`
- `GET /api/v1/players/:id`

### Update
`PATCH /api/v1/players/:id`

### Delete
`DELETE /api/v1/players/:id`

Possible filters:
- `status=current|former`
- `position=Forward|Defender|Midfielder|Goalkeeper`
- `year=<year>`
- `page=<number>`
- `limit=<number>`

## 5. Teams

Base: `/api/v1/teams`

### Create
`POST /api/v1/teams`

Example:
```json
{
  "year": 2025,
  "players": ["playerId1", "playerId2"],
  "captain": "playerId1",
  "viceCaptain": "playerId2",
  "coach": "coachId",
  "teamPhoto": "..."
}
```

### Read
- `GET /api/v1/teams`
- `GET /api/v1/teams/:id`

Possible filter: `?year=2025`

### Update/Delete
- `PATCH /api/v1/teams/:id`
- `DELETE /api/v1/teams/:id`

## 6. Tournaments

Base: `/api/v1/tournaments`

A tournament represents a recurring event/category.

### Create
`POST /api/v1/tournaments`

Example:
```json
{
  "name": "SPARDHA",
  "type": "institute_sports_fest"
}
```

### Read
- `GET /api/v1/tournaments`
- `GET /api/v1/tournaments/:id`

### Update/Delete
- `PATCH /api/v1/tournaments/:id`
- `DELETE /api/v1/tournaments/:id`

## 7. Tournament Editions

Base: `/api/v1/tournament-editions`

A tournament edition represents a specific occurrence/year.

### Create
`POST /api/v1/tournament-editions`

Example:
```json
{
  "tournamentId": "...",
  "year": 2025,
  "edition": "SPARDHA 2025",
  "teamId": "...",
  "finalPosition": 2
}
```

Other information such as host institute, participating teams, captain/vice-captain, and awards is included only where applicable/available.

### Read
- `GET /api/v1/tournament-editions`
- `GET /api/v1/tournament-editions/:id`

Filters:
- `?tournament=<id>`
- `?year=2025`

### Update/Delete
- `PATCH /api/v1/tournament-editions/:id`
- `DELETE /api/v1/tournament-editions/:id`

## 8. Matches

Base: `/api/v1/matches`

### Create
`POST /api/v1/matches`

Example:
```json
{
  "tournamentEditionId": "...",
  "date": "2025-10-10",
  "opponent": "IIT Delhi",
  "iitBhuScore": 3,
  "opponentScore": 2,
  "result": "win",
  "round": "Quarter Final"
}
```

### Read
- `GET /api/v1/matches`
- `GET /api/v1/matches/:id`

Filter:
`?tournamentEditionId=<id>`

### Update/Delete
- `PATCH /api/v1/matches/:id`
- `DELETE /api/v1/matches/:id`

## 9. Achievements

Base: `/api/v1/achievements`

### Create
`POST /api/v1/achievements`

Example:
```json
{
  "title": "Player of the Tournament",
  "description": "...",
  "type": "award",
  "year": 2025,
  "tournamentId": "...",
  "recipientType": "player",
  "recipientId": "..."
}
```

### Read
- `GET /api/v1/achievements`
- `GET /api/v1/achievements/:id`

Possible filters:
- `?year=2025`
- `?type=award`
- `?recipientType=player`

### Update/Delete
- `PATCH /api/v1/achievements/:id`
- `DELETE /api/v1/achievements/:id`

## 10. History

Base: `/api/v1/history`

### Create
`POST /api/v1/history`

Supports standard JSON or `multipart/form-data` with optional `photoFile` image upload.

Example JSON:
```json
{
  "year": 2022,
  "title": "Historic Performance",
  "description": "...",
  "category": "Memorable Performance",
  "tournament": "6aa04204f7de3bd2a43aa34a",
  "photo": "https://ik.imagekit.io/...",
  "photoFileId": "6aa04207ead997d09ac7f5af"
}
```

Optional historical information is included only when available.

### Read
- `GET /api/v1/history`
- `GET /api/v1/history/:id`

Response exposes `photo` and `photoFileId` when present.

Filters:
- `?year=2022`
- `?category=Medal`

### Update/Delete
- `PATCH /api/v1/history/:id` (supports JSON and `multipart/form-data` with `photoFile`)
- `DELETE /api/v1/history/:id` (automatically triggers ImageKit cleanup if `photoFileId` is present)

## 11. Gallery

Base: `/api/v1/gallery`

### Create metadata record
`POST /api/v1/gallery`

Example:
```json
{
  "imageUrl": "...",
  "year": 2025,
  "category": "SPARDHA",
  "tournamentId": "...",
  "eventName": "Final",
  "caption": "...",
  "description": "...",
  "taggedPlayers": ["playerId1", "playerId2"]
}
```

### Read
- `GET /api/v1/gallery`
- `GET /api/v1/gallery/:id`

Filters:
- `?year=2025`
- `?category=SPARDHA`
- `?tournament=<id>`
- `?player=<id>`

### Update/Delete
- `PATCH /api/v1/gallery/:id`
- `DELETE /api/v1/gallery/:id`

Actual image uploading will be handled separately from normal JSON metadata operations.

## 12. Partial Update Rule

Because updates use `PATCH`, send only the fields that need to change.

Example:
```json
{
  "captain": "newPlayerId"
}
```

## 13. Missing Historical Data

Historical records may be incomplete.

Do not force unavailable fields into requests and never fabricate:
- Scores
- Player statistics
- Jersey numbers
- Photos
- Awards
- Other historical details

The API should distinguish unavailable historical information from invalid submitted data and system failures.

## 14. API Structure Summary

```text
/api/v1
├── auth
├── players
├── teams
├── tournaments
├── tournament-editions
├── matches
├── achievements
├── history
└── gallery
```

## 15. Planning Boundary

This document does not yet finalize:
- Mongoose schemas
- Database indexes
- Controllers/services
- Middleware implementation
- Exact authentication mechanism
- Exact storage provider
