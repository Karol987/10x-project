# Mapa atrybutów data-test-id

Dokument zawiera mapowanie wszystkich atrybutów `data-test-id` dodanych do aplikacji dla potrzeb testów E2E.

## Scenariusz 1: Rejestracja

### 1. Rejestracja (RegisterForm.tsx)

**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Kontener formularza | `register-form` | Główny kontener karty z formularzem rejestracji |
| Pole email | `register-email-input` | Input do wpisania adresu email |
| Pole hasło | `register-password-input` | Input do wpisania hasła |
| Pole potwierdzenia hasła | `register-confirm-password-input` | Input do potwierdzenia hasła |
| Przycisk submit | `register-submit-button` | Przycisk "Zarejestruj się" |
| Komunikat błędu | `register-error-message` | Komunikat o błędzie (wyświetlany warunkowo) |
| Komunikat sukcesu | `register-success-message` | Komunikat o sukcesie/potwierdzeniu email (wyświetlany warunkowo) |
| Link do logowania | `register-login-link` | Link "Zaloguj się" dla użytkowników z kontem |

### 2. Logowanie - Link do rejestracji (LoginForm.tsx)

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Link do rejestracji | `login-register-link` | Link "Zarejestruj się" dla nowych użytkowników |

## Scenariusz 2: Login → Profil → Wybór platformy VOD

### 1. Logowanie (LoginForm.tsx)

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Kontener formularza | `login-form` | Główny kontener karty z formularzem logowania |
| Pole email | `login-email-input` | Input do wpisania adresu email |
| Pole hasło | `login-password-input` | Input do wpisania hasła |
| Przycisk submit | `login-submit-button` | Przycisk "Zaloguj się" |
| Komunikat błędu | `login-error-message` | Komunikat o błędzie (wyświetlany warunkowo) |

### 2. Nawigacja (Layout.astro)

**Lokalizacja:** `src/layouts/Layout.astro`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Link Home | `nav-home-link` | Link do strony głównej w nawigacji |
| Link Historia | `nav-history-link` | Link do historii obejrzanych w nawigacji |
| Link Profil | `nav-profile-link` | Link do profilu w nawigacji |

### 3. Menu użytkownika (UserMenu.tsx)

**Lokalizacja:** `src/components/layout/UserMenu.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Przycisk menu | `user-menu-button` | Przycisk otwierający menu użytkownika |
| Dropdown menu | `user-menu-dropdown` | Kontener z rozwijanym menu |
| Przycisk profilu | `user-menu-profile-button` | Przycisk "Ustawienia profilu" w menu |
| Przycisk historii | `user-menu-history-button` | Przycisk "Historia obejrzanych" w menu |
| Przycisk wylogowania | `user-menu-logout-button` | Przycisk "Wyloguj się" w menu |

### 4. Profil - Kontener (ProfileContainer.tsx)

**Lokalizacja:** `src/components/profile/ProfileContainer.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Loading state | `profile-loading` | Stan ładowania profilu |
| Error state | `profile-error` | Stan błędu profilu |
| Kontener profilu | `profile-container` | Główny kontener strony profilu |
| Tytuł profilu | `profile-title` | Nagłówek H1 "Profil" |
| Sekcja platform | `platforms-section` | Sekcja z platformami VOD |
| Tytuł sekcji platform | `platforms-section-title` | Nagłówek H2 "Platformy VOD" |

### 5. Siatka platform (PlatformGrid.tsx)

**Lokalizacja:** `src/components/profile/PlatformGrid.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Loading grid | `platform-grid-loading` | Stan ładowania siatki platform |
| Empty state | `platform-grid-empty` | Stan pusty (brak platform) |
| Siatka platform | `platform-grid` | Główny kontener siatki z platformami |

**Atrybuty data:**
- `data-pending="true/false"` - wskazuje czy trwa operacja zapisu

### 6. Karta platformy (PlatformCard.tsx)

**Lokalizacja:** `src/components/profile/PlatformCard.tsx`

| Element | data-test-id | Opis |
|---------|-------------|------|
| Przycisk karty | `platform-card-{platformId}` | Przycisk karty platformy (dynamiczne ID) |
| Nazwa platformy | `platform-card-name` | Nazwa platformy w karcie |
| Wskaźnik ładowania | `platform-card-loading-indicator` | Ikona ładowania (wyświetlana podczas zapisu) |
| Wskaźnik wyboru | `platform-card-selected-indicator` | Ikona checkmark (gdy platforma jest wybrana) |

**Atrybuty data:**
- `data-platform-name="Netflix"` - nazwa platformy
- `data-selected="true/false"` - czy platforma jest wybrana
- `data-pending="true/false"` - czy trwa operacja dla tej karty
- `data-testid="platform-card-{platformId}"` - duplikat dla kompatybilności

## Przykładowe selektory dla testów Playwright

### Rejestracja
```typescript
// Formularz rejestracji
await page.getByTestId('register-form');
await page.getByTestId('register-email-input').fill('newuser@example.com');
await page.getByTestId('register-password-input').fill('SecurePass123!');
await page.getByTestId('register-confirm-password-input').fill('SecurePass123!');
await page.getByTestId('register-submit-button').click();

