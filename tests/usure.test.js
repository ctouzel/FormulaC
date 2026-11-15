import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerPointsUsure, depenserPoints, totalPoints, USURE_DEPART } from '../src/moteur/usure.js';

test('la réserve de départ fait 18 points', () => {
  const points = creerPointsUsure();
  assert.deepEqual(points, { ...USURE_DEPART });
  assert.equal(totalPoints(points), 18);
});

test('on peut choisir une autre réserve', () => {
  const points = creerPointsUsure({ pneus: 10, freins: 1, boite: 1, moteur: 1, carrosserie: 1 });
  assert.equal(points.pneus, 10);
  assert.equal(totalPoints(points), 14);
});

test('dépenser retire les points sans modifier la réserve d\'origine', () => {
  const avant = creerPointsUsure();
  const { points, elimine } = depenserPoints(avant, { boite: 2, moteur: 1 });
  assert.equal(points.boite, 2);
  assert.equal(points.moteur, 1);
  assert.equal(elimine, false);
  assert.equal(avant.boite, 4, 'la réserve d\'origine a été modifiée');
});

test('tomber exactement à 0 n\'élimine pas', () => {
  const { points, elimine } = depenserPoints(creerPointsUsure(), { moteur: 2 });
  assert.equal(points.moteur, 0);
  assert.equal(elimine, false);
});

test('dépenser plus que ce qu\'il reste élimine', () => {
  const { points, elimine } = depenserPoints(creerPointsUsure(), { carrosserie: 3 });
  assert.equal(points.carrosserie, 0);
  assert.equal(elimine, true);
});

test('une catégorie inconnue ou un coût négatif est refusé', () => {
  assert.throws(() => depenserPoints(creerPointsUsure(), { aileron: 1 }), RangeError);
  assert.throws(() => depenserPoints(creerPointsUsure(), { pneus: -1 }), RangeError);
});
