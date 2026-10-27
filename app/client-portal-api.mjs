import {maintenance} from './legacy-containment.mjs';
// Quarantined legacy role engine. Never accept role cookies as identity.
export function createClientPortalApi(_dependencies){return async function(){return maintenance();};}
