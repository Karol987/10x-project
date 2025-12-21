# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Auth User | `auth.users` | Account managed by Supabase Auth (email / password) |
| Profile | `profiles` | Per–user profile & onboarding status (1-to-1 with Auth User) |
| Platform | `platforms` | Dictionary of streaming platforms (Netflix, HBO Max …) |
| User Platform | `user_platforms` | M:N link between Auth User and Platform – subscriptions |
| Creator | `creators` | Actor / director dictionary synced from external API |
| User Creator | `user_creators` | M:N link between Auth User and Creator – favourites |
| Watched Item | `watched_items` | Movie / series a user marked as watched |
| Recommendation | — (Edge Function / DB view) | Aggregated list matching user preferences |
| Onboarding | — | Wizard helpers (state, step 1 – platforms, step 2 – creators) |

## 2. Endpoints

Unless stated otherwise all endpoints:
• are relative to `/api` and return / accept JSON
• require the `Authorization: Bearer <jwt>` header issued by Supabase (401 if missing / invalid)
• support pagination with the forward cursor pattern `?limit=<int>&cursor=<id>` (default limit = 50)

### 2.1 Authentication (delegated to Supabase)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Proxy to Supabase sign-up (email, password) |
| POST | `/auth/login` | Proxy to Supabase sign-in (email, password) |
| POST | `/auth/logout` | Clears http-only auth cookies |
| POST | `/auth/forgot-password` | Starts password reset flow |
| POST | `/auth/reset-password` | Completes password reset with token |

> The frontend may call Supabase client SDK directly; the above thin wrappers allow a uniform `/api/*` surface when needed.

### 2.2 Profile

| Method | Path | Description | Req. Body | Res. Body |
|--------|------|-------------|-----------|-----------|
| GET | `/profile` | Get own profile | — | `Profile` |
| PATCH | `/profile` | Update `country_code` only | `{ country_code: string }` | `Profile` |

`Profile` response

```json
{
  "user_id": "uuid",
  "country_code": "PL",
  "onboarding_status": "not_started" | "platforms_selected" | "completed",
  "created_at": "2025-12-11T12:34:56Z",
  "updated_at": "2025-12-11T12:34:56Z"
}
```

### 2.3 Onboarding Wizard

| Method | Path | Description | Body | Success |
|--------|------|-------------|------|---------|
| GET | `/onboarding/state` | Returns wizard progress | — | `{ step: 0,  1,  2 }` |
| PUT | `/onboarding/platforms` | Saves selected platform IDs → completes step 1 | `{ platform_ids: uuid[] }` | 204 No Content |
| PUT | `/onboarding/creators` | Saves selected creator IDs → completes step 2 & sets `onboarding_status = completed` | `{ creator_ids: uuid[] }` | 204 No Content |

Validation

* Step 1 requires ≥ 1 platform (`422` if fewer)
* Step 2 requires ≥ 3 creators (`422` if fewer)

### 2.4 Platforms (public dictionary)

| Method | Path | Description | Query | Res. Body |
|--------|------|-------------|-------|-----------|
| GET | `/platforms` | List all platforms (cache 1 h) | — | `Platform[]` |
| GET | `/platforms/:slug` | Single platform by slug | — | `Platform` |

`Platform`

```json
{
  "id": "uuid",
  "name": "Netflix",
  "slug": "netflix",
  "logo_url": "https://…",
  "created_at": "…",
  "updated_at": "…"
}
```

### 2.5 User Platforms (subscriptions)

| Method | Path | Description | Body | Res. Body |
|--------|------|-------------|------|-----------|
| GET | `/me/platforms` | List my selected platforms | — | `Platform[]` |
| PUT | `/me/platforms` | Replace whole list (≥ 1) | `{ platform_ids: uuid[] }` | `Platform[]` |

### 2.6 Creators (public dictionary)

| Method | Path | Description | Query Params | Res. Body |
|--------|------|-------------|--------------|-----------|
| GET | `/creators` | Paginated list | ?q=<text>&role=actor/director | `Creator[]` |
| GET | `/creators/:id` | Single creator | — | `Creator` |

`Creator`

```json
{
  "id": "uuid",
  "external_api_id": "12345",
  "name": "Keanu Reeves",
  "creator_role": "actor",
  "avatar_url": "https://…",
  "meta_data": { … },
  "last_synced_at": "…"
}
```

### 2.7 User Creators (favourites)

