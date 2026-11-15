// Générateur de nombres aléatoires avec graine.
//
// Avec la même graine, on obtient toujours la même suite de nombres :
// une partie peut donc être rejouée à l'identique (tests, débogage, replays).
// Algorithme : mulberry32, petit, rapide et suffisant pour un jeu.

/**
 * Crée un générateur à partir d'une graine (un nombre entier).
 * @param {number} graine
 */
export function creerGenerateur(graine) {
  if (!Number.isInteger(graine)) {
    throw new TypeError(`La graine doit être un nombre entier (reçu : ${graine})`);
  }
  let etat = graine >>> 0;

  /** Nombre décimal dans [0, 1[, comme Math.random(). */
  function suivant() {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Nombre entier entre min et max, bornes incluses. */
  function entier(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new RangeError(`Bornes invalides : ${min} à ${max}`);
    }
    return min + Math.floor(suivant() * (max - min + 1));
  }

  return { suivant, entier };
}
