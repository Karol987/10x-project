# Creators Integration Flow Diagram

## Overview

This document visualizes the flow of data when users search for and add creators to their favorites.

## Flow Diagram

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 1. Search for "Nolan"
       │
       ▼
┌─────────────────────────────────────┐
│  GET /api/vod/search-creators?q=Nolan │
└──────┬──────────────────────────────┘
       │
       │ 2. Query TMDb API
       │
       ▼
┌─────────────────────┐
│    TMDb API         │
│  (External Service) │
└──────┬──────────────┘
       │
       │ 3. Return results
       │    [{ id: "tmdb-525", name: "Christopher Nolan", ... }]
       │
       ▼
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 4. User selects creator
       │    POST /api/me/creators
       │    Body: { id: "tmdb-525", name: "Christopher Nolan", ... }
       │
       ▼
┌────────────────────────────────────────────────┐
│  POST /api/me/creators                         │
│  ┌──────────────────────────────────────────┐ │
│  │ 1. Validate request body                 │ │
│  │    - Try AddUserCreatorFromExternalApi   │ │
│  │    - Fall back to AddUserCreator (UUID)  │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 2. Extract TMDb ID                       │ │
│  │    "tmdb-525" → "525"                    │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 3. Upsert into creators table            │ │
│  │    ON CONFLICT (external_api_id, role)   │ │
│  │    DO UPDATE SET last_synced_at = now()  │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 4. Get database UUID                     │ │
│  │    "550e8400-e29b-41d4-a716-44665544000" │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 5. Insert into user_creators             │ │
│  │    (user_id, creator_id)                 │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 6. Return creator with database UUID     │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
       │
       │ 7. Response: { id: "550e8400-...", name: "Christopher Nolan", ... }
       │
       ▼
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 8. Later: Search database
       │    GET /api/creators?q=Nolan
       │
       ▼
