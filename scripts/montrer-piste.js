// Affiche dans le terminal où une voiture peut aller avec un résultat de dé.
//
// Usage : npm run piste -- <distance> <voie> <dé> [autres voitures...]
//   Exemple : npm run piste -- 8 1 7 10:1 11:0
//   (voiture en colonne 8, voie 1, qui a fait 7 ; deux voitures en 10:1 et 11:0)
//
// Légende : A = la voiture, X = autre voiture, ● = arrivée sans freiner,
//           ○ = arrivée en freinant, = = colonne de virage.

import { readFileSync } from 'node:fs';
import { validerPiste, colonneDe, virageEn } from '../src/moteur/piste.js';
import { optionsDeplacement } from '../src/moteur/deplacement.js';

const [distance = 8, voie = 1, de = 7] = process.argv.slice(2, 5).map(Number);
const autres = process.argv.slice(5).map((texte) => {
  const [d, v] = texte.split(':').map(Number);
  return { distance: d, voie: v };
});

const piste = validerPiste(JSON.parse(readFileSync(new URL('../pistes/ovale-essai.json', import.meta.url))));
const options = optionsDeplacement(piste, { distance, voie }, de, autres);

const debut = distance - 1;
const fin = distance + de + 2;
const cle = (d, v) => `${d}:${v}`;
const exactes = new Set(options.filter((o) => o.freins === 0).map((o) => cle(o.position.distance, o.position.voie)));
const freinees = new Set(options.filter((o) => o.freins > 0).map((o) => cle(o.position.distance, o.position.voie)));
const occupees = new Set(autres.map((p) => cle(p.distance, p.voie)));

const cellule = (texte) => texte.toString().padStart(3);

console.log(`${piste.nom} — voiture en ${distance}:${voie}, dé = ${de}\n`);

let ligne = 'col   ';
for (let d = debut; d <= fin; d++) ligne += cellule(colonneDe(piste, d));
console.log(ligne);

ligne = 'virage';
for (let d = debut; d <= fin; d++) ligne += cellule(virageEn(piste, colonneDe(piste, d)) ? '=' : '');
console.log(ligne);

for (let v = piste.voies - 1; v >= 0; v--) {
  ligne = `voie ${v} `;
  for (let d = debut; d <= fin; d++) {
    const k = cle(d, v);
    let symbole = '·';
    if (d === distance && v === voie) symbole = 'A';
    else if (occupees.has(k)) symbole = 'X';
    else if (exactes.has(k)) symbole = '●';
    else if (freinees.has(k)) symbole = '○';
    ligne += cellule(symbole);
  }
  console.log(ligne);
}

console.log();
const sansFreiner = options.filter((o) => o.freins === 0);
if (sansFreiner.length > 0) {
  console.log(`Sans freiner : ${sansFreiner.length} arrivée(s) possible(s).`);
} else {
  const meilleure = options[0];
  console.log(`Bloqué ! Au mieux ${meilleure.cases} case(s), pour ${meilleure.freins} point(s) de freins.`);
}
