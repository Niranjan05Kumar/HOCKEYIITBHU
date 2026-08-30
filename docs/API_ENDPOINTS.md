# IIT (BHU) Hockey Platform — API Endpoints Guide

## Purpose
Planning-level reference for API resources, endpoint paths, methods, purposes, and access.

## Base
`/api/v1`

## Resources
- Auth
- Players
- Teams
- Tournaments
- Tournament Editions
- Matches
- Achievements
- History
- Gallery / Media

**Alumni:** use the `players` resource with current/former status; do not create a separate alumni API.

## Auth
Base: `/api/v1/auth`

- `POST /login` — authenticate admin
- `POST /logout` — end admin session
- `GET /me` — current authenticated admin

## Players
Base: `/api/v1/players`

Public:
- `GET /players`
- `GET /players/:id`

Possible filters:
- `status=current|former`
- `position=Forward|Defender|Midfielder|Goalkeeper`
- `year=<year>`
- `page=<number>`
- `limit=<number>`

Admin:
- `POST /players`
- `PATCH /players/:id`
- `DELETE /players/:id`

## Teams
Base: `/api/v1/teams`

Public:
- `GET /teams`
- `GET /teams/:id`

Possible filter:
- `year=<year>`

Admin:
- `POST /teams`
- `PATCH /teams/:id`
- `DELETE /teams/:id`

## Tournaments
Base: `/api/v1/tournaments`

Public:
- `GET /tournaments`
- `GET /tournaments/:id`

Admin:
- `POST /tournaments`
- `PATCH /tournaments/:id`
- `DELETE /tournaments/:id`

Represents recurring tournament categories such as SPARDHA, Inter-IIT, GC, and Out Fests.

## Tournament Editions
Base: `/api/v1/tournament-editions`

A tournament is the recurring event; an edition is a specific year/occurrence.

Public:
- `GET /tournament-editions`
- `GET /tournament-editions/:id`

Filters:
- `tournament=<id>`
- `year=<year>`

Admin:
- `POST /tournament-editions`
- `PATCH /tournament-editions/:id`
- `DELETE /tournament-editions/:id`

## Matches
Base: `/api/v1/matches`

Public:
- `GET /matches`
- `GET /matches/:id`

Filter:
- `tournamentEditionId=<id>`

Admin:
- `POST /matches`
- `PATCH /matches/:id`
- `DELETE /matches/:id`

Match data can include date, opponent, stage/round, IIT (BHU) score, opponent score, and Win/Loss/Draw result.

## Achievements
Base: `/api/v1/achievements`

Public:
- `GET /achievements`
- `GET /achievements/:id`

Possible filters:
- `year=<year>`
- `type=<type>`
- `recipientType=player|team`

Admin:
- `POST /achievements`
- `PATCH /achievements/:id`
- `DELETE /achievements/:id`

## History
Base: `/api/v1/history`

Public:
- `GET /history`
- `GET /history/:id`

Possible filters:
- `year=<year>`
- `category=<category>`

Admin:
- `POST /history`
- `PATCH /history/:id`
- `DELETE /history/:id`

## Gallery / Media
Base: `/api/v1/gallery`

Public:
- `GET /gallery`
- `GET /gallery/:id`

Possible filters:
- `year=<year>`
- `category=<category>`
- `tournament=<id>`
- `player=<id>`

Admin:
- `POST /gallery`
- `PATCH /gallery/:id`
- `DELETE /gallery/:id`

Actual image upload may use a separate storage/upload mechanism.

## Access
Public users generally use read endpoints.

Admin users use read and protected write operations:
- GET
- POST
- PATCH
- DELETE

Admin write operations must require authentication and authorization.

## Rules
1. Use plural resource names.
2. Use `:id` for a specific resource.
3. Use query parameters for filters, sorting, and pagination.
4. Do not create duplicate endpoints just because the UI has a tab.
5. Prefer filtering an existing resource.
6. Keep public reads and admin writes protected appropriately.

## Not covered yet
- Exact request/response bodies for every endpoint
- Mongoose schemas
- Database indexes
- Controller/service code
- Final authentication implementation
- Final file-storage provider
