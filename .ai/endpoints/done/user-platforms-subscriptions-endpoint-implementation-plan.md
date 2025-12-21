# API Endpoint Implementation Plan: User Platforms Management

## 1. Przegląd punktu końcowego

Endpoint `/me/platforms` umożliwia użytkownikom zarządzanie listą subskrybowanych platform VOD (np. Netflix, HBO Max). Jest to kluczowy element procesu personalizacji treści, pozwalający systemowi filtrować rekomendacje na podstawie dostępności filmów na platformach posiadanych przez użytkownika.

## 2. Szczegóły żądania

### GET `/me/platforms`

* **Metoda HTTP**: GET
* **Struktura URL**: `/api/me/platforms`
* **Parametry**: Brak (identyfikacja przez sesję Supabase)

### PUT `/me/platforms`

* **Metoda HTTP**: PUT
* **Struktura URL**: `/api/me/platforms`
* **Request Body**:

```json
{
  "platform_ids": ["uuid-1", "uuid-2"]
}

```

* **Wymagania**:
* `platform_ids`: minimum 1 element, elementy muszą być poprawnymi UUID.

---

## 3. Wykorzystywane typy

Wszystkie typy pochodzą z `src/types.ts`:

* `PlatformDTO`: Obiekt odpowiedzi zawierający dane o platformie.
* `UserPlatformsReplaceCommand`: Model komendy dla metody PUT.
* `SupabaseClient`: Typ klienta z `src/db/supabase.client.ts`.

---

## 4. Szczegóły odpowiedzi

* **200 OK**: Zwracane przy poprawnym pobraniu (GET) lub zaktualizowaniu (PUT) listy.
* Body: `PlatformDTO[]`

* **400 Bad Request**: Nieprawidłowe dane wejściowe (np. pusta lista, błędne UUID).
* **401 Unauthorized**: Brak autoryzacji lub wygasła sesja.
* **500 Internal Server Error**: Błąd bazy danych.

---

## 5. Przepływ danych

### GET flow

1. Middleware sprawdza autoryzację i wstrzykuje `supabase` oraz `user` do `context.locals`.
2. Handler wywołuje `PlatformService.getUserPlatforms(userId)`.
3. Serwis wykonuje zapytanie do tabeli `user_platforms` z joinem do tabeli `platforms`.
4. Wyniki są mapowane na `PlatformDTO` i zwracane do klienta.

### PUT flow

1. Handler odbiera body i waliduje je przy użyciu Zod.
2. Wywołanie `PlatformService.replaceUserPlatforms(userId, platformIds)`.
3. Wewnątrz serwisu (najlepiej w transakcji):

* Usunięcie wszystkich wpisów w `user_platforms` dla danego `user_id`.
* Wstawienie nowych rekordów na podstawie `platformIds`.

4. Pobranie pełnych danych nowych platform z tabeli `platforms`.
5. Zwrócenie zaktualizowanej listy jako `PlatformDTO[]`.

---

## 6. Względy bezpieczeństwa

* **Autoryzacja**: Każde żądanie musi posiadać ważny token sesji Supabase. Wykorzystujemy `context.locals.supabase.auth.getUser()`.
* **Izolacja danych**: Zapytania SQL/PostgREST muszą zawsze zawierać filtr `.eq('user_id', user.id)`, aby uniemożliwić dostęp do danych innych osób.
* **Walidacja referencji**: Przy metodzie PUT należy upewnić się (poprzez FK w bazie danych), że wszystkie przesłane `platform_ids` istnieją w tabeli `platforms`. Jeśli baza zwróci błąd klucza obcego, endpoint powinien zwrócić `400 Bad Request`.

---

## 7. Obsługa błędów

| Scenariusz | Kod statusu | Komunikat (JSON) |
| --- | --- | --- |
| Brak sesji | 401 | `{ "error": "Unauthorized Access" }` |
| Pusta tablica `platform_ids` | 400 | `{ "error": "At least one platform must be selected" }` |
| Nieprawidłowe UUID | 400 | `{ "error": "Invalid platform ID format" }` |
| Błąd bazy danych (np. timeout) | 500 | `{ "error": "Internal Server Error" }` |

---

## 8. Rozważania dotyczące wydajności

* **Caching**: Ponieważ lista platform jest relatywnie mała, można rozważyć cache'owanie odpowiedzi GET po stronie klienta (React Query / SWR).
* **N+1 Problem**: Zapytanie w serwisie musi używać joinowania (select platform:platforms(...)), aby pobrać dane platform jednym zapytaniem, zamiast wysyłać osobne zapytania dla każdego ID.

---

## 9. Etapy wdrożenia

### Krok 1: Definicja Schematu Walidacji

Utwórz plik `src/lib/validations/platforms.schema.ts` i zdefiniuj schemat Zod dla komendy PUT.

### Krok 2: Serwis Logiki Biznesowej

Utwórz/Zaktualizuj `src/lib/services/platform.service.ts`:

* Zaimplementuj metodę `getUserPlatforms`.
* Zaimplementuj metodę `replaceUserPlatforms` (użyj `.delete().eq('user_id', id)` a następnie `.insert()`).

### Krok 3: Endpoint Astro

Utwórz plik `src/pages/api/me/platforms.ts`:

* Ustaw `export const prerender = false`.
* Zaimplementuj handler `GET` korzystając z serwisu.
* Zaimplementuj handler `PUT` z walidacją Zod i wywołaniem serwisu.
* Dodaj obsługę błędów w blokach `try...catch` zgodnie z wytycznymi "Clean Code".

### Krok 4: Integracja z Middleware

Upewnij się, że middleware w `src/middleware/index.ts` poprawnie obsługuje ścieżki `/api/me/*`, weryfikując sesję użytkownika i uzupełniając `context.locals`.

### Krok 5: Testy

* Zweryfikuj, czy GET zwraca poprawną listę.
* Zweryfikuj, czy PUT nadpisuje dane i nie pozwala na pustą listę.
* Sprawdź zachowanie przy próbie wysłania nieistniejącego UUID platformy.
