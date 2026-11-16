import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validerPiste } from '../src/moteur/piste.js';
import { optionsDeplacement, destinationsExactes } from '../src/moteur/deplacement.js';

const piste = validerPiste({ nom: 'Test', voies: 3, longueur: 48, virages: [] });

/** Les voies d'arrivée, triées, pour comparer facilement. */
const voies = (options) => options.map((o) => o.position.voie).sort();

test('piste libre : avec un 3, on peut finir dans les 3 voies', () => {
  const dest = destinationsExactes(piste, { distance: 10, voie: 1 }, 3);
  assert.deepEqual(voies(dest), [0, 1, 2]);
  for (const d of dest) {
    assert.equal(d.position.distance, 13);
    assert.equal(d.chemin.length, 3);
  }
});

test('on ne change que d\'une voie par pas', () => {
  // Depuis le bord (voie 0), un seul pas ne permet pas d'atteindre la voie 2.
  const dest = destinationsExactes(piste, { distance: 10, voie: 0 }, 1);
  assert.deepEqual(voies(dest), [0, 1]);
});

test('le chemin proposé reste tout droit quand c\'est possible', () => {
  const [droit] = destinationsExactes(piste, { distance: 10, voie: 1 }, 4).filter((d) => d.position.voie === 1);
  assert.ok(droit.chemin.every((p) => p.voie === 1));
});

test('une voiture devant oblige à la contourner', () => {
  const autre = [{ distance: 11, voie: 1 }];
  const dest = destinationsExactes(piste, { distance: 10, voie: 1 }, 1, autre);
  assert.deepEqual(voies(dest), [0, 2]);
});

test('on peut dépasser en changeant de voie et revenir devant', () => {
  const autre = [{ distance: 11, voie: 1 }];
  const dest = destinationsExactes(piste, { distance: 10, voie: 1 }, 2, autre);
  assert.deepEqual(voies(dest), [0, 1, 2]);
  const devant = dest.find((d) => d.position.voie === 1);
  assert.notEqual(devant.chemin[0].voie, 1, 'le chemin traverse la voiture');
});

test('un mur de voitures bloque : il faut freiner', () => {
  const mur = [0, 1, 2].map((voie) => ({ distance: 13, voie }));
  const options = optionsDeplacement(piste, { distance: 10, voie: 1 }, 5, mur);

  assert.equal(options.filter((o) => o.freins === 0).length, 0, 'aucune destination sans freiner');
  const plusLoin = options[0];
  assert.equal(plusLoin.position.distance, 12, 'on s\'arrête juste derrière le mur');
  assert.equal(plusLoin.freins, 3, '5 au dé, 2 cases parcourues : 3 points de freins');
});

test('freiner volontairement est toujours possible', () => {
  const options = optionsDeplacement(piste, { distance: 10, voie: 1 }, 4);
  const surPlace = options.find((o) => o.cases === 0);
  assert.deepEqual(surPlace.position, { distance: 10, voie: 1 });
  assert.equal(surPlace.freins, 4);
  const unPas = options.filter((o) => o.cases === 1);
  assert.ok(unPas.every((o) => o.freins === 3));
});

test('les options sont triées de la plus lointaine à la plus proche', () => {
  const options = optionsDeplacement(piste, { distance: 0, voie: 0 }, 6);
  for (let i = 1; i < options.length; i++) {
    assert.ok(options[i - 1].cases >= options[i].cases);
  }
});

test('le passage de la ligne d\'arrivée fonctionne (tour suivant)', () => {
  // Départ colonne 46, une voiture en colonne 0 du tour suivant, voie 0.
  const autre = [{ distance: 0, voie: 0 }]; // colonne 0, quel que soit le tour
  const dest = destinationsExactes(piste, { distance: 46, voie: 0 }, 2, autre);
  assert.deepEqual(voies(dest), [1, 2], 'la voie 0 de la colonne 0 est occupée');
  assert.ok(dest.every((d) => d.position.distance === 48));
});

test('un résultat ou une voie invalide est refusé', () => {
  assert.throws(() => optionsDeplacement(piste, { distance: 0, voie: 0 }, -1), RangeError);
  assert.throws(() => optionsDeplacement(piste, { distance: 0, voie: 3 }, 2), RangeError);
});
