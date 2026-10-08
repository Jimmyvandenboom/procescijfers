// Hostingadapter; wijzigt de aangeleverde app, rubric en vormgeving niet.
import {readFileSync,writeFileSync} from 'node:fs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const database=process.env.CLOUDFLARE_D1_DATABASE_ID;
if(!account||!database||database==='00000000-0000-4000-8000-000000000000')throw Error('Stel een echte CLOUDFLARE_ACCOUNT_ID en CLOUDFLARE_D1_DATABASE_ID in.');
const built=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
const config={name:process.env.CLOUDFLARE_WORKER_NAME||'dp-proces-maris',account_id:account,main:'./server/index.js',compatibility_date:built.compatibility_date,compatibility_flags:built.compatibility_flags,no_bundle:true,rules:built.rules,assets:{directory:'./client'},d1_databases:[{binding:'DB',database_name:process.env.CLOUDFLARE_D1_DATABASE_NAME||'dp-proces',database_id:database,migrations_dir:'../drizzle'}]};
writeFileSync('dist/cloudflare.json',JSON.stringify(config,null,2)+'\n');
console.log('dist/cloudflare.json aangemaakt. Secrets blijven uitsluitend bij de hosting.');
