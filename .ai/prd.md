# Dokument wymagań produktu (PRD) - Streamly
## 1. Przegląd produktu
Streamly to responsywna aplikacja webowa (RWD) zaprojektowana w celu rozwiązania problemu paraliżu decyzyjnego wśród użytkowników subskrybujących wiele platform streamingowych (SVOD). Aplikacja agreguje w jednym miejscu filmy i seriale dostępne w ramach posiadanych przez użytkownika abonamentów, które są powiązane z jego ulubionymi twórcami (aktorami, reżyserami). Głównym celem produktu jest maksymalne skrócenie czasu potrzebnego na znalezienie interesującego tytułu do obejrzenia i wyeliminowanie frustracji związanej z manualnym przeszukiwaniem każdej z platform osobno.

## 2. Problem użytkownika
Użytkownicy posiadający dostęp do kilku serwisów VOD, takich jak Netflix, Disney+ czy HBO Max, często stają przed problemem wyboru. Chcąc obejrzeć film lub serial z konkretnym, ulubionym aktorem lub reżyserem, są zmuszeni do ręcznego przeszukiwania biblioteki każdej z platform. Proces ten jest czasochłonny, nieefektywny i frustrujący. W rezultacie, wielu użytkowników porzuca swoje pierwotne zamiary i decyduje się na przypadkowy tytuł z ekranu głównego jednej z aplikacji, co prowadzi do poczucia straconego czasu i niezadowolenia z wyboru.

## 3. Wymagania funkcjonalne
### 3.1. System kont użytkowników
- Użytkownik może założyć konto za pomocą adresu e-mail i hasła.
- Użytkownik może zalogować się do swojego konta.
- Użytkownik, który zapomniał hasła, może zainicjować proces jego resetowania za pośrednictwem swojego adresu e-mail.
- Użytkownik ma możliwość trwałego usunięcia swojego konta wraz ze wszystkimi powiązanymi danymi, zgodnie z wymogami RODO.

### 3.2. Onboarding nowego użytkownika
- Po pierwszej rejestracji użytkownik przechodzi przez obligatoryjny, dwuetapowy proces konfiguracji.
- Krok 1: Wybór posiadanych platform streamingowych z predefiniowanej listy (wymagany wybór co najmniej jednej).
- Krok 2: Wyszukanie i dodanie do profilu ulubionych twórców (wymagane dodanie co najmniej trzech).

### 3.3. Ekran główny i rekomendacje
- Aplikacja wyświetla zagregowaną listę filmów i seriali spełniających łącznie dwa warunki:
    1.  Są powiązane z co najmniej jednym ulubionym twórcą użytkownika.
    2.  Są dostępne na co najmniej jednej z platform VOD wybranych przez użytkownika.
- Wyświetlane są wyłącznie treści dostępne w ramach abonamentu (SVOD).
- Lista rekomendacji jest sortowana domyślnie od najnowszych produkcji (według daty premiery).
- Rekomendacje prezentowane są w formie tekstowej, bez plakatów. Każda pozycja zawiera: Tytuł, Rok produkcji, Gatunek, Listę twórców, Krótki opis oraz listę platform, na których tytuł jest dostępny.
- Lista zawiera maksymalnie 50 rekomendacji, zaimplementowany jest mechanizm "infinite scroll" do ładowania kolejnych pozycji.
- Przy każdej rekomendacji znajduje się interaktywny element (np. ikona) pozwalający oznaczyć tytuł jako "obejrzany". Oznaczenie powoduje usunięcie tytułu z listy rekomendacji.

### 3.4. Zarządzanie profilem
- Użytkownik ma stały, widoczny dostęp do sekcji profilu.
- W profilu użytkownik może w dowolnym momencie edytować listę swoich platform VOD.
- W profilu użytkownik może zarządzać listą ulubionych twórców (dodawać nowych i usuwać istniejących).
- Profil zawiera osobną zakładkę "Obejrzane" z listą wszystkich tytułów oznaczonych w ten sposób przez użytkownika.

