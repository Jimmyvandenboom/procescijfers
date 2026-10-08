import {mkdirSync,readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
mkdirSync('docs',{recursive:true});
for(const file of ['app.js','style.css'])writeFileSync('docs/'+file,readFileSync('public/'+file));
let html=readFileSync('public/index.html','utf8').replace('href="/style.css"','href="./style.css"').replace('<script src="/app.js" defer></script>','<script src="./demo.js" defer></script><script src="./app.js" defer></script>').replace('src="/maris-bohemen.png"','src="./maris-bohemen.png"').replace('<main>','<main><aside class="notice"><strong>Digitaal invulformulier · testversie</strong><p>Vul je eigen naam en groepsgenoten in. Antwoorden blijven alleen tijdelijk in dit scherm. Ze worden nog niet centraal opgeslagen en verdwijnen bij vernieuwen of sluiten.</p></aside>');
writeFileSync('docs/index.html',html);writeFileSync('docs/.nojekyll','');
if(existsSync('public/maris-bohemen.png'))copyFileSync('public/maris-bohemen.png','docs/maris-bohemen.png');
