// Petite démo : lance chaque dé 10 000 fois et affiche la répartition.
// Usage : npm run demo            (graine 1)
//         npm run demo -- 2026    (graine au choix)

import { creerGenerateur } from '../src/moteur/aleatoire.js';
import { DES_RAPPORTS, lancerDe } from '../src/moteur/rapports.js';

const graine = Number.parseInt(process.argv[2] ?? '1', 10);
const generateur = creerGenerateur(graine);
const TIRAGES = 10000;

console.log(`Graine : ${graine} — ${TIRAGES} lancers par rapport\n`);

for (const [rapport, { min, max }] of Object.entries(DES_RAPPORTS)) {
  const compte = {};
  let somme = 0;
  for (let i = 0; i < TIRAGES; i++) {
    const n = lancerDe(Number(rapport), generateur);
    compte[n] = (compte[n] ?? 0) + 1;
    somme += n;
  }
  console.log(`Rapport ${rapport} (${min}–${max}), moyenne ${(somme / TIRAGES).toFixed(1)} cases`);
  for (let n = min; n <= max; n++) {
    const pourcentage = (100 * (compte[n] ?? 0)) / TIRAGES;
    const barre = '█'.repeat(Math.round(pourcentage));
    console.log(`  ${String(n).padStart(2)} ${barre} ${pourcentage.toFixed(1)} %`);
  }
  console.log();
}
