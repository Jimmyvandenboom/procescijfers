# D&P procesbeoordelingen · Maris College Bohemen

Compacte Nederlandstalige telefoonapp voor klas 3 (Stad van de Toekomst) en klas 4 (Campus@Sea). Node.js 24+, geen externe pakketten. Start met fictieve testgroepen van twee en vier; er zijn geen vooraf ingevulde beoordelingen.

## Configuratie en starten

1. Kopieer `.env.example` naar `.env` of configureer dezelfde variabelen in je hostingomgeving.
2. Stel **TEACHER_PASSWORD** zelf in op een sterk, uniek wachtwoord. Bewaar dit uitsluitend in serverinstellingen; commit nooit `.env`.
3. Stel **DATABASE_PATH** in op een absoluut pad op een **blijvend servervolume**, bijvoorbeeld `/workspace/procescijfers/.data/procescijfers.sqlite` in deze cloudomgeving. Een ontbrekende waarde blokkeert de API met configuratie-instructies. Een ongeldig pad geeft een startupfout. SQLite is de centrale database voor alle telefoons; er is geen browseropslag of lokale fallback.
4. `npm start` (standaard poort 3000). Voor lokaal HTTP mag `NODE_ENV=development`; voor werkelijk gebruik **NODE_ENV=production** en **HTTPS via een reverse proxy**. Productie gebruikt een Secure-cookie en werkt daarom niet via gewone HTTP.
5. Open de app en log als docent in. Maak echte groepen aan en deel elke persoonlijke inlevercode uitsluitend met de betreffende leerling. De eigen volledige naam, expeditie en code moeten overeenkomen. Dit is toegangscontrole op basis van een code, geen school-SSO.

Als `public/maris-bohemen.png` aanwezig is, verschijnt het logo linksboven.

## Gebruik

Leerlingen geven per groepslid, inclusief zichzelf, zes scores van 1–4 en zes verplichte toelichtingen (2–500 tekens). Ze controleren alles vóór definitief inleveren. De server accepteert alleen een complete, eenmalige inzending voor de eigen groep. Leerlingen kunnen geen beoordelingen teruglezen, ook hun eigen inzending niet.

De docent ziet ontvangen en ontbrekende beoordelingen, geeft iedere beoordelaar een eerlijkheidsscore, en downloadt een Excel-geschikte UTF-8 CSV met puntkomma's en decimale komma's. Formule-injectie wordt in de CSV afgezwakt. Codes worden niet geëxporteerd.

Groepsgrootte is per groep instelbaar (1–12). Vervangen kan alleen vóór de eerste inzending, vernieuwt persoonlijke codes en sluit bestaande leerlingensessies af. Groepen met inzendingen blijven behouden; maak voor een nieuwe ronde een nieuwe groep. Testgroepen zijn opvallend gelabeld, ook in export.

## Cijfers

Deelcijfer = `((som van zes criteriumscores + eerlijkheid van de beoordelaar) / 7 − 1) × 10 / 3`.
Procescijfer = ongewogen gemiddelde van alle ontvangen deelcijfers, inclusief zelfbeoordeling. Pas definitief als elk groepslid heeft beoordeeld en elke betrokken beoordelaar een eerlijkheidsscore heeft. Intern wordt niet tussentijds afgerond; scherm en CSV tonen één decimaal. Een eerlijkheidswijziging rekent de cijfers opnieuw uit.

## Beveiliging en beheer

Docentwachtwoorden worden uitsluitend op de server met een constante-tijd hashvergelijking gecontroleerd. Sessies zijn willekeurige tokens in HttpOnly, SameSite=Strict-cookies; Secure in productie. Docentsessies verlopen na 8 uur, leerlingensessies na 2 uur. Uitloggen verwijdert de sessie. Alle docent-API's en export vereisen een docentsessie. Schrijfverzoeken met een afwijkende Origin worden geweigerd. Tekst wordt in de interface ge-escaped en een Content Security Policy blokkeert externe scripts.

Inloggen is begrensd per direct verbindend IP: maximaal 5 docentpogingen of 30 leerlingpogingen per 15 minuten, ook geslaagde pogingen tellen mee. De app vertrouwt geen door clients gestuurde forwarded-IP-headers. Achter een gedeelde reverse proxy gelden deze limieten voor dat proxy-IP; configureer daar aanvullende limieten per client. Sessies en limieten leven in geheugen en verdwijnen bij herstart. Gebruik één serverinstantie en geen meerdere containers met eigen databases.

Beperk bestandsrechten en toegang tot het databasevolume, versleutel het volume via de hostingprovider en plan back-ups en een bewaartermijn voor leerlinggegevens. Maak consistente back-ups via SQLite-back-upfunctionaliteit of bij gestopte server (inclusief eventuele WAL-bestanden). Een database in een tijdelijk containerbestandssysteem is niet blijvend: productie vereist een bevestigd persistent volume. De app doet geen automatische back-ups of schoolidentiteitsverificatie.

## Controle

`npm test` test de formule, volledigheid, server/API-autorisatie, herkomstcontrole, leerlinginzending, dubbele/ongeldige inzendingen, eerlijkheid, CSV, uitloggen, inlogbegrenzing, ontbrekende databaseconfiguratie en opslag na serverherstart. Tests gebruiken tijdelijke databases en alleen een fictief testwachtwoord. Geen browser-eind-tot-eindtest beschikbaar.