## 4. Granice produktu
### 4.1. Funkcjonalności zawarte w MVP
- System kont: Rejestracja, logowanie, usuwanie konta, resetowanie hasła.
- Onboarding: Wymuszona konfiguracja platform i twórców.
- Ekran główny: Zagregowana, posortowana lista tekstowych rekomendacji z funkcją "Oznacz jako obejrzane" i "infinite scroll".
- Zarządzanie profilem: Edycja platform, zarządzanie twórcami, historia obejrzanych tytułów.
- Platforma: Responsywna aplikacja webowa (RWD).
- Dane: Integracja z zewnętrznym API (np. https://docs.movieofthenight.com/) do pobierania danych o filmach i ich dostępności.

### 4.2. Funkcjonalności wykluczone z MVP
- Zaawansowane filtrowanie i sortowanie rekomendacji (np. po gatunku, ocenach).
- Szczegółowe podstrony filmów i seriali.
- System ocen, recenzji i komentarzy.
- Jakiekolwiek funkcje społecznościowe (np. śledzenie znajomych).
- System powiadomień.
- Prezentacja plakatów filmowych na liście rekomendacji.
- Bezpośrednie linki przekierowujące do platform VOD.
- Treści dostępne poza abonamentem (TVOD/EST).

## 5. Historyjki użytkowników
---
- ID: US-001
- Tytuł: Rejestracja nowego konta
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do spersonalizowanych funkcji.
- Kryteria akceptacji:
    1.  Formularz rejestracji zawiera pola na adres e-mail i hasło.
    2.  System waliduje poprawność formatu adresu e-mail.
    3.  System wymusza minimalne wymagania co do siły hasła.
    4.  Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do pierwszego kroku onboardingu.
    5.  W przypadku, gdy e-mail jest już zajęty, wyświetlany jest stosowny komunikat błędu.

---
- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby zobaczyć swoje rekomendacje i zarządzać profilem.
- Kryteria akceptacji:
    1.  Formularz logowania zawiera pola na adres e-mail i hasło.
    2.  Po poprawnym wprowadzeniu danych jestem zalogowany i przekierowany na ekran główny z rekomendacjami.
    3.  W przypadku podania błędnych danych uwierzytelniających, wyświetlany jest stosowny komunikat błędu.

---
- ID: US-003
- Tytuł: Onboarding - Krok 1: Wybór platform VOD
- Opis: Jako nowy użytkownik, zaraz po rejestracji, chcę wybrać z listy platformy streamingowe, które subskrybuję, aby aplikacja wiedziała, gdzie szukać dla mnie treści.
- Kryteria akceptacji:
    1.  Ekran przedstawia listę dostępnych platform VOD w formie pól wyboru (checkbox).
    2.  Muszę wybrać co najmniej jedną platformę, aby przejść do następnego kroku.
    3.  Przycisk "Dalej" jest nieaktywny, dopóki nie zaznaczę co najmniej jednej opcji.
    4.  Mój wybór jest zapisywany w moim profilu.

---
- ID: US-004
- Tytuł: Onboarding - Krok 2: Wybór ulubionych twórców
- Opis: Jako nowy użytkownik, po wybraniu platform, chcę wyszukać i dodać moich ulubionych twórców (aktorów, reżyserów), aby otrzymać trafne rekomendacje.
- Kryteria akceptacji:
    1.  Ekran zawiera pole wyszukiwania.
    2.  Gdy wpisuję tekst w pole wyszukiwania, system dynamicznie pokazuje pasujące wyniki z API.
    3.  Wyniki wyszukiwania dla twórcy zawierają jego imię, nazwisko, rolę (np. aktor) i datę urodzenia w celu łatwej identyfikacji.
    4.  Mogę dodać twórcę do mojej listy ulubionych.
    5.  Muszę dodać co najmniej trzech twórców, aby zakończyć onboarding.
    6.  Przycisk "Zakończ" jest nieaktywny, dopóki na mojej liście nie znajdą się co najmniej trzy osoby.
    7.  Po zakończeniu onboardingu jestem przekierowywany na ekran główny.

---
- ID: US-005
- Tytuł: Przeglądanie rekomendacji
- Opis: Jako zalogowany użytkownik, chcę na ekranie głównym zobaczyć listę filmów i seriali z udziałem moich ulubionych twórców, które są dostępne na moich platformach, abym mógł szybko znaleźć coś do obejrzenia.
- Kryteria akceptacji:
    1.  Na ekranie głównym widzę listę tytułów.
    2.  Każdy tytuł na liście jest powiązany z co najmniej jednym z moich ulubionych twórców ORAZ jest dostępny na co najmniej jednej z moich platform VOD.
    3.  Lista jest posortowana od najnowszych do najstarszych produkcji.
    4.  Każda pozycja na liście wyświetla: tytuł, rok produkcji, gatunek, krótki opis, listę twórców oraz listę moich platform, na których można go obejrzeć.
    5.  Twórcy z mojej listy ulubionych są wizualnie wyróżnieni na liście twórców danego tytułu.
    6.  Gdy przewijam listę do końca, automatycznie doładowywane są kolejne pozycje (do maksymalnie 50).

---
- ID: US-006
- Tytuł: Oznaczanie tytułu jako obejrzany
- Opis: Jako użytkownik przeglądający rekomendacje, chcę mieć możliwość oznaczenia tytułu jako "obejrzany", aby nie pojawiał się on więcej na mojej liście i abym mógł śledzić swoją historię.
- Kryteria akceptacji:
    1.  Przy każdej pozycji na liście rekomendacji znajduje się klikalny element (np. ikona oka).
    2.  Po kliknięciu tego elementu, tytuł natychmiast znika z mojej listy rekomendacji.
    3.  Oznaczony tytuł zostaje dodany do mojej historii w zakładce "Obejrzane".

---
- ID: US-007
- Tytuł: Zarządzanie preferencjami
- Opis: Jako użytkownik, chcę w dowolnym momencie móc edytować listę moich subskrypcji VOD i ulubionych twórców, aby moje rekomendacje były zawsze aktualne.
- Kryteria akceptacji:
    1.  W interfejsie aplikacji jest stały, łatwo dostępny link do mojego profilu/ustawień.
    2.  W ustawieniach mogę modyfikować listę wybranych platform VOD (dodawać/usuwać).
    3.  W ustawieniach mogę zarządzać listą ulubionych twórców (dodawać nowych przez wyszukiwarkę i usuwać istniejących).
    4.  Zmiany w preferencjach są natychmiast odzwierciedlane na liście rekomendacji po powrocie na ekran główny.

---
- ID: US-008
- Tytuł: Przeglądanie historii obejrzanych
- Opis: Jako użytkownik, chcę mieć dostęp do listy wszystkich tytułów, które oznaczyłem jako "obejrzane", aby móc wrócić do swojej historii.
- Kryteria akceptacji:
    1.  W moim profilu znajduje się sekcja lub zakładka "Obejrzane".
    2.  Sekcja ta zawiera listę wszystkich tytułów, które oznaczyłem.
    3.  Lista jest prosta i zawiera co najmniej tytuł i rok produkcji.

---
- ID: US-009
- Tytuł: Usunięcie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich moich danych, zgodnie z moimi prawami.
- Kryteria akceptacji:
    1.  W ustawieniach profilu znajduje się opcja "Usuń konto".
    2.  Po kliknięciu opcji wyświetlane jest okno dialogowe z prośbą o potwierdzenie decyzji.
    3.  Po potwierdzeniu moje konto oraz wszystkie dane (wybrane platformy, ulubieni twórcy, historia obejrzanych) są trwale usuwane z systemu.
    4.  Po usunięciu konta jestem wylogowywany i przekierowywany na stronę główną.

---
- ID: US-010
- Tytuł: Obsługa pustego stanu rekomendacji
- Opis: Jako użytkownik, w sytuacji gdy żadna produkcja nie pasuje do moich kryteriów, chcę zobaczyć jasny komunikat, zamiast pustego ekranu, aby wiedzieć co robić dalej.
- Kryteria akceptacji:
    1.  Jeśli system nie znajdzie żadnych pasujących rekomendacji, na ekranie głównym wyświetlany jest komunikat.
    2.  Komunikat informuje o braku wyników i sugeruje edycję preferencji (np. "Nie znaleziono rekomendacji. Spróbuj dodać więcej twórców lub platform w swoim profilu.").
    3.  Komunikat zawiera link przekierowujący do strony edycji profilu.

---
- ID: US-011
- Tytuł: Resetowanie zapomnianego hasła
- Opis: Jako zarejestrowany użytkownik, który zapomniał swojego hasła, chcę móc je zresetować przy użyciu mojego adresu e-mail, aby odzyskać dostęp do konta.
- Kryteria akceptacji:
    1. Na ekranie logowania (obok formularza z US-002) znajduje się wyraźny link "Zapomniałem/am hasła".
    2. Po kliknięciu linku, jestem przekierowywany do widoku z jednym polem do wpisania adresu e-mail.
    3. Po wpisaniu i zatwierdzeniu adresu, system sprawdza, czy e-mail istnieje w bazie danych.
    4. Jeśli e-mail istnieje, na podany adres wysyłana jest wiadomość zawierająca unikalny, ograniczony czasowo link do resetu hasła.
    5. Po wejściu w link z wiadomości e-mail, jestem przekierowywany do formularza ustawiania nowego hasła (z polami "Nowe hasło" i "Potwierdź nowe hasło").
    6. Walidacja siły nowego hasła jest taka sama, jak przy rejestracji (zgodnie z US-001).
    7. Po pomyślnym ustawieniu nowego hasła, jestem przekierowywany na ekran logowania z komunikatem potwierdzającym zmianę.
    8. Jeśli w kroku 3. podany e-mail nie istnieje w bazie, wyświetlany jest ogólny komunikat (np. "Jeśli konto istnieje, instrukcje resetowania zostały wysłane."), aby nie ujawniać, które adresy e-mail są zarejestrowane.

## 6. Metryki sukcesu
### 6.1. Aktywacja użytkownika
- Cel: 70% nowo zarejestrowanych użytkowników dodaje do swojego profilu co najmniej 3 ulubionych twórców i wybiera co najmniej 1 platformę streamingową podczas pierwszej sesji.
- Pomiar: Analityka zdarzeń śledząca ukończenie kroków onboardingu.

### 6.2. Walidacja wartości produktu
- Cel: Co najmniej 25% tygodniowo aktywnych użytkowników oznacza minimum jeden film lub serial jako "obejrzany" w ciągu tygodnia.
- Pomiar: Analityka zdarzeń śledząca użycie funkcji "Oznacz jako obejrzane" w podziale na użytkowników aktywnych w danym tygodniu.

### 6.3. Retencja użytkowników
- Cel: Osiągnięcie wskaźnika retencji Dnia 7 (D7 Retention) na poziomie 15%.
- Pomiar: Odsetek użytkowników, którzy wracają do aplikacji siódmego dnia po rejestracji.

### 6.4. Definicje kluczowe
- Tygodniowo Aktywny Użytkownik (WAU): Użytkownik, który zalogował się do aplikacji co najmniej raz w ciągu ostatnich 7 dni.