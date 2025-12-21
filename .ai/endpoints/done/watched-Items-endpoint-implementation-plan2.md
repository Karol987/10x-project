# API Endpoint Implementation Plan: Watched Items Management

## 1. Przegląd punktu końcowego

Punkt końcowy `/me/watched` umożliwia użytkownikom zarządzanie ich historią obejrzanych produkcji (filmy/seriale). System pozwala na pobieranie listy w sposób wydajny (paginacja) oraz usuwanie pozycji, co wpływa na silnik rekomendacji i widok profilu użytkownika.

## 2. Szczegóły żądania

### GET `/me/watched`

* **Metoda HTTP**: `GET`
* **Struktura URL**: `/api/me/watched`
* **Parametry**:
* `cursor` (opcjonalny): UUID elementu, od którego ma się zacząć kolejna strona wyników.
* `limit` (opcjonalny): Liczba zwracanych rekordów (domyślnie 20).

### DELETE `/me/watched/:id`

* **Metoda HTTP**: `DELETE`
* **Struktura URL**: `/api/me/watched/:id`
* **Parametry**:
* `id` (wymagany): UUID rekordu w tabeli `watched_items` przekazywany w ścieżce URL.

---

## 3. Wykorzystywane typy

Będziemy korzystać z definicji zawartych w `src/types.ts`:

* `WatchedItemDTO`: Reprezentacja pojedynczego elementu na liście.
* `PaginatedResponse<WatchedItemDTO>`: Struktura odpowiedzi dla listy.
* `UUID`: Typ pomocniczy dla identyfikatorów.

---

## 4. Szczegóły odpowiedzi

| Status | Opis | Body |
| --- | --- | --- |
| **200 OK** | Pomyślne pobranie listy (GET) | `PaginatedResponse<WatchedItemDTO>` |
| **204 No Content** | Pomyślne usunięcie elementu (DELETE) | Brak |
| **400 Bad Request** | Nieprawidłowy format UUID lub parametrów | `{ error: "ValidationError", ... }` |
| **401 Unauthorized** | Brak autentykacji | `{ error: "Unauthorized" }` |
| **404 Not Found** | Zasób nie istnieje (DELETE) | `{ error: "NotFoundError" }` |
| **500 Server Error** | Błąd wewnętrzny | `{ error: "ServerError" }` |

---

## 5. Przepływ danych

1. **Middleware**: Sprawdza sesję użytkownika i wstrzykuje klienta Supabase do `context.locals`.
2. **Walidacja**: Endpoint API używa **Zod** do weryfikacji parametrów wejściowych (np. czy `:id` to poprawny UUID).
3. **Service Layer**:

* Kontroler wywołuje `WatchedService`.
* Usługa komunikuje się z Supabase PostgreSQL.
* Przy **GET**: Pobiera rekordy posortowane malejąco po `created_at`. Jeśli podano `cursor`, filtruje rekordy starsze niż data utworzenia elementu wskazanego przez kursor.
* Przy **DELETE**: Wykonuje usunięcie rekordu, upewniając się, że `user_id` zgadza się z ID zalogowanego użytkownika.

4. **Transformacja**: Dane z bazy są mapowane na format `WatchedItemDTO`.

---

## 6. Względy bezpieczeństwa

* **Row Level Security (RLS)**: Mimo walidacji w kodzie, tabela `watched_items` musi posiadać polityki RLS ograniczające dostęp tylko dla `auth.uid() = user_id`.
* **Input Sanitization**: Walidacja Zod zapobiega przekazaniu nieoczekiwanych typów danych.
* **Authentication**: Wszystkie żądania muszą przechodzić przez middleware sprawdzający JWT.

---

## 7. Obsługa błędów

* Wykorzystanie wzorca **Early Return** w handlerach API.
* Wszystkie operacje na bazie danych są otoczone blokami `try-catch`.
* Błędy walidacji zwracają szczegółowe informacje o polach (zgodnie ze specyfikacją `ValidationError`).

---

## 8. Rozważania dotyczące wydajności

* **Indeksowanie**: Upewnienie się, że tabela `watched_items` posiada indeks złożony na `(user_id, created_at)` dla szybkiego pobierania stronicowanego.
* **Keyset Pagination**: Użycie kursora zamiast `OFFSET` zapobiega degradacji wydajności przy głębokim stronicowaniu.

---

## 9. Etapy wdrożenia

1. **Definicja Schematów Zod**:

* Utworzenie `src/lib/validations/watched.schema.ts` dla parametrów query i path.

2. **Rozbudowa Service Layer**:

* Implementacja metod w `src/lib/services/watched.service.ts`:
* `getWatchedItems(client, userId, cursor, limit)`
* `deleteWatchedItem(client, userId, itemId)`

3. **Implementacja Endpointów Astro**:

* Utworzenie pliku `src/pages/api/me/watched/index.ts` dla metody `GET`.
* Utworzenie pliku `src/pages/api/me/watched/[id].ts` dla metody `DELETE`.

4. **Middleware**:

* Weryfikacja, czy middleware poprawnie obsługuje ścieżki `/api/me/*` pod kątem autentykacji.

5. **Testy Integracyjne**:

* Weryfikacja poprawnego usuwania własnych elementów i blokowania prób usunięcia elementów innych użytkowników.
* Testowanie paginacji przy dużej liczbie rekordów.

Would you like me to generate the Zod schemas and the Service logic code for this implementation?
