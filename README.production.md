# AparatAI — przygotowanie do uruchomienia

Publiczna wersja skupia się na zdjęciach produktów dla sklepów: jedna próbna generacja bez konta, trzy aranżacje, porównanie i pobieranie. Oryginalne studio jest zachowane w `LegacyStudioApp.tsx` i starych komponentach, ale nie jest importowane do publicznego buildu. Brand Kit, menu, publikator i wideo wymagają osobnego podłączenia do bezpiecznego serwera. Nie reklamować ich jako uruchomionych funkcji tej wersji.

## Uruchomienie lokalne

Node 22, pnpm 11.25.0. `pnpm install`, następnie `pnpm lint`, `pnpm test`, `pnpm build`.

Do samego testowania interfejsu ustaw `LOCAL_PREVIEW=true` i lokalny `TRIAL_IP_SECRET` o długości co najmniej 32 znaków. Uruchom `pnpm server:dev` i w drugim terminalu `pnpm dev`. Tryb podglądu **nie uruchamia AI**: zwraca znormalizowane wejściowe zdjęcie i pokazuje wyraźny komunikat. Limit w tym trybie jest w pamięci i resetuje się po restarcie serwera. Tryb jest zabroniony z `NODE_ENV=production` i nasłuchuje tylko lokalnie.

## Konfiguracja rzeczywistej usługi

Ustaw zmienne z `.env.example` w środowisku serwera, nigdy w Vite ani w kodzie klienta:

- `GEMINI_API_KEY`: klucz do generowania obrazów. Zweryfikować dostępność `TRIAL_IMAGE_MODEL` na docelowym projekcie.
- `TRIAL_IP_SECRET`: losowy sekret, min. 32 znaki. Utrzymywać stabilny; zmiana zmieni identyfikatory prób i odnowi limity.
- `TRIAL_DAILY_LIMIT`: łączna liczba rezerwacji darmowych generacji w dniu UTC, domyślnie 50. Dostępna pula obejmuje także błędy po rezerwacji.
- `GOOGLE_CLOUD_PROJECT`, `FIRESTORE_DATABASE_ID`: ten sam projekt i baza co konfiguracja klienta.
- `APP_ORIGINS`: dokładne dozwolone adresy, np. `https://aparatai.pl,https://www.aparatai.pl`. Pierwszy jest adresem powrotu ze Stripe.
- `TRUST_PROXY_HOPS`: zweryfikowana liczba zaufanych proxy. Nie zgadywać na podstawie samej nazwy hostingu. Ingress musi usuwać lub prawidłowo dopisywać nagłówki przesłane przez klienta; sprawdzić realny IP i odporność na podrobiony `X-Forwarded-For` na wdrożeniu. Przy `0` używany jest adres bezpośredniego połączenia.
- Cloud Run: konto usługi z uprawnieniami do właściwej bazy Firestore; poświadczenia ADC. W kontenerze port pochodzi ze zmiennej `PORT`. Ustawić timeout usługi powyżej 120 sekund.
- Wdrożyć `firestore.rules`: klient może odczytać własny profil, nie może zmieniać salda ani planu. Zapisy pochodzą z Firebase Admin na serwerze. Reguły nie zostały wdrożone automatycznie.
- W Firebase Auth włączyć Google i dodać domenę docelową do autoryzowanych domen.

## Stripe

Utworzyć dwa aktywne ceny jednorazowe: `STRIPE_STARTER_PRICE_ID` dla 100 zdjęć i `STRIPE_PRO_PRICE_ID` dla 500 zdjęć. Kwoty nie są zaszyte w interfejsie — pochodzą ze Stripe. To robocza struktura pakietów, do ustalenia z właścicielem. Płatności są wyłączone, gdy nie ma konfiguracji; nie pokazujemy fikcyjnego zakupu.

Ustawić `STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET`. Endpoint: `/api/stripe/webhook`, zdarzenia `checkout.session.completed` i `checkout.session.async_payment_succeeded`. Serwer weryfikuje podpis surowego body, status zapłaty, identyfikator ceny i ilość. Dokument pokwitowania ma ID sesji, więc ponowne doręczenie zdarzenia nie zwiększa salda drugi raz. Sam redirect `?payment=success` nigdy nie przyznaje kredytów.

Przed sprzedażą wykonać pełny test Stripe w trybie testowym, potem skonfigurować rzeczywiste ceny i dane sprzedawcy. Nie wykonano rzeczywistych płatności ani nie utworzono kont z tego projektu.

## Limity i logi

