# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Auth User | `auth.users` | Registered account owned by Supabase Auth |
| Profile | `profiles` | Per-user profile record storing onboarding progress |
| Platform | `platforms` | Dictionary of streaming services (Netflix, HBO Max …) |
| User Platform | `user_platforms` | M:N link between Auth User and Platform (subscriptions) |
| Creator | `creators` | Actor / director dictionary coming from external API |
| User Creator | `user_creators` | M:N link between Auth User and Creator (favorites) |
| Watched Item | `watched_items` | Movie / series a user has marked as watched |
| Recommendation | — (view / edge-function) | Aggregated list matching user preferences |

## 2. Endpoints

Notation
- `:id` – UUID
- `:slug` – unique text identifier
- All endpoints are **relative to `/api`** and return/accept JSON.
- Every request (except auth) requires a **Bearer token** issued by Supabase Auth in the `Authorization` header.
- Pagination: `?limit=50&cursor=<id>` (forward cursor) unless stated otherwise.

### 2.2 Profile
| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Get own profile |
| PATCH | `/profile` | Update `onboarding_step` *(admin only; client normally uses onboarding endpoints)* |

### 2.3 Onboarding Wizard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/onboarding/state` | Returns `{ step: number }` from `profiles.onboarding_step` |
| PUT | `/onboarding/platforms` | Save selected platform ids (body: `{ platform_ids: uuid[] }`) → completes **Step 1** |
| PUT | `/onboarding/creators` | Save selected creator ids (body: `{ creator_ids: uuid[] }`) → completes **Step 2** & sets `onboarding_step = 2` |

### 2.4 Platforms (dictionary)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/platforms` | List all platforms (public) |
| GET | `/platforms/:slug` | Single platform |

*(Admin endpoints for create/update/delete omitted for MVP)*

### 2.5 User Platforms (subscriptions)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me/platforms` | List my platforms |
| PUT | `/me/platforms` | Replace list (body: `{ platform_ids: uuid[] }`) |

### 2.6 Creators (dictionary + search)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/creators` | Paginated list; supports `?q=<search>` (ILIKE) & `?role=actor|director` |
| GET | `/creators/:id` | Single creator |

### 2.7 User Creators (favorites)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me/creators` | List my favorite creators |
| POST | `/me/creators` | Add (body: `{ creator_id: uuid }`) |
| DELETE | `/me/creators/:id` | Remove favorite |

### 2.8 Watched Items
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me/watched` | Paginated list of watched items |
| POST | `/me/watched` | Mark as watched (body: WatchedItemCreate) |
| DELETE | `/me/watched/:id` | Unmark |

WatchedItemCreate
```json
{
  "external_movie_id": "string",
  "media_type": "movie" | "series",
  "title": "string",
  "year": 2025
}
```

### 2.9 Recommendations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/recommendations` | Returns up to 50 titles matching rules (`?cursor=<uuid>` pagination) |

Query parameters:
- `cursor` – last recommendation id for infinite scroll (optional)

Response (array items):
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

Supabase issues JWT access tokens. The backend verifies the token on every request and exposes `auth.uid()` for Row Level Security in Postgres.

Policies already defined in schema ensure that:
- users can read/update only their own rows in `profiles`, `user_platforms`, `user_creators`, `watched_items`.
- `platforms` & `creators` are public-read.

## 4. Validation & Business Logic

| Resource | Rule | Source |
|----------|------|--------|
| Profile | `onboarding_step` smallint 0-2 | schema |
| User Platform | Must provide ≥1 platform in onboarding; UNIQUE(user_id, platform_id) | schema + PRD 3.1/3.2 |
| User Creator | Must provide ≥3 creators in onboarding; UNIQUE(user_id, creator_id) | schema + PRD |
| Creator | UNIQUE(external_api_id, creator_role) | schema |
| Watched Item | UNIQUE(user_id, external_movie_id, media_type) | schema |
| Recommendation | Must satisfy BOTH favorite creator AND subscribed platform | PRD 3.3 |

Additional business rules
1. Completing onboarding steps updates `profiles.onboarding_step`.
2. Deleting account cascades via `ON DELETE CASCADE` triggers.
3. Mark as watched removes item from recommendation view.

## 5. Error Handling

| HTTP Status | Reason |
|-------------|--------|
| 400 Bad Request | Validation failed (missing field, invalid enum) |
| 401 Unauthorized | Missing / invalid JWT |
| 403 Forbidden | Violates RLS (accessing someone else’s row) |
| 404 Not Found | Resource not found |
| 409 Conflict | Unique constraint violated (e.g., duplicate favorite) |
| 422 Unprocessable Entity | Business rule violation (less than 3 creators on onboarding) |
| 429 Too Many Requests | Rate-limit triggered |
| 500 Internal Server Error | Unhandled exception |

## 6. Rate Limiting & Security

- Global rate limit: 100 req/min per IP; stricter (20) for `/auth/*`.
- Input sanitization & JSON schema validation on every body.
- All responses include standard `Cache-Control: no-store, private` except dictionary endpoints (`platforms`, `creators`) which may be cached for 1 hour.
- HTTPS enforced; HSTS, CORS restricted to first-party domain.

---

**Assumptions**
- Dictionary tables (`platforms`, `creators`) are pre-populated by back-office processes, not by this API.
- Edge Function backed by Supabase will implement recommendation query joining external API & our tables.
- Admin maintenance endpoints & Webhooks for external API sync are future work.

