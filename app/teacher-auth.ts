import {env} from 'cloudflare:workers';
const settings=()=>env as unknown as {TEACHER_PASSWORD?:string,TEACHER_SESSION_SECRET?:string};
const enc=new TextEncoder();
async function mac(value:string){const secret=settings().TEACHER_SESSION_SECRET;if(!secret)throw Error('Missing session secret');const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function validTeacher(req:Request){try{const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('dp_teacher='))?.slice(11);if(!token)return false;const [expiry,nonce,signature]=token.split('.');if(!expiry||!nonce||!signature||Number(expiry)<Date.now()||Number(expiry)>Date.now()+86400000)return false;return signature===await mac(expiry+'.'+nonce);}catch{return false;}}
export async function issueSession(){const value=(Date.now()+8*3600000)+'.'+crypto.randomUUID();return value+'.'+await mac(value);}
export function matchesPassword(value:string){const expected=settings().TEACHER_PASSWORD;if(!expected)return false;let diff=value.length^expected.length;for(let i=0;i<Math.max(value.length,expected.length);i++)diff|=(value.charCodeAt(i)||0)^(expected.charCodeAt(i)||0);return diff===0;}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
