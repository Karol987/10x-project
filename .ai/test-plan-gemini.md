# Kompleksowy Plan Testów dla Projektu Streamly

## 1. Wprowadzenie i cele testowania

Celem niniejszego planu jest zapewnienie jakości, stabilności i bezpieczeństwa aplikacji Streamly (wersja MVP). Głównym naciskiem testów będzie weryfikacja poprawności działania kluczowych ścieżek użytkownika (Auth, Onboarding), niezawodności integracji z zewnętrznymi API (TMDb, MOTN) oraz poprawności mechanizmów buforowania danych.

## 2. Zakres testów

* **Backend & API:** Endpointy Astro, logika biznesowa w serwisach (`src/lib/services`), walidacja schematów Zod.
* **Frontend:** Komponenty React (interakcje, formularze), widoki Astro, Responsive Web Design (RWD).
* **Baza Danych:** Operacje CRUD, poprawność relacji, mechanizmy RLS (Row Level Security).
* **Integracje:** Komunikacja z API TMDb i Movie of the Night API.

**Wyłączenia z zakresu:**

* Testy wydajnościowe pod ekstremalnym obciążeniem (poza weryfikacją limitów API).
* Testy płatności (nie dotyczy MVP).

## 3. Typy testów

### 3.1. Testy Jednostkowe (Unit Testing)

Koncentracja na izolowanej logice biznesowej i funkcjach pomocniczych.

* **Narzędzie:** Vitest (kompatybilny z ekosystemem Vite/Astro).
* **Obszary:**
  * `src/lib/services/*`: Szczególnie `VodService` (logika parsowania, filtrowania, obsługa błędów).
  * `src/lib/utils.ts`: Funkcje pomocnicze.
  * `src/lib/schemas/*`: Walidacja poprawności schematów Zod (czy odrzucają błędne dane).
  * Hooki React (`useCreatorSelection`, `useRecommendations`) – testowanie logiki stanu.

### 3.2. Testy Komponentów (Component Testing)

Weryfikacja zachowania interfejsu użytkownika w izolacji.

* **Narzędzie:** React Testing Library + Vitest.
* **Obszary:**
  * Formularze autoryzacji (`LoginForm`, `RegisterForm`) – walidacja inputów, obsługa błędów API.
  * Karty (`RecommendationCard`, `PlatformCard`) – wyświetlanie danych, stany ładowania (Skeletons).
  * Elementy interaktywne (`CreatorChip`, `DeleteAccountDialog`).

### 3.3. Testy Integracyjne (Integration Testing)

Sprawdzenie współpracy między modułami (np. Astro API <-> Serwisy <-> Mockowana Baza).

* **Narzędzie:** Vitest / Supertest (dla endpointów API).
* **Obszary:**
  * Endpointy `/api/auth/*`: Proces rejestracji i logowania.
  * Endpointy `/api/recommendations`: Weryfikacja formatu odpowiedzi JSON.
  * Weryfikacja zapytań do bazy danych (poprzez lokalną instancję Supabase lub mocki).

### 3.4. Testy End-to-End (E2E)

Symulacja pełnych ścieżek użytkownika w przeglądarce.

* **Narzędzie:** Playwright.
* **Obszary:**
  * Pełny proces rejestracji i onboardingu.
  * Główny przepływ: Logowanie -> Przeglądanie rekomendacji -> Oznaczenie jako obejrzane -> Sprawdzenie historii.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie i Zarządzanie Kontem

| ID | Scenariusz | Oczekiwany rezultat | Priorytet |
|----|------------|---------------------|-----------|
| A01 | Rejestracja z poprawnymi danymi | Konto utworzone, przekierowanie do Onboardingu. | Krytyczny |
| A02 | Rejestracja z istniejącym e-mailem | Wyświetlenie komunikatu błędu, brak duplikatu w DB. | Wysoki |
| A03 | Logowanie (poprawne dane) | Utworzenie sesji, przekierowanie na Home. | Krytyczny |
| A04 | Usunięcie konta (Danger Zone) | Usunięcie danych z tabel `auth.users`, `profiles`, `user_creators`, `user_platforms`. | Wysoki |

### 4.2. Onboarding (Krytyczna ścieżka aktywacji)

| ID | Scenariusz | Oczekiwany rezultat | Priorytet |
|----|------------|---------------------|-----------|
| O01 | Wybór platform (min. 1) | Przycisk "Dalej" aktywny dopiero po wyborze 1 platformy. | Krytyczny |
| O02 | Wyszukiwanie twórców (API Mock) | Lista wyników filtruje się poprawnie, brak duplikatów. | Wysoki |
| O03 | Wybór twórców (min. 3) | Walidacja blokuje przejście dalej, jeśli wybrano < 3. | Krytyczny |
| O04 | Zapisanie preferencji | Dane trafiają do tabel `user_platforms` i `user_creators`. | Krytyczny |

### 4.3. Silnik Rekomendacji i VodService

