# Onboarding Creators External ID Fix

## Problem

The onboarding creators endpoint was failing with a 422 validation error when receiving creator IDs from the frontend:

```json
{
  "creator_ids": ["tmdb-6193", "tmdb-19537", "tmdb-16851"]
}
```

Error:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "creator_ids.0",
      "message": "Invalid UUID format"
    }
  ]
}
```

## Root Cause

The onboarding endpoint expected UUIDs (database IDs) but received external IDs in the format `tmdb-{id}`. This happened because:

1. Frontend searches for creators via `/api/creators`
2. When no local results found, the API falls back to external TMDb API
3. External API returns creators with IDs in format `tmdb-{id}`
4. Frontend sends these external IDs to onboarding endpoint
5. Onboarding endpoint expected UUIDs only

## Solution

Updated the onboarding flow to accept and process both UUID and external ID formats:

### 1. Schema Changes (`src/lib/schemas/onboarding.schema.ts`)

Changed from accepting only UUID strings to accepting a union type that supports:
- UUID strings (for existing creators in database)
- Full creator objects from external API with external IDs

```typescript
const creatorItemSchema = z.union([
  // Option 1: Just a UUID string (for existing creators in database)
  z.string().uuid("ID must be a valid UUID"),
  // Option 2: Full creator object from external API
  z.object({
    id: z.string().regex(/^tmdb-\d+$/, "ID must be in format 'tmdb-{id}'"),
    name: z.string().min(1, "Name is required"),
    creator_role: z.enum(["actor", "director"]),
    avatar_url: z.string().url().nullable(),
  }),
]);

export const OnboardingCreatorsSchema = z.object({
  creators: z.array(creatorItemSchema).min(3).max(50),
});
```

### 2. Type Changes (`src/types.ts`)

Updated the command interface to accept both formats:

```typescript
export interface OnboardingCreatorsCommand {
  creators: (UUID | AddUserCreatorFromExternalApiCommand)[];
}
```

### 3. Service Changes (`src/lib/services/onboarding.service.ts`)

Updated `updateCreators` function to:
- Accept both UUID strings and full creator objects
- Upsert external creators into the database before creating user associations
- Handle the `tmdb-{id}` to UUID conversion

```typescript
export async function updateCreators(
  supabase: SupabaseClient,
  creators: (UUID | { id: string; name: string; creator_role: string; avatar_url: string | null })[]
): Promise<void> {
  // Process all creators and get their UUIDs
  const creatorIds: UUID[] = [];

  for (const creator of creators) {
    if (typeof creator === "string") {
      // UUID string - use directly
      creatorIds.push(creator);
    } else {
      // External creator - upsert first
      const externalApiId = creator.id.replace("tmdb-", "");
      
      const { data: upsertedData, error } = await supabase
        .from("creators")
        .upsert({
          external_api_id: externalApiId,
          name: creator.name,
          creator_role: creator.creator_role,
          avatar_url: creator.avatar_url,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: "external_api_id,creator_role",
          ignoreDuplicates: false,
        })
        .select("id")
        .single();
      
      creatorIds.push(upsertedData.id);
    }
  }

  // Continue with existing logic using creatorIds...
}
```

### 4. API Endpoint Changes (`src/pages/api/onboarding/creators.ts`)

Updated to use the new field name:

```typescript
await updateCreators(supabase, validationResult.data.creators);
```

### 5. Frontend Changes (`src/components/hooks/useCreatorSelection.ts`)

Updated to send full creator objects instead of just IDs:

```typescript
const command: OnboardingCreatorsCommand = {
  creators: selectedCreators.map((c) => ({
    id: c.id,
    name: c.name,
    creator_role: c.creator_role,
    avatar_url: c.avatar_url,
  })),
};
```

## Benefits

1. **Seamless Integration**: Frontend can now select creators from external API during onboarding
2. **Automatic Caching**: External creators are automatically cached in the database when selected
3. **Backward Compatible**: Still supports UUID format for existing database creators
4. **Consistent Pattern**: Follows the same approach as `/api/me/creators` POST endpoint
5. **No Redundant API Calls**: Uses data already fetched during search

## Testing

Test the onboarding flow with:

1. **External creators** (from TMDb search):
```json
{
  "creators": [
    {
      "id": "tmdb-6193",
      "name": "Leonardo DiCaprio",
      "creator_role": "actor",
      "avatar_url": "https://image.tmdb.org/t/p/w200/..."
    }
  ]
}
```

2. **Database creators** (existing UUIDs):
```json
{
  "creators": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

3. **Mixed** (both formats):
```json
{
  "creators": [
    "550e8400-e29b-41d4-a716-446655440000",
    {
      "id": "tmdb-6193",
      "name": "Leonardo DiCaprio",
      "creator_role": "actor",
      "avatar_url": "https://image.tmdb.org/t/p/w200/..."
    }
  ]
}
```

## Files Modified

- `src/lib/schemas/onboarding.schema.ts`
- `src/lib/services/onboarding.service.ts`
- `src/pages/api/onboarding/creators.ts`
- `src/components/hooks/useCreatorSelection.ts`
- `src/types.ts`
