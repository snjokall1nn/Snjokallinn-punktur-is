import {env} from 'cloudflare:workers';
import {bucket,isOwner} from './cms';
import {createClientsApi} from './clients-api.mjs';
import {renderService} from './service-pages.mjs';
const db=()=>(env as unknown as {DB:D1Database}).DB;
const runtime=createClientsApi({db,bucket,isOwner,routeExists:(slug:string)=>!!renderService(slug)});
export const clientsApi=runtime.api;
export const getClient=runtime.get;
