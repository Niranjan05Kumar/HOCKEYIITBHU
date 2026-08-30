# IIT (BHU) Hockey Platform — MongoDB Collections

Planning-level database design. No Mongoose/JavaScript schema code yet.

## 1. `players`

**Purpose:** Store current and former IIT (BHU) Hockey player profiles.

| Field | Purpose | Required |
|---|---|---|
| `name` | Player's full name | Yes |
| `profilePhoto` | Cloudinary image URL/reference | No |
| `playingPosition` | Hockey playing position (`Forward`, `Defender`, `Midfielder`, `Goalkeeper`) | No |
| `status` | Current or former/alumni player | Yes |
| `playingYears` | Years represented IIT (BHU) Hockey | No |
| `jerseyNumber` | Jersey number | No |
| `leadershipRoles` | Captain, Vice-Captain, etc. | No |
| `achievements` | Related achievement references | No |
| `individualStatistics` | Available individual statistics | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

**Note:** Alumni are represented as former players; no separate alumni collection. When set, `playingPosition` must be one of `Forward`, `Defender`, `Midfielder`, or `Goalkeeper`.

## 2. `teams`

**Purpose:** Store year-wise IIT (BHU) Hockey team records.

| Field | Purpose | Required |
|---|---|---|
| `year` | Year/season represented by the team | Yes |
| `players` | References to players in the team | Yes |
| `captain` | Reference to captain | No |
| `viceCaptain` | Reference to vice-captain | No |
| `coach` | Coach information/reference | No |
| `teamPhoto` | Cloudinary image URL/reference | No |
| `achievements` | Related team achievements | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

**Note:** When creating a team, select existing player records instead of re-entering player information.

## 3. `tournaments`

**Purpose:** Store recurring tournament categories.

| Field | Purpose | Required |
|---|---|---|
| `name` | Tournament name | Yes |
| `type` | Tournament category/type | Yes |
| `description` | Short tournament description | No |
| `logo` | Tournament logo/image URL | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

Current categories:
- SPARDHA, IIT BHU
- Inter-IIT Sports Meet
- General Championship (GC)
- Sports Out Fests

## 4. `tournamentEditions`

**Purpose:** Store a specific occurrence/year of a tournament, e.g. SPARDHA 2025.

| Field | Purpose | Required |
|---|---|---|
| `tournament` | Reference to main tournament | Yes |
| `year` | Year of edition | Yes |
| `edition` | Edition name/label | Yes |
| `team` | Reference to participating IIT (BHU) team | Yes |
| `hostInstitute` | Host institute | No |
| `participatingTeams` | Participating teams/participation information | No |
| `finalPosition` | IIT (BHU) final position/ranking | No |
| `captain` | Captain, where applicable | No |
| `viceCaptain` | Vice-Captain, where applicable | No |
| `achievements` | Related achievement references | No |
| `awards` | Related distinctions/award references | No |
| `photos` | Related gallery item references | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## 5. `matches`

**Purpose:** Store individual matches played within a tournament edition.

| Field | Purpose | Required |
|---|---|---|
| `tournamentEdition` | Reference to tournament edition | Yes |
| `date` | Match date | No |
| `opponent` | Opponent team | Yes |
| `iitBhuScore` | IIT (BHU) score | No |
| `opponentScore` | Opponent score | No |
| `result` | Win, Loss, or Draw | No |
| `round` | Group, Quarter-Final, Semi-Final, Final, etc. | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

## 6. `achievements`

**Purpose:** Store team and individual achievements, honors, medals, championships, and awards.

| Field | Purpose | Required |
|---|---|---|
| `title` | Achievement/award name | Yes |
| `description` | Achievement details | No |
| `type` | Achievement type/category | Yes |
| `year` | Year of achievement | Yes |
| `tournament` | Related tournament/edition | No |
| `recipientType` | Team or Player | Yes |
| `recipient` | Reference to relevant team/player | Yes |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

Suggested types:
- Championship
- Medal
- Award
- Major Victory
- Individual Achievement

## 7. `historyEvents`

**Purpose:** Store significant historical events used in the IIT (BHU) Hockey timeline.

| Field | Purpose | Required |
|---|---|---|
| `year` | Year of event | Yes |
| `title` | Event/milestone title | Yes |
| `description` | Historical explanation | Yes |
| `category` | Type of historical event | Yes |
| `tournament` | Related tournament/edition | No |
| `achievement` | Related achievement | No |
| `photo` | Related Cloudinary image URL/reference | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

Suggested categories:
- Major Victory
- Championship
- Medal
- Milestone
- Memorable Performance

## 8. `galleryItems`

**Purpose:** Store photographs and archival media metadata.

| Field | Purpose | Required |
|---|---|---|
| `imageUrl` | Cloudinary image URL/reference | Yes |
| `year` | Year associated with media | No |
| `category` | Gallery category | Yes |
| `tournament` | Related tournament/edition | No |
| `eventName` | Match/event name | No |
| `caption` | Short caption | No |
| `description` | Additional context | No |
| `taggedPlayers` | References to players in media | No |
| `createdAt` | Record creation time | Yes |
| `updatedAt` | Last update time | Yes |

Suggested categories:
- SPARDHA
- Inter-IIT
- GC
- Out Fest
- Team Photos
- Match Photos
- Awards & Medal Celebrations
- Old/Archive Memories
- Other Memorable Moments

**Note:** Actual image files are stored in Cloudinary; MongoDB stores metadata/reference.

## 9. `admins`

**Purpose:** Store authorized administrators who manage platform content.

| Field | Purpose | Required |
|---|---|---|
| `name` | Admin name | Yes |
| `email` | Admin login email | Yes |
| `passwordHash` | Secure password hash | Yes |
| `role` | Admin permission level | Yes |
| `createdAt` | Account creation time | Yes |
| `updatedAt` | Last update time | Yes |

Current MVP role:
`admin`

## Current Collection List

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

## Modeling Decisions

- **Alumni:** no separate collection; former players use the player resource.
- **Coaches:** no separate collection at this stage; coach information is associated with a team.
- **Year:** no separate `years` collection; year/season is an attribute of relevant records.
- **Images:** stored in Cloudinary; MongoDB stores references and metadata.
- **Implementation:** actual Mongoose schemas, indexes, validation code, controllers, services, and middleware are defined later during development.
