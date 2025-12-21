# Onboarding Wizard API - Przykłady użycia

## Przegląd

Implementacja trzech endpointów obsługujących proces onboardingu użytkownika:
- `GET /api/onboarding/state` - pobieranie stanu onboardingu
- `PUT /api/onboarding/platforms` - zapisywanie wybranych platform
- `PUT /api/onboarding/creators` - zapisywanie wybranych twórców

## Struktura plików

```
src/
├── lib/
│   ├── services/
│   │   └── onboarding.service.ts       # Logika biznesowa
│   └── schemas/
│       └── onboarding.schema.ts        # Walidacja Zod
└── pages/
    └── api/
        └── onboarding/
            ├── state.ts                # GET endpoint
            ├── platforms.ts            # PUT endpoint
            └── creators.ts             # PUT endpoint
```

## Przykłady użycia API

### 1. Pobieranie stanu onboardingu

**Request:**
```bash
GET /api/onboarding/state
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "step": "not_started"
}
```

Możliwe wartości `step`:
- `"not_started"` - użytkownik nie rozpoczął onboardingu
- `"platforms_selected"` - użytkownik wybrał platformy, ale nie twórców
- `"completed"` - onboarding zakończony

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: User not authenticated"
}
```

**Response (404 Not Found):**
```json
{
  "error": "User profile not found"
}
```

---

### 2. Zapisywanie wybranych platform

**Request:**
```bash
PUT /api/onboarding/platforms
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "platform_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response (204 No Content):**
Sukces - brak treści w odpowiedzi.

**Response (400 Bad Request):**
```json
{
  "error": "Invalid JSON format"
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "platform_ids",
      "message": "At least 1 platform must be selected"
    }
  ]
}
```

**Response (422 - Invalid UUID):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "platform_ids.0",
      "message": "Invalid UUID format"
    }
  ]
}
```

**Response (422 - Foreign Key Violation):**
```json
{
  "error": "One or more platform IDs are invalid"
}
```

---

### 3. Zapisywanie wybranych twórców

**Request:**
```bash
PUT /api/onboarding/creators
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "creator_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002",
    "660e8400-e29b-41d4-a716-446655440003"
  ]
}
```

**Response (204 No Content):**
Sukces - brak treści w odpowiedzi.

**Response (422 Unprocessable Entity):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "creator_ids",
      "message": "At least 3 creators must be selected"
    }
  ]
}
```

**Response (422 - Too Many Items):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "creator_ids",
      "message": "Maximum 50 creators allowed"
    }
  ]
}
```

---

## Przepływ onboardingu (Happy Path)

### Krok 1: Sprawdzenie stanu
```bash
GET /api/onboarding/state
→ { "step": "not_started" }
```

### Krok 2: Wybór platform
```bash
PUT /api/onboarding/platforms
Body: { "platform_ids": ["uuid1", "uuid2"] }
→ 204 No Content
```

### Krok 3: Weryfikacja stanu
```bash
GET /api/onboarding/state
→ { "step": "platforms_selected" }
```

### Krok 4: Wybór twórców
```bash
PUT /api/onboarding/creators
Body: { "creator_ids": ["uuid1", "uuid2", "uuid3"] }
→ 204 No Content
```

### Krok 5: Weryfikacja zakończenia
```bash
GET /api/onboarding/state
→ { "step": "completed" }
```

---

## Walidacja

### OnboardingPlatformsSchema
- `platform_ids`: tablica UUID
  - Minimum: 1 element
  - Maximum: 50 elementów
  - Każdy element musi być poprawnym UUID v4

### OnboardingCreatorsSchema
- `creator_ids`: tablica UUID
  - Minimum: 3 elementy
  - Maximum: 50 elementów
  - Każdy element musi być poprawnym UUID v4

---

## Bezpieczeństwo

### Autentykacja
Wszystkie endpointy wymagają autentykacji poprzez JWT token w nagłówku `Authorization`.

### Autoryzacja
- Użytkownik może modyfikować tylko własne dane
- `user_id` jest pobierany z sesji JWT, nie z parametrów requestu
- RLS (Row Level Security) w Supabase zapewnia dodatkową warstwę ochrony

### Ochrona przed atakami
- **DoS Protection**: Maksymalnie 50 platform/twórców na request
- **SQL Injection**: Użycie Supabase client z parametryzowanymi zapytaniami
- **XSS**: Brak renderowania danych użytkownika w HTML (tylko JSON API)

---

## Obsługa błędów

### Kody statusu HTTP

| Kod | Znaczenie | Kiedy występuje |
|-----|-----------|-----------------|
| 200 | OK | Pomyślne pobranie stanu |
| 204 | No Content | Pomyślna aktualizacja platform/twórców |
| 400 | Bad Request | Niepoprawny format JSON |
| 401 | Unauthorized | Brak autentykacji |
| 404 | Not Found | Profil użytkownika nie istnieje |
| 422 | Unprocessable Entity | Błąd walidacji danych |
| 500 | Internal Server Error | Błąd serwera/bazy danych |

---

## Testowanie

### Test Case 1: Pełny przepływ onboardingu
```javascript
// 1. Sprawdź stan początkowy
const state1 = await fetch('/api/onboarding/state');
// Oczekiwane: { "step": "not_started" }

