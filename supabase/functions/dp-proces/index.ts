import { createClient } from 'npm:@supabase/supabase-js@2.99.1';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(24))).map(x=>x.toString(16).padStart(2,'0')).join('');
const text = (v:unknown,max=100) => {if(typeof v!=='string'||!v.trim()||v.trim().length>max) throw Error('Vul alle gegevens correct in.'); return v.trim();};
const check = (r:any) => {if(r.error){console.error('Database request failed',r.error.code);throw Error('Opslaan of ophalen is niet gelukt. Probeer opnieuw.');}return r.data;};
const json = (data:unknown,status=200)=> new Response(JSON.stringify(data),{status,headers});

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return json({error:'Gebruik POST'},405);
 try {
  const raw=await req.text(); if(raw.length>120000)return json({error:'Formulier is te groot'},413);
  const b=JSON.parse(raw), action=text(b.action,40), credential=text(b.credential,100);
  if(action.startsWith('teacher_')){
   const settings=check(await db.from('dp_settings').select('teacher_hash').eq('id',true).single());
   if(settings.teacher_hash!==await hash(credential))return json({error:'De docentcode klopt niet.'},401);
   if(action==='teacher_list'){
    const groups=check(await db.from('dp_groups').select('*').order('created_at',{ascending:false}));
    const submissions=check(await db.from('dp_submissions').select('*'));
    return json({groups,submissions});
   }
   if(action==='teacher_create'){
    const names=b.names;
    if(!Array.isArray(names)||names.length<1||names.length>5)throw Error('Gebruik één tot vijf leerlingen per groep.');
    const clean=names.map(n=>text(n));
    if(new Set(clean.map(n=>n.toLocaleLowerCase('nl'))).size!==clean.length)throw Error('Iedere naam moet uniek zijn binnen de groep.');
    const roster=clean.map(name=>({id:crypto.randomUUID(),name,code:code()}));
    const group=check(await db.from('dp_groups').insert({project:text(b.project),class_name:text(b.class_name,40),name:text(b.name),roster}).select().single());
    return json({group});
   }
   if(action==='teacher_close'){
    if(typeof b.closed!=='boolean')throw Error('Ongeldige status');
    check(await db.from('dp_groups').update({closed:b.closed}).eq('id',text(b.group_id)).select('id').single());
    return json({ok:true});
   }
   if(action==='teacher_review'){
    if(!Number.isInteger(b.honesty)||b.honesty<1||b.honesty>4)throw Error('Kies een eerlijkheidsscore van 1 tot 4.');
    const comment=typeof b.comment==='string'?b.comment.trim():'';
    if(comment.length>2000)throw Error('De toelichting is te lang.');
    check(await db.from('dp_submissions').update({honesty:b.honesty,teacher_comment:comment,teacher_name:text(b.teacher_name),reviewed_at:new Date().toISOString()}).eq('group_id',text(b.group_id)).eq('actor_id',text(b.actor_id)).select('actor_id').single());
    return json({ok:true});
   }
   if(action==='teacher_rotate'){
    const next=text(b.next,100); if(next.length<20)throw Error('Gebruik een docentcode van minimaal twintig tekens.');
    check(await db.from('dp_settings').update({teacher_hash:await hash(next)}).eq('id',true));
    return json({ok:true});
   }
   return json({error:'Onbekende actie'},400);
  }
  const groups=check(await db.from('dp_groups').select('*').contains('roster',JSON.stringify([{code:credential}])));
  const group=groups[0];if(!group)return json({error:'Deze leerlingcode is niet gevonden. Vraag je docent om jouw persoonlijke code.'},401);
  const actor=group.roster.find((r:any)=>r.code===credential);
  if(action==='student_open'){
   const own=check(await db.from('dp_submissions').select('answers,submitted_at').eq('group_id',group.id).eq('actor_id',actor.id).maybeSingle());
   return json({group:{id:group.id,project:group.project,class_name:group.class_name,name:group.name,closed:group.closed,roster:group.roster.map(({id,name}:any)=>({id,name}))},actor_id:actor.id,submission:own});
  }
  if(action==='student_submit'){
   const answers=b.answers;
   if(!Array.isArray(answers)||answers.length!==group.roster.length)throw Error('Beoordeel jezelf en alle groepsleden.');
   if(new Set(answers.map(a=>a.target_id)).size!==answers.length)throw Error('Je hebt iemand dubbel beoordeeld.');
   const clean=answers.map((a:any)=>{
    if(!group.roster.some((r:any)=>r.id===a.target_id)||!Array.isArray(a.criteria)||a.criteria.length!==6)throw Error('De beoordelingsonderdelen zijn niet compleet.');
    return {target_id:a.target_id,criteria:a.criteria.map((c:any)=>{
     if(!Number.isInteger(c.score)||c.score<1||c.score>4)throw Error('Kies overal een score van 1 tot 4.');
     const comment=text(c.comment,500);if(comment.length<2)throw Error('Geef bij iedere score een korte toelichting.');
     return {score:c.score,comment};
    })};
   });
   const result=await db.rpc('dp_save_submission',{p_group:group.id,p_actor:actor.id,p_code:credential,p_answers:clean});
   if(result.error){if(result.error.message.includes('gesloten'))return json({error:'Deze beoordelingsronde is gesloten. Neem contact op met je docent.'},409);check(result);}
   return json({submitted_at:result.data});
  }
  return json({error:'Onbekende actie'},400);
 }catch(e){return json({error:e instanceof SyntaxError?'Ongeldig verzoek':e instanceof Error?e.message:'Er ging iets mis'},400);}
});