// Sprawdzenie komunikatów
const hasError = await page.getByTestId('register-error-message').isVisible();
const hasSuccess = await page.getByTestId('register-success-message').isVisible();

// Przejście do logowania
await page.getByTestId('register-login-link').click();
```

### Logowanie
```typescript
// Formularz logowania
await page.getByTestId('login-form');
await page.getByTestId('login-email-input').fill('user@example.com');
await page.getByTestId('login-password-input').fill('password123');
await page.getByTestId('login-submit-button').click();
```

### Nawigacja do profilu
```typescript
// Opcja 1: Link w nawigacji
await page.getByTestId('nav-profile-link').click();

// Opcja 2: Menu użytkownika
await page.getByTestId('user-menu-button').click();
await page.getByTestId('user-menu-profile-button').click();
```

### Wybór platformy VOD
```typescript
// Poczekaj na załadowanie profilu
await page.getByTestId('profile-container').waitFor();

// Znajdź sekcję platform
const platformsSection = page.getByTestId('platforms-section');

// Znajdź siatkę platform
const grid = page.getByTestId('platform-grid');

// Wybierz losową platformę (niebędącą już wybraną)
const unselectedPlatforms = await grid
  .locator('[data-test-id^="platform-card-"][data-selected="false"]')
  .all();

const randomCard = unselectedPlatforms[Math.floor(Math.random() * unselectedPlatforms.length)];

// Zapamiętaj stan przed kliknięciem
const platformName = await randomCard.getAttribute('data-platform-name');
const platformId = (await randomCard.getAttribute('data-test-id')).replace('platform-card-', '');

// Kliknij kartę
await randomCard.click();

// Poczekaj na zakończenie operacji
await page.getByTestId(`platform-card-${platformId}`).waitFor({ state: 'visible' });
await page.waitForSelector(`[data-test-id="platform-card-${platformId}"][data-pending="false"]`);

// Zweryfikuj zmianę stanu
const updatedCard = page.getByTestId(`platform-card-${platformId}`);
await expect(updatedCard).toHaveAttribute('data-selected', 'true');

// Zweryfikuj obecność wskaźnika wyboru
await expect(updatedCard.getByTestId('platform-card-selected-indicator')).toBeVisible();
```

## Uwagi implementacyjne

1. **Duplikacja atrybutów**: Niektóre komponenty mają zarówno `data-testid` jak i `data-test-id` dla kompatybilności wstecznej
2. **Dynamiczne ID**: Karty platform używają dynamicznych ID w formacie `platform-card-{platformId}`
3. **Atrybuty stanu**: Komponenty używają dodatkowych atrybutów data (`data-selected`, `data-pending`, `data-platform-name`) do ułatwienia weryfikacji stanu
4. **Wskaźniki wizualne**: Każdy stan ma odpowiedni wskaźnik (loading, selected) z własnym data-test-id

## Scenariusz testowy - pełny przepływ

```typescript
test('User can login and select VOD platform', async ({ page }) => {
  // 1. Zaloguj się
  await page.goto('/auth/login');
  await page.getByTestId('login-email-input').fill(process.env.E2E_USERNAME);
  await page.getByTestId('login-password-input').fill(process.env.E2E_PASSWORD);
  await page.getByTestId('login-submit-button').click();

  // 2. Poczekaj na zalogowanie (przekierowanie)
  await page.waitForURL('**/home');

  // 3. Przejdź do profilu
  await page.getByTestId('nav-profile-link').click();
  await page.waitForURL('**/profile');

  // 4. Poczekaj na załadowanie profilu
  await page.getByTestId('profile-container').waitFor();

  // 5. Wybierz losową niewykrytą platformę
  const grid = page.getByTestId('platform-grid');
  const unselectedCards = await grid
    .locator('[data-test-id^="platform-card-"][data-selected="false"]')
    .all();
  
  expect(unselectedCards.length).toBeGreaterThan(0);
  
  const randomCard = unselectedCards[Math.floor(Math.random() * unselectedCards.length)];
  const platformId = (await randomCard.getAttribute('data-test-id')).replace('platform-card-', '');
  const platformName = await randomCard.getAttribute('data-platform-name');

  console.log(`Selecting platform: ${platformName} (${platformId})`);

  // 6. Zapamiętaj stan
  const wasSelected = await randomCard.getAttribute('data-selected') === 'true';

  // 7. Kliknij - wybierz
  await randomCard.click();

  // 8. Poczekaj na odświeżenie (pending -> false)
  await page.waitForSelector(
    `[data-test-id="platform-card-${platformId}"][data-pending="false"]`,
    { timeout: 5000 }
  );

  // 9. Zweryfikuj czy stan się zmienił
  const updatedCard = page.getByTestId(`platform-card-${platformId}`);
  const isNowSelected = await updatedCard.getAttribute('data-selected') === 'true';
  
  expect(isNowSelected).toBe(!wasSelected);

  // 10. Zweryfikuj wizualny wskaźnik
  if (isNowSelected) {
    await expect(updatedCard.getByTestId('platform-card-selected-indicator')).toBeVisible();
  } else {
    await expect(updatedCard.getByTestId('platform-card-selected-indicator')).not.toBeVisible();
  }
});
```
