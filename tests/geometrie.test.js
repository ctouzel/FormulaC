import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validerPiste } from '../src/moteur/piste.js';
import { calculerGeometrie } from '../src/interface/geometrie.js';

const ovale = validerPiste(JSON.parse(readFileSync(new URL('../pistes/ovale-essai.json', import.meta.url))));

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('il y a un bord par colonne', () => {
  const geo = calculerGeometrie(ovale);
  assert.equal(geo.bords.length, ovale.longueur);
});

test('la piste se referme : la dernière case touche la première', () => {
  const geo = calculerGeometrie(ovale);
  const derniere = geo.polygoneCase(ovale.longueur - 1, 1);
  const premiere = geo.polygoneCase(0, 1);
  // Le côté avant de la dernière case = le côté arrière de la première.
  assert.ok(distance(derniere[1], premiere[0]) < 1e-9);
  assert.ok(distance(derniere[2], premiere[3]) < 1e-9);
});

test('une piste asymétrique se referme aussi, grâce à la correction', () => {
  const piste = validerPiste({
    nom: 'Bizarre',
    voies: 2,
    longueur: 40,
    virages: [
      { nom: 'A', debut: 5, fin: 7, arrets: 1 },
      { nom: 'B', debut: 15, fin: 22, arrets: 2 },
      { nom: 'C', debut: 30, fin: 31, arrets: 1 },
    ],
  });
  const geo = calculerGeometrie(piste);
  const derniere = geo.polygoneCase(39, 0);
  const premiere = geo.polygoneCase(0, 0);
  assert.ok(distance(derniere[1], premiere[0]) < 1e-9);
});

test('les cases voisines sont proches (un pas, un peu plus en virage)', () => {
  const geo = calculerGeometrie(ovale);
  for (let d = 0; d < ovale.longueur; d++) {
    const ecart = distance(geo.centreCase(d, 1), geo.centreCase(d + 1, 1));
    assert.ok(ecart > 0.5 && ecart < 2.2, `colonne ${d} : écart ${ecart}`);
  }
});

test('une distance au tour suivant tombe au même endroit', () => {
  const geo = calculerGeometrie(ovale);
  assert.deepEqual(geo.centreCase(5, 2), geo.centreCase(5 + ovale.longueur, 2));
  assert.deepEqual(geo.centreCase(-1, 0), geo.centreCase(ovale.longueur - 1, 0));
});

test('aucune coordonnée invalide, et un cadre de taille raisonnable', () => {
  const geo = calculerGeometrie(ovale);
  for (let d = 0; d < ovale.longueur; d++) {
    for (let v = 0; v < ovale.voies; v++) {
      for (const p of geo.polygoneCase(d, v)) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
  }
  assert.ok(geo.cadre.largeur > 5 && geo.cadre.hauteur > 5);
});
