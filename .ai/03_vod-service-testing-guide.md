# VodService - Testing Guide

## Przegląd

Ten dokument zawiera instrukcje testowania zaimplementowanego `VodService` oraz przykłady użycia.

## Konfiguracja Środowiska

### 1. Uzyskanie Kluczy API

#### TMDb API

1. Przejdź na <https://www.themoviedb.org/settings/api>
2. Zarejestruj się i wygeneruj klucz API (v3)
3. Skopiuj klucz API

#### Movie of the Night API (RapidAPI)

1. Przejdź na <https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability>
2. Zarejestruj się na RapidAPI
3. Wybierz darmowy plan (100 requests/day)
4. Skopiuj `X-RapidAPI-Key` z sekcji "Code Snippets"

### 2. Konfiguracja `.env`

Dodaj klucze do pliku `.env`:

```env
TMDB_API_KEY=twoj_klucz_tmdb
RAPIDAPI_KEY=twoj_klucz_rapidapi
RAPIDAPI_HOST=streaming-availability.p.rapidapi.com
```

### 3. Uruchomienie Migracji

Upewnij się, że tabela cache jest utworzona:

```bash
# Jeśli używasz Supabase CLI
supabase db push

# Lub ręcznie wykonaj migrację:
# supabase/migrations/20260118120000_create_vod_availability_cache.sql
```

## Testy Manualne

### Test 1: Wyszukiwanie Twórców

#### Endpoint

```
GET /api/vod/search-creators?q={query}
```

#### Przykłady

```bash
# Test 1: Wyszukaj Christopher Nolan
curl "http://localhost:4321/api/vod/search-creators?q=Nolan"

# Test 2: Wyszukaj Leonardo DiCaprio
curl "http://localhost:4321/api/vod/search-creators?q=DiCaprio"

# Test 3: Wyszukaj Quentin Tarantino
curl "http://localhost:4321/api/vod/search-creators?q=Tarantino"

# Test 4: Pusta fraza (powinno zwrócić błąd 400)
curl "http://localhost:4321/api/vod/search-creators?q=N"

# Test 5: Brak parametru (powinno zwrócić błąd 400)
curl "http://localhost:4321/api/vod/search-creators"
```

#### Oczekiwane Wyniki

**Test 1 - Success (200):**
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

**Test 4 - Validation Error (400):**
```json
{
  "error": "ValidationError",
  "message": "Search query must be at least 2 characters",
  "status": 400
}
```

### Test 2: Rekomendacje (Integracja)

#### Przygotowanie Danych Testowych

Przed testowaniem rekomendacji, dodaj dane testowe do bazy:

```sql
-- 1. Dodaj użytkownika testowego (jeśli nie istnieje)
INSERT INTO profiles (user_id, onboarding_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'completed')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Dodaj twórców do bazy (z TMDb ID)
INSERT INTO creators (id, name, creator_role, avatar_url, meta_data)
VALUES 
  ('tmdb-525', 'Christopher Nolan', 'director', 'https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg', '{"tmdb_id": 525}'),
  ('tmdb-6384', 'Keanu Reeves', 'actor', 'https://image.tmdb.org/t/p/w500/4D0PpNI0kmP58hgrwGC3wCjxhnm.jpg', '{"tmdb_id": 6384}')
ON CONFLICT (id) DO NOTHING;

-- 3. Dodaj platformy (jeśli nie istnieją)
INSERT INTO platforms (slug, name, logo_url)
VALUES 
  ('netflix', 'Netflix', 'https://example.com/netflix.png'),
  ('hbo-max', 'HBO Max', 'https://example.com/hbo.png')
ON CONFLICT (slug) DO NOTHING;

-- 4. Przypisz twórców do użytkownika
INSERT INTO user_creators (user_id, creator_id)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'tmdb-525'),
  ('00000000-0000-0000-0000-000000000001', 'tmdb-6384')
ON CONFLICT DO NOTHING;

-- 5. Przypisz platformy do użytkownika
INSERT INTO user_platforms (user_id, platform_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM platforms
WHERE slug IN ('netflix', 'hbo-max')
ON CONFLICT DO NOTHING;
```

#### Endpoint

```
GET /api/recommendations?limit={limit}
```

#### Przykłady

```bash
# Test 1: Pobierz 10 rekomendacji
curl "http://localhost:4321/api/recommendations?limit=10"

# Test 2: Pobierz 50 rekomendacji (max)
curl "http://localhost:4321/api/recommendations?limit=50"

# Test 3: Paginacja (użyj cursor z poprzedniej odpowiedzi)
curl "http://localhost:4321/api/recommendations?limit=10&cursor=tmdb-movie-123"
```

#### Oczekiwane Wyniki

**Success (200):**
```json
[
  {
    "id": "tmdb-movie-27205",
    "external_movie_id": "27205",
    "media_type": "movie",
    "title": "Inception",
    "year": 2010,
    "creators": [],
    "platforms": ["netflix"],
    "poster_path": "https://image.tmdb.org/t/p/w500/..."
  },
  {
    "id": "tmdb-movie-155",
    "external_movie_id": "155",
    "media_type": "movie",
    "title": "The Dark Knight",
    "year": 2008,
    "creators": [],
    "platforms": ["hbo-max"],
    "poster_path": "https://image.tmdb.org/t/p/w500/..."
  }
]
```

### Test 3: Cache'owanie

#### Sprawdzenie Cache

```sql
-- Sprawdź zawartość cache
SELECT 
  tmdb_id,
  country_code,
  jsonb_array_length(availability_data) as platforms_count,
  last_updated_at,
  NOW() - last_updated_at as age
FROM vod_availability_cache
ORDER BY last_updated_at DESC
LIMIT 10;
```

