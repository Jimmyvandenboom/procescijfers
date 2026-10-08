# Overgenomen D&P-app en hosting

De broncode komt uit `DP_Proces_Broncode.zip`. `OVERDRACHT_CODEX.md` is gelezen. `app/workspace.tsx`, `app/globals.css`, `app/rubric.json` en `public/maris-bohemen.png` zijn ongewijzigd en byte voor byte gelijk aan het archief. Ook de cijferberekening en testgroepen zijn behouden. De Git-geschiedenis blijft bestaan.

## Techniek en bestaande publicatie

React 19, TypeScript, Vinext 1.0.0-beta.5, Vite 8, Tailwind 4, Cloudflare Workers en D1. De serverroutes zijn `/api/teacher` en `/api/records`. Drizzle beschrijft de tabel; de routes gebruiken het D1-binding rechtstreeks.

De bestaande `gh-pages`-branch is niet veranderd. De oude statische versie in `docs/` blijft als tijdelijk publicatiebestand behouden. Deze is niet de overgenomen React-app. GitHub Pages kan de nieuwe app niet uitvoeren. Ook `npm start` is alleen een lokale Worker-preview, geen internetpublicatie. Vervang Pages pas wanneer de serverhosting werkt.

## Lokaal installeren en controleren

Node >=22.13 en exact pnpm 11.25.0 zijn gepind. Installeren met de bestaande lockfile:

```sh
pnpm install --frozen-lockfile
npm run build
```

Dit is uitgevoerd met pnpm 11.25.0; de supply-chain-controle van de lockfile slaagde. Build slaagt. De losse controle `pnpm exec tsc --noEmit --incremental false` meldt bestaande fouten doordat JSON-antwoorden als `unknown` worden getypeerd. Deze zijn niet verhuld of via aanpassing van het oorspronkelijke formulier opgelost. Hosting die typecontrole verplicht stelt, zal een gerichte vervolgreparatie nodig hebben.

