import {env} from 'cloudflare:workers';
import {createErnaApi} from './erna-api.mjs';
import {bucket} from './cms';
const db=()=>(env as unknown as {DB:D1Database}).DB;
export const ernaApi=createErnaApi({db,bucket,config:()=>env});
