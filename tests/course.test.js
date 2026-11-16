import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validerPiste } from '../src/moteur/piste.js';
import {
  creerCourse,
  choisirRapport,
  jouerOption,
  optionsDuCoup,
  voitureActive,
  classement,
  positionGrille,
} from '../src/moteur/course.js';
import { simulerCourse } from '../src/moteur/simulation.js';

const ovale = validerPiste(JSON.parse(readFileSync(new URL('../pistes/ovale-essai.json', import.meta.url))));
const quatre = ['rouge', 'bleu', 'vert', 'jaune'].map((id) => ({ id }));

/** Joue un coup en choisissant toujours l'option la plus lointaine. */
function coupSimple(etat, rapport) {
  const apres = choisirRapport(etat, rapport);
  return jouerOption(apres, optionsDuCoup(apres)[0]);
}

test('la grille : 2 voitures par rangée, derrière la ligne', () => {
  assert.deepEqual(positionGrille(ovale, 0), { distance: -1, voie: 2 });
  assert.deepEqual(positionGrille(ovale, 1), { distance: -1, voie: 0 });
  assert.deepEqual(positionGrille(ovale, 2), { distance: -2, voie: 2 });
});

test('la grille est tirée au hasard, mais reproductible', () => {
  const ordre = (graine) => creerCourse({ piste: ovale, voitures: quatre, graine }).ordre;
  assert.deepEqual(ordre(5), ordre(5));
  const differents = [1, 2, 3, 4, 5, 6].some((g) => ordre(g).join() !== ordre(1).join());
  assert.ok(differents, 'toutes les graines donnent le même ordre');
});

test('toutes les voitures démarrent en 1re, en course', () => {
  const etat = creerCourse({ piste: ovale, voitures: quatre, graine: 1 });
  for (const v of etat.voitures) {
    assert.equal(v.rapport, 1);
    assert.equal(v.statut, 'en course');
  }
  assert.equal(etat.tourDeJeu, 1);
});

test('une configuration invalide est refusée', () => {
  assert.throws(() => creerCourse({ piste: ovale, voitures: [], graine: 1 }), /de 1 à 8/);
  assert.throws(() => creerCourse({ piste: ovale, voitures: [{ id: 'a' }, { id: 'a' }], graine: 1 }), /même/);
});

test('les voitures jouent chacune leur tour, puis on passe au tour de jeu suivant', () => {
  let etat = creerCourse({ piste: ovale, voitures: quatre, graine: 1 });
  const ordreTour1 = [...etat.ordre];
  const ontJoue = [];
  for (let i = 0; i < 4; i++) {
    ontJoue.push(voitureActive(etat).id);
    etat = coupSimple(etat, 2);
  }
  assert.deepEqual(ontJoue, ordreTour1);
  assert.equal(etat.tourDeJeu, 2);
});

test('le nouvel ordre suit le classement', () => {
  let etat = creerCourse({ piste: ovale, voitures: quatre, graine: 3 });
  for (let i = 0; i < 4; i++) etat = coupSimple(etat, 2);
  const tete = classement(etat).map((v) => v.id);
  assert.deepEqual(etat.ordre, tete);
});

test('on ne peut pas se déplacer avant de choisir un rapport', () => {
  const etat = creerCourse({ piste: ovale, voitures: quatre, graine: 1 });
  assert.throws(() => optionsDuCoup(etat), /rapport/);
});

test('sauter un rapport en montant est refusé', () => {
  const etat = creerCourse({ piste: ovale, voitures: quatre, graine: 1 });
  assert.throws(() => choisirRapport(etat, 3), /un rapport à la fois/);
});

test('freiner coûte des points de freins', () => {
  let etat = creerCourse({ piste: ovale, voitures: [{ id: 'seule' }], graine: 1 });
  etat = choisirRapport(etat, 2);
  const resultat = etat.coup.resultat;
  const surPlace = optionsDuCoup(etat).find((o) => o.cases === 0);
  etat = jouerOption(etat, surPlace);
  assert.equal(etat.voitures[0].usure.freins, 4 - resultat);
});

test('une sortie de piste élimine et retire la voiture', () => {
  let etat = creerCourse({ piste: ovale, voitures: [{ id: 'a' }, { id: 'b' }], graine: 1 });
  const id = voitureActive(etat).id;
  // On place la voiture juste avant V1 (2 arrêts), en 6e : elle va forcément trop loin.
  etat = {
    ...etat,
    voitures: etat.voitures.map((v) => (v.id === id ? { ...v, rapport: 6, position: { distance: 5, voie: 1 } } : v)),
  };
  etat = choisirRapport(etat, 6);
  const tropLoin = optionsDuCoup(etat)[0];
  assert.match(tropLoin.elimination, /sortie de piste/);
  etat = jouerOption(etat, tropLoin);
  const voiture = etat.voitures.find((v) => v.id === id);
  assert.equal(voiture.statut, 'eliminee');
  assert.ok(etat.journal.some((e) => e.type === 'abandon' && e.id === id));
});

test('une course IA complète se termine, avec un classement', () => {
  const etat = simulerCourse({ piste: ovale, voitures: quatre, graine: 2026 });
  assert.equal(etat.terminee, true);
  const final = classement(etat);
  assert.equal(final.length, 4);
  for (const v of final) assert.notEqual(v.statut, 'en course');
  const arrivees = final.filter((v) => v.statut === 'arrivee');
  assert.deepEqual(arrivees.map((v) => v.rang), arrivees.map((_, i) => i + 1));
});

test('la même graine rejoue exactement la même course', () => {
  const a = simulerCourse({ piste: ovale, voitures: quatre, graine: 77 });
  const b = simulerCourse({ piste: ovale, voitures: quatre, graine: 77 });
  assert.deepEqual(a.journal, b.journal);
});

test('l\'IA ne se fait pas éliminer sur l\'ovale d\'essai', () => {
  for (const graine of [1, 2, 3, 4, 5]) {
    const etat = simulerCourse({ piste: ovale, voitures: quatre, graine });
    assert.equal(etat.journal.filter((e) => e.type === 'abandon').length, 0, `graine ${graine}`);
  }
});