| ID | Scenariusz | Oczekiwany rezultat | Priorytet |
|----|------------|---------------------|-----------|
| R01 | Generowanie rekomendacji (Happy Path) | Zwrócenie listy filmów dostępnych na wybranych platformach powiązanych z ulubionymi twórcami. | Krytyczny |
| R02 | Obsługa Cache (VodService) | Drugie zapytanie o ten sam film nie uderza do MOTN API (sprawdzenie logów/mocków). | Wysoki |
| R03 | Przekroczenie limitu API (429) | Serwis degraduje funkcjonalność (zwraca tylko zcacheowane dane lub pustą listę dostępności), aplikacja nie crashuje. | Średni |
| R04 | Filtrowanie obejrzanych | Filmy z tabeli `watched_items` nie pojawiają się w rekomendacjach. | Wysoki |

### 4.4. Historia i Interakcje

| ID | Scenariusz | Oczekiwany rezultat | Priorytet |
|----|------------|---------------------|-----------|
| H01 | Oznaczenie jako obejrzane (Optimistic UI) | Karta znika natychmiast, pojawia się toast sukcesu. W przypadku błędu API – wraca na listę. | Średni |
| H02 | Infinite Scroll (Historia) | Po przewinięciu do dołu ładuje się kolejna strona wyników. | Średni |

## 5. Środowisko testowe

* **Lokalne (Development):**
  * Node.js 22.14.0.
  * Lokalna instancja Supabase (za pomocą `supabase start`) - zapewnia izolację od bazy produkcyjnej.
  * Zmienne środowiskowe `.env.test` z kluczami do mockowanych lub piaskownicowych wersji zewnętrznych API.
* **CI/CD (GitHub Actions):**
  * Uruchamianie testów jednostkowych i linterów przy każdym Pull Request.
  * Uruchamianie testów E2E na zbuildowanej wersji produkcyjnej (`npm run build && npm run preview`).

## 6. Narzędzia do testowania

1. **Vitest:** Główny runner do testów jednostkowych i integracyjnych (zamiennik Jesta, szybszy dla Vite/Astro).
2. **React Testing Library:** Do testowania komponentów React.
3. **Playwright:** Do testów End-to-End (obsługa wielu przeglądarek, nagrywanie wideo z testów).
4. **MSW (Mock Service Worker):** Do przechwytywania i mockowania zapytań sieciowych (TMDb, MOTN) w testach jednostkowych/integracyjnych, aby nie zużywać limitów API.
5. **Supabase CLI:** Do stawiania lokalnego środowiska backendowego.

## 7. Harmonogram testów

1. **Faza 1: Konfiguracja (Dzień 1-2):** Instalacja Vitest, Playwright, konfiguracja MSW, ustawienie lokalnego Supabase.
2. **Faza 2: Testy Jednostkowe Serwisów (Dzień 3-4):** Pokrycie `VodService` (szczególnie cache i error handling) oraz walidacji Zod.
3. **Faza 3: Testy Komponentów i Integracyjne (Dzień 5-6):** Formularze Auth, Flow Onboardingu (logika UI).
4. **Faza 4: Testy E2E (Dzień 7):** Krytyczne ścieżki (Rejestracja -> Onboarding -> Rekomendacje).
5. **Faza 5: Testy Bezpieczeństwa (Dzień 8):** Weryfikacja włączenia RLS (naprawa migracji `20260107...`) i testy dostępu do danych innych użytkowników.

## 8. Kryteria akceptacji testów

* **Coverage:** Minimum 80% pokrycia kodu dla `src/lib/services` i `src/lib/utils`.
* **Pass Rate:** 100% testów E2E dla ścieżki krytycznej ("Happy Path") musi przechodzić przed wdrożeniem.
* **Linting:** Brak błędów ESLint i Prettier.
* **Security:** Weryfikacja, że RLS jest włączone dla tabel produkcyjnych (należy cofnąć lub nadpisać migrację wyłączającą RLS).

## 9. Role i odpowiedzialności

* **Developer:** Pisanie testów jednostkowych dla nowo tworzonego kodu (TDD mile widziane), utrzymanie zgodności typów TypeScript.
* **QA Engineer:** Tworzenie i utrzymanie scenariuszy E2E, konfiguracja środowiska CI/CD, weryfikacja przypadków brzegowych (np. API rate limits).

## 10. Procedury raportowania błędów

W przypadku wykrycia błędu, zgłoszenie (Issue w GitHub) musi zawierać:

1. **Opis:** Co nie działa?
2. **Kroki do reprodukcji:** Dokładna ścieżka.
3. **Oczekiwane vs Rzeczywiste zachowanie.**
4. **Kontekst:** Środowisko (przeglądarka, wersja Node), logi z konsoli.
5. **Priorytet:** (Krytyczny/Wysoki/Średni/Niski).

---

### Rekomendacja natychmiastowa (Action Items)

1. Zainstalować **Vitest** i **Playwright** (`npm install -D vitest @playwright/test`).
2. Skonfigurować **MSW**, aby uniknąć zużycia limitu 100 zapytań/dzień do MOTN API podczas developmentu i testów.
3. **Pilne:** Zweryfikować migrację `20260107011330_disable_rls_on_all_tables.sql` – wyłączenie RLS jest niedopuszczalne w wersji produkcyjnej, gdzie przechowujemy dane użytkowników. Testy bezpieczeństwa muszą potwierdzić, że użytkownik A nie widzi platform użytkownika B.