#### Test Cache Hit

1. Wywołaj endpoint rekomendacji pierwszy raz (cache miss)
2. Sprawdź logi - powinny pokazać zapytania do MOTN API
3. Wywołaj endpoint ponownie (cache hit)
4. Sprawdź logi - nie powinno być zapytań do MOTN API

### Test 4: Obsługa Błędów

#### Test Rate Limiting

```bash
# Wywołaj endpoint wiele razy szybko (>10 req/s dla MOTN)
for i in {1..15}; do
  curl "http://localhost:4321/api/vod/search-creators?q=Nolan" &
done
wait
```

**Oczekiwany wynik**: Niektóre requesty mogą zwrócić 429, ale aplikacja nie powinna crashować.

#### Test Nieprawidłowych Kluczy API

1. Ustaw nieprawidłowy klucz w `.env`
2. Uruchom serwer
3. Wywołaj endpoint

**Oczekiwany wynik**: 500 z komunikatem "VOD service is not configured"

#### Test Braku Kluczy API

1. Usuń klucze z `.env`
2. Uruchom serwer
3. Wywołaj endpoint rekomendacji

**Oczekiwany wynik**: Fallback do mock data (200 z mock danymi)

## Testy Jednostkowe (Przyszłość)

### Przykładowa Struktura

```typescript
// tests/vod.service.test.ts

import { describe, it, expect, vi } from 'vitest';
import { VodService } from '../src/lib/services/vod.service';

describe('VodService', () => {
  describe('searchCreators', () => {
    it('should return creators for valid query', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 525,
              name: 'Christopher Nolan',
              profile_path: '/path.jpg',
              known_for_department: 'Directing',
            },
          ],
        }),
      });

      const vodService = new VodService(mockSupabase);
      const result = await vodService.searchCreators('Nolan');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Christopher Nolan');
      expect(result[0].creator_role).toBe('director');
    });

    it('should return empty array for empty query', async () => {
      const vodService = new VodService(mockSupabase);
      const result = await vodService.searchCreators('');

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const vodService = new VodService(mockSupabase);

      await expect(vodService.searchCreators('Nolan')).rejects.toThrow();
    });
  });
});
```

## Metryki Sukcesu

### Wydajność

- **Cache hit rate**: >80% po pierwszym tygodniu użytkowania
- **Czas odpowiedzi**:
  - Cache hit: <200ms
  - Cache miss: <3s (zależnie od liczby filmów)
- **API quota usage**: <50 requests/day (z 100 dostępnych)

### Funkcjonalność

- ✅ Wyszukiwanie twórców zwraca wyniki z TMDb
- ✅ Rekomendacje filtrują po platformach użytkownika
- ✅ Rekomendacje zawierają tylko subskrypcje (nie rent/buy)
- ✅ Cache redukuje liczbę zapytań do MOTN API
- ✅ Graceful degradation przy błędach API
- ✅ Rate limiting nie crashuje aplikacji

## Znane Ograniczenia (MVP)

1. **Brak informacji o twórcach w RecommendationDTO**: Pole `creators` jest puste. Wymaga dodatkowego zapytania do TMDb lub rozszerzenia cache.

2. **Limit 10 filmów na request**: Ochrona przed wyczerpaniem API quota. W przyszłości można zwiększyć z inteligentnym cache'owaniem.

3. **Tylko filmy**: Seriale nie są jeszcze wspierane (wymaga rozszerzenia TMDb queries).

4. **Brak background jobs**: Cache nie jest automatycznie odświeżany. Wymaga ręcznego wywołania lub cron job.

5. **Twórcy nie są persystowani**: TMDb IDs są generowane dynamicznie (`tmdb-{id}`). W produkcji powinny być zapisywane w bazie.

## Następne Kroki

1. **Dodać testy jednostkowe** (vitest)
2. **Zaimplementować background job** do odświeżania cache
3. **Dodać wsparcie dla seriali** (TV shows)
4. **Rozszerzyć cache** o metadane twórców
5. **Dodać monitoring** API quota usage
6. **Zoptymalizować** równoległe zapytania (Promise.all)

## Troubleshooting

### Problem: "ConfigurationError: TMDB_API_KEY is not configured"

**Rozwiązanie**: Sprawdź plik `.env` i upewnij się, że klucze są ustawione.

### Problem: Puste rekomendacje

**Możliwe przyczyny**:
1. Użytkownik nie ma ulubionych twórców
2. Użytkownik nie ma wybranych platform
3. Brak filmów dostępnych na wybranych platformach
4. Błąd API (sprawdź logi)

**Rozwiązanie**: Sprawdź dane w bazie i logi serwera.

### Problem: "ApiRateLimitError: Movie of the Night API rate limit exceeded"

**Rozwiązanie**: 
- Poczekaj do następnego dnia (quota resetuje się o północy UTC)
- Lub przejdź na płatny plan RapidAPI
- Lub zwiększ cache hit rate

### Problem: Wolne odpowiedzi

**Możliwe przyczyny**:
1. Dużo cache missów (pierwsze użycie)
2. Wolne połączenie z API
3. Dużo filmów do sprawdzenia

**Rozwiązanie**:
- Poczekaj na wypełnienie cache
- Zmniejsz limit filmów na request
- Zoptymalizuj zapytania (Promise.all)

## Kontakt

W razie problemów sprawdź:
1. Logi serwera (`console.log/error`)
2. Dokumentację API: <https://docs.movieofthenight.com>
3. README serwisu: `src/lib/services/README.md`
