// L'ordinateur : une IA simple et prudente.
// Règles : docs/conception.md, section 9.
//
// 1. Rapport : pour chaque rapport permis, on regarde TOUS les résultats
//    possibles du dé. Pour chacun, on garde la meilleure option. Le « pire
//    cas » d'un rapport est le coût de son plus mauvais résultat (plus le coût
//    du changement de rapport). On prend le rapport au pire cas le plus bas ;
//    à égalité, celui qui avance le plus en moyenne.
// 2. Déplacement : l'option qui n'élimine pas, coûte le moins, puis va le
//    plus loin.

import { DES_RAPPORTS, coutChangementRapport, rapportsAutorises } from './rapports.js';
import { changerRapport } from './voiture.js';
import { choisirRapport, evaluerOptions, jouerOption, optionsDuCoup, voitureActive } from './course.js';

/** Compare deux options : la meilleure en premier. */
function comparerOptions(a, b) {
  return (
    (a.elimination ? 1 : 0) - (b.elimination ? 1 : 0) ||
    a.coutTotal - b.coutTotal ||
    b.cases - a.cases ||
    a.position.voie - b.position.voie
  );
}

/** La meilleure option d'une liste, selon l'IA. */
export function meilleureOption(options) {
  return [...options].sort(comparerOptions)[0];
}

/** Évalue un rapport : pire coût et distance moyenne sur tous les résultats du dé. */
export function evaluerRapport(etat, voiture, rapport) {
  const apres = changerRapport(voiture, rapport);
  if (apres.elimine) return null;

  const changement = coutChangementRapport(voiture.rapport, rapport);
  const coutChangement = changement.boite + changement.moteur;

  const { min, max } = DES_RAPPORTS[rapport];
  let pire = 0;
  let sommeCases = 0;
  for (let resultat = min; resultat <= max; resultat++) {
    const option = meilleureOption(evaluerOptions(etat, apres, resultat));
    pire = Math.max(pire, option.elimination ? Infinity : option.coutTotal);
    sommeCases += option.cases;
  }
  return { rapport, pire: pire + coutChangement, moyenne: sommeCases / (max - min + 1) };
}

/** Le rapport choisi par l'IA pour la voiture active. */
export function choisirRapportIA(etat) {
  const voiture = voitureActive(etat);
  const evaluations = rapportsAutorises(voiture.rapport)
    .map((r) => evaluerRapport(etat, voiture, r))
    .filter(Boolean)
    .sort((a, b) => a.pire - b.pire || b.moyenne - a.moyenne);
  return evaluations[0]?.rapport ?? voiture.rapport;
}

/** Joue un coup complet de l'IA pour la voiture active. */
export function jouerCoupIA(etat) {
  const apresRapport = choisirRapport(etat, choisirRapportIA(etat));
  // Si la voiture a cassé en changeant de rapport, le coup est déjà fini.
  if (apresRapport.coup.etape !== 'deplacement') return apresRapport;
  return jouerOption(apresRapport, meilleureOption(optionsDuCoup(apresRapport)));
}
