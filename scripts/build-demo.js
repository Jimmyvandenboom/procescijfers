import {mkdirSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
mkdirSync('docs',{recursive:true});
for(const [source,target] of [['scripts/sheet.js','app.js'],['scripts/sheet.css','style.css'],['scripts/rubric.json','rubric.json']])copyFileSync(source,'docs/'+target);
writeFileSync('docs/index.html',`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Procescijfer · Maris College Bohemen</title><link rel="stylesheet" href="./style.css"><script src="./app.js" defer></script></head><body><header><img id="logo" src="./maris-bohemen.png" alt="Maris-logo" hidden><div><strong>Maris College Bohemen</strong><small>D&P · Procescijfer</small></div><button id="home">Start</button></header><main><aside class="notice">Testversie · nog geen opslag of verzending. Antwoorden verdwijnen bij vernieuwen of sluiten.</aside><div id="message" role="status"></div><div id="app"></div></main></body></html>`);
writeFileSync('docs/.nojekyll','');
if(existsSync('public/maris-bohemen.png'))copyFileSync('public/maris-bohemen.png','docs/maris-bohemen.png');
