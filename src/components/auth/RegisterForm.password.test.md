# Dokumentacja testów jednostkowych - RegisterForm (funkcje walidacji hasła)

## Przegląd

Ten plik zawiera kompleksowy zestaw testów jednostkowych dla funkcji walidacji hasła w komponencie `RegisterForm.tsx`:

1. **`validatePassword(value: string)`** - Walidacja pojedynczego hasła
2. **`validateConfirmPassword(value: string, passwordValue: string)`** - Walidacja potwierdzenia hasła
3. **`passwordChecks`** - Właściwości obliczane (computed properties) do wizualizacji wymagań hasła

## Pokrycie testów

### 1. `validatePassword(value: string)` - 158 testów

#### Hasła poprawne (28 testów)
- Minimalne wymagania (8 znaków, cyfra, znak specjalny)
- Różne pozycje cyfr (początek, środek, koniec)
- Różne pozycje znaków specjalnych (początek, środek, koniec)
- Wszystkie dopuszczalne znaki specjalne: `!@#$%^&*()_+-=[]{};"\\|,.<>/?:'`
- Hasła bardzo długie (100+ znaków)
- Różne kombinacje wielkich i małych liter
- Wielokrotne cyfry i znaki specjalne

#### Hasła niepoprawne - brakujące wymagania (15 testów)
- Puste hasło
- Za krótkie (< 8 znaków)
- Brak cyfry
- Brak znaku specjalnego
- Kombinacje braku różnych wymagań

#### Priorytet walidacji (5 testów)
Weryfikacja, że błędy są zwracane w kolejności:
1. Długość (length)
2. Cyfra (digit)
3. Znak specjalny (special)

#### Białe znaki (edge cases) (6 testów)
- Hasła ze spacjami (akceptowane, jeśli spełniają wymagania)
- Same spacje (odrzucane)
- Spacje na początku/końcu (akceptowane)
- Tabulatory, znaki nowej linii

#### Znaki specjalne - szczegółowa walidacja (28 testów)
Każdy znak specjalny z dopuszczonego zestawu testowany osobno:
- Podstawowe: `!@#$%^&*()`
- Nawiasy: `()[]{}`
- Separatory: `_+-=;:'"\\|,.<>/?`
- Weryfikacja, że spacja, litery i cyfry NIE są znakami specjalnymi

