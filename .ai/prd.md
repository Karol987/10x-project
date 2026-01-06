# Dokument wymagań produktu (PRD) - Streamly

## 1. Przegląd produktu

Streamly to responsywna aplikacja webowa (RWD) zaprojektowana w celu rozwiązania problemu paraliżu decyzyjnego wśród użytkowników subskrybujących wiele platform streamingowych (SVOD). Aplikacja agreguje w jednym miejscu filmy i seriale dostępne w ramach posiadanych przez użytkownika abonamentów, które są powiązane z jego ulubionymi twórcami (aktorami, reżyserami). Głównym celem produktu jest maksymalne skrócenie czasu potrzebnego na znalezienie interesującego tytułu do obejrzenia poprzez generowanie spersonalizowanych rekomendacji "na żądanie" (on-demand). Aplikacja eliminuje frustrację związaną z manualnym przeszukiwaniem każdej z platform osobno, oferując prosty, tekstowy interfejs skupiony na szybkim wyborze.

## 2. Problem użytkownika

Użytkownicy posiadający dostęp do kilku serwisów VOD, takich jak Netflix, Disney+ czy HBO Max, często stają przed problemem wyboru. Chcąc obejrzeć film lub serial z konkretnym, ulubionym aktorem lub reżyserem, są zmuszeni do ręcznego przeszukiwania biblioteki każdej z platform. Proces ten jest czasochłonny, nieefektywny i frustrujący. W rezultacie, wielu użytkowników porzuca swoje pierwotne zamiary i decyduje się na przypadkowy tytuł z ekranu głównego jednej z aplikacji, co prowadzi do poczucia straconego czasu i niezadowolenia z wyboru. Streamly rozwiązuje ten problem, agregując ofertę wyłącznie z opłacanych przez użytkownika subskrypcji (SVOD) i filtrując ją przez pryzmat ulubionych twórców.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników i bezpieczeństwo

- Użytkownik może założyć konto za pomocą adresu e-mail i hasła.
- Hasła są walidowane pod kątem siły (minimum 8 znaków, w tym cyfra i znak specjalny).
- Użytkownik może bezpiecznie zalogować się do swojego konta (sesja użytkownika).
- Użytkownik może wylogować się z aplikacji.
- Użytkownik, który zapomniał hasła, może zainicjować proces jego resetowania za pośrednictwem adresu e-mail.
- Użytkownik ma możliwość trwałego usunięcia swojego konta wraz ze wszystkimi powiązanymi danymi (RODO).

### 3.2. Onboarding nowego użytkownika

- Proces jest obligatoryjny po pierwszej rejestracji i składa się z dwóch kroków.
- Krok 1: Wybór platform streamingowych z predefiniowanej listy (wymagane zaznaczenie min. 1 platformy).
- Krok 2: Wyszukanie i dodanie ulubionych twórców (wymagane dodanie min. 3 twórców: aktorów lub reżyserów).
- Wyniki wyszukiwania twórców zawierają imię, nazwisko, rolę oraz datę urodzenia, aby ułatwić identyfikację.

### 3.3. Ekran główny i rekomendacje

- Aplikacja generuje rekomendacje w sposób synchroniczny (on-demand) w momencie wejścia użytkownika na ekran główny.
- Rekomendacje spełniają łącznie dwa warunki: są powiązane z min. 1 ulubionym twórcą oraz są dostępne na min. 1 wybranej platformie VOD.
- Wyświetlane są wyłącznie treści dostępne w ramach abonamentu (SVOD); treści płatne dodatkowo (TVOD/EST) są wykluczone.
- Lista sortowana jest chronologicznie: od najnowszych produkcji (według daty premiery światowej).
- Rekomendacje prezentowane są w formie plakat z tekstem, zawierającym: Tytuł, Rok produkcji, Gatunek, Listę twórców, Krótki opis (2-3 linie) oraz listę platform dostępności.
- Lista ograniczona jest do 50 pozycji, ładowanych dynamicznie mechanizmem "infinite scroll".
- Każda rekomendacja posiada funkcję "Oznacz jako obejrzane", co usuwa tytuł z listy i przenosi go do historii.
- W przypadku seriali, oznaczenie "obejrzane" dotyczy całego serialu jako jednej encji.

