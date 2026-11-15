import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerGenerateur } from '../src/moteur/aleatoire.js';
import {
  DES_RAPPORTS,
  lancerDe,
  coutChangementRapport,
  rapportsAutorises,
} from '../src/moteur/rapports.js';

test('chaque dé donne tous ses résultats possibles, et seulement ceux-là', () => {
  const g = creerGenerateur(99);
  for (const [rapport, { min, max }] of Object.entries(DES_RAPPORTS)) {
    const vus = new Set();
    for (let i = 0; i < 3000; i++) {
      const n = lancerDe(Number(rapport), g);
      assert.ok(n >= min && n <= max, `rapport ${rapport} : ${n} hors de ${min}-${max}`);
      vus.add(n);
    }
    assert.equal(vus.size, max - min + 1, `rapport ${rapport} : il manque des résultats`);
  }
});

test('les dés vont de plus en plus loin', () => {
  for (let r = 2; r <= 6; r++) {
    assert.ok(DES_RAPPORTS[r].min > DES_RAPPORTS[r - 1].min);
    assert.ok(DES_RAPPORTS[r].max > DES_RAPPORTS[r - 1].max);
  }
});

test('lancerDe refuse un rapport invalide', () => {
  const g = creerGenerateur(1);
  assert.throws(() => lancerDe(0, g), RangeError);
  assert.throws(() => lancerDe(7, g), RangeError);
});

test('monter d\'un rapport ou rester est gratuit', () => {
  assert.deepEqual(coutChangementRapport(3, 4), { boite: 0, moteur: 0 });
  assert.deepEqual(coutChangementRapport(3, 3), { boite: 0, moteur: 0 });
});

test('monter de plus d\'un rapport est interdit', () => {
  assert.equal(coutChangementRapport(2, 4), null);
  assert.equal(coutChangementRapport(1, 6), null);
});

test('descendre d\'un rapport est gratuit', () => {
  assert.deepEqual(coutChangementRapport(5, 4), { boite: 0, moteur: 0 });
});

test('descendre de plusieurs rapports coûte boîte puis moteur', () => {
  assert.deepEqual(coutChangementRapport(5, 3), { boite: 1, moteur: 0 });
  assert.deepEqual(coutChangementRapport(6, 3), { boite: 2, moteur: 1 });
  assert.deepEqual(coutChangementRapport(6, 2), { boite: 3, moteur: 2 });
  assert.deepEqual(coutChangementRapport(6, 1), { boite: 4, moteur: 3 });
});

test('rapportsAutorises : on peut descendre jusqu\'en 1 et monter d\'un seul', () => {
  assert.deepEqual(rapportsAutorises(1), [1, 2]);
  assert.deepEqual(rapportsAutorises(3), [1, 2, 3, 4]);
  assert.deepEqual(rapportsAutorises(6), [1, 2, 3, 4, 5, 6]);
});
