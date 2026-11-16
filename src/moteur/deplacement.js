// Calcul des déplacements possibles d'une voiture.
// Règles : docs/conception.md, sections 2, 3 et 5 (freins).
//
// Un pas = avancer d'une colonne, en restant dans sa voie ou en passant en
// diagonale dans une voie voisine. On ne peut pas entrer dans une case
// occupée par une autre voiture : il faut la contourner.

import { cleCase } from './piste.js';

// Ordre d'essai des voies à chaque pas : tout droit d'abord, pour que le
// chemin proposé change de voie le moins souvent possible.
const DECALAGES = [0, -1, 1];

/**
 * Toutes les destinations atteignables avec un résultat de dé.
 *
 * On peut avancer de moins que le dé en freinant : chaque case non parcourue
 * coûte 1 point de freins. (La vérification des points disponibles se fera
 * au moment de jouer le coup.)
 *
 * @param {object} piste - une piste validée
 * @param {{distance: number, voie: number}} depart
 * @param {number} resultatDe
 * @param {Array<{distance: number, voie: number}>} autresVoitures - positions occupées
 * @returns {Array<{position, chemin, cases, freins}>} triées de la plus lointaine à la plus proche
 *   chemin : liste des positions traversées, arrivée comprise, départ exclu.
 */
export function optionsDeplacement(piste, depart, resultatDe, autresVoitures = []) {
  if (!Number.isInteger(resultatDe) || resultatDe < 0) {
    throw new RangeError(`Résultat de dé invalide : ${resultatDe}`);
  }
  if (!Number.isInteger(depart.voie) || depart.voie < 0 || depart.voie >= piste.voies) {
    throw new RangeError(`Voie de départ invalide : ${depart.voie}`);
  }

  const occupees = new Set(autresVoitures.map((p) => cleCase(piste, p)));
  const options = [];

  // couche : pour chaque voie atteinte après k pas, un chemin pour y arriver.
  let couche = new Map([[depart.voie, []]]);

  for (let pas = 0; pas <= resultatDe; pas++) {
    for (const [voie, chemin] of couche) {
      options.push({
        position: { distance: depart.distance + pas, voie },
        chemin,
        cases: pas,
        freins: resultatDe - pas,
      });
    }
    if (pas === resultatDe) break;

    const suivante = new Map();
    for (const [voie, chemin] of couche) {
      for (const decalage of DECALAGES) {
        const nouvelleVoie = voie + decalage;
        if (nouvelleVoie < 0 || nouvelleVoie >= piste.voies) continue;
        if (suivante.has(nouvelleVoie)) continue;
        const position = { distance: depart.distance + pas + 1, voie: nouvelleVoie };
        if (occupees.has(cleCase(piste, position))) continue;
        suivante.set(nouvelleVoie, [...chemin, position]);
      }
    }
    if (suivante.size === 0) break; // complètement bloqué : on ne peut pas aller plus loin
    couche = suivante;
  }

  return options.sort((a, b) => b.cases - a.cases || a.position.voie - b.position.voie);
}

/** Seulement les destinations atteintes sans freiner (exactement le résultat du dé). */
export function destinationsExactes(piste, depart, resultatDe, autresVoitures = []) {
  return optionsDeplacement(piste, depart, resultatDe, autresVoitures).filter((o) => o.freins === 0);
}
