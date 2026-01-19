# Creators External API Integration - Test Guide

## Quick Test Steps

### 1. Search for Creators (External API)

```bash
# Test the VOD search endpoint
curl "http://localhost:3000/api/vod/search-creators?q=Nolan"
```

**Expected Response:**
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

### 2. Add Creator to Favorites (New Workflow)

```bash
# Add Christopher Nolan to favorites
curl -X POST "http://localhost:3000/api/me/creators" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Christopher Nolan",
  "creator_role": "director",
  "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
}
```

**Note:** The `id` field changes from `"tmdb-525"` to a database UUID.

### 3. Verify Database Population

```bash
# Check if creator appears in database search
curl "http://localhost:3000/api/creators?q=Nolan"
```

**Expected Response:**
```json
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

**✅ SUCCESS:** The database now contains the creator!

### 4. Test Duplicate Prevention

```bash
# Try to add the same creator again
curl -X POST "http://localhost:3000/api/me/creators" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tmdb-525",
    "name": "Christopher Nolan",
    "creator_role": "director",
    "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Creator is already in favorites"
}
```

### 5. Get User's Favorites

```bash
# Get all favorite creators for the user
curl "http://localhost:3000/api/me/creators"
```

**Expected Response:**
```json
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

### 6. Test Multiple Creators

```bash
# Add another creator (actor)
curl -X POST "http://localhost:3000/api/me/creators" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tmdb-1232094",
    "name": "Nolan Hemmings",
    "creator_role": "actor",
    "avatar_url": "https://image.tmdb.org/t/p/w500/pYbbQMAnxoLIKuhkgclnFz4b8vV.jpg"
  }'
```

```bash
# Search database again
curl "http://localhost:3000/api/creators?q=Nolan"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Christopher Nolan",
      "creator_role": "director",
      "avatar_url": "https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "name": "Nolan Hemmings",
      "creator_role": "actor",
      "avatar_url": "https://image.tmdb.org/t/p/w500/pYbbQMAnxoLIKuhkgclnFz4b8vV.jpg"
    }
  ],
  "next_cursor": null
}
```

## Test Scenarios

### Scenario 1: First-time User Onboarding
1. User searches for "Nolan" → External API returns results
2. User selects "Christopher Nolan" → Added to database + favorites
3. User searches database → Christopher Nolan appears
4. ✅ Database is populated automatically

### Scenario 2: Second User Favorites Same Creator
1. User 2 searches for "Nolan" → External API returns results
2. User 2 selects "Christopher Nolan" → Upsert finds existing record
3. User 2's favorites link to existing creator record
4. ✅ No duplicate creators in database

### Scenario 3: Same Person, Different Role
1. User searches for "Christopher Nolan" as actor
2. User adds "Christopher Nolan (actor)" → New record created
3. Database now has 2 records: director + actor
4. ✅ Unique constraint allows same person with different roles

### Scenario 4: Legacy Workflow (Backward Compatibility)
1. Admin manually adds creator to database
2. User calls POST with `creator_id` (UUID)
3. Creator is added to favorites without external API call
4. ✅ Legacy workflow still works

## Database Verification

### Check Creators Table

```sql
-- View all creators in database
SELECT id, external_api_id, name, creator_role, last_synced_at
FROM creators
ORDER BY created_at DESC;
```

**Expected Result:**
```
id                                   | external_api_id | name              | creator_role | last_synced_at
-------------------------------------|-----------------|-------------------|--------------|-------------------
550e8400-e29b-41d4-a716-446655440000 | 525             | Christopher Nolan | director     | 2026-01-18 12:00:00
650e8400-e29b-41d4-a716-446655440001 | 1232094         | Nolan Hemmings    | actor        | 2026-01-18 12:01:00
```

### Check User Creators Junction Table

```sql
-- View user's favorite creators
SELECT uc.user_id, uc.creator_id, c.name, c.creator_role
FROM user_creators uc
JOIN creators c ON c.id = uc.creator_id
ORDER BY uc.created_at DESC;
```

**Expected Result:**
```
user_id                              | creator_id                           | name              | creator_role
-------------------------------------|--------------------------------------|-------------------|-------------
450e8400-e29b-41d4-a716-446655440000 | 550e8400-e29b-41d4-a716-446655440000 | Christopher Nolan | director
450e8400-e29b-41d4-a716-446655440000 | 650e8400-e29b-41d4-a716-446655440001 | Nolan Hemmings    | actor
```

## Troubleshooting

### Issue: "Creator not found" (404)
**Cause:** Using legacy workflow with non-existent UUID
**Solution:** Use new workflow with external API data

### Issue: "Validation error" (400)
**Cause:** Invalid request body format
**Solution:** Ensure body contains either:
- `creator_id` (UUID string), OR
- `id` (tmdb-{id}), `name`, `creator_role`, `avatar_url`

### Issue: "Already in favorites" (409)
**Cause:** Creator is already in user's favorites
**Solution:** This is expected behavior, not an error

### Issue: Database search returns empty
**Cause:** No creators have been added to favorites yet
**Solution:** Add at least one creator to favorites first

## Success Criteria

- ✅ External API search works (`/api/vod/search-creators`)
- ✅ Adding creator populates database (`/api/me/creators` POST)
- ✅ Database search returns results (`/api/creators`)
- ✅ Duplicate prevention works (409 Conflict)
- ✅ Multiple users can favorite same creator (no duplicates)
- ✅ Same person can have multiple roles (separate records)
- ✅ Legacy workflow still works (backward compatibility)

## Next Steps After Testing

1. **Update Frontend Components:**
   - Modify onboarding creator selection to use new workflow
   - Update profile creator management
   - Handle ID format changes (external → database UUID)

2. **Performance Optimization:**
   - Add database indexes on `name` and `creator_role`
   - Implement caching for popular creators
   - Add pagination for large result sets

3. **Future Enhancements:**
   - Auto-refresh stale creator data (based on `last_synced_at`)
   - Bulk import popular creators
   - Creator popularity tracking
   - Related creators suggestions