Voor een verse lokale database, pas de meegeleverde migratie eenmaal toe na build:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_slow_gorgon.sql
```

Kopieer `.dev.vars.example` naar `.dev.vars` en vul een lokaal testwachtwoord en een sterke sessiesleutel in. Kopieer dat bestand na build naar `dist/server/.dev.vars` zodat Wrangler de secrets naast zijn configuratie vindt. Deze bestanden blijven buiten Git. Start `npm start -- --port 3202`. Als de machine geen beschrijfbare gebruikersconfiguratiemap biedt, zet `XDG_CONFIG_HOME` voor die opdracht op een beschrijfbare locatie zoals `/workspace/procescijfers/.sites-runtime/xdg-config`. Verander de host-HOME niet. Live processen moeten na een nieuwe taak opnieuw starten.

De overdrachtscontrole gebruikte uitsluitend tijdelijke willekeurige testsecrets en fictieve inzendingen. Getest: twee onafhankelijke inzendingen naar dezelfde D1-database, validatie, beschermde uitleesroute, wachtwoordcontrole, HttpOnly/Secure/SameSite-cookie, herkomstcontrole, gemanipuleerde sessie, vijf mislukte inlogpogingen en daarna 429, formulier, rubrictekst, antwoordcontrole, docentoverzicht, CSV en uitloggen. D1-data bleven behouden na serverherstart. De testsecrets zijn na afloop verwijderd. Lokale testdata zijn geen productiegegevens.

## Wat voor online hosting nog ontbreekt

1. Een Cloudflare-account en toegang om Workers en D1 te beheren. Hier is geen Wrangler-login beschikbaar; `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID` ontbreken. Log in via Wrangler op een bevoegde machine of configureer een scoped API-token veilig in hosting/CI, nooit in chat of Git. Voor een token zijn toegang tot Workers Scripts (Edit) en D1 (Edit) op het juiste account nodig; domeinroutes kunnen extra zonerechten vereisen.
2. Een echte D1-database en de ID daarvan. `.openai/hosting.json` declareert `DB`, maar de gegenereerde buildconfig heeft alleen de lokale placeholder `00000000-0000-4000-8000-000000000000`. Dat is geen gekoppelde productiedatabase.
3. De Worker-binding `DB` naar die database, en de migratie `drizzle/0000_slow_gorgon.sql` op de productiedatabase.
4. De Worker-secrets `TEACHER_PASSWORD` en `TEACHER_SESSION_SECRET`. Een lang willekeurig sessiegeheim is nodig voor de HMAC-sessies. De oude lokale `.env` en `DATABASE_PATH` horen bij de vervangen SQLite-app; zij configureren deze D1-app niet.
5. Een daadwerkelijke Worker-publicatie met HTTPS op `workers.dev` of een eigen domein. Een aangepast domein is optioneel. Vanuit deze cloudomgeving zijn voor deployment ook netwerktoegang tot `api.cloudflare.com` en de juiste accountrechten nodig. Alleen geheimnamen of configuratie opslaan publiceert niets.

Het project kan ook terug naar de oorspronkelijke Sites-hosting als daar publicatierechten beschikbaar zijn. Die control plane moet dan D1 en secrets injecteren. In deze sessie zijn geen Sites-publicatietools beschikbaar.

## Voorbereide adapter voor eigen Cloudflare-hosting

De adapter `scripts/create-cloudflare-config.mjs` laat het oorspronkelijke Vite-configuratiebestand en de app intact. Stel de niet-geheime metadata uit `.env.example` in. Na `npm run build`:

```sh
node --env-file=.env.hosting scripts/create-cloudflare-config.mjs
```

Deze opdracht maakt `dist/cloudflare.json` met een echte database-ID, Worker entrypoint en statische assets. Het script weigert ontbrekende metadata en de placeholder-ID. `dist/` staat buiten Git; genereer opnieuw na elke build. Dit script publiceert niets.

Met een bestaand Cloudflare-account kun je eerst `wrangler d1 create dp-proces` gebruiken en de verkregen ID invullen. Daarna, via de lokaal geïnstalleerde Wrangler:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --remote --config dist/cloudflare.json
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js secret put TEACHER_PASSWORD --config dist/cloudflare.json
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js secret put TEACHER_SESSION_SECRET --config dist/cloudflare.json
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js deploy --config dist/cloudflare.json
```

Voer productiecommando's pas uit met de juiste accounttoegang en bevestigde database. De adapter is gecontroleerd met een lokale dry-run; online migratie en publicatie zijn nog niet uitgevoerd.

## Behouden beperkingen van de aangeleverde versie

- Leerlingen zijn gekoppeld aan vaste fictieve testplekken. Een inzending op dezelfde plek overschrijft de eerdere inzending. Dit is een testapp, geen veilige echte-klasidentificatie.
- Eerlijkheid hoort bij de beoordelaar en telt mee als zevende score in diens geschreven beoordelingen. Definitieve cijfers wachten op alle inzendingen en eerlijkheidsscores.
- Schermcijfers tonen één decimaal; de aangeleverde CSV toont twee. Excel-formuleachtige vrije tekst wordt in deze broncode niet geneutraliseerd. Deze bestaande eigenschappen zijn niet stilzwijgend gewijzigd.
- Uitloggen wist de cookie; een gekopieerd ondertekend token wordt serverzijdig niet ingetrokken en blijft maximaal acht uur geldig. Inlogbegrenzing vertrouwt hosting-identiteitsheaders. Bij eigen hosting moet de afhandeling van die headers worden beoordeeld, omdat de Sites-authproxy daar mogelijk ontbreekt.
- Het Excel-werkboek zelf zit niet in de ZIP. De overgenomen formule is getest zoals hij in de code staat; overeenstemming met een extern Excel-bestand is niet onafhankelijk vastgesteld.
