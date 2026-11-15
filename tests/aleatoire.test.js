import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerGenerateur } from '../src/moteur/aleatoire.js';

test('la même graine donne la même suite de nombres', () => {
  const a = creerGenerateur(42);
  const b = creerGenerateur(42);
  for (let i = 0; i < 100; i++) {
    assert.equal(a.suivant(), b.suivant());
  }
});

test('deux graines différentes donnent des suites différentes', () => {
  const a = creerGenerateur(1);
  const b = creerGenerateur(2);
  const suiteA = Array.from({ length: 10 }, () => a.suivant());
  const suiteB = Array.from({ length: 10 }, () => b.suivant());
  assert.notDeepEqual(suiteA, suiteB);
});

test('suivant() reste dans [0, 1[', () => {
  const g = creerGenerateur(7);
  for (let i = 0; i < 10000; i++) {
    const n = g.suivant();
    assert.ok(n >= 0 && n < 1, `valeur hors limites : ${n}`);
  }
});

test('entier() reste dans les bornes et les atteint toutes', () => {
  const g = creerGenerateur(123);
  const vus = new Set();
  for (let i = 0; i < 5000; i++) {
    const n = g.entier(3, 7);
    assert.ok(Number.isInteger(n) && n >= 3 && n <= 7, `valeur hors limites : ${n}`);
    vus.add(n);
  }
  assert.deepEqual([...vus].sort(), [3, 4, 5, 6, 7]);
});

test('entier() est à peu près équitable', () => {
  const g = creerGenerateur(2026);
  const compte = [0, 0, 0, 0];
  const tirages = 40000;
  for (let i = 0; i < tirages; i++) compte[g.entier(0, 3)]++;
  for (const c of compte) {
    // Chaque valeur devrait sortir environ 25 % du temps.
    assert.ok(Math.abs(c / tirages - 0.25) < 0.02, `répartition déséquilibrée : ${compte}`);
  }
});

test('une graine invalide est refusée', () => {
  assert.throws(() => creerGenerateur(1.5), TypeError);
  assert.throws(() => creerGenerateur('abc'), TypeError);
});

test('des bornes invalides sont refusées', () => {
  const g = creerGenerateur(1);
  assert.throws(() => g.entier(5, 2), RangeError);
});
