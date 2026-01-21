# Frontend - Astro z React dla komponentów interaktywnych

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników
- Edge Function (działająca po stronie serwera) bezpiecznie przechowuje Twój klucz API do <https://docs.movieofthenight.com/>
- Wykonuje zapytania server-to-server do zewnętrznego API (np. TMBD), aby pobrać wszystkie niezbędne dane

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker

Testowanie:

- Vitest służy jako główny framework do testów jednostkowych i integracyjnych (kompatybilny z ekosystemem Vite/Astro)
- React Testing Library zapewnia narzędzia do testowania komponentów React w izolacji
- Playwright umożliwia przeprowadzanie testów end-to-end, symulując pełne ścieżki użytkownika w przeglądarce
- MSW (Mock Service Worker) służy do przechwytywania i mockowania zapytań sieciowych (TMDb, MOTN API), aby nie zużywać limitów API podczas testów
