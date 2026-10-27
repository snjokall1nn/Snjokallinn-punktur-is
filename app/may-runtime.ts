import {env} from 'cloudflare:workers';
import {bucket} from './cms';
import {createMayApi} from './may-api.mjs';
export const mayApi=createMayApi({bucket,config:()=>env});
