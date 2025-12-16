# API Endpoint Implementation Plan: POST /me/watched

## 1. Przegląd punktu końcowego

Endpoint umożliwia zalogowanemu użytkownikowi oznaczenie filmu lub serialu jako obejrzanego. Wstawia jeden wiersz do tabeli `watched_items` i zwraca reprezentację dodanego rekordu.

## 2. Szczegóły żądania

- Metoda HTTP: **POST**
- Ścieżka URL: `/api/me/watched`
- Autoryzacja: Wymagany nagłówek `Authorization: Bearer <jwt>` (walidowany przez Astro middleware + Supabase)
- Request Body `WatchedItemCreate` (Content-Type: `application/json`):
  - `external_movie_id` *string* – ID filmu/serialu w zewnętrznym API **(wymagane)**
  - `media_type` *"movie" | "series"* – enum `media_type` **(wymagane)**
  - `title` *string* – tytuł produkcji **(wymagane, ≥ 1 znak)**
  - `year` *number* – rok produkcji *(opcjonalny)*
  - `meta_data` *object* – dowolny JSON, **musi zawierać klucz `poster_path` (string)**

## 3. Wykorzystywane typy

- **Command**: `WatchedItemCreateCommand` (`src/types.ts` l.128-130)
- **DTO (response)**: `WatchedItemDTO` (`src/types.ts` l.122-127)
- **Enum**: `MediaType` (`src/types.ts` l.16)

## 4. Szczegóły odpowiedzi

| Status | Opis | Body |
|--------|------|------|
| 201 Created | Rekord utworzono pomyślnie | `WatchedItemDTO` |
| 400 Bad Request | Walidacja Zod nie powiodła się | `{ error: "Validation error", details: zod.errors }` |
| 401 Unauthorized | Brak / nieprawidłowy JWT | `{ error: "Unauthorized" }` |
| 409 Conflict | Rekord już istnieje (UNIQUE) | `{ error: "Already marked as watched" }` |
| 500 Internal Server Error | Nieoczekiwany błąd | `{ error: "Internal server error" }` |

## 5. Przepływ danych

1. Router (`src/pages/api/me/watched.ts`) odbiera żądanie POST.
2. Middleware weryfikuje JWT i udostępnia `locals.supabase` oraz `user.id`.
3. Body jest parsowane i walidowane Zod-schematem `WatchedItemCreateSchema` (`src/lib/schemas/watched.schema.ts`).
4. Handler POST wywołuje `watchedService.create(userId, payload)`.
5. Service wykonuje `INSERT … RETURNING *` do tabeli `watched_items` z Supabase JS; kolumna `user_id` ustawiana z auth.uid().
6. Jeśli Postgres zgłosi błąd 23505 (UNIQUE) → mapujemy na HTTP 409.
7. Zwracamy 201 + sformatowany `WatchedItemDTO`.

## 6. Względy bezpieczeństwa

- Autoryzacja przez Supabase JWT; brak tokenu → 401.
- RLS na `watched_items` gwarantuje, że użytkownik może zapisywać tylko własne wiersze.
- Brak możliwości nadpisania `user_id` – ustawiany po stronie serwera.
- Walidacja typów + długości pól minimalizuje ryzyko SQL-injection / DoS.
- Nagłówki `Cache-Control: no-store, private`.

## 7. Obsługa błędów

| Sytuacja | Kod HTTP | Szczegóły |
|----------|----------|-----------|
| Nieprawidłowe pole lub brak wymaganych danych | 400 | Zod errors array |
| JWT brak/błędny | 401 | – |
| Duplikat `(user_id, external_movie_id, media_type)` | 409 | Sprawdzony przez Postgresa; komunikat użytkownika przyjazny |
| Dowolny inny błąd Supabase / wyjątek JS | 500 | Logujemy do console oraz, docelowo, tabeli `error_logs` |

## 8. Rozważania dotyczące wydajności

- Pojedynczy INSERT → operacja w O(1); brak ostrych wymagań.
- Dodamy index na kolumnach `(user_id, external_movie_id, media_type)` (już istnieje dzięki UNIQUE) – zapytanie INSERT/SELECT szybkie.
- Brak potrzeby transakcji – pojedyncza operacja.

## 9. Etapy wdrożenia

1. **Schema**: utwórz `src/lib/schemas/watched.schema.ts` z `WatchedItemCreateSchema` (Zod).
2. **Service**: utwórz `src/lib/services/watched.service.ts`:

   ```ts
   export const createWatchedItem = async (supabase: SupabaseClient, userId: UUID, cmd: WatchedItemCreateCommand) => { … };
   ```

3. **API Route**: `src/pages/api/me/watched.ts`:
   - `export const POST: APIRoute`
   - `export const prerender = false;`
   - Pobranie userId z `locals`, walidacja body, wywołanie service, mapowanie błędów.
4. **Docs**: zaktualizuj `api-plan.md` sekcję przykładów curl.
5. **Monitoring**: dopisz logowanie błędów 500 do `watched_error_logs` (poza MVP).
