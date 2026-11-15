// Les points d'usure de chaque voiture.
// Règles : docs/conception.md, section 5.
//
// Les fonctions ne modifient jamais l'objet reçu : elles renvoient une copie.
// C'est plus simple à tester et ça permettra d'annuler un coup ou de rejouer.

export const CATEGORIES_USURE = Object.freeze(['pneus', 'freins', 'boite', 'moteur', 'carrosserie']);

export const USURE_DEPART = Object.freeze({
  pneus: 6,
  freins: 4,
  boite: 4,
  moteur: 2,
  carrosserie: 2,
});

/** Crée une réserve de points d'usure (les valeurs de départ par défaut). */
export function creerPointsUsure(valeurs = USURE_DEPART) {
  const points = {};
  for (const categorie of CATEGORIES_USURE) {
    const valeur = valeurs[categorie] ?? 0;
    if (!Number.isInteger(valeur) || valeur < 0) {
      throw new RangeError(`Valeur invalide pour ${categorie} : ${valeur}`);
    }
    points[categorie] = valeur;
  }
  return points;
}

/**
 * Dépense des points d'usure.
 * @param {object} points - la réserve actuelle
 * @param {object} cout - par exemple { boite: 1, moteur: 1 }
 * @returns {{ points: object, elimine: boolean }}
 *   elimine vaut true si une catégorie n'avait pas assez de points.
 *   On peut tomber à 0 sans être éliminé ; c'est dépenser au-delà qui élimine.
 */
export function depenserPoints(points, cout) {
  const nouveauxPoints = { ...points };
  let elimine = false;

  for (const [categorie, quantite] of Object.entries(cout)) {
    if (!CATEGORIES_USURE.includes(categorie)) {
      throw new RangeError(`Catégorie d'usure inconnue : ${categorie}`);
    }
    if (!Number.isInteger(quantite) || quantite < 0) {
      throw new RangeError(`Coût invalide pour ${categorie} : ${quantite}`);
    }
    if (quantite > nouveauxPoints[categorie]) elimine = true;
    nouveauxPoints[categorie] = Math.max(0, nouveauxPoints[categorie] - quantite);
  }

  return { points: nouveauxPoints, elimine };
}

/** Total des points restants, toutes catégories confondues. */
export function totalPoints(points) {
  return CATEGORIES_USURE.reduce((somme, categorie) => somme + points[categorie], 0);
}
