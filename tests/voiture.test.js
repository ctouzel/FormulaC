import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerVoiture, changerRapport } from '../src/moteur/voiture.js';

/** Monte une voiture jusqu'au rapport voulu, un rapport à la fois. */
function voitureAuRapport(rapport) {
  let v = creerVoiture({ id: 'test' });
  for (let r = 2; r <= rapport; r++) v = changerRapport(v, r);
  return v;
}

test('une voiture démarre en 1re avec 18 points', () => {
  const v = creerVoiture({ id: 'rouge', nom: 'Rouge' });
  assert.equal(v.rapport, 1);
  assert.equal(v.elimine, false);
  assert.equal(v.usure.boite, 4);
});

test('monter les rapports un par un ne coûte rien', () => {
  const v = voitureAuRapport(6);
  assert.equal(v.rapport, 6);
  assert.deepEqual(v.usure, creerVoiture().usure);
});

test('sauter un rapport en montant est interdit', () => {
  const v = creerVoiture({ id: 'test' });
  assert.throws(() => changerRapport(v, 3), /un rapport à la fois/);
});

test('une grosse descente coûte de la boîte et du moteur', () => {
  const v = changerRapport(voitureAuRapport(6), 3);
  assert.equal(v.rapport, 3);
  assert.equal(v.usure.boite, 2);
  assert.equal(v.usure.moteur, 1);
  assert.equal(v.elimine, false);
});

test('une descente trop brutale élimine la voiture', () => {
  // 6 → 1 coûte 3 points de moteur, il n'en reste que 2.
  const v = changerRapport(voitureAuRapport(6), 1);
  assert.equal(v.elimine, true);
});

test('une voiture éliminée ne peut plus changer de rapport', () => {
  const v = changerRapport(voitureAuRapport(6), 1);
  assert.throws(() => changerRapport(v, 2), /éliminée/);
});

test('changerRapport ne modifie pas la voiture d\'origine', () => {
  const avant = voitureAuRapport(6);
  changerRapport(avant, 3);
  assert.equal(avant.rapport, 6);
  assert.equal(avant.usure.boite, 4);
});
