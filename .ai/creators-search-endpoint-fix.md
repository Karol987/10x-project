# Creators Search Endpoint Fix

## Problem

The `/api/creators?q=nolan` endpoint was returning empty results `{"data":[],"next_cursor":null}` while `/api/vod/search-creators?q=Nolan` was working correctly.

## Root Causes

1. **Authentication Issue**: The `/api/creators` endpoint was not in the `PUBLIC_PATHS` list in the middleware, causing unauthenticated requests to be redirected to `/auth/login` (302 redirect).

2. **Empty Database**: The `creators` table in the database was empty. The endpoint was only searching the local database cache, not the external TMDb API.

## Solution

### 1. Made `/api/creators` a Public Endpoint

Modified `src/middleware/index.ts` to add `/api/creators` and `/api/platforms` to the `PUBLIC_PATHS` list, allowing unauthenticated access to these search endpoints.

### 2. Added External API Fallback

Modified `src/pages/api/creators/index.ts` to implement a hybrid search strategy:

1. **First**: Search the local database cache using `CreatorsService.getPaginatedCreators()`
2. **If no results found** and a search query is provided: Fall back to external TMDb API using `VodService.searchCreators()`
3. **Filter by role** if specified in the query parameters

## How It Works Now

### Database Search (Default)

When the database has creators cached:

```bash
GET /api/creators?q=nolan
```

Returns paginated results from the database:

```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Christopher Nolan",
      "creator_role": "director",
      "avatar_url": "https://..."
    }
  ],
  "next_cursor": "uuid-of-last-item"
}
```

### External API Fallback

When the database is empty or has no matching results:

```bash
GET /api/creators?q=nolan
```

Returns results from TMDb API (no pagination):

```json
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

### Role Filtering

Works with both database and external API:

```bash
GET /api/creators?q=nolan&role=director
```

Returns only directors:

```json
[
  {
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
  }
]
```

## Response Format Differences

**Important**: The response format differs depending on the data source:

- **Database results**: Returns `PaginatedResponse<CreatorDTO>` with `data` array and `next_cursor`
- **External API results**: Returns `CreatorDTO[]` array directly (no pagination)

Frontend code should handle both formats:

```typescript
const response = await fetch('/api/creators?q=nolan');
const json = await response.json();

// Check if it's a paginated response or array
const creators = Array.isArray(json) ? json : json.data;
```

## Architecture Notes

### Creators Table as Cache

The `creators` table serves as a cache for external API data:

- Starts empty
- Gets populated when users add creators to their favorites
- Uses `(external_api_id, creator_role)` as unique constraint
- Supports upsert operations to keep data fresh

### When Creators Get Cached

Creators are automatically cached when:

1. User adds a creator to favorites via `POST /api/me/creators` with external API data
2. The `CreatorsService.upsertCreatorFromExternalApi()` method is called

### Search Strategy Benefits

This hybrid approach provides:

1. **Fast searches** for commonly used creators (cached in database)
2. **Comprehensive results** for new searches (external API fallback)
3. **Reduced API calls** as the cache grows over time
4. **No manual data seeding** required

## Testing

```bash
# Test search with external API fallback
curl "http://localhost:3000/api/creators?q=nolan"

# Test role filtering
curl "http://localhost:3000/api/creators?q=nolan&role=director"

# Test pagination (when database has data)
curl "http://localhost:3000/api/creators?limit=10&cursor=uuid-here"

# Test browsing all creators
curl "http://localhost:3000/api/creators"
```

## Files Modified

1. `src/pages/api/creators/index.ts` - Added external API fallback logic
2. `src/middleware/index.ts` - Added `/api/creators` to public paths
