import {bucket,isOwner} from './cms';
import {createClubsApi} from './sjut-clubs.mjs';
export const clubsApi=createClubsApi({bucket,isOwner});
import {env} from 'cloudflare:workers';
import {createSjutGameApi} from './sjut-game-api.mjs';
export const sjutGameApi=createSjutGameApi({db:()=>(env as unknown as {DB:D1Database}).DB,bucket,isOwner});