### 3.4. Zarządzanie profilem

- Użytkownik ma stały dostęp do edycji swoich preferencji (platformy i twórcy).
- Zmiany w profilu natychmiast wpływają na algorytm rekomendacji.
- Profil zawiera zakładkę "Obejrzane" z prostą listą historyczną (tytuł + rok) oznaczonych produkcji.

### 3.5. Obsługa błędów i stanów pustych

- W przypadku braku wyników (pusta lista rekomendacji), wyświetlany jest komunikat zachęcający do dodania większej liczby twórców lub platform, wraz z linkiem do edycji profilu.
- W przypadku awarii zewnętrznego API, użytkownik otrzymuje czytelny komunikat błędu zamiast "rozsypanego" interfejsu.

## 4. Granice produktu

### 4.1. Funkcjonalności zawarte w MVP

- Platforma: Responsywna aplikacja webowa (RWD).
- Uwierzytelnianie: Rejestracja, logowanie, reset hasła, wylogowanie, usuwanie konta.
- Core: Onboarding (wymuszenie preferencji), pobieranie danych z zewnętrznego API (np. TMDB/JustWatch), algorytm filtracji (Creator + Platform + SVOD Only).
- UI: Lista - plakat/zdjęcie + tekst, sortowanie po dacie, oznaczanie jako obejrzane.
- Profil: Edycja ustawień, historia obejrzanych.

### 4.2. Funkcjonalności wykluczone z MVP

- Zaawansowane filtrowanie (np. po gatunku, ocenach IMDB/Rotten Tomatoes).
- Szczegółowe podstrony filmów i seriali (widok ogranicza się do karty na liście).
- System ocen, recenzji i komentarzy użytkowników.
- Funkcje społecznościowe (udostępnianie, śledzenie znajomych).
- Powiadomienia (push/email) o nowych filmach.
- Bezpośrednie linki przekierowujące (deep links) do aplikacji VOD.
- Treści dostępne w modelach transakcyjnych (wypożyczenia/kupno).

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja nowego konta
Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do spersonalizowanych funkcji.
Kryteria akceptacji:

1. Formularz rejestracji zawiera pola na adres e-mail i hasło.
2. System waliduje poprawność formatu adresu e-mail.
3. System wymusza hasło o długości min. 8 znaków.
4. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do pierwszego kroku onboardingu.
5. W przypadku, gdy e-mail jest już zajęty, wyświetlany jest stosowny komunikat błędu.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby zobaczyć swoje rekomendacje i zarządzać profilem.
Kryteria akceptacji:

1. Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
2. Formularz logowania wymaga podania e-maila i hasła.
3. Po poprawnym wprowadzeniu danych jestem przekierowany na ekran główny.
4. Błędne dane powodują wyświetlenie komunikatu "Nieprawidłowy login lub hasło".
5. Sesja użytkownika jest utrzymywana bezpiecznie do momentu wylogowania.

ID: US-003
Tytuł: Onboarding - Krok 1: Wybór platform VOD
Opis: Jako nowy użytkownik, zaraz po rejestracji, chcę wybrać z listy platformy streamingowe, które subskrybuję, aby aplikacja wiedziała, gdzie szukać dla mnie treści.
Kryteria akceptacji:

1. Ekran wyświetla listę dostępnych platform (np. Netflix, HBO, Disney+).
2. Przycisk "Dalej" jest nieaktywny do momentu zaznaczenia min. 1 platformy.
3. Wybór jest zapisywany w bazie danych przypisanej do mojego konta.
4. Funkcjonalność Onboardingu nie jest dostępna bez logowania się do systemu (US-002)

ID: US-004
Tytuł: Onboarding - Krok 2: Wybór ulubionych twórców
Opis: Jako nowy użytkownik, po wybraniu platform, chcę wyszukać i dodać moich ulubionych twórców, aby otrzymać trafne rekomendacje.
Kryteria akceptacji:

