# Implementacja serwisu integracji Movie of the Night (MOTN)

Twoim zadaniem jest zaimplementowanie `VodService` w oparciu o dostarczony plan implementacji, dokumentację API oraz zasady projektu. Twoim celem jest stworzenie solidnej warstwy integracji, która obsługuje hybrydowy model pobierania danych (TMDb + MOTN) oraz efektywnie zarządza limitami API poprzez caching w bazie danych.

Najpierw dokładnie przeanalizuj plan implementacji:
<implementation_plan>
@.ai/vod-api-integration-plan.md
</implementation_plan>

Zapoznaj się z dokumentacją API (szczególnie sekcja "Architektura Rozwiązania dla MVP"):
<api_documentation>
@.ai/Movie_of_the_Night_API_Documentation.md
</api_documentation>

Sprawdź schemat tabeli cache:
<cache_schema>
@supabase/migrations/20260118120000_create_vod_availability_cache.sql
</cache_schema>

Oraz zasady implementacji:
<implementation_rules>
@.cursor/rules/backend.mdc
@.cursor/rules/shared.mdc
</implementation_rules>

Wdrażaj rozwiązanie iteracyjnie (max 3 kroki naraz), czekając na feedback.

### Kluczowe Założenia Architektoniczne (Hybrid Approach)

Zgodnie z dokumentacją, rozwiązanie musi łączyć dwa źródła danych:

1. **TMDb API**: Do wyszukiwania twórców, pobierania filmografii i podstawowych metadanych (Tytuł, Rok, Plakat).
2. **Movie of the Night API**: Wyłącznie do sprawdzania dostępności VOD (Streaming Availability) dla konkretnych tytułów.

### Szczegółowe Kroki Implementacji

#### 1. Konfiguracja i Typy

- Zaktualizuj `.env.example` o wymagane klucze: `TMDB_API_KEY`, `RAPIDAPI_KEY`, `RAPIDAPI_HOST`.
- W pliku `src/lib/services/vod.service.ts` (lub dedykowanym pliku typów) zdefiniuj interfejsy DTO zgodne z planem (`CreatorDTO`, `RecommendationDTO`).
- Zdefiniuj typy odpowiedzi dla API TMDb i MOTN przy użyciu `zod` do walidacji w czasie rzeczywistym.

#### 2. Implementacja `VodService` - Struktura

- Utwórz klasę `VodService` jako Singleton lub serwis eksportujący funkcje.
- Zaimplementuj prywatne metody pomocnicze do komunikacji HTTP:
  - `fetchFromTmdb<T>(endpoint: string, params: Record<string, string>)`
  - `fetchFromMotn<T>(endpoint: string, params: Record<string, string>)`
- Obsłuż specyficzne nagłówki dla każdego API (RapidAPI dla MOTN).

#### 3. Wyszukiwanie Twórców (`searchCreators`)

- Wykorzystaj endpoint TMDb `/search/person`.
- Zmapuj wyniki na `CreatorDTO`, filtrując osoby bez zdjęć lub o niskiej popularności (jeśli API pozwala).
- Obsłuż błędy i puste wyniki.

#### 4. System Rekomendacji (`getRecommendations`) - Core Logic

Ta metoda jest najbardziej złożona i wymaga orkiestracji:

1. **Pobierz filmy**: Dla podanych ID twórców pobierz ich filmografię z TMDb (`/person/{id}/movie_credits` lub `discover`).
2. **Deduplikacja**: Usuń powtarzające się tytuły (jeśli szukamy dla wielu twórców).
3. **Sprawdzenie Cache (Kluczowe)**:
    - Przed zapytaniem do MOTN, sprawdź tabelę `vod_availability_cache` dla każdego `tmdb_id` w danym kraju (`pl`).
    - Użyj `last_updated_at` by respektować 24h TTL.
4. **Zapytanie do MOTN (tylko brakujące/stare dane)**:
    - Dla filmów nieobecnych w cache, odpytaj endpoint `/shows/{id}` w MOTN (obsługuje `tmdb_id`).
    - **UWAGA**: Limit 100 zapytań/dzień. Implementuj to ostrożnie. Jeśli to możliwe, sprawdzaj dostępność tylko dla topowych filmów (np. najnowszych), by nie spalić limitu.
    - Zapisz wyniki do `vod_availability_cache` (Upsert).
5. **Filtrowanie**:
    - Połącz dane o filmach z danymi o dostępności.
    - Zwróć tylko te filmy, które są dostępne w modelu **subscription (flatrate)** na platformach wybranych przez użytkownika.
6. **Mapowanie**: Zwróć `RecommendationDTO`.

#### 5. Obsługa Błędów i Odporność

- Zaimplementuj mapowanie błędów HTTP na błędy domenowe.
- Szczególna obsługa kodu `429` (Too Many Requests) z MOTN - serwis nie może przestać działać, powinien np. zwrócić wyniki bez informacji o dostępności (z odpowiednim flagowaniem) lub pominąć te filmy.
- Logowanie błędów po stronie serwera.

#### 6. Testowanie

- Przygotuj unit testy dla parserów/mapperów danych.
- Zasugeruj sposób manualnego przetestowania (np. endpoint API zwracający wynik dla "Christopher Nolan" i "Netflix").

### Wymagania Niefunkcjonalne

- **Typowanie**: Pełne, ścisłe typowanie TypeScript. Żadnego `any`.
- **Zmienne**: Używaj `import.meta.env` (Astro).
- **Bezpieczeństwo**: Nie loguj kluczy API w konsoli.
- **Wydajność**: Minimalizuj liczbę zapytań do MOTN wykorzystując cache SQL.

Pamiętaj o ścisłym przestrzeganiu zasad z pliku `shared.mdc` i `backend.mdc`.