| Method | Path | Description | Body | Success |
|--------|------|-------------|------|---------|
| GET | `/me/creators` | List my favourite creators | — | `Creator[]` |
| POST | `/me/creators` | Add favourite | `{ creator_id: uuid }` | 201 Created – `Creator` |
| DELETE | `/me/creators/:id` | Remove favourite link | — | 204 No Content |

### 2.8 Watched Items

| Method | Path | Description | Query | Body | Res. Body |
|--------|------|-------------|-------|------|-----------|
| GET | `/me/watched` | Paginated list of watched items | `?cursor` | — | `WatchedItem[]` |
| POST | `/me/watched` | Mark as watched | — | `WatchedItemCreate` | 201 Created – `WatchedItem` |
| DELETE | `/me/watched/:id` | Unmark watched | — | — | 204 No Content |

#### POST `/me/watched` - Mark movie/series as watched

**Request Body** (`WatchedItemCreate`)

```json
{
  "external_movie_id": "string",
  "media_type": "movie" | "series",
  "title": "string",
  "year": 2025,
  "meta_data": { "poster_path": "/p.jpg" }
}
```

**Field Requirements:**

- `external_movie_id` (string, required) – ID from external API (e.g., IMDb ID)
- `media_type` (enum, required) – Must be either `"movie"` or `"series"`
- `title` (string, required) – Title of the movie/series, minimum 1 character
- `year` (number, optional) – Production year
- `meta_data` (object, required) – Must contain `poster_path` field (string)

**Success Response** (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "external_movie_id": "tt0133093",
  "media_type": "movie",
  "title": "The Matrix",
  "year": 1999,
  "created_at": "2025-12-15T10:30:45.123Z"
}
```

**Error Responses:**

| Status | Error | Description | Response Body |
|--------|-------|-------------|---------------|
| 400 | ValidationError | Invalid request body | `{ "error": "ValidationError", "message": "Validation error", "details": {...} }` |
| 400 | InvalidJSON | Malformed JSON | `{ "error": "InvalidJSON", "message": "Invalid JSON body" }` |
| 401 | Unauthorized | Missing/invalid JWT | `{ "error": "Unauthorized" }` |
| 409 | Conflict | Already marked as watched | `{ "error": "Conflict", "message": "Already marked as watched" }` |
| 500 | ServerError | Unexpected error | `{ "error": "ServerError", "message": "Internal server error" }` |

**cURL Examples:**

```bash
# Success - Mark a movie as watched
curl -X POST http://localhost:4321/api/me/watched \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "external_movie_id": "tt0133093",
    "media_type": "movie",
    "title": "The Matrix",
    "year": 1999,
    "meta_data": {
      "poster_path": "/path/to/poster.jpg",
      "backdrop_path": "/path/to/backdrop.jpg"
    }
  }'

# Response (201):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440001",
#   "external_movie_id": "tt0133093",
#   "media_type": "movie",
#   "title": "The Matrix",
#   "year": 1999,
#   "created_at": "2025-12-15T10:30:45.123Z"
# }

# Mark a series as watched (without year)
curl -X POST http://localhost:4321/api/me/watched \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "external_movie_id": "tt0944947",
    "media_type": "series",
    "title": "Game of Thrones",
    "meta_data": {
      "poster_path": "/path/to/poster.jpg"
    }
  }'

# Error - Missing required field (400)
curl -X POST http://localhost:4321/api/me/watched \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "external_movie_id": "tt0133093",
    "media_type": "movie"
  }'

# Response (400):
# {
#   "error": "ValidationError",
#   "message": "Validation error",
#   "details": {
#     "_errors": [],
#     "title": {
#       "_errors": ["Required"]
#     },
#     "meta_data": {
#       "_errors": ["Required"]
#     }
#   }
# }

# Error - Invalid media_type (400)
curl -X POST http://localhost:4321/api/me/watched \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "external_movie_id": "tt0133093",
    "media_type": "documentary",
    "title": "The Matrix",
    "meta_data": { "poster_path": "/p.jpg" }
  }'

# Response (400):
# {
#   "error": "ValidationError",
#   "message": "Validation error",
#   "details": {
#     "_errors": [],
#     "media_type": {
#       "_errors": ["Media type must be 'movie' or 'series'"]
#     }
#   }
# }

