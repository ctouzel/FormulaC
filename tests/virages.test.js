import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validerPiste } from '../src/moteur/piste.js';
import { passageVirages } from '../src/moteur/virages.js';

// Virage A : colonnes 10 à 13, 2 arrêts. Virage B : colonnes 30 à 31, 1 arrêt.
const piste = validerPiste({
  nom: 'Test',
  voies: 3,
  longueur: 40,
  virages: [
    { nom: 'A', debut: 10, fin: 13, arrets: 2 },
    { nom: 'B', debut: 30, fin: 31, arrets: 1 },
  ],
});

test('en ligne droite, rien ne se passe', () => {
  assert.deepEqual(passageVirages(piste, null, 0, 8), { pneus: 0, sortieDePiste: null, virage: null });
});

test('finir son coup dans un virage compte un arrêt', () => {
  const r = passageVirages(piste, null, 5, 11);
  assert.deepEqual(r.virage, { nom: 'A', arrets: 1 });
  const r2 = passageVirages(piste, r.virage, 11, 12);
  assert.deepEqual(r2.virage, { nom: 'A', arrets: 2 });
});

test('sortir après assez d\'arrêts est gratuit', () => {
  const r = passageVirages(piste, { nom: 'A', arrets: 2 }, 12, 18);
  assert.deepEqual(r, { pneus: 0, sortieDePiste: null, virage: null });
});

test('un arrêt manquant : 1 point de pneus par case après la ligne', () => {
  // Ligne de sortie entre 13 et 14 ; arrivée en 16 = 3 cases après.
  const r = passageVirages(piste, { nom: 'A', arrets: 1 }, 12, 16);
  assert.equal(r.pneus, 3);
  assert.equal(r.sortieDePiste, null);
});

test('deux arrêts manquants : sortie de piste', () => {
  const r = passageVirages(piste, null, 5, 16);
  assert.equal(r.sortieDePiste, 'A');
});

test('partir de la dernière colonne du virage franchit la ligne', () => {
  const r = passageVirages(piste, { nom: 'B', arrets: 1 }, 31, 33);
  assert.deepEqual(r, { pneus: 0, sortieDePiste: null, virage: null });
  const r2 = passageVirages(piste, null, 29, 33);
  assert.equal(r2.pneus, 2, 'virage B traversé sans arrêt (1 manquant)');
});

test('fonctionne au tour suivant (distance au-delà de la longueur)', () => {
  // Distance 50 = colonne 10 du 2e tour.
  const r = passageVirages(piste, null, 45, 50);
  assert.deepEqual(r.virage, { nom: 'A', arrets: 1 });
});

test('les arrêts d\'un autre virage ne comptent pas', () => {
  const r = passageVirages(piste, { nom: 'A', arrets: 2 }, 28, 33);
  assert.equal(r.pneus, 2);
});