1. Wyszukiwarka dynamicznie podpowiada wyniki z API podczas wpisywania.
2. Wynik wyszukiwania zawiera: imię, nazwisko, rolę (np. Reżyser) i rok urodzenia.
3. Przycisk "Zakończ" jest nieaktywny, dopóki lista ulubionych zawiera mniej niż 3 osoby.
4. Po dodaniu 3. twórcy i kliknięciu "Zakończ", jestem przenoszony na ekran główny.
5. Funkcjonalność Onboardingu nie jest dostępna bez logowania się do systemu (US-002)

ID: US-005
Tytuł: Przeglądanie rekomendacji (Ekran główny)
Opis: Jako zalogowany użytkownik, chcę zobaczyć listę produkcji SVOD posortowaną od najnowszych, powiązaną z moimi twórcami i platformami.
Kryteria akceptacji:

1. Lista ładuje się synchronicznie po wejściu na stronę (możliwy wskaźnik ładowania).
2. Wyświetlane są tylko tytuły dostępne w modelu abonamentowym (SVOD).
3. Lista posortowana jest malejąco wg daty premiery.
4. Każdy element listy zawiera : Plakat/zdjęcie, Tytuł, Rok, Gatunek, Opis, Twórców, Dostępne Platformy.
5. Mechanizm "infinite scroll" doładowuje kolejne pozycje po przewinięciu (do max 50).
6. Funkcjonalność 'Przeglądanie rekomendacji' Onboardingu nie jest dostępna bez logowania się do systemu (US-002)

ID: US-006
Tytuł: Oznaczanie tytułu jako obejrzany
Opis: Jako użytkownik, chcę oznaczyć film lub serial jako "obejrzany", aby zniknął z rekomendacji i trafił do historii.
Kryteria akceptacji:

1. Przy każdym tytule widoczna jest ikona/przycisk "Oznacz jako obejrzane".
2. Kliknięcie usuwa element z listy rekomendacji bez konieczności odświeżania strony.
3. Tytuł zostaje zapisany w historii użytkownika.
4. Dla seriali akcja ta oznacza obejrzenie całej produkcji.
5. Funkcjonalność 'Oznaczanie tytułu jako obejrzany' nie jest dostępna bez logowania się do systemu (US-002)

ID: US-007
Tytuł: Edycja preferencji (Profil)
Opis: Jako użytkownik, chcę w dowolnym momencie zmienić moje platformy i twórców, aby odświeżyć rekomendacje.
Kryteria akceptacji:

1. Sekcja "Profil" pozwala na dodawanie/usuwanie platform VOD.
2. Sekcja "Profil" pozwala na wyszukiwanie i usuwanie twórców.
3. Zmiany są zapisywane natychmiastowo.
4. Powrót na ekran główny skutkuje przeładowaniem listy rekomendacji wg nowych kryteriów.
5. Funkcjonalność 'Edycja preferencji' nie jest dostępna bez logowania się do systemu (US-002)

ID: US-008
Tytuł: Przeglądanie historii
Opis: Jako użytkownik, chcę widzieć listę tytułów oznaczonych jako obejrzane.
Kryteria akceptacji:

1. W profilu dostępna jest zakładka "Obejrzane".
2. Lista zawiera tytuły i lata produkcji filmów/seriali, które oznaczyłem w US-006.
3. Lista jest posortowana od ostatnio dodanych.
4. Funkcjonalność 'Przeglądanie historii' nie jest dostępna bez logowania się do systemu (US-002)

ID: US-009
Tytuł: Usunięcie konta
Opis: Jako użytkownik, chcę trwale usunąć konto i dane.
Kryteria akceptacji:

1. Opcja dostępna w ustawieniach profilu.
2. Wymagane dodatkowe potwierdzenie w oknie dialogowym.
3. Usunięcie konta kasuje bezpowrotnie dane osobowe, preferencje i historię.
4. Następuje wylogowanie i przekierowanie na stronę startową.
5. Funkcjonalność 'Usunięcie konta' nie jest dostępna bez logowania się do systemu (US-002)

