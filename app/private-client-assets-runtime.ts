import {maintenance} from './legacy-containment.mjs';
// Conservative fallback: no private image decoding or delivery, even to owner.
// Preserve source bytes in private/ and retain all role/API containment from v73.
export const GET=(_request:Request)=>maintenance();
export const HEAD=GET;