- Próba jest blokowana transakcją Firestore przed wywołaniem AI. Odświeżenie, nowa karta ani inna instancja serwera jej nie odnawia. IPv4 ma jeden identyfikator; IPv6 jest grupowany po /64.
- Identyfikator sieci jest HMAC, nie surowym IP. Dokument próby nie zawiera zdjęcia. Nie ma automatycznego TTL próby, bo zmieniłby regułę jednej próby.
- IP nie identyfikuje jednoznacznie osoby. Wspólne Wi-Fi dzieli limit; VPN lub nowa sieć może dać inną tożsamość. Przy większym ruchu dołożyć zarządzaną ochronę botową i limity na ingress.
- Rate limit w procesie: 30 żądań API/minutę/sieć. To warstwa pomocnicza, nie wspólny globalny licznik. Limit prób i dzienny budżet są wspólne w Firestore.
- Rezerwacja pozostaje po niepewnym błędzie AI. Nie ponawiamy automatycznie płatnych wywołań. Obsługa może sprawdzić numer zgłoszenia i rozpatrzyć próbę.
- Płatne generacje rezerwują jeden kredyt w transakcji, blokują drugą równoległą generację konta i zwracają kredyt przy obsłużonym błędzie. Nagłe zakończenie procesu może pozostawić zadanie `processing` i blokadę konta: przed premierą podłączyć kolejkę/reconciliation lub procedurę operacyjną dla `generationJobs`, zanim otworzy się sprzedaż na większy ruch.
- Logi JSON obejmują request ID, etap, status i czas. Nie wypisujemy base64, kluczy, tokenów ani pełnych błędów dostawcy. Infrastruktura hostingu może osobno logować IP — ustalić retencję i dostęp.
- Zdjęcia i wyniki w tej wersji nie są zapisywane w galerii. Pobieranie działa w bieżącej karcie. Historia i przechowywanie wyników są następnym zakresem, nie gotową funkcją.

## Weryfikacja

Testy lokalne wykorzystują testowy generator i serializowalną atrapę bazy. Obejmują próby równoległe, podrobione nagłówki, błędne pliki, błędy AI, budżet, saldo konta, zwroty i rzeczywiste podpisy testowych webhooków Stripe. Nie zastępują integracji z rzeczywistym Firestore ani dostawcą AI. Przed premierą sprawdzić te integracje na środowisku testowym, zachowanie identyczności produktu na rzeczywistych zdjęciach, restart procesu i konfigurację ingress.

Znalezione repozytorium GitHub: `https://github.com/aimarketingagencynorge-boop/aparatAI.pl`. Zawiera osobną pokazówkę (obiektyw, HUD i jeden kredyt w stanie przeglądarki), a nie pełne studio z przesłanego ZIP-a. Sklonowano ją do `../upstream` do porównania; repozytorium zdalne nie zostało zmienione.

Interfejs publiczny zachowuje motyw aparatu: czarny korpus, niebieskie światła, wizjer, obiektyw, pokrętło aranżacji i spust. Wgrany produkt i wynik pojawiają się w wizjerze. Pokrętło, wgrywanie, wywoływanie i pobieranie są połączone z rzeczywistymi funkcjami aplikacji.

Do uzupełnienia przez właściciela: dostęp do wdrożenia/DNS, konfiguracja serwera i Stripe, ceny, dane sprzedawcy i dokumenty obsługi klienta. Limit pięciu animacji wymaga doprecyzowania; wideo nie jest częścią darmowej próby.

## TikTok

Odczytany profil: `https://www.tiktok.com/@aparatai.pl`; nazwa „Aparatai Pl”, bio „Tworzymy zdjęcia produktowe z AI / Bez studia. Bez limitów. / Sprzedawaj obrazem. / ↓ aparatai.pl”. Profil nie został zmieniony.

Propozycja nazwy: **AparatAI | Zdjęcia produktów**.

Propozycja bio: **Zdjęcia produktów z AI. Dla sklepów online. Przetestuj 1 zdjęcie za darmo ↓**.

Dokumentacja użyta przy implementacji: [transakcje Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions), [weryfikacja podpisów Stripe](https://docs.stripe.com/events/manage-webhook-endpoints#signature-errors), [kontrakt kontenera Cloud Run](https://docs.cloud.google.com/run/docs/container-contract).

Docelowy link po uruchomieniu: `https://aparatai.pl/?utm_source=tiktok&utm_medium=organic&utm_campaign=profile#test`. Używać tylko po rzeczywistym uruchomieniu testu na domenie.

Pierwsze trzy przypięte filmy: (1) pełny proces od zwykłego zdjęcia do pobrania, (2) jeden produkt w trzech aranżacjach, (3) instrukcja bezpłatnego testu. Pokazywać prawdziwe wyniki i produkt obok oryginału. Nie obiecywać nielimitowanych generacji ani gwarantowanego zachowania wszystkich detali.
