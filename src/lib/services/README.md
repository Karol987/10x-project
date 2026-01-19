# Services Documentation

## VodService

`VodService` is the core integration layer for external VOD (Video on Demand) APIs. It implements a hybrid approach combining TMDb for metadata and Movie of the Night API for streaming availability.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  User: Search for "Christopher Nolan" movies       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  VodService.searchCreators()                        │
│  → TMDb API: /search/person                        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  VodService.getRecommendations()                    │
│  1. Fetch filmography from TMDb                     │
│  2. Check cache for availability                    │
│  3. Fetch missing data from MOTN (max 10/request)  │
│  4. Filter by user's platforms (subscription only)  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Result: Movies available on user's platforms       │
└─────────────────────────────────────────────────────┘
```

### Configuration

Required environment variables:

```env
TMDB_API_KEY=your_tmdb_api_key
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=streaming-availability.p.rapidapi.com
```

### Usage

#### 1. Search for Creators

```typescript
import { VodService } from "./lib/services/vod.service";

const vodService = new VodService(supabase);

// Search for creators by name
const creators = await vodService.searchCreators("Christopher Nolan");
// Returns: CreatorDTO[]
```

#### 2. Get Recommendations

```typescript
import { VodService } from "./lib/services/vod.service";

const vodService = new VodService(supabase);

// Get recommendations for user
const recommendations = await vodService.getRecommendations(
  userId,
  ["netflix", "hbo-max"], // User's platform slugs
  ["tmdb-525", "tmdb-138"] // User's creator IDs (format: tmdb-{id})
);
// Returns: RecommendationDTO[]
```

### API Rate Limits

#### TMDb API
- **Free tier**: 40 requests per 10 seconds
- **Effectively unlimited** for MVP usage

#### Movie of the Night API (via RapidAPI)
- **Free tier**: 100 requests per day
- **Rate limit handling**: Graceful degradation - returns empty availability on 429

### Caching Strategy

VodService implements a database cache (`vod_availability_cache` table) to minimize API calls:

1. **Cache-first**: Always check cache before calling MOTN API
2. **TTL**: 24 hours (configurable via `CACHE_TTL_MS`)
3. **Upsert**: Automatically updates stale entries
4. **Graceful degradation**: Cache failures don't break the flow

### Rate Limit Protection

To conserve the 100 requests/day limit:

1. **Limit per request**: Max 10 MOTN API calls per `getRecommendations()` call
2. **Cache reuse**: Shared cache across all users
3. **Priority**: Only fetch availability for top movies (sorted by release date)
4. **Graceful handling**: Returns empty availability on rate limit (429)

### Error Handling

VodService uses custom error types:

- `ConfigurationError`: Missing API keys
- `ApiRateLimitError`: Rate limit exceeded (429)
- `ExternalApiError`: API failure (4xx, 5xx)

All errors are logged but don't crash the application. The service gracefully degrades to:
- Empty results for search failures
- Mock data for recommendation failures (via RecommendationsService)

### Testing

#### Test Endpoint: Search Creators

```bash
# Search for creators
curl "http://localhost:4321/api/vod/search-creators?q=Nolan"
```

Expected response:
```json
[
  {
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/..."
  }
]
```

#### Test Endpoint: Recommendations

```bash
# Get recommendations (requires authenticated user with favorites and platforms)
curl "http://localhost:4321/api/recommendations?limit=10"
```

### Platform Mapping

Database slugs are mapped to MOTN service IDs:

| Database Slug | MOTN Service ID |
|--------------|-----------------|
| `netflix` | `netflix` |
| `hbo-max` | `hbo` |
| `disney-plus` | `disney` |
| `amazon-prime` | `prime` |
| `apple-tv` | `apple` |
| `mubi` | `mubi` |

### Future Improvements

1. **Parallel API calls**: Use `Promise.all()` for filmography fetching
2. **Background jobs**: Periodic cache refresh for popular movies
3. **Series support**: Extend to TV shows (currently movies only)
4. **Creator metadata**: Store TMDb creator IDs in database for faster lookups
5. **Smart caching**: Prioritize caching for popular titles

### Dependencies

- `zod`: Schema validation for API responses
- `@supabase/supabase-js`: Database client for caching

### Related Files

- `vod.service.ts`: Main service implementation
- `vod.service.types.ts`: Type definitions and schemas
- `recommendations.service.ts`: Integrates VodService for user recommendations
- `vod_availability_cache` (database): Cache table for MOTN data

### Troubleshooting

#### "ConfigurationError: TMDB_API_KEY is not configured"

Set the required environment variables in `.env`:

```env
TMDB_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
```

#### "ApiRateLimitError: Movie of the Night API rate limit exceeded"

The free tier limit (100/day) has been reached. Options:
1. Wait until next day for quota reset
2. Upgrade to paid plan
3. Service will gracefully degrade to cached data only

#### Empty recommendations

Check:
1. User has favorite creators in database
2. User has subscribed platforms in database
3. API keys are valid
4. Check console logs for errors

### Performance Considerations

- **Cache hit rate**: Aim for >80% to stay within API limits
- **Response time**: ~200ms with cache hit, ~2-3s with API calls
- **Concurrent requests**: Limited by API rate limits (TMDb: 40/10s, MOTN: 10/s)

### Security

- API keys are stored in environment variables (never committed)
- All API calls use HTTPS
- No sensitive data is logged (only error messages)
- Cache is shared but contains only public VOD availability data
