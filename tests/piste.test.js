import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validerPiste, colonneDe, virageEn, cleCase } from '../src/moteur/piste.js';

const ovale = JSON.parse(readFileSync(new URL('../pistes/ovale-essai.json', import.meta.url)));

test('la piste ovale d\'essai est valide', () => {
  const piste = validerPiste(ovale);
  assert.equal(piste.voies, 3);
  assert.equal(piste.longueur, 48);
  assert.equal(piste.virages.length, 2);
});

test('colonneDe fait le tour de la boucle', () => {
  const piste = validerPiste(ovale);
  assert.equal(colonneDe(piste, 5), 5);
  assert.equal(colonneDe(piste, 48), 0);
  assert.equal(colonneDe(piste, 50), 2);
  assert.equal(colonneDe(piste, 100), 4);
});

test('virageEn trouve le virage, ou null en ligne droite', () => {
  const piste = validerPiste(ovale);
  assert.equal(virageEn(piste, 11), null);
  assert.equal(virageEn(piste, 12).nom, 'V1');
  assert.equal(virageEn(piste, 17).nom, 'V1');
  assert.equal(virageEn(piste, 18), null);
  assert.equal(virageEn(piste, 40).nom, 'V2');
});

test('cleCase est la même d\'un tour à l\'autre', () => {
  const piste = validerPiste(ovale);
  assert.equal(cleCase(piste, { distance: 3, voie: 1 }), cleCase(piste, { distance: 51, voie: 1 }));
});

test('validerPiste refuse les pistes mal formées', () => {
  const base = { nom: 'Test', voies: 3, longueur: 30, virages: [] };
  assert.throws(() => validerPiste({ ...base, nom: '' }), /nom/);
  assert.throws(() => validerPiste({ ...base, voies: 0 }), /voies/);
  assert.throws(() => validerPiste({ ...base, longueur: 5 }), /Longueur/);
  assert.throws(
    () => validerPiste({ ...base, virages: [{ nom: 'A', debut: 10, fin: 40, arrets: 1 }] }),
    /colonnes invalides/,
  );
  assert.throws(
    () => validerPiste({ ...base, virages: [{ nom: 'A', debut: 10, fin: 12, arrets: 4 }] }),
    /arrêts/,
  );
  assert.throws(
    () =>
      validerPiste({
        ...base,
        virages: [
          { nom: 'A', debut: 10, fin: 15, arrets: 1 },
          { nom: 'B', debut: 14, fin: 18, arrets: 1 },
        ],
      }),
    /chevauche/,
  );
});
