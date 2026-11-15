// La boîte de vitesses : les dés de chaque rapport et le coût des changements.
// Règles : docs/conception.md, sections 3 et 4.

export const RAPPORT_MIN = 1;
export const RAPPORT_MAX = 6;

/** Résultats possibles du dé de chaque rapport (bornes incluses). */
export const DES_RAPPORTS = Object.freeze({
  1: Object.freeze({ min: 1, max: 2 }),
  2: Object.freeze({ min: 2, max: 4 }),
  3: Object.freeze({ min: 3, max: 7 }),
  4: Object.freeze({ min: 6, max: 11 }),
  5: Object.freeze({ min: 10, max: 16 }),
  6: Object.freeze({ min: 15, max: 24 }),
});

export function estRapportValide(rapport) {
  return Number.isInteger(rapport) && rapport >= RAPPORT_MIN && rapport <= RAPPORT_MAX;
}

function verifierRapport(rapport) {
  if (!estRapportValide(rapport)) {
    throw new RangeError(`Rapport invalide : ${rapport} (attendu de ${RAPPORT_MIN} à ${RAPPORT_MAX})`);
  }
}

/**
 * Lance le dé d'un rapport.
 * @param {number} rapport
 * @param {{ entier: (min: number, max: number) => number }} generateur
 */
export function lancerDe(rapport, generateur) {
  verifierRapport(rapport);
  const { min, max } = DES_RAPPORTS[rapport];
  return generateur.entier(min, max);
}

/**
 * Coût en points d'usure pour passer d'un rapport à un autre.
 * Renvoie null si le changement est interdit (monter de plus d'un rapport).
 *
 * Descendre de n rapports coûte :
 *   - (n - 1) points de boîte,
 *   - (n - 2) points de moteur, à partir de 3 rapports.
 */
export function coutChangementRapport(actuel, nouveau) {
  verifierRapport(actuel);
  verifierRapport(nouveau);

  const ecart = nouveau - actuel;
  if (ecart > 1) return null;

  const descente = Math.max(0, -ecart);
  return {
    boite: Math.max(0, descente - 1),
    moteur: Math.max(0, descente - 2),
  };
}

/** Liste des rapports qu'on a le droit de choisir depuis le rapport actuel. */
export function rapportsAutorises(actuel) {
  verifierRapport(actuel);
  const liste = [];
  for (let r = RAPPORT_MIN; r <= Math.min(actuel + 1, RAPPORT_MAX); r++) liste.push(r);
  return liste;
}
