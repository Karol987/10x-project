# Testing Setup - 10x Project

Środowisko testowe dla projektu zostało skonfigurowane zgodnie z tech stackiem i najlepszymi praktykami.

## 📦 Zainstalowane narzędzia

### Testy jednostkowe (Unit Tests)
- **Vitest** - Framework do testów jednostkowych i integracyjnych (kompatybilny z Vite/Astro)
- **@vitest/ui** - Interfejs UI do przeglądania testów
- **jsdom** - Środowisko DOM dla testów
- **@testing-library/react** - Narzędzia do testowania komponentów React
- **@testing-library/jest-dom** - Dodatkowe matchery dla testów DOM
- **@testing-library/user-event** - Symulacja interakcji użytkownika

### Testy E2E (End-to-End)
- **@playwright/test** - Framework do testów end-to-end
- **Chromium** - Przeglądarka do uruchamiania testów

### Mockowanie API
- **MSW (Mock Service Worker)** - Mockowanie zapytań HTTP (TMDb, MOTN API)

## 📁 Struktura projektu

```
10x-project/
├── e2e/                      # Testy E2E (Playwright)
│   ├── .gitkeep
│   └── example.spec.ts       # Przykładowy test E2E
├── src/
│   ├── mocks/                # MSW handlers
│   │   ├── handlers.ts       # Definicje mock handlerów
│   │   ├── server.ts         # MSW server (Node.js)
│   │   └── browser.ts        # MSW worker (Browser)
│   └── lib/
│       └── example.test.ts   # Przykładowy test jednostkowy
├── vitest.config.ts          # Konfiguracja Vitest
├── vitest.setup.ts           # Setup dla Vitest
└── playwright.config.ts      # Konfiguracja Playwright
```

## 🚀 Dostępne komendy

### Testy jednostkowe (Vitest)

```bash
# Uruchom testy jednostkowe (tryb watch)
npm test

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy z pokryciem kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchom testy E2E
npm run test:e2e

# Uruchom testy z interfejsem UI
npm run test:e2e:ui

# Uruchom testy w trybie debug
npm run test:e2e:debug

# Generator testów (codegen)
npm run test:e2e:codegen
```

## 📝 Konfiguracja

### Vitest (`vitest.config.ts`)

- **Environment**: jsdom (dla testów React)
- **Globals**: Włączone (expect, describe, it, etc.)
- **Setup**: `vitest.setup.ts` - konfiguracja @testing-library/jest-dom
- **Coverage**: v8 provider z raportami (text, json, html)
- **Aliases**: `@/*` mapowane do `./src/*`

### Playwright (`playwright.config.ts`)

- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: `http://localhost:4321`
- **Parallel**: Włączone
- **Retry**: 2 próby na CI
- **Trace**: Zapisywane przy pierwszej próbie powtórzenia
- **Web Server**: Automatyczne uruchamianie `npm run dev`

## 🧪 Przykłady testów

### Test jednostkowy (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('Example Unit Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Test komponentu React

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test E2E (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Example E2E Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    expect(page).toBeTruthy();
  });
});
```

## 🎯 Najlepsze praktyki

### Vitest
- Używaj `vi.fn()` dla mocków funkcji
- Używaj `vi.spyOn()` do monitorowania funkcji
- Umieszczaj mock factory na początku pliku
- Stosuj Arrange-Act-Assert pattern
- Grupuj testy z `describe`
- Używaj `expect().toMatchInlineSnapshot()` dla czytelnych asercji

### Playwright
- Używaj Page Object Model dla utrzymywalności
- Implementuj Browser contexts dla izolacji testów
- Używaj lokatorów dla odpornego wyboru elementów
- Wykorzystuj hooks (beforeEach, afterEach) dla setup/teardown
- Używaj `expect(page).toHaveScreenshot()` dla porównań wizualnych
- Testuj API z użyciem wbudowanych narzędzi Playwright

### MSW
- Definiuj handlery w `src/mocks/handlers.ts`
- Używaj `server` dla testów Node.js (Vitest)
- Używaj `worker` dla testów przeglądarki (Playwright)
- Mockuj zewnętrzne API (TMDb, MOTN) aby nie zużywać limitów

## 🔧 Integracja z CI/CD

Testy są gotowe do integracji z GitHub Actions:

```yaml
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e
```

## 📚 Dokumentacja

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW](https://mswjs.io/)
