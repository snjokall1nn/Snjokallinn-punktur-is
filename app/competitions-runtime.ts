import {env} from 'cloudflare:workers';
import {isOwner} from './cms';
import {createCompetitionsApi} from './competitions-api.mjs';
export const competitions=createCompetitionsApi({db:()=>(env as unknown as {DB:D1Database}).DB,isOwner});
