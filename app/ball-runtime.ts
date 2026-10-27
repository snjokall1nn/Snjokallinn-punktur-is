import {env} from 'cloudflare:workers';
import {bucket,isOwner} from './cms';
import {createBallApi} from './ball-api.mjs';
export const ballApi=createBallApi({db:()=>(env as unknown as {DB:D1Database}).DB,bucket,isOwner});
