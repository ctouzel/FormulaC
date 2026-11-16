// La piste : une boucle de colonnes, avec plusieurs voies côte à côte.
// Règles : docs/conception.md, section 2.
//
// Une position sur la piste est { distance, voie } :
//   - distance : nombre total de colonnes parcourues depuis la ligne de départ
//     (elle continue d'augmenter à chaque tour : 50 sur une piste de 48 = tour 2,
//     colonne 2). C'est pratique pour le classement et les tours.
//   - voie : de 0 (bord) à voies - 1.
// La colonne réelle sur la piste est distance modulo longueur.

/**
 * Vérifie une piste (par exemple lue depuis un fichier JSON) et renvoie une
 * copie figée. Lève une erreur claire si quelque chose ne va pas.
 */
export function validerPiste(donnees) {
  const { nom, voies, longueur, virages = [] } = donnees ?? {};

  if (typeof nom !== 'string' || nom.trim() === '') {
    throw new Error('La piste doit avoir un nom');
  }
  if (!Number.isInteger(voies) || voies < 1 || voies > 4) {
    throw new Error(`Nombre de voies invalide : ${voies} (de 1 à 4)`);
  }
  if (!Number.isInteger(longueur) || longueur < 10) {
    throw new Error(`Longueur invalide : ${longueur} (au moins 10 colonnes)`);
  }
  if (!Array.isArray(virages)) {
    throw new Error('« virages » doit être une liste');
  }

  const tries = [...virages].sort((a, b) => a.debut - b.debut);
  tries.forEach((v, i) => {
    const nomV = v.nom ?? `n°${i + 1}`;
    if (!Number.isInteger(v.debut) || !Number.isInteger(v.fin) || v.debut < 0 || v.fin >= longueur || v.debut > v.fin) {
      throw new Error(`Virage ${nomV} : colonnes invalides (${v.debut} à ${v.fin})`);
    }
    if (!Number.isInteger(v.arrets) || v.arrets < 1 || v.arrets > 3) {
      throw new Error(`Virage ${nomV} : nombre d'arrêts invalide (${v.arrets}, de 1 à 3)`);
    }
    const precedent = tries[i - 1];
    if (precedent && v.debut <= precedent.fin) {
      throw new Error(`Virage ${nomV} : il chevauche le virage ${precedent.nom}`);
    }
  });

  return Object.freeze({
    nom,
    voies,
    longueur,
    virages: Object.freeze(tries.map((v) => Object.freeze({ ...v }))),
  });
}

/** Colonne réelle (de 0 à longueur - 1) correspondant à une distance. */
export function colonneDe(piste, distance) {
  return ((distance % piste.longueur) + piste.longueur) % piste.longueur;
}

/** Le virage qui contient cette colonne, ou null en ligne droite. */
export function virageEn(piste, colonne) {
  return piste.virages.find((v) => colonne >= v.debut && colonne <= v.fin) ?? null;
}

/** Clé unique d'une case de la piste, quel que soit le tour. */
export function cleCase(piste, { distance, voie }) {
  return `${colonneDe(piste, distance)}:${voie}`;
}
