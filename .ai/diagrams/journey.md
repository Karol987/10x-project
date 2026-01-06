<user_journey_analysis>

1. Ścieżki użytkownika (z PRD i Auth Spec):
   - Nowy użytkownik: Rejestracja -> Onboarding (Platformy) -> Onboarding (Twórcy) -> Strona Główna.
   - Powracający użytkownik: Logowanie -> Strona Główna (lub dokończenie Onboardingu).
   - Zapomniane hasło: Formularz resetu -> Email -> Formularz zmiany hasła -> Logowanie.
   - Użytkownik zalogowany: Przeglądanie rekomendacji -> Oznaczanie jako obejrzane.
   - Zarządzanie profilem: Edycja platform/twórców, Przeglądanie historii, Wylogowanie, Usunięcie konta.
   - Niezalogowany użytkownik: Próba dostępu do funkcji chronionych -> Przekierowanie do logowania.

2. Główne podróże i stany:
   - **Autentykacja**: Logowanie, Rejestracja, Odzyskiwanie Hasła.
   - **Onboarding**: Wybór Platform, Wybór Twórców.
   - **Główna Aplikacja**: Strona Główna (Feed), Profil Użytkownika, Historia.

3. Punkty decyzyjne:
   - Czy użytkownik ma konto? (Login vs Rejestracja)
   - Czy dane logowania poprawne?
   - Czy onboarding zakończony? (Middleware check)
   - Czy token resetu hasła poprawny?
   - Decyzja o wylogowaniu lub usunięciu konta.

4. Opis stanów:
   - **EkranStartowy**: Punkt wejścia dla niezalogowanych.
   - **FormularzLogowania**: Wprowadzenie poświadczeń.
   - **FormularzRejestracji**: Utworzenie konta.
   - **ProcesResetu**: Ścieżka odzyskiwania dostępu.
   - **WybórPlatform**: Krok 1 onboardingu (deklaracja subskrypcji).
   - **WybórTworcow**: Krok 2 onboardingu (deklaracja preferencji).
   - **TablicaRekomendacji**: Główny widok z filmami/serialami.
   - **ZarzadzanieProfilem**: Edycja ustawień i historii.
</user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2
    [*] --> WeryfikacjaSesji: Wejście na stronę

    state if_sesja <<choice>>
    WeryfikacjaSesji --> if_sesja
    if_sesja --> StrefaPubliczna: Brak sesji
    if_sesja --> WeryfikacjaOnboardingu: Sesja aktywna

    state "Strefa Publiczna (Niezalogowany)" as StrefaPubliczna {
        [*] --> EkranLogowania
        
        state "Logowanie" as Logowanie {
            EkranLogowania --> WeryfikacjaDanych: Wpisanie danych
            state if_dane <<choice>>
            WeryfikacjaDanych --> if_dane
            if_dane --> BłądLogowania: Dane błędne
            BłądLogowania --> EkranLogowania: Ponowna próba
            if_dane --> [*]: Sukces (Przejście do Onboardingu)
        }

        state "Rejestracja" as Rejestracja {
            EkranLogowania --> EkranRejestracji: "Załóż konto"
            EkranRejestracji --> WalidacjaRejestracji: Przesłanie formularza
            state if_rejestracja <<choice>>
            WalidacjaRejestracji --> if_rejestracja
            if_rejestracja --> BłądRejestracji: Błąd (np. email zajęty)
            BłądRejestracji --> EkranRejestracji
            if_rejestracja --> [*]: Sukces (Auto-login)
        }

        state "Odzyskiwanie Hasła" as ResetHasla {
            EkranLogowania --> ProsbaOReset: "Zapomniałem hasła"
            ProsbaOReset --> WyslanieEmaila: Podanie adresu email
            WyslanieEmaila --> ZmianaHasla: Kliknięcie w link (Email)
            ZmianaHasla --> PotwierdzenieZmiany: Nowe hasło ustawione
            PotwierdzenieZmiany --> EkranLogowania: Powrót do logowania
        }
    }

    state if_onboarding <<choice>>
    StrefaPubliczna --> WeryfikacjaOnboardingu: Po zalogowaniu/rejestracji
    WeryfikacjaOnboardingu --> if_onboarding
    
    state "Proces Onboardingu" as Onboarding {
        if_onboarding --> Krok1_Platformy: Status 'not_started'
        
        state "Krok 1: Platformy VOD" as Krok1_Platformy {
            [*] --> ListaPlatform
            ListaPlatform --> WyborPlatform: Zaznaczenie (min. 1)
            WyborPlatform --> ZapisPlatform: "Dalej"
        }

        ZapisPlatform --> Krok2_Tworcy

        state "Krok 2: Ulubieni Twórcy" as Krok2_Tworcy {
            [*] --> WyszukiwarkaTworcow
            WyszukiwarkaTworcow --> DodanieTworcy: Wybór z listy
            DodanieTworcy --> WeryfikacjaLicznika: Sprawdzenie ilości (min. 3)
            state if_licznik <<choice>>
            WeryfikacjaLicznika --> if_licznik
            if_licznik --> WyszukiwarkaTworcow: < 3 twórców
            if_licznik --> ZapisTworcow: >= 3 twórców (Przycisk "Zakończ")
        }
    }

    if_onboarding --> AplikacjaGlowna: Status 'completed'
    ZapisTworcow --> AplikacjaGlowna: Zakończenie onboardingu

    state "Aplikacja Główna (Streamly)" as AplikacjaGlowna {
        [*] --> TablicaRekomendacji

        state "Ekran Główny" as TablicaRekomendacji {
            [*] --> PobranieDanych
            PobranieDanych --> ListaFilmow: Wyświetlenie rekomendacji
            ListaFilmow --> SzczegolyFilmu: Kliknięcie w kartę
            ListaFilmow --> OznaczenieObejrzane: "Oznacz jako obejrzane"
            OznaczenieObejrzane --> AktualizacjaListy: Usunięcie z widoku
            AktualizacjaListy --> ListaFilmow
        }

        state "Profil Użytkownika" as Profil {
            TablicaRekomendacji --> PanelProfilu: Nawigacja do profilu
            
            state fork_profil <<fork>>
            PanelProfilu --> fork_profil
            
            fork_profil --> EdycjaPreferencji: Zmiana platform/twórców
            fork_profil --> HistoriaObejrzanych: Przegląd historii
            fork_profil --> StrefaNiebezpieczna: Usuwanie konta
            
            EdycjaPreferencji --> AktualizacjaAlgorytmu
            AktualizacjaAlgorytmu --> PanelProfilu
            
            StrefaNiebezpieczna --> PotwierdzenieUsuniecia: Wymagane potwierdzenie
            PotwierdzenieUsuniecia --> UsuniecieKonta: "USUŃ"
        }

        state "Wylogowanie" as ProcesWylogowania {
            TablicaRekomendacji --> Wyloguj: Kliknięcie "Wyloguj"
            PanelProfilu --> Wyloguj
            Wyloguj --> CzyszczenieSesji
        }
    }

    UsuniecieKonta --> [*]: Konto usunięte
    CzyszczenieSesji --> [*]: Sesja zakończona (Powrót do logowania)

    note right of Krok1_Platformy
        Użytkownik musi wybrać 
        przynajmniej jedną platformę,
        aby przejść dalej.
    end note

    note right of Krok2_Tworcy
        Wymagane dodanie minimum
        3 ulubionych twórców
        dla lepszych rekomendacji.
    end note
```

</mermaid_diagram>
