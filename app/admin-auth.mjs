import {isSjut} from './site-boundary.mjs';
const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)))}
export async function verifyPassword(password,stored){
  const [salt,iterations,expected]=(stored||'').split(':');
  if(!salt || !/^[a-f0-9]{64}$/.test(expected||'') || Number(iterations)!==100000)return false;
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const actual=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:Number(iterations),hash:'SHA-256'},key,256));
  let diff=0;for(let i=0;i<expected.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}
export function createAdminAuth({bucket,config,now=()=>Date.now()}){
  const realm=request=>isSjut(request)?'sjut':'snjokallinn';
  const cookieName=request=>'__Host-'+realm(request)+'_admin';
  const prefix=request=>isSjut(request)?'auth/sjut/':'auth/';
  const token=request=>request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(request)+'='))?.slice(cookieName(request).length+1);
  const sessionKey=async request=>{const t=token(request);return /^[a-f0-9]{64}$/.test(t||'')?prefix(request)+'session/'+await digest(t):null};
  const cookie=(request,value,seconds)=>`${cookieName(request)}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Strict`;
  return {
    async isOwner(request){
      const key=await sessionKey(request);if(!key)return false;
      const obj=await bucket().get(key);if(!obj)return false;
      const session=await obj.json();
      return session.expires>now() && session.version===await digest(config().passwordHash||'');
    },
    async login(request){
      if(request.headers.get('Origin')!==new URL(request.url).origin)return {status:403};
      if(Number(request.headers.get('Content-Length'))>4096)return {status:413};
      const body=await request.text();if(body.length>4096)return {status:413};
      const fields=new URLSearchParams(body),username=fields.get('username')||'',password=fields.get('password')||'';
      const ip=request.headers.get('CF-Connecting-IP')||'unknown';
      const key=prefix(request)+'attempts/'+await digest(ip);
      const obj=await bucket().get(key);let attempts=obj?await obj.json():null;
      if(!attempts || attempts.until<=now())attempts={count:0,until:now()+15*60*1000};
      if(attempts.count>=10)return {status:429};
      const {username:allowed,passwordHash}=config();
      if(!passwordHash || !allowed)return {status:503};
      const valid=await verifyPassword(password,passwordHash);
      if(username!==allowed || !valid){attempts.count++;await bucket().put(key,JSON.stringify(attempts));return {status:401};}
      await bucket().delete(key);
      const value=hex(crypto.getRandomValues(new Uint8Array(32)));
      await bucket().put(prefix(request)+'session/'+await digest(value),JSON.stringify({expires:now()+12*60*60*1000,version:await digest(passwordHash)}));
      return {status:303,cookie:cookie(request,value,12*60*60)};
    },
    async logout(request){
      if(request.headers.get('Origin')!==new URL(request.url).origin)return {status:403};
      const key=await sessionKey(request);if(key)await bucket().delete(key);
      return {status:303,cookie:cookie(request,'',0)};
    }
  };
}
