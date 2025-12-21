# API Endpoint Implementation Plan: Creators Dictionary

## 1. Przegląd punktu końcowego

Implementacja publicznego słownika twórców (aktorów i reżyserów). System umożliwia przeszukiwanie globalnej bazy twórców zsynchronizowanej z zewnętrznymi API (np. TMDB). Punkt końcowy wspiera paginację opartą na kursorach (keyset pagination) dla zapewnienia wysokiej wydajności przy dużych zbiorach danych.

## 2. Szczegóły żądania

### GET `/creators`

* **Metoda HTTP:** `GET`
* **Struktura URL:** `/api/creators`
* **Parametry zapytania (Query Params):**
* `q` (Opcjonalny): Fraza wyszukiwania (min. 2 znaki).
* `role` (Opcjonalny): `actor` lub `director`.
* `limit` (Opcjonalny): Domyślnie 20, max 100.
* `cursor` (Opcjonalny): UUID ostatnio pobranego rekordu do paginacji.

### GET `/creators/:id`

* **Metoda HTTP:** `GET`
* **Struktura URL:** `/api/creators/:id`
* **Parametry ścieżki:**
* `id` (Wymagany): UUID twórcy.

## 3. Wykorzystywane typy

Zdefiniowane w `src/types.ts`:

* `CreatorDTO`: Przesyłanie danych do frontendu.
* `CreatorSearchQuery`: Struktura parametrów wejściowych.
* `PaginatedResponse<T>`: Standardowa odpowiedź dla list.
* `CreatorRole`: Typ wyliczeniowy (actor/director).

## 4. Szczegóły odpowiedzi

* **200 OK (List):**

```json
{
  "data": [ { "id": "uuid", "name": "...", "creator_role": "actor", "avatar_url": "..." } ],
  "next_cursor": "uuid-or-null"
}

```

* **200 OK (Single):** Obiekt `CreatorDTO`.
* **400 Bad Request:** Błąd walidacji parametrów (np. nieprawidłowy format UUID).
* **404 Not Found:** Twórca nie istnieje w bazie danych.
* **500 Internal Server Error:** Błąd serwera/bazy danych.

## 5. Przepływ danych

1. **Client** wywołuje endpoint API w Astro.
2. **Astro Middleware** weryfikuje sesję (opcjonalnie, jeśli słownik jest publiczny, dopuszcza anonimowy dostęp przez klucz Supabase).
3. **API Route Handler** pobiera parametry i waliduje je przy użyciu schematu **Zod**.
4. **CreatorService** buduje zapytanie do Supabase:

* Jeśli podano `q`, używa `.ilike('name',`%${q}%`)`.
* Jeśli podano `role`, używa `.eq('creator_role', role)`.
* Jeśli podano `cursor`, dodaje filtr `.gt('id', cursor)` (przy założeniu sortowania po ID).
* Nakłada `.limit(limit + 1)` aby sprawdzić, czy istnieje następna strona.

5. **Service** mapuje wyniki z tabeli `creators` na `CreatorDTO`.
6. **API Route** zwraca odpowiedź JSON.

## 6. Względy bezpieczeństwa

* **Public access:** Słownik jest publiczny, ale dostęp do API powinien być ograniczony przez Supabase RLS (Row Level Security) ustawiony na `SELECT` dla roli `anon`.
* **Input Validation:** Zod rygorystycznie sprawdza typy, uniemożliwiając wstrzyknięcie nieoczekiwanych parametrów do zapytań SQL.
* **Rate Limiting:** Należy polegać na infrastrukturze DigitalOcean/Supabase, aby zapobiec nadużyciom endpointu wyszukiwania.

## 7. Obsługa błędów

* **Zod Error:** Jeśli walidacja zawiedzie, zwracany jest kod `400` z opisem pól, które nie przeszły walidacji.
* **Empty results:** Pusta tablica `data` z `next_cursor: null` przy kodzie `200` (brak wyników wyszukiwania).
* **Not Found:** Przy `GET /creators/:id`, jeśli Supabase zwróci pusty wynik, handler natychmiast zwraca `404`.
* **Database Error:** Przechwytywane w `try-catch`, logowane na serwerze, zwracany kod `500` z generycznym komunikatem.

## 8. Rozważania dotyczące wydajności

* **Indeksowanie:** Upewnić się, że kolumna `name` posiada indeks typu `gin` (dla wyszukiwania tekstowego) lub `btree` (jeśli wyszukujemy od początku frazy).
* **Keyset Pagination:** Użycie `cursor` zamiast `offset` zapewnia stałą wydajność niezależnie od głębokości paginacji.
* **Select fields:** Zapytania do bazy powinny pobierać tylko kolumny zdefiniowane w `CreatorDTO`, aby zredukować payload.

## 9. Etapy wdrożenia

1. **Definicja Schematów Zod:**

* Utworzenie `src/lib/validations/creators.schema.ts`.
* Definicja `creatorSearchSchema` oraz `creatorIdSchema`.

2. **Implementacja CreatorService:**

* Utworzenie `src/lib/services/creators.service.ts`.
* Implementacja metod `getPaginatedCreators` i `getCreatorById`.
* Dodanie logiki wyliczania `next_cursor` (pobranie N+1 elementów).

3. **Utworzenie API Routes w Astro:**

* `src/pages/api/creators/index.ts` (GET).
* `src/pages/api/creators/[id].ts` (GET).
* Ustawienie `export const prerender = false`.

4. **Middleware & Supabase Context:**

* Wykorzystanie `context.locals.supabase` do zapytań.

5. **Testy:**

* Weryfikacja wyszukiwania po nazwie.
* Weryfikacja filtrowania po roli.
* Weryfikacja poprawności przechodzenia do następnej strony (cursor).