┌─────────────────────────────────┐
│  GET /api/creators?q=Nolan      │
│  ┌───────────────────────────┐  │
│  │ 1. Query creators table   │  │
│  │    WHERE name ILIKE '%Nolan%' │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 2. Return results         │  │
│  │    [{ id: "550e8400-...", │  │
│  │       name: "Christopher  │  │
│  │       Nolan", ... }]      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
       │
       │ 9. Response: { data: [...], next_cursor: null }
       │
       ▼
┌─────────────┐
│   Frontend  │
└─────────────┘
```

## Database State Changes

### Before Adding Creator

```
┌─────────────────────┐
│  creators (empty)   │
└─────────────────────┘

┌─────────────────────┐
│  user_creators      │
│  (empty)            │
└─────────────────────┘
```

### After Adding Creator

```
┌──────────────────────────────────────────────────────────────┐
│  creators                                                     │
├──────────────┬──────────┬────────────────┬──────────┬────────┤
│ id           │ ext_id   │ name           │ role     │ avatar │
├──────────────┼──────────┼────────────────┼──────────┼────────┤
│ 550e8400-... │ 525      │ Christopher N. │ director │ https..│
└──────────────┴──────────┴────────────────┴──────────┴────────┘

┌──────────────────────────────────────────┐
│  user_creators                           │
├──────────────┬───────────────────────────┤
│ user_id      │ creator_id                │
├──────────────┼───────────────────────────┤
│ 450e8400-... │ 550e8400-...              │
└──────────────┴───────────────────────────┘
```

### After Second User Adds Same Creator

```
┌──────────────────────────────────────────────────────────────┐
│  creators (no change - same record)                          │
├──────────────┬──────────┬────────────────┬──────────┬────────┤
│ id           │ ext_id   │ name           │ role     │ avatar │
├──────────────┼──────────┼────────────────┼──────────┼────────┤
│ 550e8400-... │ 525      │ Christopher N. │ director │ https..│
└──────────────┴──────────┴────────────────┴──────────┴────────┘

┌──────────────────────────────────────────┐
│  user_creators (new row for user 2)     │
├──────────────┬───────────────────────────┤
│ user_id      │ creator_id                │
├──────────────┼───────────────────────────┤
│ 450e8400-... │ 550e8400-... (user 1)     │
│ 460e8400-... │ 550e8400-... (user 2)     │
└──────────────┴───────────────────────────┘
```

## ID Format Transformation

### External API Format
```
"tmdb-525"
```
- Used by VOD service
- Returned from `/api/vod/search-creators`
- Sent to `/api/me/creators` POST

### Database Format
```
"550e8400-e29b-41d4-a716-446655440000"
```
- UUID v4 format
- Stored in `creators.id`
- Returned from `/api/me/creators` POST
- Used in `/api/creators` GET
- Used in `/api/me/creators` GET

### Transformation Logic
```typescript
// External → Database (storage)
const externalId = "tmdb-525";
const dbId = externalId.replace("tmdb-", ""); // "525"
// Store in creators.external_api_id

// Database → External (reconstruction)
const dbExternalId = "525";
const externalId = `tmdb-${dbExternalId}`; // "tmdb-525"
```

## Error Handling Flow

```
POST /api/me/creators
       │
       ├─► Validate body
       │   ├─► Valid external API format → Continue
       │   ├─► Valid legacy format (UUID) → Continue
       │   └─► Invalid → 400 Bad Request
       │
       ├─► Upsert creator
       │   ├─► Success → Continue
       │   └─► Database error → 500 Internal Server Error
       │
       ├─► Check if already favorite
       │   ├─► Not favorite → Continue
       │   └─► Already favorite → 409 Conflict
       │
       ├─► Insert into user_creators
       │   ├─► Success → 201 Created
       │   ├─► Duplicate (race condition) → 409 Conflict
       │   └─► Database error → 500 Internal Server Error
       │
       └─► Return creator with database UUID
```

## Data Flow Summary

1. **Search Phase:**
   - Frontend → VOD API → TMDb → Frontend
   - Data format: External (`tmdb-{id}`)

2. **Add to Favorites Phase:**
   - Frontend → POST /api/me/creators → Database
   - Transform: External (`tmdb-{id}`) → Database (UUID)
   - Upsert: Prevent duplicates
   - Link: Create user-creator relationship

3. **Display Phase:**
   - Frontend → GET /api/creators → Database
   - Data format: Database (UUID)
   - Source: Local cache (fast)

## Key Benefits

1. **Automatic Cache Population**
   - No manual seeding
   - Grows with user activity

2. **Deduplication**
   - Multiple users → Single creator record
   - Efficient storage

3. **Fast Searches**
   - Database queries faster than API calls
   - Reduced external API usage

4. **Data Consistency**
   - Single source of truth per creator
   - Synchronized updates via `last_synced_at`

## Implementation Files

```
src/
├── lib/
│   ├── services/
│   │   └── creators.service.ts        # Business logic
│   └── schemas/
│       └── creators.schema.ts         # Validation
├── pages/
│   └── api/
│       ├── creators/
│       │   └── index.ts               # Public search (database)
│       ├── me/
│       │   └── creators/
│       │       └── index.ts           # User favorites (add/list)
│       └── vod/
│           └── search-creators.ts     # External API search
└── types.ts                           # Shared types
```

## Testing Flow

```
1. Search External API
   GET /api/vod/search-creators?q=Nolan
   ✓ Returns results from TMDb

2. Add to Favorites
   POST /api/me/creators
   Body: { id: "tmdb-525", name: "Christopher Nolan", ... }
   ✓ Returns 201 Created
   ✓ Creator in database
   ✓ User-creator link created

3. Search Database
   GET /api/creators?q=Nolan
   ✓ Returns results from database
   ✓ Same creator appears

4. Verify Deduplication
   POST /api/me/creators (same creator)
   ✓ Returns 409 Conflict
   ✓ No duplicate in database

5. Get User Favorites
   GET /api/me/creators
   ✓ Returns user's favorites
   ✓ Includes creator details
```
