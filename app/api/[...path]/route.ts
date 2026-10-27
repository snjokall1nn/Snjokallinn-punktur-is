import {isOwner} from '../../cms';
import {legacyApiGate} from '../../legacy-containment.mjs';
import {competitions} from '../../competitions-runtime';
import {clubsApi,sjutGameApi} from '../../sjut-runtime';
import {clientsApi} from '../../clients-runtime';
import { ballApi } from '../../ball-runtime';
import { api } from '../../cms';
import { ernaApi } from '../../erna-runtime';
import { mayApi } from '../../may-runtime';
export const dynamic='force-dynamic';
async function handle(request:Request,context:{params:Promise<{path:string[]}>}) {const path=(await context.params).path;const blocked=await legacyApiGate(request,path,isOwner);if(blocked)return blocked;return path[0]==='may'?mayApi(request,path.slice(1)):path[0]==='competitions'?competitions.api(request,path.slice(1)):path[0]==='sjut-game'?sjutGameApi(request,path.slice(1)):path[0]==='sjut-clubs'?clubsApi(request,path.slice(1)):path[0]==='clients'?clientsApi(request,path.slice(1)):path[0]==='6uball'?ballApi(request,path.slice(1)):path[0]==='erna'?ernaApi(request,path.slice(1)):api(request,path);}
export const GET=handle;export const POST=handle;export const PUT=handle;export const DELETE=handle;