# Error - Missing poster_path in meta_data (400)
curl -X POST http://localhost:4321/api/me/watched \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "external_movie_id": "tt0133093",
    "media_type": "movie",
    "title": "The Matrix",
    "year": 1999,
    "meta_data": {
      "backdrop_path": "/backdrop.jpg"
    }
  }'

# Response (400):
# {
#   "error": "ValidationError",
#   "message": "Validation error",
#   "details": {
#     "_errors": [],
#     "meta_data": {
#       "_errors": ["meta_data must contain poster_path field"]
#     }
#   }
# }

# Error - Duplicate watched item (409)
curl -X POST http://localhost:4321/api/me/watched \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "external_movie_id": "tt0133093",
    "media_type": "movie",
    "title": "The Matrix",
    "year": 1999,
    "meta_data": { "poster_path": "/p.jpg" }
  }'

# Response (409) - if already marked as watched:
# {
#   "error": "Conflict",
#   "message": "Already marked as watched"
# }
```

**Notes:**

- The `meta_data` object can contain additional fields beyond `poster_path` (e.g., `backdrop_path`, `overview`, etc.)
- Duplicate detection is based on the combination of `(user_id, external_movie_id, media_type)`
- Successfully marking an item as watched will remove it from the recommendations list

### 2.9 Recommendations

| Method | Path | Description | Query | Res. Body |
|--------|------|-------------|-------|-----------|
| GET | `/recommendations` | Returns up to 50 titles that match BOTH favourite creators & subscribed platforms | `?cursor=<uuid>` | `Recommendation[]` |

`Recommendation`

```json
{
  "id": "uuid",
  "external_movie_id": "string",
  "media_type": "movie",
  "title": "The Movie",
  "year": 2025,
  "creators": [
    { "id": "uuid", "name": "Keanu Reeves", "role": "actor", "is_favorite": true }
  ],
  "platforms": [ "netflix", "hbo-max" ]
}
```

## 3. Authentication & Authorization

* Supabase issues JWTs; middleware verifies and injects `auth.uid()` into request context.
* Row-Level Security (RLS) in Postgres ensures users can access only their rows.
* Public endpoints: `GET /platforms`, `GET /creators`.
* Admin-only endpoints (create / update / delete for dictionaries) are excluded from MVP – future work with `service_role` key.

## 4. Validation & Business Logic

| Resource | Rule | Error |
|----------|------|-------|
| Profile | `country_code` must be 2-char ISO 3166; enum `onboarding_status` controlled by wizard | 400 |
| User Platform | Must send ≥ 1 platform in onboarding; UNIQUE(user_id, platform_id) | 422 / 409 |
| User Creator | Must send ≥ 3 creators on step 2; UNIQUE(user_id, creator_id) | 422 / 409 |
| Creator | UNIQUE(external_api_id, creator_role) – handled server side | 409 |
| Watched Item | UNIQUE(user_id, external_movie_id, media_type) | 409 |
| Recommendation | Result must satisfy BOTH a favourite creator AND subscribed platform | — (edge logic) |

Additional rules

1. Completing wizard steps updates `profiles.onboarding_status` (step 0 → 1 → 2).
2. Deleting account cascades via `ON DELETE CASCADE` triggers across all tables.
3. Posting to `/me/watched` removes the item from the `/recommendations` view (client may refresh list).

## 5. Error Handling

| HTTP Status | Reason |
|-------------|--------|
| 400 Bad Request | Validation failed (missing field, wrong enum) |
| 401 Unauthorized | Missing / invalid JWT |
| 403 Forbidden | Violates RLS (accessing someone else’s row) |
| 404 Not Found | Resource not found |
| 409 Conflict | Unique constraint violated |
| 422 Unprocessable Entity | Business rule violation (e.g., < 3 creators) |
| 429 Too Many Requests | Rate-limit triggered |
| 500 Internal Server Error | Unhandled exception |

## 6. Security & Rate Limiting

* Global limit: 100 req/min per IP (20 for `/auth/*`).
* All request bodies validated against JSON Schemas.
* Standard `Cache-Control: no-store, private` on all responses except dictionary endpoints (max-age = 3600, public).
* HTTPS enforced, HSTS enabled, CORS restricted to first-party origin.

---

**Assumptions & Notes**

* Dictionary tables are pre-populated by back-office services – creation / update not part of this API scope.
* Recommendation query is implemented in an Edge Function joining external API data with local tables.
* Frontend may bypass auth proxy endpoints and call Supabase SDK directly if desired.
