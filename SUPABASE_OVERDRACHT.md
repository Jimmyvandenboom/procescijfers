# D&P Procescijfer · actieve versie

## Gebruik

1. Open https://jimmyvandenboom.github.io/procescijfers/ en vul rechts de docentcode in.
2. Maak per project, klas, groep en beoordelingsmoment een nieuwe groep aan. Eén tot vijf leerlingen per groep.
3. Open de persoonlijke leerlingcodes. Deel iedere leerling alleen de eigen code/link. Het CSV-bestand met codes is vertrouwelijk.
4. De leerling beoordeelt zichzelf en alle groepsleden op zes criteria (1–4) en geeft per criterium een toelichting. Na controleren kiest de leerling **Verstuur naar mijn docent**.
5. Open een groep en kies Vernieuwen. Onder Bekijk staan ontvangen beoordelingen en de beoordelingen die de leerling zelf heeft gegeven. De docent beoordeelt eerlijkheid (1–4) met een toelichting en naam.
6. Sluit de ronde zodra alle beoordelingen binnen zijn. Heropenen kan. Excel-export is een UTF-8 CSV met puntkomma's; het klasfilter geldt ook voor de export.

Een concept blijft binnen het browsertabblad bewaard. Pas na succesvolle serverbevestiging is het ingeleverd. Opnieuw insturen vervangt het eigen formulier, maakt geen duplicaat en wist een eerdere eerlijkheidsbeoordeling, zodat een docent de aangepaste beoordeling opnieuw controleert.

## Oorspronkelijke rubric

`docs/rubric.json` bevat de zes leerlingcriteria en het zevende docentcriterium uit **Procescijfer.docx**, geüpload op 8 oktober 2026. Niveaus: 1 onvoldoende, 2 matig, 3 voldoende, 4 goed. De docent beoordeelt eerlijkheid van de beoordelaar, niet van het groepslid dat deze beoordeelt.

Zelfscores en peer-scores worden afzonderlijk gemiddeld op schaal 1–4. Ontbrekende inzendingen tellen niet als nul. Het aantal ontvangen peer-formulieren staat erbij. Het vlaggetje bij een verschil van ten minste 1 punt is een gesprekssignaal. Er wordt geen onbevestigde cijferformule of projectweging toegepast.

## Techniek

- `docs/index.html`, `docs/app.js`, `docs/model.js`, `docs/style.css`: buildloze productiefrontend. Geen npm-installatie nodig.
- GitHub Pages publiceert via `.github/workflows/pages.yml` rechtstreeks de map `main/docs`. De oude gh-pages-branch bevat een kopie voor oude links, maar bepaalt niet meer de publicatie.
- Supabase-project `lcixyqpuzvpfyrxyctxc` (de bestaande schoolomgeving), met afzonderlijke `dp_settings`, `dp_groups`, `dp_submissions` tabellen. Bestaande AK-tabellen blijven intact.
- `supabase/schema.sql`: reproduceerbare structuur; al toegepast op de database. Niet opnieuw op een bestaande installatie uitvoeren.
- `supabase/functions/dp-proces/index.ts`: actieve Edge Function. Publiceer alleen deze functie bij wijzigingen.
- Geen betaalde projecten of branches toegevoegd.

## Toegang en gegevens

De functie valideert zelf een docentcode of persoonlijke leerlingcode. Daarom staat gateway-JWT-controle voor deze functie uit; de toegang tot gegevens wordt binnen de functie gecontroleerd. De docentcode is een willekeurige lange toegangssleutel, waarvan alleen een SHA-256-hash in de database staat. Verander de code via Toegang beheren. De code is nooit in GitHub opgeslagen.

De frontend bevat uitsluitend de publieke publishable key. De service-role key wordt alleen in de Supabase-runtime gebruikt. Alle D&P-tabellen hebben RLS, zonder publieke policies, en alle rechten voor anon/authenticated zijn ingetrokken. De opslagfunctie is SECURITY INVOKER en alleen uitvoerbaar door service_role. Leerlingcodes zijn willekeurige waarden van 192 bits; de leerling krijgt geen codes of antwoorden van anderen terug. Een code bewijst bezit van de link, geen schoolidentiteit: houd codes persoonlijk. Er worden geen mails verzonden.

De docentcode wordt maximaal acht uur in sessionStorage onthouden. Uitloggen wist lokale sessiegegevens en concepten. Een gewijzigd formulier maakt een docentbeoordeling ongeldig. Ronde sluiten en inzenden zijn transactioneel geserialiseerd zodat sluiten niet kan worden omzeild door een gelijktijdig verzoek.

Verzamel alleen gegevens die de school voor deze beoordeling toestaat. Beperk toegang tot betrokken docenten. De beheerder kan ongebruikte groepen en bijbehorende beoordelingen op verzoek verwijderen; verwijderen zit bewust niet onder een snelle knop in de leerlingomgeving.

## Controles

- `node --check docs/app.js` en `node --check docs/model.js`.
- `node --test tests/dp-model.test.mjs`: scheiding zelf/peer, ontbrekende formulieren, gemiddelden en veilige CSV-uitvoer.
- Live API met fictieve leerlingen: verkeerde codes, afscherming, score- en toelichtingvalidatie, opslaan/herladen, docentbeoordeling, vervanging zonder duplicaten, reset eerlijkheid, gesloten ronde en heropenen.
- Browsercontrole van formulier, alle twaalf criteria in een tweepersoonsgroep, voortgang en controlepagina; dashboard met fictieve gegevens.

Nieuwe publicatie: commit wijzigingen in docs op main; de GitHub Actions-workflow publiceert automatisch. Controleer de geslaagde run en de live pagina. De oude D1-app en de oude demo zijn niet geschikt als productiebackend voor deze versie.
