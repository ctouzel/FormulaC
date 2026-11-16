// Les virages : comptage des arrêts et pénalités à la sortie.
// Règles : docs/conception.md, section 6.
//
// Chaque voiture retient le virage où elle se trouve et combien de fois elle
// s'y est arrêtée : voiture.virage = { nom, arrets } ou null.

import { colonneDe, virageEn } from './piste.js';

/**
 * Ce qui se passe dans les virages quand une voiture va de distanceDepart à
 * distanceArrivee.
 *
 * La ligne de sortie d'un virage est entre sa dernière colonne (fin) et la
 * suivante. On la franchit en passant d'une distance x (colonne fin) à x + 1.
 *
 * @returns {{ pneus: number, sortieDePiste: string|null, virage: object|null }}
 *   pneus : points de pneus à payer ;
 *   sortieDePiste : nom du virage raté (élimination), sinon null ;
 *   virage : le nouvel état { nom, arrets } de la voiture après le coup.
 */
export function passageVirages(piste, virageActuel, distanceDepart, distanceArrivee) {
  let pneus = 0;
  let sortieDePiste = null;
  let virage = virageActuel;

  for (let x = distanceDepart; x < distanceArrivee; x++) {
    const v = virageEn(piste, colonneDe(piste, x));
    if (!v || colonneDe(piste, x) !== v.fin) continue;

    // On franchit la ligne de sortie du virage v.
    const arretsFaits = virage?.nom === v.nom ? virage.arrets : 0;
    const manquants = v.arrets - arretsFaits;
    if (manquants === 1) {
      pneus += distanceArrivee - x; // 1 point par case au-delà de la ligne
    } else if (manquants >= 2) {
      sortieDePiste ??= v.nom;
    }
    virage = null;
  }

  // L'arrivée compte comme un arrêt si elle est dans un virage.
  const vArrivee = virageEn(piste, colonneDe(piste, distanceArrivee));
  if (vArrivee) {
    const dejaFaits = virage?.nom === vArrivee.nom ? virage.arrets : 0;
    virage = { nom: vArrivee.nom, arrets: dejaFaits + 1 };
  } else {
    virage = null;
  }

  return { pneus, sortieDePiste, virage };
}
