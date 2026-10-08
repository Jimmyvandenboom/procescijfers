import {mkdirSync,readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
mkdirSync('docs',{recursive:true});
for(const file of ['app.js','style.css'])writeFileSync('docs/'+file,readFileSync('public/'+file));
let html=readFileSync('public/index.html','utf8').replace('href="/style.css"','href="./style.css"').replace('<script src="/app.js" defer></script>','<script src="./demo.js" defer></script><script src="./app.js" defer></script>').replace('src="/maris-bohemen.png"','src="./maris-bohemen.png"').replace('<main>','<main><aside class="notice"><strong>DEMO · uitsluitend fictieve testgegevens</strong><p>Geen echte beveiliging of centrale opslag. Alle wijzigingen verdwijnen bij vernieuwen. Vul geen echte leerlinggegevens of wachtwoorden in.</p><p>Leerling: Alex Voorbeeld · Stad van de Toekomst · code <strong>demo-alex</strong>. Docent: klik op ‘Demo openen’; er is geen wachtwoord nodig.</p></aside>');
writeFileSync('docs/index.html',html);writeFileSync('docs/.nojekyll','');
if(existsSync('public/maris-bohemen.png'))copyFileSync('public/maris-bohemen.png','docs/maris-bohemen.png');
