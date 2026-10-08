# Overdracht van de bestaande D&P-testapp
Dit is de echte broncode van de eerder gebouwde testversie, geen ontwerpopdracht.
Behoud app/workspace.tsx, app/globals.css, app/rubric.json en public/maris-bohemen.png voor hetzelfde uiterlijk en dezelfde rubric.
Projecten: klas 3 expeditie 1 Stad van de Toekomst; klas 4 expeditie 1 Campus@Sea.

De app gebruikt React/Vinext en serverroutes op Cloudflare Workers met D1. GitHub Pages alleen kan de serverroutes niet uitvoeren. Kies geschikte hosting of pas uitsluitend de serverintegratie aan; herontwerp het formulier niet.
Geheimen ontbreken bewust: configureer TEACHER_PASSWORD en TEACHER_SESSION_SECRET uitsluitend bij de hosting. Databasegegevens en inzendingen zijn niet inbegrepen.
De D1-migratie staat in drizzle/. Neem app/rubric.json als gezaghebbende rubric; vraag niet opnieuw om het Word-document.

Testbeperking: app/config.ts bevat fictieve groepsleden. Eigen namen zijn gekoppeld aan vaste testplekken; leerlingidentiteit is nog geen veilige echte-klasoplossing. Richt echte groepen en leerlingcodes in vóór gebruik in de klas.
Eerlijkheid is in deze versie gekoppeld aan de beoordelaar en opgenomen als zevende score in diens beoordelingen. Controleer deze keuze met de docent voordat echte cijfers worden vastgesteld.

Stappen voor Codex:
1. Pak dit archief uit in een aparte map en inspecteer de huidige repository.
2. Neem deze broncode over zonder de vormgeving opnieuw te ontwerpen. Bewaar bestaande Git-geschiedenis.
3. Vervang oude Pages-publicatie alleen wanneer een werkende serverhosting is ingericht.
4. Configureer database, migratie en geheimen. Bewaar geen wachtwoord in code.
5. Test de formulieren, wachtwoordcontrole, serveropslag en export. Rapporteer eventuele ontbrekende hostingtoegang concreet.
