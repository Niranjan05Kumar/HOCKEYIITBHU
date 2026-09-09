# IIT (BHU) Hockey Platform — Final MongoDB Collections Design

## Purpose

This document is the final planning-level design for the MongoDB collections of the IIT (BHU) Hockey Digital Archive & Platform.

It consolidates:

- Collection names
- Collection purposes
- Fields
- Required/optional status
- Referenced vs. embedded data
- Cross-collection relationships
- Index recommendations
- Cloudinary media strategy
- Current modeling decisions

This document does **not** contain Mongoose/JavaScript implementation code.

---

# 1. `players`

## Purpose

Store current and former IIT (BHU) Hockey player profiles.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `name` | Player's full name | Yes |
| `profilePhoto` | Cloudinary image URL/reference | No |
| `playingPosition` | Hockey playing position (`Forward`, `Defender`, `Midfielder`, `Goalkeeper`) | No |
| `status` | Current player or former player/alumni | Yes |
| `playingYears` | Years represented IIT (BHU) Hockey | No |
| `jerseyNumber` | Jersey number, where available | No |
| `leadershipRoles` | Captain, Vice-Captain, or other leadership roles | No |
| `achievements` | References to related achievement records | No |
| `individualStatistics` | Available individual statistics | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Storage Decisions

### Referenced
- `achievements` → references `achievements`

### Embedded
- `leadershipRoles`
- `individualStatistics` where the information is small and specific to the player

### Notes

- Alumni do not have a separate collection.
- Former players are represented through the player's `status`.
- `playingPosition` is optional and, when present, must be one of: `Forward`, `Defender`, `Midfielder`, `Goalkeeper`.
- Historical information is optional when unavailable.
- A player can belong to multiple yearly teams.

---

# 2. `teams`

## Purpose

Store year-wise IIT (BHU) Hockey team records.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `year` | Year/season represented by the team | Yes |
| `players` | References to players belonging to the team | Yes |
| `captain` | Reference to the captain | No |
| `viceCaptain` | Reference to the vice-captain | No |
| `coach` | Small team-specific coach information | No |
| `teamPhoto` | Cloudinary image URL/reference | No |
| `achievements` | References to team achievements | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Storage Decisions

### Referenced
- `players` → `players`
- `captain` → `players`
- `viceCaptain` → `players`
- `achievements` → `achievements`

### Embedded
- `coach` as small team-specific information

### Notes

When creating a team, select existing players rather than re-entering their complete information.

---

# 3. `tournaments`

## Purpose

Store recurring tournament categories/events.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `name` | Tournament name | Yes |
| `type` | Tournament category/type | Yes |
| `description` | Short tournament description | No |
| `logo` | Tournament logo/image URL | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Current Categories

- SPARDHA, IIT BHU
- Inter-IIT Sports Meet
- General Championship (GC)
- Sports Out Fests

## Storage Decisions

No child records are embedded in the tournament document.

Tournament editions are stored separately and reference the tournament.

---

# 4. `tournamentEditions`

## Purpose

Store a specific occurrence/year of a tournament.

Example:

`SPARDHA` → `SPARDHA 2025`

## Fields

| Field | Purpose | Required |
|---|---|---|
| `tournament` | Reference to the main tournament | Yes |
| `year` | Year of the edition | Yes |
| `edition` | Edition name/label | Yes |
| `team` | Reference to the participating IIT (BHU) team | Yes |
| `hostInstitute` | Hosting institute, where available | No |
| `participatingTeams` | Participating team information | No |
| `finalPosition` | IIT (BHU) final position/ranking | No |
| `captain` | Captain for this edition, where applicable | No |
| `viceCaptain` | Vice-Captain for this edition, where applicable | No |
| `achievements` | References to related achievements | No |
| `awards` | References to individual/tournament distinctions | No |
| `photos` | References to related gallery items | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Storage Decisions

### Referenced
- `tournament` → `tournaments`
- `team` → `teams`
- `captain` → `players`
- `viceCaptain` → `players`
- `achievements` → `achievements`
- `awards` → `achievements`
- `photos` → `galleryItems`

### Embedded
- `participatingTeams` when this is small, self-contained participation metadata

### Notes

Not every tournament type has the same available fields. Optional information should remain optional.

---

# 5. `matches`

## Purpose

Store individual IIT (BHU) Hockey matches played within a tournament edition.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `tournamentEdition` | Reference to the tournament edition | Yes |
| `date` | Match date | No |
| `opponent` | Opponent team | Yes |
| `iitBhuScore` | IIT (BHU) score | No |
| `opponentScore` | Opponent score | No |
| `result` | Win, Loss, or Draw | No |
| `round` | Group, Quarter-Final, Semi-Final, Final, etc. | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Storage Decisions

### Referenced
- `tournamentEdition` → `tournamentEditions`

### Embedded
- Score values and other match-specific scalar values remain inside the match document.

### Notes

Scores, dates, results, and round/stage information may be unavailable for older records.

---

# 6. `achievements`

## Purpose

Store team and individual achievements, honors, medals, championships, and awards.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `title` | Achievement or award name | Yes |
| `description` | Achievement details | No |
| `type` | Achievement type/category | Yes |
| `year` | Year of achievement | Yes |
| `tournament` | Related tournament/edition reference | No |
| `recipientType` | Team or Player | Yes |
| `recipient` | Reference to the relevant team/player | Yes |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Suggested Types

- Championship
- Medal
- Award
- Major Victory
- Individual Achievement

## Storage Decisions

### Referenced
- `tournament` → tournament/edition as finalized by implementation
- `recipient` → `players` or `teams`

### Embedded
- Title, description, type, year, and recipient type are values belonging to the achievement record.

### Notes

