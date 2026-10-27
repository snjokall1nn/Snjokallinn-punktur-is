import { recommendation } from './pricing.mjs';
const energies = { quick: 'quick', editorial: 'full', iconic: 'production' };
export function packageEstimate(packageId) {
  if (!Object.hasOwn(energies, packageId)) return null;
  const answers = { goal: 'confidence', energy: energies[packageId], timing: 'day', extraImages: '0', bts: false };
  return { ...recommendation(answers), answers };
}
