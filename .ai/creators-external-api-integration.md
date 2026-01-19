# Creators External API Integration - Implementation Summary

## Problem Statement

The `/api/creators` endpoint was returning empty results (`{"data":[],"next_cursor":null}`) while `/api/vod/search-creators` was working correctly and returning creator data from TMDb.

### Root Cause

The application had two separate systems:
1. **External API Search** (`/api/vod/search-creators`) - Searches TMDb API directly
2. **Database Search** (`/api/creators`) - Searches the local `creators` table

The `creators` table was empty because there was no mechanism to populate it from the external API.

## Solution Architecture

### Database Design

The `creators` table acts as a **cache** for creator data from external APIs:

```sql
create table creators (
  id uuid primary key default gen_random_uuid(),
  external_api_id text not null,           -- TMDb person ID
  name text not null,
  creator_role creator_role not null,      -- 'actor' or 'director'
  avatar_url text,
  meta_data jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_api_id, creator_role)   -- Same person can be both actor and director
);
```

### Workflow

#### 1. Search for Creators (Frontend)

```typescript
// Frontend calls the VOD search endpoint
GET /api/vod/search-creators?q=Nolan

// Response: Array of CreatorDTO with external IDs
[
  {
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
  }
]
```

#### 2. Add Creator to Favorites (Frontend)

```typescript
// Frontend sends the complete creator object from search results
POST /api/me/creators
Content-Type: application/json

{
  "id": "tmdb-525",
  "name": "Christopher Nolan",
  "creator_role": "director",
  "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
}
```

#### 3. Backend Processing

The endpoint now handles two workflows:

**New Workflow (External API Data):**
```typescript
// 1. Validate as external API data
AddUserCreatorFromExternalApiSchema.safeParse(body)

// 2. Upsert creator into database
await creatorsService.addFavoriteFromExternalApi(userId, creatorData)
  // a. Extract TMDb ID from "tmdb-525" -> "525"
  // b. Upsert into creators table (ON CONFLICT UPDATE)
  // c. Get the database UUID
  // d. Insert into user_creators junction table
  // e. Return CreatorDTO with database UUID
```

**Legacy Workflow (Database UUID):**
```typescript
// 1. Validate as legacy format
AddUserCreatorSchema.safeParse(body)

// 2. Add existing creator
await creatorsService.addFavorite(userId, creator_id)
  // a. Verify creator exists in database
  // b. Insert into user_creators junction table
  // c. Return CreatorDTO
```

## Implementation Details

### 1. Service Layer (`CreatorsService`)

#### New Method: `upsertCreatorFromExternalApi`

```typescript
async upsertCreatorFromExternalApi(data: UpsertCreatorData): Promise<UUID> {
  const { external_api_id, name, creator_role, avatar_url } = data;

  const { data: upsertedData, error } = await this.supabase
    .from("creators")
    .upsert(
      {
        external_api_id,
        name,
        creator_role,
        avatar_url,
        last_synced_at: new Date().toISOString(),
      },
      {
        onConflict: "external_api_id,creator_role",
        ignoreDuplicates: false, // Update if exists
      }
    )
    .select("id")
    .single();

  return upsertedData.id;
}
```

#### New Method: `addFavoriteFromExternalApi`

```typescript
async addFavoriteFromExternalApi(userId: UUID, creatorData: CreatorDTO): Promise<CreatorDTO> {
  // 1. Extract TMDb ID from "tmdb-{id}" format
  const externalApiId = creatorData.id.replace("tmdb-", "");

  // 2. Upsert creator into database
  const creatorId = await this.upsertCreatorFromExternalApi({
    external_api_id: externalApiId,
    name: creatorData.name,
    creator_role: creatorData.creator_role,
    avatar_url: creatorData.avatar_url,
  });

  // 3. Check if already in favorites
  const { data: existingFavorite } = await this.supabase
    .from("user_creators")
    .select("creator_id")
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .single();

  if (existingFavorite) {
    throw new CreatorAlreadyFavoriteError();
  }

  // 4. Insert into user_creators junction table
  const { error } = await this.supabase.from("user_creators").insert({
    user_id: userId,
    creator_id: creatorId,
  });

  if (error) {
    if (error.code === "23505") {
      throw new CreatorAlreadyFavoriteError();
    }
    throw new Error(`Failed to add favorite creator: ${error.message}`);
  }

  // 5. Return creator with database UUID
  return {
    ...creatorData,
    id: creatorId,
  };
}
```

### 2. Schema Validation

#### New Schema: `AddUserCreatorFromExternalApiSchema`

```typescript
export const AddUserCreatorFromExternalApiSchema = z.object({
  id: z.string().regex(/^tmdb-\d+$/, "ID must be in format 'tmdb-{id}'"),
  name: z.string().min(1, "Name is required"),
  creator_role: z.enum(["actor", "director"], {
    errorMap: () => ({ message: "Role must be 'actor' or 'director'" }),
  }),
  avatar_url: z.string().url("Avatar URL must be a valid URL").nullable(),
});
```

### 3. API Endpoint Updates

#### Updated: `POST /api/me/creators`

The endpoint now tries both validation schemas:

