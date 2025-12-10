# API Endpoint Implementation Plan: `/profile`

## 1. Przegląd punktu końcowego
- Cel: udostępnić własny profil użytkownika oraz (opcjonalnie, tylko dla admina) zaktualizować `onboarding_step`.
- Lokalizacja: Astro route `src/pages/api/profile.ts` (lub `profile/index.ts`), bazująca na Supabase (JWT + RLS).
- Zależności: Supabase client z `context.locals.supabase`, typy DTO z `src/types.ts`, walidacja Zod.

## 2. Szczegóły żądania
- Metody/URL: `GET /api/profile` (odczyt), `PATCH /api/profile` (aktualizacja kroku).
- Parametry:
  - Wymagane: brak parametrów ścieżki/query.
  - Opcjonalne: brak.
- Nagłówki: `Authorization: Bearer <jwt>` (wymagane), `Content-Type: application/json` dla PATCH.
- Body (tylko PATCH): `{ "onboarding_step": number }` zgodne z `ProfileUpdateCommand`; ograniczenia: integer, zakres 0–2.
- Autoryzacja biznesowa: PATCH tylko dla admina (np. `app_metadata.role === "admin"` lub token service role); GET dla zalogowanego użytkownika.

## 3. Wykorzystywane typy
- DTO: `ProfileDTO` (`user_id`, `created_at`, `onboarding_step`).
- Command: `ProfileUpdateCommand` (pole `onboarding_step`).
- Pomocnicze: `UUID` z `src/types.ts`.

## 4. Szczegóły odpowiedzi
- Sukces:
  - GET `200 OK` → `ProfileDTO`.
  - PATCH `200 OK` → zaktualizowany `ProfileDTO`.
- Błędy:
  - `400 Bad Request` – nieprawidłowe dane (walidacja Zod, zakres).
  - `401 Unauthorized` – brak/niepoprawny token.
  - `404 Not Found` – profil nie istnieje (teoretycznie nie powinno się zdarzyć dzięki triggerowi tworzącemu profil).
  - `500 Internal Server Error` – nieoczekiwany błąd / błąd Supabase.

## 5. Przepływ danych
1) Middleware/handler pobiera `supabase` i sesję z `locals`.
2) Walidacja JWT → `userId = session.user.id`; brak → 401.
3a) GET: `profileService.getByUserId(userId)` → `select ... from profiles where user_id = userId limit 1`; zwróć DTO.
3b) PATCH:
   - Sprawdź uprawnienie admina (custom claim lub service role); w przeciwnym razie 401/400.
   - Zwaliduj body Zod (integer 0–2).
   - `profileService.updateOnboardingStep(userId, onboarding_step)` → `update profiles set onboarding_step = ... where user_id = ... returning ...`.
4) Mapuj Supabase errors na kody HTTP; ustaw `Cache-Control: no-store`.

## 6. Względy bezpieczeństwa
- Uwierzytelnienie: Bearer JWT z Supabase; używaj `locals.supabase` (nie tworzyć nowego klienta).
- Autoryzacja: RLS egzekwuje dostęp tylko do własnego wiersza; dodatkowo twarde sprawdzenie roli admina dla PATCH.
- Walidacja: Zod schema na body; typ `onboarding_step` integer w zakresie; odrzuć nadmiarowe pola (`stripUnknown`).
- Audyt/logowanie: brak tabeli błędów w planie – loguj do serwera (console/logger) z korelacją requestu.
- Nagłówki: `Cache-Control: no-store, private`; CORS zgodnie z polityką globalną.

## 7. Obsługa błędów
- Walidacja: Zod → 400 z komunikatem; brak body → 400.
- Auth: brak sesji/tokena → 401.
- Uprawnienia admina niespełnione → 401/400 (wg decyzji produktu; zalecane 401 w tym MVP).
- Brak rekordu profilu → 404.
- Supabase error (np. db down) → 500; loguj szczegóły, bez ujawniania ich w odpowiedzi.

## 8. Rozważania dotyczące wydajności
- Zapytania pojedyncze, indeks PK na `profiles` wystarcza.
- Brak potrzeby cache po stronie API (dane użytkownika, no-store).
- Minimalizuj transport: wybieraj tylko potrzebne kolumny (select narrow).

## 9. Etapy wdrożenia
1) Dodaj serwis `src/lib/services/profile.service.ts` z metodami `getByUserId(userId: UUID): Promise<ProfileDTO>` i `updateOnboardingStep(userId: UUID, step: number): Promise<ProfileDTO>`.
2) Zdefiniuj schemat Zod w handlerze PATCH: `z.object({ onboarding_step: z.number().int().min(0).max(2) })`.
3) Utwórz route `src/pages/api/profile.ts`: pobierz `supabase` z `locals`, obsłuż GET/PATCH w switch/if na `request.method`, zastosuj walidację, sprawdź rolę admina, wołaj serwis, mapuj statusy.
4) Dodaj jednolite mapowanie błędów Supabase → (400/404/500) i walidacji → 400; ustaw nagłówki no-store.
