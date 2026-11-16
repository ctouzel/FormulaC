// Fait courir une course entière, sans humain : toutes les voitures sont
// pilotées par l'IA.

import { creerCourse } from './course.js';
import { jouerCoupIA } from './ia.js';

export const TOURS_DE_JEU_MAX = 500; // sécurité contre une boucle infinie

export function simulerCourse(config) {
  let etat = creerCourse(config);
  while (!etat.terminee) {
    if (etat.tourDeJeu > TOURS_DE_JEU_MAX) {
      throw new Error(`Course interrompue après ${TOURS_DE_JEU_MAX} tours de jeu`);
    }
    etat = jouerCoupIA(etat);
  }
  return etat;
}
