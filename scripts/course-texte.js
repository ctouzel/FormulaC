// Fait courir des voitures IA et raconte la course dans le terminal.
//
// Usage : npm run course                  (graine 1, 4 voitures, 2 tours)
//         npm run course -- 2026 6 3      (graine, nombre de voitures, tours)

import { readFileSync } from 'node:fs';
import { validerPiste, colonneDe, virageEn } from '../src/moteur/piste.js';
import { classement, tourDePiste } from '../src/moteur/course.js';
import { simulerCourse } from '../src/moteur/simulation.js';

const NOMS = ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 'Blanc', 'Noir'];

const graine = Number.parseInt(process.argv[2] ?? '1', 10);
const nombre = Math.min(8, Math.max(1, Number.parseInt(process.argv[3] ?? '4', 10)));
const tours = Number.parseInt(process.argv[4] ?? '2', 10);

const piste = validerPiste(JSON.parse(readFileSync(new URL('../pistes/ovale-essai.json', import.meta.url))));
const voitures = NOMS.slice(0, nombre).map((nom) => ({ id: nom.toLowerCase(), nom }));
const etat = simulerCourse({ piste, voitures, tours, graine });

const ordinal = (n) => (n === 1 ? '1re' : `${n}e`);
const nomDe = (id) => etat.voitures.find((v) => v.id === id).nom.padEnd(7);
const lieu = (position) => {
  const colonne = colonneDe(piste, position.distance);
  const virage = virageEn(piste, colonne);
  return `col ${String(colonne).padStart(2)} v${position.voie}${virage ? ` [${virage.nom}]` : ''}`;
};
const texteCout = (cout) =>
  Object.entries(cout)
    .map(([categorie, n]) => `-${n} ${categorie}`)
    .join(', ');

console.log(`${piste.nom} — ${tours} tour(s), ${nombre} voitures, graine ${graine}\n`);

let tourAffiche = 0;
for (const e of etat.journal) {
  if (e.tourDeJeu !== tourAffiche) {
    tourAffiche = e.tourDeJeu;
    console.log(`— Tour de jeu ${tourAffiche} —`);
  }
  if (e.type === 'coup') {
    const fini = e.arrivee.distance >= etat.tours * piste.longueur;
    const tourPiste = fini ? 'arrivée' : `tour ${tourDePiste(etat, { position: e.arrivee })}`;
    const cout = texteCout(e.cout);
    const rapport = ordinal(e.rapport).padEnd(3);
    console.log(
      `  ${nomDe(e.id)} ${rapport}, dé ${String(e.de).padStart(2)} → ` +
        `${lieu(e.arrivee).padEnd(16)} ${tourPiste}${cout ? `   (${cout})` : ''}`,
    );
  } else if (e.type === 'arrivee') {
    console.log(`  🏁 ${nomDe(e.id).trim()} franchit la ligne d'arrivée : ${ordinal(e.rang)} !`);
  } else if (e.type === 'abandon') {
    console.log(`  💥 ${nomDe(e.id).trim()} abandonne : ${e.raison}`);
  }
}

console.log('\nClassement final');
classement(etat).forEach((v, i) => {
  const usure = Object.values(v.usure).reduce((s, n) => s + n, 0);
  const statut = v.statut === 'arrivee' ? `${i + 1}.` : 'Abandon';
  console.log(`  ${statut.padEnd(8)} ${v.nom.padEnd(7)} (${usure} points d'usure restants)`);
});
