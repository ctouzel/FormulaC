// Calcule la forme de la piste à dessiner à partir de sa description JSON.
//
// Principe de la « tortue » : on part d'un point, on avance d'un pas par
// colonne, et on tourne seulement dans les virages. Les virages se partagent
// un tour complet (360°). Si la piste ne se referme pas tout à fait, on répartit
// le petit écart sur toute la longueur.
//
// Ce fichier ne touche pas au DOM : il est testé dans Node comme le moteur.

import { colonneDe, virageEn } from '../moteur/piste.js';

/**
 * @param {object} piste - piste validée
 * @param {object} [options]
 * @param {number} [options.pasVirage] - longueur dessinée d'une colonne de
 *   virage, plus grande qu'en ligne droite pour des virages bien ronds. C'est
 *   seulement visuel : pour les règles, toutes les colonnes valent une case.
 * @returns {{ bords, centreCase, polygoneCase, pointHorsPiste, etiquettes, cadre, largeurVoie }}
 */
export function calculerGeometrie(piste, { pas = 1, pasVirage = 1.8, largeurVoie = 0.8 } = {}) {
  const { longueur, voies } = piste;
  const tourComplet = 2 * Math.PI;
  const nbVirages = piste.virages.length;

  // Angle dont on tourne dans chaque colonne.
  const angles = Array.from({ length: longueur }, (_, colonne) => {
    const v = virageEn(piste, colonne);
    if (!v) return 0;
    return tourComplet / nbVirages / (v.fin - v.debut + 1);
  });

  // bords[k] : la ligne qui sépare la colonne k - 1 de la colonne k.
  const bords = [];
  let x = 0;
  let y = 0;
  let cap = 0;
  for (let colonne = 0; colonne < longueur; colonne++) {
    bords.push({ x, y, cap });
    cap += angles[colonne] / 2;
    const longueurPas = angles[colonne] > 0 ? pasVirage : pas;
    x += longueurPas * Math.cos(cap);
    y += longueurPas * Math.sin(cap);
    cap += angles[colonne] / 2;
  }

  // Correction de fermeture : on veut revenir au point de départ.
  const ecartX = x - bords[0].x;
  const ecartY = y - bords[0].y;
  bords.forEach((b, k) => {
    b.x -= (ecartX * k) / longueur;
    b.y -= (ecartY * k) / longueur;
  });

  /** Décalage latéral du centre d'une voie (voie 0 = côté intérieur). */
  const decalageVoie = (voie) => ((voies - 1) / 2 - voie) * largeurVoie;

  /** Point sur le bord k, décalé de d vers l'intérieur. */
  function pointBord(k, d) {
    const b = bords[((k % longueur) + longueur) % longueur];
    return { x: b.x - Math.sin(b.cap) * d, y: b.y + Math.cos(b.cap) * d };
  }

  /** Les 4 coins d'une case. La distance peut dépasser un tour. */
  function polygoneCase(distance, voie) {
    const k = colonneDe(piste, distance);
    const d = decalageVoie(voie);
    const demi = largeurVoie / 2;
    return [pointBord(k, d - demi), pointBord(k + 1, d - demi), pointBord(k + 1, d + demi), pointBord(k, d + demi)];
  }

  /** Le centre d'une case. */
  function centreCase(distance, voie) {
    const coins = polygoneCase(distance, voie);
    return {
      x: coins.reduce((s, p) => s + p.x, 0) / 4,
      y: coins.reduce((s, p) => s + p.y, 0) / 4,
    };
  }

  /** Un point au milieu d'une colonne, à une distance donnée hors de la piste (> 0 : intérieur). */
  function pointHorsPiste(colonne, ecart) {
    const a = pointBord(colonne, ecart);
    const b = pointBord(colonne + 1, ecart);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  // Étiquettes des virages : au milieu du virage, à l'extérieur de la courbe.
  const demiLargeur = (voies / 2) * largeurVoie;
  const etiquettes = piste.virages.map((v) => ({
    virage: v,
    ...pointHorsPiste(Math.floor((v.debut + v.fin) / 2), -(demiLargeur + 1.3)),
  }));

  // Cadre englobant : la piste, plus la place pour le texte des étiquettes.
  const points = bords.flatMap((_, k) => [pointBord(k, demiLargeur), pointBord(k, -demiLargeur)]);
  const demiTexte = { x: 1.9, y: 0.5 };
  const marge = 0.4;
  const minX = Math.min(...points.map((p) => p.x), ...etiquettes.map((e) => e.x - demiTexte.x)) - marge;
  const minY = Math.min(...points.map((p) => p.y), ...etiquettes.map((e) => e.y - demiTexte.y)) - marge;
  const maxX = Math.max(...points.map((p) => p.x), ...etiquettes.map((e) => e.x + demiTexte.x)) + marge;
  const maxY = Math.max(...points.map((p) => p.y), ...etiquettes.map((e) => e.y + demiTexte.y)) + marge;

  return {
    bords,
    largeurVoie,
    demiLargeur,
    pointBord,
    centreCase,
    polygoneCase,
    pointHorsPiste,
    etiquettes,
    cadre: { x: minX, y: minY, largeur: maxX - minX, hauteur: maxY - minY },
  };
}
