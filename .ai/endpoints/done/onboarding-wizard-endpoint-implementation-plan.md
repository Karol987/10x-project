# API Endpoint Implementation Plan: Onboarding Wizard

## 1. Przegląd punktu końcowego

Implementacja zestawu endpointów obsługujących proces "Onboarding Wizard". Proces ten pozwala nowym użytkownikom na skonfigurowanie swoich preferencji (platformy VOD i ulubieni twórcy) oraz śledzenie postępu tego procesu. Onboarding składa się z dwóch kroków zapisu danych, które zmieniają stan profilu użytkownika.

## 2. Szczegóły żądania

### GET `/api/onboarding/state`

* **Metoda HTTP**: `GET`
* **URL**: `/api/onboarding/state`
* **Parametry**: Brak (identyfikacja na podstawie JWT)

### PUT `/api/onboarding/platforms`

* **Metoda HTTP**: `PUT`
* **URL**: `/api/onboarding/platforms`
* **Request Body**: `OnboardingPlatformsCommand`

```json
{ "platform_ids": ["uuid-1", "uuid-2"] }

```

### PUT `/api/onboarding/creators`

* **Metoda HTTP**: `PUT`
* **URL**: `/api/onboarding/creators`
* **Request Body**: `OnboardingCreatorsCommand`

```json
{ "creator_ids": ["uuid-1", "uuid-2", "uuid-3"] }

```

## 3. Wykorzystywane typy

Zgodnie z `src/types.ts`:

* `OnboardingStateDTO` - odpowiedź stanu.
* `OnboardingPlatformsCommand` - walidacja i wejście platform.
* `OnboardingCreatorsCommand` - walidacja i wejście twórców.
* `UUID` - typ bazowy dla identyfikatorów.

## 4. Szczegóły odpowiedzi

| Endpoint | Sukces (Kod) | Treść sukcesu | Błąd (Kod) |
| --- | --- | --- | --- |
| `GET /state` | `200 OK` | `{ "step": 0 | 1 | 2 }` | `401`, `500` |
| `PUT /platforms` | `204 No Content` | — | `400`, `401`, `422`, `500` |
| `PUT /creators` | `204 No Content` | — | `400`, `401`, `422`, `500` |

## 5. Przepływ danych

### Krok 1: Pobieranie stanu

1. Middleware sprawdza autentykację.
2. `OnboardingService` pobiera kolumnę `onboarding_status` z tabeli `profiles` dla `user_id`.
3. Mapowanie statusu:

* `not_started` -> `step: 0`
* `platforms_completed` (nowy status) -> `step: 1`
* `completed` -> `step: 2`

### Krok 2: Wybór platform

1. Walidacja Zod: czy tablica `platform_ids` ma min. 1 element.
2. Rozpoczęcie operacji w `OnboardingService`:

* Usunięcie wszystkich rekordów z `user_platforms` dla danego `user_id` (pełne zastąpienie).
* Wstawienie nowych powiązań do `user_platforms`.
* Aktualizacja `profiles.onboarding_status` na `platforms_completed`.

### Krok 3: Wybór twórców

1. Walidacja Zod: czy tablica `creator_ids` ma min. 3 elementy.
2. Rozpoczęcie operacji w `OnboardingService`:

* Usunięcie wszystkich rekordów z `user_creators` dla danego `user_id`.
* Wstawienie nowych powiązań do `user_creators`.
* Aktualizacja `profiles.onboarding_status` na `completed`.

## 6. Względy bezpieczeństwa

* **Authentication**: Wszystkie trasy muszą być chronione. Użycie `context.locals.supabase.auth.getUser()` do pobrania bezpiecznego `user_id`.
* **Authorization**: Użytkownik może modyfikować tylko własne dane (klauzula `WHERE user_id = auth.uid()` w zapytaniach Supabase/RLS).
* **Data Validation**:
* Zod wymusza format UUID.
* Ograniczenie wielkości tablic w body (np. max 50 platform/twórców), aby zapobiec ataku DoS na bazę.

## 7. Obsługa błędów

* `401 Unauthorized`: Brak sesji użytkownika.
* `422 Unprocessable Entity`: Zwracane, gdy `platform_ids.length < 1` lub `creator_ids.length < 3`.
* `400 Bad Request`: Niepoprawny format JSON lub UUID.
* `404 Not Found`: Jeśli profil użytkownika nie istnieje w tabeli `profiles` (mimo istnienia w `auth.users`).

## 8. Wydajność

* **Batching**: Użycie pojedynczego zapytania `.insert()` z tablicą obiektów dla tabel łączących `user_platforms` i `user_creators`.
* **Indeksy**: Upewnienie się, że tabele `user_platforms` i `user_creators` mają indeksy na `user_id` (zgodnie ze specyfikacją FK i UNIQUE).

## 9. Etapy wdrożenia

### Krok 1: Serwis (Backend Logic)

1. Utwórz plik `src/lib/services/onboarding.service.ts`.
2. Zaimplementuj metodę `getOnboardingState(supabase: SupabaseClient)`:

* Pobierz profil, zwróć zmapowany krok.

3. Zaimplementuj metodę `updatePlatforms(supabase: SupabaseClient, platformIds: string[])`:

* Użyj transakcji (lub sekwencji zapytań w Edge Function).
* Usuń stare platformy, dodaj nowe, zaktualizuj status.

4. Zaimplementuj metodę `updateCreators(supabase: SupabaseClient, creatorIds: string[])`:

* Analogicznie: usuń starych twórców, dodaj nowych, ustaw status na `completed`.

### Krok 2: Walidacja (Schemas)

1. Zdefiniuj schematy Zod w `src/lib/validations/onboarding.schema.ts`:

* `OnboardingPlatformsSchema`: `array(uuid).min(1)`
* `OnboardingCreatorsSchema`: `array(uuid).min(3)`

### Krok 3: Endpointy API (Astro)

1. Utwórz `src/pages/api/onboarding/state.ts` (GET).

* Pamiętaj o `export const prerender = false`.

2. Utwórz `src/pages/api/onboarding/platforms.ts` (PUT).

* Walidacja Zod, wywołanie serwisu, zwrot 204.

3. Utwórz `src/pages/api/onboarding/creators.ts` (PUT).

* Walidacja Zod, wywołanie serwisu, zwrot 204.

### Krok 4: Integracja i Testy

1. Przetestuj przepływ: `GET state` (0) -> `PUT platforms` -> `GET state` (1) -> `PUT creators` -> `GET state` (2).
2. Speryfikuj limity walidacji (np. wysłanie 2 twórców zamiast 3).

Would you like me to generate the Zod validation schemas and the `OnboardingService` implementation for this plan?
