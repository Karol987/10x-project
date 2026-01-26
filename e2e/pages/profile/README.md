# Profile Page Object Models

Page Object Models (POM) dla strony profilu i zarządzania platformami VOD.

## Struktura

```
e2e/pages/profile/
├── PlatformCard.page.ts      # POM dla pojedynczej karty platformy
├── PlatformGrid.page.ts      # POM dla siatki kart platform
├── ProfilePage.page.ts       # POM dla głównej strony profilu
├── index.ts                  # Barrel export
└── README.md                 # Dokumentacja
```

## Klasy POM

### PlatformCardPage

Reprezentuje pojedynczą kartę platformy VOD.

**Konstruktor:**
```typescript
new PlatformCardPage(page: Page, platformId: string)
```

**Główne metody:**
- `click()` - kliknij w kartę platformy
- `isSelected()` - sprawdź czy platforma jest wybrana
- `isPending()` - sprawdź czy trwa zapis
- `isDisabled()` - sprawdź czy karta jest zablokowana
- `getPlatformName()` - pobierz nazwę platformy
- `waitForSaveComplete()` - poczekaj na zakończenie zapisu
- `waitForLoadingIndicator()` - poczekaj na wskaźnik ładowania
- `waitForSelectedIndicator()` - poczekaj na wskaźnik wyboru

**Lokatory:**
- `card` - główny element karty
- `loadingIndicator` - wskaźnik ładowania podczas zapisu
- `selectedIndicator` - ikona checkmark dla wybranej platformy
- `platformLogo` - logo platformy
- `platformName` - nazwa platformy

**Przykład użycia:**
```typescript
const platformCard = new PlatformCardPage(page, 'netflix-id');
await platformCard.click();
await platformCard.waitForSaveComplete();
expect(await platformCard.isSelected()).toBe(true);
```

---

### PlatformGridPage

Reprezentuje siatkę kart platform VOD.

**Konstruktor:**
```typescript
new PlatformGridPage(page: Page)
```

**Główne metody:**
- `getPlatformCard(platformId: string)` - pobierz konkretną kartę platformy
- `getAllPlatformCards()` - pobierz wszystkie karty platform
- `getRandomPlatformCard()` - pobierz losową kartę platformy
- `getSelectedPlatformCards()` - pobierz wybrane platformy
- `getUnselectedPlatformCards()` - pobierz niewybrane platformy
- `getPlatformCardsCount()` - liczba wszystkich platform
- `getSelectedPlatformCardsCount()` - liczba wybranych platform
- `isPending()` - czy trwa zapis
- `waitForSaveComplete()` - poczekaj na zakończenie zapisu
- `waitForPendingState()` - poczekaj na rozpoczęcie zapisu
- `waitForLoadingComplete()` - poczekaj na zakończenie ładowania
- `clickRandomPlatformAndWaitForSave()` - kliknij losową platformę i poczekaj na zapis
- `togglePlatformAndWaitForSave(platformId)` - przełącz platformę i poczekaj na zapis

**Lokatory:**
- `grid` - główna siatka platform
- `loadingState` - stan ładowania (skeleton)
- `emptyState` - pusty stan (brak platform)

**Przykład użycia:**
```typescript
const platformGrid = new PlatformGridPage(page);

// Kliknij losową platformę
const card = await platformGrid.getRandomPlatformCard();
await card.click();
await platformGrid.waitForSaveComplete();

// Lub użyj metody pomocniczej
await platformGrid.clickRandomPlatformAndWaitForSave();
```

---

### ProfilePage

Reprezentuje główną stronę profilu z wszystkimi sekcjami.

**Konstruktor:**
```typescript
new ProfilePage(page: Page)
```

**Główne metody:**
- `goto()` - przejdź do strony profilu
- `waitForPageLoad()` - poczekaj na załadowanie strony
- `gotoAndWaitForLoad()` - przejdź do strony i poczekaj na załadowanie
- `isPlatformsSectionVisible()` - czy sekcja platform jest widoczna
- `getPlatformsSectionHeading()` - pobierz nagłówek sekcji
- `getPlatformsSectionDescription()` - pobierz opis sekcji

**Właściwości:**
- `platformsSection` - lokator sekcji platform
- `platformGrid` - instancja PlatformGridPage

**Przykład użycia:**
```typescript
const profilePage = new ProfilePage(page);
await profilePage.gotoAndWaitForLoad();

// Użyj zagnieżdżonego POM dla platform
await profilePage.platformGrid.clickRandomPlatformAndWaitForSave();
```

## Przykładowy test

```typescript
import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/profile';

test.describe('Profile - Platforms', () => {
  test('should toggle platform selection', async ({ page }) => {
    // Setup
    const profilePage = new ProfilePage(page);
    await profilePage.gotoAndWaitForLoad();

    // Execute - Scenariusz z wymagań:
    // 1. Kliknij na losową kartę platformy VOD
    const randomCard = await profilePage.platformGrid.getRandomPlatformCard();
    const initialState = await randomCard.isSelected();
    
    await randomCard.click();

    // 2. Poczekaj na odświeżenie po zapisie zmian
    await profilePage.platformGrid.waitForSaveComplete();

    // Assert
    const finalState = await randomCard.isSelected();
    expect(finalState).toBe(!initialState);
  });
});
```

## Atrybuty testowe

Wszystkie komponenty używają atrybutów `data-testid` dla stabilnych selektorów:

### PlatformCard
- `data-testid="platform-card-{platformId}"` - główny element
- `data-platform-name="{name}"` - nazwa platformy
- `data-selected="{true|false}"` - stan wyboru
- `data-pending="{true|false}"` - stan zapisu
- `data-testid="platform-card-loading-indicator"` - wskaźnik ładowania
- `data-testid="platform-card-selected-indicator"` - wskaźnik wyboru

### PlatformGrid
- `data-testid="platform-grid"` - główna siatka
- `data-pending="{true|false}"` - stan zapisu
- `data-testid="platform-grid-loading"` - stan ładowania
- `data-testid="platform-grid-empty"` - pusty stan

### ProfilePage
- `data-testid="platforms-section"` - sekcja platform

## Best Practices

1. **Używaj metod pomocniczych** zamiast bezpośredniego dostępu do lokatorów
2. **Zawsze czekaj na zakończenie akcji** (waitForSaveComplete, waitForLoadingComplete)
3. **Wykorzystuj zagnieżdżone POM** (ProfilePage → PlatformGrid → PlatformCard)
4. **Używaj atrybutów data-testid** zamiast selektorów CSS
5. **Grupuj logikę związaną z komponentem** w jednej klasie POM