ID: US-010
Tytuł: Obsługa braku rekomendacji
Opis: Jako użytkownik, dla którego nie znaleziono filmów, chcę wiedzieć co zrobić dalej.
Kryteria akceptacji:

1. Wyświetlenie komunikatu: "Nie znaleziono rekomendacji. Spróbuj dodać więcej twórców lub platform.".
2. Wyświetlenie przycisku/linku kierującego bezpośrednio do edycji profilu.
3. Funkcjonalność 'Obsługa braku rekomendacji' nie jest dostępna bez logowania się do systemu (US-002)

ID: US-011
Tytuł: Resetowanie hasła
Opis: Jako użytkownik, który zapomniał hasła, chcę je zresetować przez e-mail.
Kryteria akceptacji:

1. Link "Zapomniałem hasła" na ekranie logowania.
2. Formularz wysyłki linku resetującego na podany e-mail.
3. Jeśli e-mail istnieje, system wysyła token; jeśli nie - wyświetla ogólny komunikat (security through obscurity).
4. Link w e-mailu prowadzi do formularza ustawienia nowego hasła.

ID: US-012
Tytuł: Bezpieczne wylogowanie
Opis: Jako użytkownik, chcę mieć możliwość wylogowania się, aby nikt inny nie miał dostępu do mojego konta na tym urządzeniu.
Kryteria akceptacji:

1. Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Layout.astro.
2. Kliknięcie kończy sesję użytkownika.
3. Użytkownik jest przekierowywany na ekran logowania/rejestracji.
4. Próba powrotu "wstecz" w przeglądarce nie daje dostępu do zasobów zalogowanego użytkownika.

ID: US-013
Tytuł: Obsługa błędu zewnętrznego API
Opis: Jako użytkownik, w przypadku awarii dostawcy danych, chcę zobaczyć zrozumiały komunikat.
Kryteria akceptacji:

1. Jeśli zewnętrzne API nie odpowiada lub zwraca błąd 5xx, aplikacja nie ulega awarii (crash).
2. Wyświetlany jest komunikat: "Wystąpił problem z pobraniem danych. Spróbuj ponownie później."
3. Dostępna jest opcja ręcznego odświeżenia widoku.

ID: US-014: Bezpieczny dostęp i uwierzytelnianie
Tytuł: Bezpieczny dostęp
Opis: Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych.
Kryteria akceptacji:

1. Logowanie i rejestracja odbywają się na dedykowanych stronach.
2. Logowanie wymaga podania adresu email i hasła.
3. Rejestracja wymaga podania adresu email, hasła.
4. Użytkownik NIE MOŻE korzystać z funkcji systemu bez logowania się do systemu: US-003, US-004, US-005, US-006 US-007, US-008, US-009, US-010, US-012.
5. Użytkownik MOŻE korzystać z funkcji systemu bez logowania się do systemu: US-001, US-002, US-011.
6. Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
7. Odzyskiwanie hasła powinno być możliwe.

## 6. Metryki sukcesu

### 6.1. Aktywacja użytkownika

Cel: 70% nowo zarejestrowanych użytkowników kończy proces onboardingu (wybiera min. 1 platformę i 3 twórców) podczas pierwszej sesji.
Sposób pomiaru: Lejek konwersji (Rejestracja -> Krok 1 -> Krok 2 -> Ekran Główny).

### 6.2. Walidacja wartości produktu

Cel: Co najmniej 25% tygodniowo aktywnych użytkowników (WAU) klika w przycisk "Oznacz jako obejrzane" przy minimum jednym tytule w ciągu tygodnia.
Sposób pomiaru: Liczba unikalnych użytkowników wykonujących akcję US-006 podzielona przez WAU.

### 6.3. Retencja użytkowników

Cel: Osiągnięcie wskaźnika Retencji Dnia 7 (D7 Retention) na poziomie 15%.
Sposób pomiaru: Procent użytkowników, którzy zarejestrowali się dnia 0 i zalogowali się ponownie w dniu 7.

### 6.4. Definicje kluczowe

Tygodniowo Aktywny Użytkownik (WAU): Zalogowany użytkownik, który otworzył aplikację co najmniej raz w ciągu ostatnich 7 dni kalendarzowych.