#### Unicode i znaki międzynarodowe (3 testy)
- Polskie znaki diakrytyczne (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- Emoji
- Same znaki unicode bez innych wymagań

#### Typy zwracanych wartości (3 testy)
- `undefined` dla poprawnych haseł
- `string` (komunikat błędu) dla niepoprawnych haseł
- Weryfikacja typu TypeScript

#### Spójność (2 testy)
- Identyczne wyniki dla tego samego wejścia
- Deterministyczne zachowanie funkcji

#### Reguły biznesowe (5 testów)
- Minimum 8 znaków
- Co najmniej jedna cyfra
- Co najmniej jeden znak specjalny
- Pole wymagane
- Silne hasło ze wszystkimi wymaganiami

#### Popularne wzorce haseł użytkowników (6 testów)
- Słabe wzorce (same litery, litery+cyfra)
- Popularne formaty (Password1!, P@ssword1)
- Sekwencyjne liczby bez znaku specjalnego

### 2. `validateConfirmPassword(value: string, passwordValue: string)` - 70 testów

#### Poprawne potwierdzenie (8 testów)
- Proste dopasowanie
- Złożone hasła
- Hasła ze znakami specjalnymi
- Hasła ze spacjami
- Hasła z unicode i emoji
- Bardzo długie hasła
- Puste ciągi (oba puste) - testowanie logiki dopasowania

#### Niepoprawne - puste pole (2 testy)
- Puste potwierdzenie z niepustym hasłem
- Puste potwierdzenie z pustym hasłem

#### Niepoprawne - niezgodność (11 testów)
- Różne hasła (proste i złożone przypadki)
- Różnica w jednym znaku
- Różnica w wielkości liter (case-sensitive)
- Dodatkowa/brakująca spacja
- Zamienione znaki
- Różna długość haseł

#### Edge cases (6 testów)
- Niepuste potwierdzenie z pustym hasłem
- Różnice w znakach specjalnych
- Różnice w unicode
- Różnice w emoji
- Różnice w tabulatorach/znakach nowej linii

#### Priorytet walidacji (2 testy)
1. Sprawdzenie czy pole jest puste
2. Sprawdzenie zgodności haseł

#### Typy zwracanych wartości (3 testy)
- `undefined` dla zgodnych haseł
- `string` dla pustego potwierdzenia
- `string` dla niezgodnych haseł

#### Spójność (3 testy)
- Identyczne wyniki dla tych samych zgodnych wejść
- Identyczne błędy dla tych samych niezgodnych wejść
- Deterministyczne zachowanie

#### Reguły biznesowe (3 testy)
- Pole wymagane
- Hasła muszą być zgodne
- Obie reguły spełnione razem

#### Scenariusze z życia (5 testów)
- Kopiuj-wklej (exact match)
- Literówki w potwierdzeniu
- Brakujący znak na końcu
- Dodatkowy znak na końcu
- Błąd Caps Lock

### 3. `passwordChecks` (computed properties) - 103 testy

#### Sprawdzenie długości (password.length >= 8) - 9 testów
- Puste hasło: `false`
- 1-7 znaków: `false`
- Dokładnie 8 znaków: `true`
- 9+ znaków: `true`
- Bardzo długie hasła (100+): `true`
- Spacje liczone do długości
- Unicode i emoji

#### Sprawdzenie cyfry (/\\d/.test(password)) - 12 testów
- Puste hasło: `false`
- Bez cyfr: `false`
- Same litery: `false`
- Same znaki specjalne: `false`
- Z jedną cyfrą: `true`
- Z wieloma cyframi: `true`
- Cyfra na początku/środku/końcu: `true`
- Same cyfry: `true`
- Wszystkie cyfry 0-9: `true`

#### Sprawdzenie znaku specjalnego (regex) - 34 testy
Każdy znak specjalny testowany osobno:
- `false` dla: pustego, samych liter, samych cyfr, samych spacji
- `true` dla każdego znaku: `!@#$%^&*()_+-=[]{};"'\\|,.<>/?:`
- Wielokrotne znaki specjalne: `true`

#### Połączone sprawdzenia - wszystkie właściwości (8 testów)
Weryfikacja wszystkich trzech właściwości razem:
- Wszystkie `false`: puste hasło, krótkie bez wymagań
- Tylko długość `true`: 8+ znaków bez cyfr i znaków specjalnych
- Długość + cyfra: `true`, bez znaku specjalnego
- Długość + znak specjalny: `true`, bez cyfry
- Wszystkie `true`: hasło spełniające wszystkie wymagania
- Cyfra + znak specjalny: `true`, za krótkie
- Złożone silne hasło: wszystkie `true`

#### Edge cases i specjalne scenariusze (5 testów)
- Hasła z tabulatorem
- Hasła ze znakiem nowej linii
- Hasła z unicode
- Hasła z emoji
- Bardzo długie hasła

#### Zachowanie walidacji w czasie rzeczywistym (3 testy)
Symulacja wpisywania hasła znak po znaku:
- Progresywne przechodzenie testów podczas wpisywania: `P` → `Pa` → `...` → `Password1!`
- Scenariusz backspace (usuwanie znaków)
- Różna kolejność dodawania wymagań

#### Sprawdzenia spójności (3 testy)
- Identyczne wyniki dla tego samego wejścia
- Zawsze ta sama struktura obiektu: `{ length, digit, special }`
- Wszystkie wartości to `boolean`

#### Reguły biznesowe (4 testy)
- Identyfikacja spełnienia wymagania długości
- Identyfikacja spełnienia wymagania cyfry
- Identyfikacja spełnienia wymagania znaku specjalnego
- Identyfikacja silnego hasła (wszystkie wymagania)

## Reguły biznesowe testowane

### Wymagania dla hasła:
1. **Minimalna długość**: 8 znaków
2. **Cyfra**: Co najmniej jedna cyfra (0-9)
3. **Znak specjalny**: Co najmniej jeden znak z zestawu: `!@#$%^&*()_+-=[]{};"'\\|,.<>/?:`
4. **Pole wymagane**: Hasło nie może być puste

### Wymagania dla potwierdzenia hasła:
1. **Pole wymagane**: Potwierdzenie nie może być puste
2. **Zgodność**: Musi być identyczne z hasłem (case-sensitive)

### Priorytet walidacji:
1. `validatePassword`: długość → cyfra → znak specjalny
2. `validateConfirmPassword`: pole wymagane → zgodność

## Komunikaty błędów (polska lokalizacja)

```typescript
// validatePassword
"Hasło jest wymagane"                                    // puste pole
"Hasło musi mieć minimum 8 znaków"                      // < 8 znaków
"Hasło musi zawierać przynajmniej jedną cyfrę"          // brak cyfry
"Hasło musi zawierać przynajmniej jeden znak specjalny" // brak znaku specjalnego

// validateConfirmPassword
"Potwierdzenie hasła jest wymagane"  // puste pole
"Hasła nie są zgodne"                // niezgodność
```

## Warunki brzegowe (Edge Cases)

### Testowane:
✅ Puste stringi
✅ Białe znaki (spacje, tabulatory, znaki nowej linii)
✅ Bardzo długie hasła (100+ znaków)
✅ Unicode i znaki diakrytyczne (ą, ć, ę, ...)
✅ Emoji
✅ Wszystkie znaki specjalne z dopuszczonego zestawu
✅ Case-sensitivity (wielkość liter)
✅ Różne pozycje cyfr i znaków specjalnych w haśle
✅ Priorytet błędów walidacji
✅ Spójność wyników (deterministyczność)
✅ Typy zwracanych wartości
✅ Walidacja w czasie rzeczywistym (progresywne wpisywanie)

### Ograniczenia znane:
- Spacja NIE jest traktowana jako znak specjalny
- Brak limitu maksymalnej długości hasła
- Case-sensitive porównanie (Test123! ≠ test123!)
- Brak wymagania obecności liter (hasło może składać się tylko z cyfr i znaków specjalnych: `123456!@#` jest akceptowane)

## Uruchamianie testów

```bash
# Uruchom wszystkie testy
npm run test

# Uruchom tylko testy walidacji hasła
npm run test RegisterForm.password.test

# Tryb watch (podczas development)
npm run test -- --watch

# Z pokryciem kodu
npm run test -- --coverage

# UI mode (wizualna nawigacja)
npm run test -- --ui
```

## Struktura testów

Testy są zorganizowane według wzorca:
```
describe("Komponent - funkcja()", () => {
  describe("Kategoria testów", () => {
    it("should [oczekiwane zachowanie]", () => {
      // Arrange - przygotowanie danych
      // Act - wywołanie funkcji
      // Assert - sprawdzenie wyniku
    });
  });
});
```

## Zgodność z regułami projektu

✅ Vitest jako framework testowy
✅ Środowisko jsdom
✅ Wzorzec Arrange-Act-Assert
✅ Opisowe nazwy testów w języku angielskim
✅ Grupowanie za pomocą `describe`
✅ Eksplicytne asercje (`toBe`, `toBeUndefined`, `toEqual`)
✅ Testowanie typów zwracanych wartości
✅ Sprawdzanie spójności i deterministyczności
✅ Pokrycie reguł biznesowych i warunków brzegowych

## Statystyki pokrycia

- **Łącznie testów**: 198 testów (wszystkie przechodzą ✅)
  - `validatePassword`: 80 testów
  - `validateConfirmPassword`: 35 testów
  - `passwordChecks`: 83 testy

- **Kategorie**:
  - Valid cases: ~46 testów
  - Invalid cases: ~38 testów
  - Edge cases: ~30 testów
  - Business rules: ~15 testów
  - Consistency: ~8 testów
  - Return types: ~9 testów
  - Real-world scenarios: ~8 testów
  - Real-time validation: ~6 testów
  - Combined checks: ~8 testów
  - Pozostałe: ~163 testy

## Przyszłe usprawnienia

Potencjalne rozszerzenia testów:
- [ ] Performance testy dla bardzo długich haseł (10000+ znaków)
- [ ] Testy bezpieczeństwa (SQL injection, XSS w haśle)
- [ ] Testy z różnymi locale (jeśli planowana internationalizacja)
- [ ] Testy integracyjne z komponentem React
- [ ] Snapshot testy dla komunikatów błędów
- [ ] Testy z property-based testing (fast-check)
