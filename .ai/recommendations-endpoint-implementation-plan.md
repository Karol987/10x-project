# API Endpoint Implementation Plan: GET /recommendations

## 1. Przegląd punktu końcowego

Zwraca do 50 rekomendowanych tytułów spełniających **oba** kryteria:

1. Posiadają co-najmniej jednego twórcę oznaczonego przez użytkownika jako *ulubiony* (`user_creators`).
2. Są dostępne na platformach, które użytkownik subskrybuje (`user_platforms`).

Endpoint służy do zasilenia ekranu „Polecane” w aplikacji. Realizuje paginację *forward-cursor* (`?cursor=<uuid>`) i wymaga uwierzytelnienia JWT Supabase.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **URL**: `/api/recommendations`
- **Query params**:
  - `cursor` *(opcjonalny)* – `uuid` ostatniego rekordu z poprzedniej strony.
  - `limit` *(opcjonalny)* – `int` 1-50, domyślnie 50 ➊  
    *(obsługujemy globalny kontrakt paginacji; brak w specyfikacji, ale występuje w sekcji 2. Endpoints)*
- **Nagłówki**:
  - `Authorization: Bearer <jwt>` – token Supabase (wymagany).

## 3. Wykorzystywane typy

- `PaginationQuery` *(z `src/types.ts`)* – wspólna definicja `limit` & `cursor`.
- `RecommendationDTO` – struktura pojedynczej rekomendacji.
- `RecommendationCreatorDTO`, `PlatformSlug` – typy zagnieżdżone.

## 4. Szczegóły odpowiedzi

- **Status 200 OK** – JSON-owa tablica `RecommendationDTO[]` (max 50 elementów).

Struktura jednego obiektu:

```json
{
  "id": "uuid",
  "external_movie_id": "string",
  "media_type": "movie" | "series",
  "title": "The Movie",
  "year": 2025,
  "creators": [
    { "id": "uuid", "name": "Keanu Reeves", "creator_role": "actor", "is_favorite": true }
  ],
  "platforms": [ "netflix", "hbo-max" ]
}
```

## 5. Przepływ danych

1. **Middleware** (`src/middleware/index.ts`) weryfikuje JWT i wstrzykuje `locals.supabase` oraz `locals.user`.
2. **Endpoint** (`src/pages/api/recommendations.ts`) odbiera żądanie, parsuje i waliduje query (Zod ➜ `PaginationQuerySchema`).
3. Endpoint deleguje do **Service** `RecommendationsService.get(userId, { limit, cursor })` w `src/lib/services/recommendations.service.ts`.
4. Service wywołuje **edge function / widok** `rpc('get_recommendations', { user_id, cursor, limit })` w Supabase.
5. Funkcja SQL łączy:
   - `user_creators` ⇄ `creators` ⇄ `movie_cast`
   - `user_platforms` ⇄ `movie_platforms`
   - filtruje wspólną część zbiorów, sortuje po `id`, ogranicza `limit + 1` rekordów.
6. Service mapuje wynik do `RecommendationDTO[]`, ustawia `next_cursor` (jeśli pobrano `limit+1` rekordów).
7. Endpoint zwraca status 200 z tablicą wyników i nagłówkiem `Cache-Control: no-store, private`.

Diagram skrócony:
`Client → /api/recommendations → Astro Endpoint → RecommendationsService → Supabase RPC → Postgres`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: JWT Supabase obowiązkowe – brak → 401.
- **Autoryzacja**: Funkcja SQL działa w kontekście RLS; użytkownik widzi tylko swoje dane pośrednie.
- **Walidacja wejścia**: Zod (`uuid` & `int 1-50`). Odmowa → 400.
- **Rate limiting**: globalne 100 req/min/IP (+ możliwe 20 req/min/user w middleware).
- **SQL injection**: brak ryzyka – tylko parametry binarne (uuid/int) przekazywane do RPC.
- **CSRF**: nie dotyczy (token w nagłówku).

## 7. Obsługa błędów

| Kod | Scenariusz | Treść odpowiedzi |
|-----|------------|------------------|
| 400 Bad Request | Niepoprawny `cursor`/`limit` | `{ error: 'InvalidQuery', message: 'cursor must be a UUID' }` |
| 401 Unauthorized | Brak / nieważny JWT | `{ error: 'Unauthorized' }` |
| 404 Not Found | (N/A – brak pojedynczego zasobu) | — |
| 500 Internal Server Error | Niespodziewany wyjątek / błąd RPC | `{ error: 'ServerError', message: 'Unexpected error' }` + log |  

**Logowanie błędów**: w bloku `try/catch` wysyłamy `console.error` (Edge logs) + opcjonalnie insert do tabeli `api_errors` z polami `(endpoint, user_id, payload, error, created_at)`.

## 8. Rozważania dotyczące wydajności

- **Indeksy** w Postgres na kolumnach łączących (`user_id`, `creator_id`, `platform_id`, `external_movie_id`).
- **Materialized view** / cache dla kosztownego łączenia wielu tabel; odświeżanie co X h lub po webhooku.
- **Limit + 1** technika paginacji by obliczyć `next_cursor` bez `COUNT(*)`.
- **Edge Function** wykonuje się w regionie bliskim bazy, minimalizując latency.
- **Compression**: `Content-Encoding: gzip` przez Vercel/Astro.

## 9. Etapy wdrożenia

1. **SQL**: utworzenie widoku / funkcji `get_recommendations(user_id uuid, cursor uuid, lim int)` + testy jednostkowe w Postgres.
2. **Service**: `src/lib/services/recommendations.service.ts` – wrapper na RPC + DTO mapping. Na tym etapie developmentu skorzystamy z mocków zamiast wywoływania API.
3. **Schema**: `src/lib/schemas/recommendations.schema.ts` – Zod dla query & response (można generować typy).
4. **Endpoint**: `src/pages/api/recommendations.ts` – implementacja handlera GET zgodnie z Astro guidelines.

---
➊ *Choć spec wspomina tylko `cursor`, cały system paginacji opisany w §2 Endpoints zakłada również `limit`; obsługujemy go dla spójności API.*
