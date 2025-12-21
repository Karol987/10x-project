# API Endpoint Implementation Plan: Onboarding State Retrieval

Ten dokument opisuje szczegółowy plan implementacji punktu końcowego `GET /onboarding/state`, który zarządza postępem użytkownika w procesie konfiguracji konta (Onboarding Wizard).

## 1. Przegląd punktu końcowego

Endpoint służy do synchronizacji stanu interfejsu użytkownika (UI) z faktycznym postępem zapisanym w bazie danych. Na podstawie przypisanych platform VOD i ulubionych twórców, API oblicza, na którym etapie wizardu powinien znajdować się użytkownik.

## 2. Szczegóły żądania

* **Metoda HTTP**: `GET`
* **Struktura URL**: `/api/onboarding/state`
* **Uwierzytelnianie**: Wymagane (JWT via Supabase Auth)
* **Parametry**:
* *Brak parametrów zapytania (Query Params).*
* *Brak treści żądania (Request Body).*

## 3. Wykorzystywane typy

Zgodnie z `src/types.ts`:

```typescript
// Response DTO
export interface OnboardingStateDTO {
  step: 0 | 1 | 2; // Zmapowane z onboarding_status
}

```

## 4. Szczegóły odpowiedzi

* **200 OK**: Zwraca aktualny krok.

```json
{ "step": 1 }

```

* **401 Unauthorized**: Użytkownik nie jest zalogowany.
* **422 Unprocessable Entity**: Niezgodność stanu danych (np. użytkownik jest na kroku 1, ale usunął wszystkie platformy).
* **500 Internal Server Error**: Błąd bazy danych.

## 5. Przepływ danych

1. **Middleware**: Sprawdza ważność sesji użytkownika i wstrzykuje `supabase` do `context.locals`.
2. **Endpoint Handler**: Wywołuje `OnboardingService`.
3. **OnboardingService**:

* Pobiera rekord z tabeli `profiles` dla `auth.uid()`.
* Pobiera licznik (count) z tabeli `user_platforms`.
* Pobiera licznik (count) z tabeli `user_creators`.
* **Logika mapowania**:
* Jeśli `onboarding_status` == `'not_started'` → `step: 0`.
* Jeśli `onboarding_status` == `'platforms_selected'`:
* Jeśli `platforms_count >= 1` → `step: 1`.
* W przeciwnym razie → `422 Error`.

* Jeśli `onboarding_status` == `'completed'`:
* Jeśli `platforms_count >= 1` ORAZ `creators_count >= 3` → `step: 2`.
* W przeciwnym razie → `422 Error`.

4. **Response**: Zwraca zmapowany obiekt DTO.

## 6. Względy bezpieczeństwa

* **Row Level Security (RLS)**: Tabele `profiles`, `user_platforms` i `user_creators` muszą mieć aktywne polityki RLS ograniczające dostęp tylko do właściciela rekordu (`auth.uid() = user_id`).
* **Input Validation**: Mimo braku body, walidujemy czy `user_id` z sesji jest poprawnym formatem UUID.
* **Service Isolation**: Logika biznesowa jest odizolowana od warstwy HTTP w serwisie.

## 7. Obsługa błędów

* **Brak profilu**: Jeśli `profiles` nie istnieje dla danego UID, zwracamy `404` lub automatycznie tworzymy profil (zależnie od polityki rejestracji).
* **Early Returns**: W handlerze API stosujemy wzorzec guard clause dla braku sesji.
* **Logowanie**: Błędy 500 są logowane z pełnym stack trace'em do konsoli serwerowej (DigitalOcean logs).

## 8. Wydajność

* **Zapytania równoległe**: Użycie `Promise.all()` do jednoczesnego pobrania statusu profilu oraz liczników z tabel łączących, aby zminimalizować czas odpowiedzi (latency).
* **Indeksowanie**: Upewnienie się, że kolumny `user_id` w `user_platforms` i `user_creators` posiadają indeksy (standard w PK/FK Supabase).

## 9. Etapy wdrożenia

1. **Service**: Utworzenie `src/lib/services/onboarding.service.ts` i implementacja metody `getOnboardingState`.
2. **Mapping Helper**: Dodanie funkcji pomocniczej zamieniającej enum DB na wartości `0, 1, 2`.
3. **API Route**: Utworzenie pliku `src/pages/api/onboarding/state.ts`.

* Ustawienie `export const prerender = false`.
* Implementacja handlera `GET` z wykorzystaniem `context.locals.supabase`.

4. **Validation**: Dodanie schematu Zod do weryfikacji struktury odpowiedzi przed wysłaniem.
5. **Testing**:

* Test manualny (Postman/Curl) z aktywnym tokenem.
* Test przypadku granicznego: Ustawienie statusu na 'completed' przy braku twórców (oczekiwane 422).
