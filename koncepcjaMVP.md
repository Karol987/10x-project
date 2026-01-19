### Główny problem

Paraliż decyzyjny i strata czasu. Użytkownicy posiadający subskrypcje kilku platform streamingowych (Netflix, HBO, Disney+ itp.) chcą obejrzeć film lub serial z udziałem konkretnego, ulubionego twórcy (aktora, reżysera). Ręczne przeszukiwanie każdej platformy z osobna jest frustrujące i nieefektywne, co często kończy się porzuceniem poszukiwań i włączeniem czegokolwiek z ekranu głównego.

### Najmniejszy zestaw funkcjonalności

- Prosty system kont użytkowników (np. logowanie przez email/hasło) do zapisywania swoich preferencji.
- Wybór posiadanych platform streamingowych w profilu użytkownika (proste checkboxy, np. "Mam Netflix", "Mam Disney+").
- Zarządzanie listą ulubionych twórców:
  - Wyszukiwarka do znajdowania i dodawania osób (aktorów, reżyserów).
  - Możliwość usuwania osób z listy.
- Główny ekran z rekomendacjami: Agregacja i wyświetlanie listy filmów/seriali, które:
  - Są powiązane z ulubionymi twórcami użytkownika.
  - Są aktualnie dostępne na co najmniej jednej z platform wybranych przez użytkownika.
- Integracja z zewnętrznym API (np. <https://docs.movieofthenight.com/>) w celu pobierania filmografii twórców oraz sprawdzania bieżącej dostępności VOD.

### Co NIE wchodzi w zakres MVP

- Zaawansowane filtry i sortowanie (np. po gatunku, roku produkcji, ocenach).
- Szczegółowe podstrony filmów/seriali (w MVP wystarczy kafelek z tytułem, plakatem i informacją, gdzie obejrzeć).
- System ocen, recenzji i komentarzy.
- Funkcje społecznościowe (śledzenie innych użytkowników, udostępnianie list).
- Powiadomienia (np. o dodaniu nowego filmu od ulubionego twórcy do oferty VOD).
- Bezpośrednie odpytywanie LLM o dostępność VOD (zamiast tego użycie stabilnego, dedykowanego API).

### Kryteria sukcesu

- Aktywacja użytkownika: 70% nowo zarejestrowanych użytkowników dodaje do swojego profilu co najmniej 3 ulubionych twórców i wybiera 1 platformę streamingową podczas pierwszej sesji.
- Walidacja wartości: Co najmniej 25% tygodniowo aktywnych użytkowników klika w link prowadzący do platformy streamingowej, co potwierdza, że aplikacja skutecznie pomogła im znaleźć coś do obejrzenia.