This collection can represent:
- Team championships
- Team medals
- Player of the Tournament
- Top Scorer
- Best Attacker
- Best Midfielder
- Best Defender
- Other individual/team honors

---

# 7. `historyEvents`

## Purpose

Store significant events used in the IIT (BHU) Hockey historical timeline.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `year` | Year of the historical event | Yes |
| `title` | Event/milestone title | Yes |
| `description` | Historical explanation | Yes |
| `category` | Type of historical event | Yes |
| `tournament` | Related tournament/edition | No |
| `achievement` | Related achievement | No |
| `photo` | Related ImageKit image URL/reference | No |
| `photoFileId` | ImageKit file ID for photo lifecycle management | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Suggested Categories

- Major Victory
- Championship
- Medal
- Milestone
- Memorable Performance

## Storage Decisions

### Referenced
- `tournament` → tournament/edition
- `achievement` → `achievements`

### Embedded
- `year`
- `title`
- `description`
- `category`

### Notes

History represents the chronological story and significant milestones. It should not duplicate the detailed tournament record.

---

# 8. `galleryItems`

## Purpose

Store photographs and archival media metadata.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `imageUrl` | Cloudinary image URL/reference | Yes |
| `year` | Year associated with the media | No |
| `category` | Gallery category | Yes |
| `tournament` | Related tournament/edition | No |
| `eventName` | Match/event name | No |
| `caption` | Short caption | No |
| `description` | Additional context | No |
| `taggedPlayers` | References to players appearing in the media | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Suggested Categories

- SPARDHA
- Inter-IIT
- GC
- Out Fest
- Team Photos
- Match Photos
- Awards & Medal Celebrations
- Old/Archive Memories
- Other Memorable Moments

## Storage Decisions

### Referenced
- `tournament` → tournament/edition
- `taggedPlayers` → `players`

### Embedded
- `year`
- `category`
- `eventName`
- `caption`
- `description`

### Media Storage

Actual image files are stored in Cloudinary.

MongoDB stores:
- Cloudinary image URL/reference
- Media metadata
- Relationships

---

# 9. `admins`

## Purpose

Store authorized administrators who manage the platform.

## Fields

| Field | Purpose | Required |
|---|---|---|
| `name` | Admin name | Yes |
| `email` | Admin login email | Yes |
| `passwordHash` | Secure password hash | Yes |
| `role` | Admin permission level | Yes |
| `createdAt` | Account creation time | Yes |
| `updatedAt` | Last update time | Yes |

## Storage Decisions

All fields are values belonging to the admin document.

`email` should be uniquely indexed.

## Current MVP Role

`admin`

Additional roles can be introduced later if requirements require them.

---

# Cross-Collection Relationship Model

```text
PLAYER
  ↕
TEAM
  ↓
TOURNAMENT EDITION
  ├── MATCH
  ├── ACHIEVEMENT
  └── GALLERY ITEM

TOURNAMENT
  ↓
TOURNAMENT EDITION

ACHIEVEMENT
  ├── PLAYER
  └── TEAM

HISTORY EVENT
  ├── TOURNAMENT / EDITION
  ├── ACHIEVEMENT
  └── GALLERY ITEM / MEDIA

GALLERY ITEM
  ├── TOURNAMENT / EDITION
  └── PLAYERS

ADMIN
  ↓
Manages platform content
```

---

# Embedded vs Referenced — Final Summary

## Referenced

- `Team → Players`
- `Team → Captain`
- `Team → Vice-Captain`
- `Team → Achievements`
- `Tournament Edition → Tournament`
- `Tournament Edition → Team`
- `Tournament Edition → Captain/Vice-Captain`
- `Tournament Edition → Achievements/Awards`
- `Tournament Edition → Gallery`
- `Match → Tournament Edition`
- `Achievement → Player/Team`
- `History Event → Tournament/Achievement`
- `Gallery Item → Tournament`
- `Gallery Item → Players`

## Embedded

- Small team-specific coach information
- Small self-contained participation metadata
- Match scalar values such as scores/result/round/date
- Simple player-specific sub-information such as leadership roles/statistics
- Simple history-event values
- Gallery metadata

---

# Index Recommendations

| Collection | Index |
|---|---|
| `players` | `status` |
| `players` | `playingPosition` |
| `players` | `playingYears` |
| `teams` | `year` |
| `tournaments` | `name` |
| `tournamentEditions` | `tournament + year` |
| `tournamentEditions` | `year` |
| `matches` | `tournamentEdition` |
| `achievements` | `year` |
| `achievements` | `recipientType + recipient` |
| `historyEvents` | `year` |
| `historyEvents` | `category` |
| `galleryItems` | `year + category` |
| `galleryItems` | `tournament` |
| `galleryItems` | `taggedPlayers` |
| `admins` | `email` — unique |

Because the current archive is relatively small, keep indexes focused on actual query patterns rather than indexing every field.

---

# Final Modeling Decisions

## Alumni

No separate `alumni` collection.

```text
players
├── current
└── former → alumni
```

## Coaches

No separate `coaches` collection at this stage.

Coach information is associated with the relevant team.

## Year

No separate `years` collection.

Year/season is stored on relevant records.

## Images

Actual image files → Cloudinary.

Image URL/reference + metadata → MongoDB.

## Data Availability

Historical records may be incomplete.

Do not fabricate:
- Scores
- Statistics
- Jersey numbers
- Coaches
- Captain/Vice-Captain
- Host institute
- Awards
- Photos
- Captions

Fields should remain optional where the historical record is unavailable.

---

# Implementation Boundary

This document is the final **planning-level MongoDB data model**.

It does not yet contain:
- Mongoose schema code
- JavaScript/TypeScript models
- Controllers
- Services
- Middleware
- API implementation
- Cloudinary implementation
- Production database migration scripts

Those belong to the Development phase.
