// Une voiture, et le changement de rapport qui relie la boîte de vitesses
// aux points d'usure.

import { coutChangementRapport, estRapportValide, RAPPORT_MIN } from './rapports.js';
import { creerPointsUsure, depenserPoints } from './usure.js';

/** Crée une voiture au départ : rapport 1, réserve d'usure complète. */
export function creerVoiture({ id, nom, usure } = {}) {
  return {
    id,
    nom,
    rapport: RAPPORT_MIN,
    usure: creerPointsUsure(usure),
    elimine: false,
  };
}

/**
 * Passe la voiture au rapport demandé et paie le coût en usure.
 * Lève une erreur si le changement est interdit.
 * @returns {object} une nouvelle voiture (l'ancienne n'est pas modifiée)
 */
export function changerRapport(voiture, nouveauRapport) {
  if (voiture.elimine) {
    throw new Error(`La voiture ${voiture.id} est éliminée`);
  }
  if (!estRapportValide(nouveauRapport)) {
    throw new RangeError(`Rapport invalide : ${nouveauRapport}`);
  }

  const cout = coutChangementRapport(voiture.rapport, nouveauRapport);
  if (cout === null) {
    throw new Error(
      `Interdit de passer du rapport ${voiture.rapport} au rapport ${nouveauRapport} : on ne monte que d'un rapport à la fois`,
    );
  }

  const { points, elimine } = depenserPoints(voiture.usure, cout);
  return { ...voiture, rapport: nouveauRapport, usure: points, elimine };
}
