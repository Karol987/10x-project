# Mock Data - Aktualizacja Rekomendacji

## Data: 16 grudnia 2025

## Wprowadzone Zmiany

### ✅ 1. Dodano `poster_path` do wszystkich rekomendacji

Każda rekomendacja w mock data zawiera teraz pole `poster_path` z prawdziwymi URL-ami do plakatów z TMDB (The Movie Database).

**Przykład:**
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440001",
  external_movie_id: "tt0133093",
  media_type: "movie",
  title: "The Matrix",
  year: 1999,
  poster_path: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", // ✅ NOWE
  creators: [...],
  platforms: [...]
}
```

### ✅ 2. Rozszerzono mock data do 120 elementów

Poprzednio: **5 elementów** (za mało dla testów infinite scroll)  
Teraz: **120 elementów** (2.4 pełnych stron po 50 elementów)

**Metoda generowania:**
- 20 bazowych tytułów (najpopularniejsze filmy i seriale)
- Każdy tytuł powtórzony 6 razy z wariacjami (różne lata, aktorzy, platformy)
- Zapewnia różnorodność danych dla realnego testowania

### ✅ 3. Zróżnicowane dane

**Aktorzy:** 20 popularnych aktorów (Leonardo DiCaprio, Brad Pitt, Tom Hanks, etc.)  
**Reżyserzy:** 14 uznanych reżyserów (Christopher Nolan, Quentin Tarantino, etc.)  
**Platformy:** netflix, hbo-max, disney-plus, prime-video, apple-tv  
**Typy:** Mieszanka filmów (movie) i seriali (series)  
**Ulubieni:** Zróżnicowane oznaczenia `is_favorite` (co 3. aktor, co 5. reżyser)

## Struktura Mock Data

```typescript
interface MockTitle {
  title: string;
  year: number;
  type: "movie" | "series";
  id: string; // IMDb ID
  poster: string; // TMDB poster URL
}
```

### Lista bazowych tytułów (20):

1. The Matrix (1999) - Movie
2. The Dark Knight (2008) - Movie
3. Interstellar (2014) - Movie
4. The Shawshank Redemption (1994) - Movie
5. Inception (2010) - Movie
6. Pulp Fiction (1994) - Movie
7. Fight Club (1999) - Movie
8. Forrest Gump (1994) - Movie
9. The Godfather (1972) - Movie
10. Gladiator (2000) - Movie
11. Game of Thrones (2011) - Series
12. Breaking Bad (2008) - Series
13. Stranger Things (2016) - Series
14. The Crown (2016) - Series
15. The Witcher (2019) - Series
16. Avatar (2009) - Movie
17. Avengers: Endgame (2019) - Movie
18. Titanic (1997) - Movie
19. Jurassic Park (1993) - Movie
20. The Lion King (1994) - Movie

## Testowanie Infinite Scroll

### Parametry paginacji:
- **Limit na stronę:** 50 elementów
- **Całkowita liczba:** 120 elementów
- **Liczba stron:** 2.4 (3 requesty)

### Flow testowy:
```text
1. Initial load → 50 elementów (indeks 0-49)
2. Scroll down → 50 elementów (indeks 50-99)
3. Scroll down → 20 elementów (indeks 100-119)
4. hasMore = false (koniec listy)
```

## Wpływ na Frontend

### RecommendationCard
✅ Teraz wyświetla plakaty filmów  
✅ Poprawiony layout z obrazami (aspect-ratio 2/3)

### InfiniteScroll
✅ Może przetestować 3 pełne cykle ładowania  
✅ Sentinel loader pojawi się 2 razy  
✅ "To wszystkie dostępne rekomendacje" pojawi się po 120 elementach

### useRecommendations Hook
✅ `markAsWatched` teraz wysyła prawdziwe URL plakatów  
✅ Optimistic UI działa z pełnymi danymi

## Pliki Zmodyfikowane

- ✅ `src/lib/services/recommendations.service.ts` - główna logika mock data
- ✅ `.ai/home-view-implementation-summary.md` - zaktualizowano status zadań

## Następne Kroki

### Dla pełnej implementacji:
1. ⏳ Implementacja prawdziwego RPC call do Supabase `get_recommendations()`
2. ⏳ Funkcja PostgreSQL zwracająca dane z tabel:
   - `creators` + `user_creators` (ulubieni)
   - `platforms` + `user_platforms` (subskrypcje)
   - `movies` (zewnętrzne dane filmów z poster_path)
3. ⏳ Dodanie autentykacji JWT (obecnie używa DEFAULT_USER_ID)

## Uwagi Techniczne

### Generowanie UUID
- ID rekomendacji: `550e8400-e29b-41d4-a716-{nnnnnnnn}0001`
  - Format: `8-4-4-4-12` znaków hex (prawidłowy UUID v4)
  - Index padowany do 8 znaków + suffix 4 znaki = 12 znaków
  - Przykład: `550e8400-e29b-41d4-a716-000000500001` (element 50)
- ID twórców: `650e8400-e29b-41d4-a716-{hex(i*3+n)}`
  - Konwersja do hex + padStart(12, "0")
  - Przykład: `650e8400-e29b-41d4-a716-000000000001`
- ✅ **FIX v2:** Naprawiono błąd walidacji UUID (ostatni segment musi mieć dokładnie 12 znaków hex)

### External Movie IDs
- Format: `{imdb_id}_{variation}` (np. `tt0133093_0`, `tt0133093_1`)
- Pozwala na rozróżnienie wariantów tego samego filmu

### Performance
- Wszystkie 120 elementów generowane raz przy pierwszym wywołaniu
- Cursor-based pagination przez `Array.slice()` jest O(n)
- Dla produkcji: zamienić na prawdziwe query do bazy danych

## Weryfikacja

### Sprawdź w przeglądarce:
1. Otwórz `/home`
2. Sprawdź czy karty mają plakaty
3. Przewiń w dół - powinieneś załadować 120 elementów (3 requesty)
4. Network tab: `GET /api/recommendations?limit=50&cursor=...`

### Oczekiwany rezultat:
✅ Wszystkie karty z plakatami  
✅ Smooth infinite scroll  
✅ Loader pojawia się podczas ładowania  
✅ Komunikat "To wszystkie dostępne rekomendacje" na końcu  

---

**Status:** ✅ Gotowe do testowania manualnego
