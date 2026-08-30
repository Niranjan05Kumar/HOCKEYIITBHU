# IIT (BHU) Hockey Platform — MongoDB Collections

## Purpose

This document records the current conceptual MongoDB collection list for the IIT (BHU) Hockey Digital Archive & Platform.

This is a planning-level document. It does not define implementation schemas yet.

---

## Core Collections

### 1. `players`

**Purpose:** Store current and former IIT (BHU) Hockey player profiles.

Includes:
- Current players
- Former players / alumni
- Player identity and profile information
- Playing position (`Forward`, `Defender`, `Midfielder`, `Goalkeeper`)
- Playing years
- Leadership roles
- Achievements
- Individual statistics where available

**Important:** Alumni are not stored in a separate collection. Former players are represented through the player record.

---

### 2. `teams`

**Purpose:** Store year-wise IIT (BHU) Hockey team records.

Includes:
- Year/season
- Players associated with the team
- Captain
- Vice-Captain
- Coach
- Team photograph
- Team achievements

---

### 3. `tournaments`

**Purpose:** Store the main recurring tournament categories.

Current categories:
- SPARDHA
- Inter-IIT Sports Meet
- General Championship (GC)
- Sports Out Fests

A tournament represents the recurring event/category, not a specific year.

---

### 4. `tournamentEditions`

**Purpose:** Store a specific occurrence/year of a tournament.

Example:

`SPARDHA` → `SPARDHA 2025`

Includes:
- Tournament reference
- Year
- Edition
- IIT (BHU) participating team
- Host institute where available
- Participating teams where available
- Final position/ranking where available
- Captain/Vice-Captain where applicable
- Related achievements
- Awards/distinctions
- Related gallery items

---

### 5. `matches`

**Purpose:** Store individual IIT (BHU) Hockey matches played within a tournament edition.

Includes:
- Tournament edition reference
- Date where available
- Opponent
- IIT (BHU) score where available
- Opponent score where available
- Result where available
- Round/stage where available

Possible results:
- Win
- Loss
- Draw

---

### 6. `achievements`

**Purpose:** Store team and individual achievements, honors, medals, championships, and awards.

Includes:
- Title
- Description where available
- Type
- Year
- Related tournament/edition where applicable
- Recipient type
- Recipient reference

Recipient can be:
- Team
- Player

---

### 7. `historyEvents`

**Purpose:** Store significant historical events used in the IIT (BHU) Hockey timeline.

Includes:
- Year
- Event/milestone title
- Description
- Category
- Related tournament/edition where applicable
- Related achievement where applicable
- Related photo/media where applicable

Suggested categories:
- Major Victory
- Championship
- Medal
- Milestone
- Memorable Performance

---

### 8. `galleryItems`

**Purpose:** Store photographs and archival media metadata.

Includes:
- Cloudinary image URL/reference
- Year where available
- Category
- Related tournament/edition where applicable
- Event name where available
- Caption where available
- Description where available
- Tagged player references where available

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

**Important:** Actual image files are intended to be stored in Cloudinary; MongoDB stores the media metadata and Cloudinary reference.

---

### 9. `admins`

**Purpose:** Store authorized administrators who manage the platform.

Includes:
- Name
- Email
- Password hash
- Role
- Created/updated timestamps

For the current MVP, a simple `admin` role is sufficient.

---

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

### Alumni

No separate `alumni` collection.

```text
players
├── current players
└── former players / alumni
```

### Coaches

No separate `coaches` collection at this stage.

Coach information is associated with the relevant team. A separate coach entity can be introduced later if the requirements demonstrate a need for reusable coach profiles.

### Year

No separate `years` collection.

Year/season is treated as an attribute of relevant records such as teams, tournament editions, achievements, history events, and gallery items.

### Implementation Boundary

This document intentionally does not define:
- Mongoose schemas
- Field data types in code
- Validation code
- Index definitions
- Embedded-vs-referenced implementation
- Controllers/services
- API code

Those decisions are handled in the later database design steps.