```typescript
// Try external API format first
const externalApiValidation = AddUserCreatorFromExternalApiSchema.safeParse(body);
if (externalApiValidation.success) {
  const creator = await creatorsService.addFavoriteFromExternalApi(userId, creatorData);
  return jsonResponse<CreatorDTO>(creator, 201);
}

// Fall back to legacy format
const legacyValidation = AddUserCreatorSchema.safeParse(body);
if (legacyValidation.success) {
  const creator = await creatorsService.addFavorite(userId, creator_id);
  return jsonResponse<CreatorDTO>(creator, 201);
}

// Both failed - return validation error
return errorResponse("ValidationError", 400, "Invalid request body", {
  message: "Body must contain either 'creator_id' (UUID) or creator data",
  legacyErrors: legacyValidation.error.format(),
  externalApiErrors: externalApiValidation.error.format(),
});
```

## API Usage Examples

### Search for Creators

```bash
# Search TMDb for creators
curl "http://localhost:3000/api/vod/search-creators?q=Nolan"

# Response
[
  {
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
  },
  {
    "id": "tmdb-1232094",
    "name": "Nolan Hemmings",
    "creator_role": "actor",
    "avatar_url": "https://image.tmdb.org/t/p/w500/pYbbQMAnxoLIKuhkgclnFz4b8vV.jpg"
  }
]
```

### Add Creator to Favorites (New Workflow)

```bash
# Add creator from external API data
curl -X POST "http://localhost:3000/api/me/creators" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
  }'

# Response (201 Created)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  # Database UUID
  "name": "Christopher Nolan",
  "creator_role": "director",
  "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
}
```

### Search Database Creators

```bash
# Now the database search will return results
curl "http://localhost:3000/api/creators?q=Nolan"

# Response
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Christopher Nolan",
      "creator_role": "director",
      "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
    }
  ],
  "next_cursor": null
}
```

## Benefits

### 1. Automatic Cache Population
- Creators are automatically added to the database when users mark them as favorites
- No manual database seeding required
- Database grows organically with user activity

### 2. Deduplication
- The `unique (external_api_id, creator_role)` constraint prevents duplicates
- Multiple users can favorite the same creator without creating duplicate entries
- Same person can exist as both actor and director (separate records)

### 3. Data Freshness
- `last_synced_at` timestamp tracks when data was last updated
- Future enhancement: Refresh stale data from external API

### 4. Backward Compatibility
- Legacy workflow still works for existing integrations
- New workflow seamlessly integrates with external API

### 5. Performance
- Database search is faster than external API calls
- Cached data reduces API usage and costs
- Pagination works efficiently with database indexes

## Frontend Integration Guide

### Onboarding Flow

```typescript
// 1. Search for creators
const searchResults = await fetch(
  `/api/vod/search-creators?q=${encodeURIComponent(query)}`
).then(r => r.json());

// 2. User selects a creator
const selectedCreator = searchResults[0];

// 3. Add to favorites (pass the complete object)
const response = await fetch('/api/me/creators', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(selectedCreator)  // Pass the entire object
});

// 4. Handle response
if (response.status === 201) {
  const creator = await response.json();
  console.log('Added to favorites:', creator);
  // Note: creator.id is now a database UUID, not "tmdb-{id}"
} else if (response.status === 409) {
  console.log('Already in favorites');
}
```

### Profile/Settings Flow

```typescript
// 1. Get user's favorite creators (from database)
const favorites = await fetch('/api/me/creators').then(r => r.json());

// 2. Display favorites
favorites.data.forEach(creator => {
  console.log(creator.name, creator.id);  // Database UUID
});

// 3. Remove from favorites
await fetch(`/api/me/creators/${creator.id}`, {
  method: 'DELETE'
});
```

## Testing Checklist

- [x] Search creators via `/api/vod/search-creators`
- [ ] Add creator to favorites via `/api/me/creators` (new workflow)
- [ ] Verify creator appears in database (`creators` table)
- [ ] Verify junction table entry (`user_creators` table)
- [ ] Search database creators via `/api/creators`
- [ ] Add same creator again (should return 409 Conflict)
- [ ] Add creator with different role (should create new record)
- [ ] Get user's favorites via `/api/me/creators`
- [ ] Remove creator from favorites via `/api/me/creators/{id}`
- [ ] Legacy workflow: Add creator by UUID (backward compatibility)

## Next Steps

1. **Test the implementation:**
   - Use the search endpoint to find creators
   - Add creators to favorites using the new workflow
   - Verify database population
   - Test database search endpoint

2. **Update frontend components:**
   - Update onboarding creator selection to use new workflow
   - Update profile creator management to use new workflow
   - Handle ID format changes (external vs database UUIDs)

3. **Future enhancements:**
   - Implement data refresh based on `last_synced_at`
   - Add bulk import for popular creators
   - Add creator popularity tracking
   - Implement creator recommendations

## Files Modified

1. `src/lib/services/creators.service.ts`
   - Added `UpsertCreatorData` interface
   - Added `upsertCreatorFromExternalApi()` method
   - Added `addFavoriteFromExternalApi()` method

2. `src/lib/schemas/creators.schema.ts`
   - Added `AddUserCreatorFromExternalApiSchema`

3. `src/pages/api/me/creators/index.ts`
   - Updated POST endpoint to handle both workflows
   - Added dual validation (external API + legacy)
   - Improved error handling and documentation

4. `.ai/creators-external-api-integration.md` (new)
   - Complete implementation documentation
