# Stripe i kredyty — 14 października 2026

## Stan

Wybrany operator produkcyjny: Stripe. PayPal pozostaje wyłączony w punkcie uruchomienia serwera. Zmiany są przygotowane lokalnie; nie oznacza to uruchomienia sprzedaży ani testu rzeczywistej płatności.

Saldo jest wspólne dla zdjęć i filmów. Zatwierdzony przez właściciela cennik: 20 kredytów za 49 PLN, 100 za 199 PLN, 500 za 799 PLN. Zdjęcie kosztuje 1 kredyt, film 10 kredytów. Film z wybranego wygenerowanego zdjęcia: Veo 3.1 Lite, 8 sekund, 1080p, pion 9:16 albo poziom 16:9. Wideo domyślnie pozostaje wyłączone do próby z rzeczywistym dostawcą.

## Konfiguracja Stripe

1. Używać istniejącego konta sprzedawcy; na zrzucie właściciela widoczne `usetheforce.ai`, waluta NOK. Zweryfikować konto i dane sprzedawcy przed włączeniem sprzedaży AparatAI.
2. Jednorazowe pakiety w PLN: mini 20/49 zł, starter 100/199 zł, pro 500/799 zł. Checkout po polsku (`locale: pl`).
3. Utworzyć produkty/ceny w trybie testowym. Ustawić po stronie serwera `STRIPE_SECRET_KEY`, `STRIPE_MINI_PRICE_ID`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`. Domyślny katalog sprawdza zgodność kwot i waluty z zatwierdzonym cennikiem. Nie umieszczać klucza w Vite, repozytorium ani czacie.
4. Endpoint webhooka: `https://m-j-aparat-ai-profesjonalna-fotografia-produktowa-301238981720.us-west1.run.app/api/stripe/webhook`. Zdarzenia: `checkout.session.completed`, `checkout.session.async_payment_succeeded`. Sekret podpisu: `STRIPE_WEBHOOK_SECRET` w środowisku serwera.
5. Pierwszy wpis `APP_ORIGINS` to adres powrotu; produkcyjnie `https://www.aparatai.pl`.
6. Zweryfikować cały zakup testowy: konto z zerowym saldem, checkout, powrót, dodanie kredytów dokładnie raz, powtórzony webhook, zdjęcie, odmowa przy braku kredytów. Przed produkcją podmienić testowe ceny i klucze na live, zachowując zgodny tryb webhooka.

## Zasady rozliczenia

Klient wybiera wyłącznie identyfikator pakietu. Serwer ustala cenę i kredyty, a zapis `stripeOrders` utrwala parametry zamówienia. Podpisany webhook i uwierzytelnione potwierdzenie po powrocie stosują tę samą transakcję `paymentReceipts`; powtórzenia nie podwajają salda. Sam parametr `payment=success` nie przyznaje kredytów. Potwierdzenie sesji jest dostępne wyłącznie właścicielowi zamówienia.

Wideo rezerwuje koszt atomowo, blokuje równoległe zdjęcia/filmy i zapisuje identyfikator operacji dostawcy. Odświeżenie pozwala wznowić odpytywanie bez nowej generacji. Odrzucone zlecenie lub potwierdzony błąd dostawcy zwraca koszt tylko raz. Niepewne przerwanie podczas uruchamiania pozostaje `needs_review`; nie zwracamy automatycznie środków, jeśli operacja mogła już powstać. Nagły restart pomiędzy wywołaniem a zapisaniem operacji nadal wymaga procedury operacyjnej sprawdzającej `generationJobs` i blokadę konta.

Film pobieramy przez uwierzytelniony serwer — bez klucza Google i adresu dostawcy w przeglądarce. Provider przechowuje wynik czasowo, więc użytkownik powinien pobrać MP4; ta wersja nie daje trwałej galerii filmów.

## Weryfikacja lokalna

25 testów backendu, TypeScript i build. Testy używają atrap dostawców, a podpisy Stripe są sprawdzane rzeczywistym SDK. Sprawdzamy także zapisaną kwotę i liczbę kredytów zamówienia, ignorowanie ceny podanej przez klienta, wznowienie filmu i zwrot jego aktualnego kosztu. Nie zastępują próby prawdziwego checkouta ani filmu.

Kalkulacja cen: Google Gemini 3.1 Flash Image output 1K $0.067, 2K $0.101, 4K $0.151; Veo 3.1 Lite 1080p $0.08/sekundę. NBP 14.10.2026: USD 3.9042 PLN, NOK 0.4112 PLN. Dodatkowo płatne wejście, analiza, ponowienia, infrastruktura. Stripe Norway: karty EOG 2.4% + 2 NOK, plus 2% jeśli wymagane przewalutowanie. Cennik uwzględnia zapas kosztów; rzeczywiste marże, podatki i koszty pozyskania klienta należy zweryfikować po testach sprzedaży.

Dokumentacja: https://docs.stripe.com/checkout/fulfillment oraz https://ai.google.dev/gemini-api/docs/veo.