// 2. Wybierz platformy
await fetch('/api/onboarding/platforms', {
  method: 'PUT',
  body: JSON.stringify({ platform_ids: ['uuid1', 'uuid2'] })
});
// Oczekiwane: 204

// 3. Sprawdź stan po platformach
const state2 = await fetch('/api/onboarding/state');
// Oczekiwane: { "step": "platforms_selected" }

// 4. Wybierz twórców
await fetch('/api/onboarding/creators', {
  method: 'PUT',
  body: JSON.stringify({ creator_ids: ['uuid1', 'uuid2', 'uuid3'] })
});
// Oczekiwane: 204

// 5. Sprawdź stan końcowy
const state3 = await fetch('/api/onboarding/state');
// Oczekiwane: { "step": "completed" }
```

### Test Case 2: Walidacja - za mało platform
```javascript
const response = await fetch('/api/onboarding/platforms', {
  method: 'PUT',
  body: JSON.stringify({ platform_ids: [] })
});
// Oczekiwane: 422 z błędem "At least 1 platform must be selected"
```

### Test Case 3: Walidacja - za mało twórców
```javascript
const response = await fetch('/api/onboarding/creators', {
  method: 'PUT',
  body: JSON.stringify({ creator_ids: ['uuid1', 'uuid2'] })
});
// Oczekiwane: 422 z błędem "At least 3 creators must be selected"
```

### Test Case 4: Niepoprawny UUID
```javascript
const response = await fetch('/api/onboarding/platforms', {
  method: 'PUT',
  body: JSON.stringify({ platform_ids: ['invalid-uuid'] })
});
// Oczekiwane: 422 z błędem "Invalid UUID format"
```

### Test Case 5: Brak autentykacji
```javascript
const response = await fetch('/api/onboarding/state');
// Oczekiwane: 401 Unauthorized
```

---

## Wydajność

### Optymalizacje
1. **Batch Insert**: Wszystkie platformy/twórcy są wstawiane jednym zapytaniem
2. **Indeksy**: Tabele `user_platforms` i `user_creators` mają indeksy na `user_id`
3. **Early Returns**: Walidacja autentykacji na początku funkcji
4. **Minimalne zapytania**: 3 zapytania na operację (delete, insert, update)

### Oczekiwane czasy odpowiedzi
- GET /state: < 100ms
- PUT /platforms: < 200ms
- PUT /creators: < 200ms

---

## Changelog

### 2024-12-21 - Implementacja początkowa
- ✅ Utworzono `onboarding.service.ts` z funkcjami: `getOnboardingState`, `updatePlatforms`, `updateCreators`
- ✅ Utworzono `onboarding.schema.ts` z walidacją Zod
- ✅ Utworzono endpoint `GET /api/onboarding/state`
- ✅ Utworzono endpoint `PUT /api/onboarding/platforms`
- ✅ Utworzono endpoint `PUT /api/onboarding/creators`
- ✅ Naprawiono błędy lintera (klasa → funkcje, usunięto console.log)
- ✅ Wszystkie testy lintera przeszły pomyślnie

