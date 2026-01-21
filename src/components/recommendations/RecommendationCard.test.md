# RecommendationCard - Dokumentacja testów jednostkowych

## Podsumowanie

Kompleksowy zestaw testów jednostkowych dla komponentu `RecommendationCard.tsx` z wykorzystaniem Vitest, React Testing Library i zgodnie z wytycznymi z `.cursor/rules/vitest-unit-testing.mdc`.

## Statystyki pokrycia

- **Liczba testów:** 25
- **Status:** ✅ Wszystkie testy przechodzą
- **Framework:** Vitest + React Testing Library + jsdom

## Struktura testów

### 1. Rendering: Basic structure (4 testy)

Sprawdza podstawową strukturę komponentu i renderowanie kluczowych elementów:

- ✅ `should render card with all essential elements` - weryfikuje obecność tytułu, roku, typu mediów i przycisku
- ✅ `should render poster image with correct attributes` - sprawdza atrybuty obrazu (`src`, `alt`, `loading="lazy"`)
- ✅ `should not render poster when poster_path is missing` - testuje przypadek braku obrazu
- ✅ `should return null when isOptimisticallyHidden is true` - weryfikuje optymistyczne ukrywanie

### 2. Rendering: Media type display (4 testy)

Testuje logikę wyświetlania typu mediów i metadanych:

- ✅ `should display 'Film' for media_type movie` - tłumaczenie dla filmu
- ✅ `should display 'Serial' for media_type tv` - tłumaczenie dla serialu
- ✅ `should handle missing year gracefully` - brak roku nie wywołuje błędu
- ✅ `should handle missing media_type gracefully` - brak typu mediów nie wywołuje błędu

### 3. Rendering: Platforms section (3 testy)

Weryfikuje sekcję dostępnych platform:

- ✅ `should render all platforms as badges` - renderowanie wszystkich platform
- ✅ `should not render platforms section when empty array` - ukrywanie pustej sekcji
- ✅ `should not render platforms section when undefined` - obsługa undefined

### 4. Rendering: Creators section (6 testów)

Testuje sekcję twórców z rolami i wariantami:

- ✅ `should render all creators with correct roles` - renderowanie wszystkich twórców z tłumaczeniami ról
- ✅ `should render creator without role when creator_role is missing` - twórca bez roli
- ✅ `should not render creators section when empty array` - ukrywanie pustej sekcji
- ✅ `should not render creators section when undefined` - obsługa undefined
- ✅ `should apply different badge variants based on is_favorite` - wariantowe stylowanie (default vs outline)
- ✅ Weryfikacja różnicowania ulubionych twórców przez `data-slot="badge"`

### 5. Interaction: Button behavior (4 testy)

Testuje interakcje użytkownika z przyciskiem:

- ✅ `should call onWatched with correct id when button clicked` - wywołanie callback z właściwym ID
- ✅ `should disable button when isMarking is true` - wyłączenie przycisku podczas zapisywania
- ✅ `should enable button when isMarking is false` - włączony przycisk w stanie idle
- ✅ `should have correct aria-label for accessibility` - dostępność dla screen readerów

### 6. Component memoization (1 test)

- ✅ `should be memoized and not re-render with same props` - weryfikacja użycia `React.memo()`

### 7. Edge cases: Complex scenarios (3 testy)

Testuje nietypowe scenariusze i przypadki brzegowe:

- ✅ `should handle item with only title and id (minimal data)` - minimalne dane bez opcjonalnych pól
- ✅ `should handle very long title with truncation class` - bardzo długi tytuł z `line-clamp-2`
- ✅ `should handle multiple creators with same name but different ids` - duplikaty nazw

### 8. Snapshot tests (1 test)

- ✅ `should match inline snapshot for complete recommendation` - inline snapshot pełnej struktury DOM

## Kluczowe wzorce testowe zastosowane

### 1. Arrange-Act-Assert (AAA Pattern)

Każdy test stosuje czysty podział na sekcje z komentarzami:

```typescript
it("should render card with all essential elements", () => {
  // Arrange
  const item = createMockRecommendation();

  // Act
  render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

  // Assert
  expect(screen.getByText("Test Movie Title")).toBeInTheDocument();
});
```

### 2. Mock data factory

Wykorzystanie fabryki do tworzenia spójnych danych testowych:

```typescript
const createMockRecommendation = (overrides?: Partial<RecommendationViewModel>): RecommendationViewModel => ({
  id: "test-id-123",
  // ... domyślne wartości
  ...overrides, // możliwość nadpisania
});
```

### 3. Spies z `vi.fn()`

Monitorowanie wywołań funkcji bez zmiany implementacji:

```typescript
const onWatchedSpy = vi.fn();
await user.click(button);
expect(onWatchedSpy).toHaveBeenCalledWith("test-id-123");
```

### 4. User Events

Symulacja rzeczywistych interakcji użytkownika:

```typescript
const user = userEvent.setup();
await user.click(button);
```

### 5. Semantic queries

Preferowanie zapytań semantycznych dla lepszej dostępności:

```typescript
screen.getByRole("button", { name: /oznacz jako obejrzane/i })
screen.getByText("Film")
screen.getByAltText("Test Movie Title")
```

### 6. Inline snapshots

Przechowywanie snapshotów bezpośrednio w pliku testowym:

```typescript
expect(container.firstChild).toMatchInlineSnapshot(`...`);
```

## Pokrycie funkcjonalności

### ✅ Renderowanie warunkowe
- Obsługa braku `poster_path`
- Obsługa braku `year` i `media_type`
- Ukrywanie pustych sekcji (platforms, creators)
- Optymistyczne ukrywanie (`isOptimisticallyHidden`)

### ✅ Transformacje danych
- Tłumaczenie typu mediów (movie → Film, tv → Serial)
- Tłumaczenie ról twórców (actor → aktor, director → reżyser)
- Kapitalizacja nazw platform

### ✅ Interaktywność
- Kliknięcie przycisku "Oznacz jako obejrzane"
- Stan loading (isMarking)
- Disabled state

### ✅ Stylowanie
- Truncation długich tytułów (`line-clamp-2`)
- Wariantowe stylowanie badges (favorite creators)
- Lazy loading obrazów
- Responsywne aspect ratio (`aspect-[2/3]`)

### ✅ Accessibility
- Poprawne aria-labels
- Semantyczne role (button)
- Alt text dla obrazów

### ✅ Optymalizacja wydajności
- Memoizacja komponentu (`React.memo`)
- Lazy loading obrazów

## Zgodność z regułami Vitest

Testy są zgodne z wytycznymi z `.cursor/rules/vitest-unit-testing.mdc`:

✅ **Leverage `vi` object** - użycie `vi.fn()` dla mocków  
✅ **Arrange-Act-Assert pattern** - każdy test ma wyraźny podział  
✅ **Configure jsdom** - `environment: 'jsdom'` w `vitest.config.ts`  
✅ **Explicit assertion messages** - opisowe asercje  
✅ **Descriptive describe blocks** - logiczne grupowanie testów  
✅ **TypeScript type checking** - pełna typizacja mocków  
✅ **Inline snapshots** - snapshot bezpośrednio w kodzie  

## Uruchomienie testów

```bash
# Uruchomienie wszystkich testów komponentu
npm test -- RecommendationCard.test.tsx

# Watch mode podczas development
npm test -- RecommendationCard.test.tsx --watch

# UI mode
npm test -- --ui

# Z pokryciem kodu
npm test -- RecommendationCard.test.tsx --coverage
```

## Potencjalne rozszerzenia

### 1. Testy dostępności (a11y)
Można dodać testy z `jest-axe` dla głębszej weryfikacji WCAG:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<RecommendationCard item={item} onWatched={mockOnWatched} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. Testy wydajności renderowania
Dla sprawdzenia optymalizacji memo:

```typescript
import { renderHook } from '@testing-library/react';

it('should not re-render when props are shallow equal', () => {
  const renderSpy = vi.fn();
  // ... test implementacji
});
```

### 3. Visual regression tests
Integracja z Playwright dla testów wizualnych:

```typescript
test('RecommendationCard visual regression', async ({ page }) => {
  await page.goto('/storybook-iframe?id=recommendationcard');
  await expect(page).toHaveScreenshot();
});
```

## Podsumowanie

Zestaw testów zapewnia:
- ✅ **Wysokie pokrycie kluczowych funkcjonalności**
- ✅ **Zgodność z najlepszymi praktykami Vitest**
- ✅ **Czytelność i maintainability**
- ✅ **Obsługę edge cases i scenariuszy błędów**
- ✅ **Weryfikację accessibility**
- ✅ **Stabilność przy refaktoryzacji**
