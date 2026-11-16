// Une course : la grille de départ, l'ordre de jeu, les coups, les tours et
// l'arrivée. Règles : docs/conception.md, section 3.
//
// Un coup se joue en deux temps, pour que l'interface puisse plus tard
// laisser un humain choisir à chaque étape :
//   1. choisirRapport(etat, rapport)  → on lance le dé automatiquement ;
//   2. jouerOption(etat, option)      → l'une des options de optionsDuCoup(etat).
//
// Les fonctions renvoient un nouvel état. Seul le générateur aléatoire
// (etat.generateur) avance au fil de la partie.

import { creerGenerateur } from './aleatoire.js';
import { colonneDe, virageEn } from './piste.js';
import { coutChangementRapport, lancerDe } from './rapports.js';
import { creerVoiture, changerRapport } from './voiture.js';
import { CATEGORIES_USURE, depenserPoints } from './usure.js';
import { optionsDeplacement } from './deplacement.js';
import { passageVirages } from './virages.js';

export const TOURS_PAR_DEFAUT = 2;
export const VOITURES_MAX = 8;

/** Mélange une liste avec le générateur (algorithme de Fisher-Yates). */
function melanger(liste, generateur) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = generateur.entier(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Place sur la grille : 2 voitures par rangée, derrière la ligne de départ. */
export function positionGrille(piste, rang) {
  if (piste.voies === 1) return { distance: -1 - rang, voie: 0 };
  return {
    distance: -1 - Math.floor(rang / 2),
    voie: rang % 2 === 0 ? piste.voies - 1 : 0,
  };
}

/**
 * Crée une course.
 * @param {object} config
 * @param {object} config.piste - piste validée
 * @param {Array<{id: string, nom?: string, pilote?: 'ia'|'humain'}>} config.voitures
 * @param {number} [config.tours]
 * @param {number} config.graine
 */
export function creerCourse({ piste, voitures, tours = TOURS_PAR_DEFAUT, graine }) {
  if (!Array.isArray(voitures) || voitures.length < 1 || voitures.length > VOITURES_MAX) {
    throw new Error(`Il faut de 1 à ${VOITURES_MAX} voitures`);
  }
  if (new Set(voitures.map((v) => v.id)).size !== voitures.length) {
    throw new Error('Deux voitures ont le même identifiant');
  }
  if (!Number.isInteger(tours) || tours < 1) {
    throw new Error(`Nombre de tours invalide : ${tours}`);
  }

  const generateur = creerGenerateur(graine);
  const grille = melanger(voitures, generateur).map((v, rang) => {
    const position = positionGrille(piste, rang);
    if (virageEn(piste, colonneDe(piste, position.distance))) {
      throw new Error(`La grille de départ déborde dans un virage (place ${rang + 1})`);
    }
    return {
      ...creerVoiture({ id: v.id, nom: v.nom ?? v.id, usure: v.usure }),
      pilote: v.pilote ?? 'ia',
      position,
      virage: null,
      statut: 'en course', // 'en course' | 'arrivee' | 'eliminee'
      rang: null,
    };
  });

  return {
    piste,
    tours,
    graine,
    generateur,
    voitures: grille,
    tourDeJeu: 1,
    ordre: grille.map((v) => v.id),
    indexOrdre: 0,
    coup: { etape: 'rapport', resultat: null },
    arrivees: [],
    journal: [],
    terminee: false,
  };
}

// ---------------------------------------------------------------------------
// Lecture de l'état

export function voitureParId(etat, id) {
  return etat.voitures.find((v) => v.id === id);
}

export function voituresEnCourse(etat) {
  return etat.voitures.filter((v) => v.statut === 'en course');
}

/** La voiture qui doit jouer, ou null si la course est terminée. */
export function voitureActive(etat) {
  if (etat.terminee) return null;
  return voitureParId(etat, etat.ordre[etat.indexOrdre]);
}

/** Distance à parcourir pour finir la course. */
export function distanceArrivee(etat) {
  return etat.tours * etat.piste.longueur;
}

/** Numéro du tour de piste en cours pour une voiture (1 au départ). */
export function tourDePiste(etat, voiture) {
  return Math.max(1, Math.floor(voiture.position.distance / etat.piste.longueur) + 1);
}

/**
 * Classement : les arrivées dans l'ordre, puis les voitures en course (la plus
 * avancée d'abord ; à égalité, celle qui jouait avant), puis les éliminées.
 */
export function classement(etat) {
  const arrivees = etat.arrivees.map((id) => voitureParId(etat, id));
  const enCourse = voituresEnCourse(etat).sort(
    (a, b) =>
      b.position.distance - a.position.distance ||
      etat.ordre.indexOf(a.id) - etat.ordre.indexOf(b.id),
  );
  const eliminees = etat.voitures.filter((v) => v.statut === 'eliminee');
  return [...arrivees, ...enCourse, ...eliminees];
}

// ---------------------------------------------------------------------------
// Évaluation des options

function coutTotal(cout) {
  return Object.values(cout).reduce((s, n) => s + n, 0);
}

function categorieEpuisee(usure, cout) {
  return CATEGORIES_USURE.find((c) => (cout[c] ?? 0) > usure[c]) ?? null;
}

/**
 * Les options de déplacement d'une voiture pour un résultat de dé, avec leur
 * coût complet (freins + pneus) et le risque d'élimination.
 * La voiture peut être hypothétique : l'IA s'en sert pour tester des rapports.
 */
export function evaluerOptions(etat, voiture, resultat) {
  const autres = voituresEnCourse(etat)
    .filter((v) => v.id !== voiture.id)
    .map((v) => v.position);

  return optionsDeplacement(etat.piste, voiture.position, resultat, autres).map((option) => {
    const virages = passageVirages(etat.piste, voiture.virage, voiture.position.distance, option.position.distance);
    const cout = {};
    if (option.freins > 0) cout.freins = option.freins;
    if (virages.pneus > 0) cout.pneus = virages.pneus;

    let elimination = null;
    if (virages.sortieDePiste) elimination = `sortie de piste dans ${virages.sortieDePiste}`;
    else {
      const epuisee = categorieEpuisee(voiture.usure, cout);
      if (epuisee) elimination = `plus de points de ${epuisee}`;
    }

    return { ...option, cout, coutTotal: coutTotal(cout), virage: virages.virage, elimination };
  });
}

/** Les options du coup en cours (après le lancer de dé). */
export function optionsDuCoup(etat) {
  if (etat.coup.etape !== 'deplacement') {
    throw new Error("Il faut d'abord choisir un rapport");
  }
  return evaluerOptions(etat, voitureActive(etat), etat.coup.resultat);
}

// ---------------------------------------------------------------------------
// Jouer un coup

function remplacerVoiture(etat, voiture) {
  return { ...etat, voitures: etat.voitures.map((v) => (v.id === voiture.id ? voiture : v)) };
}

function noter(etat, evenement) {
  return { ...etat, journal: [...etat.journal, { tourDeJeu: etat.tourDeJeu, ...evenement }] };
}

function eliminer(etat, voiture, raison) {
  const etatSuivant = remplacerVoiture(etat, { ...voiture, elimine: true, statut: 'eliminee' });
  return noter(etatSuivant, { type: 'abandon', id: voiture.id, raison });
}

/** Passe à la voiture suivante, et au tour de jeu suivant si besoin. */
function finirCoup(etat) {
  let suivant = { ...etat, coup: { etape: 'rapport', resultat: null } };

  // Cherche la prochaine voiture encore en course dans l'ordre de ce tour.
  let index = suivant.indexOrdre + 1;
  while (index < suivant.ordre.length && voitureParId(suivant, suivant.ordre[index]).statut !== 'en course') {
    index++;
  }
  if (index < suivant.ordre.length) return { ...suivant, indexOrdre: index };

  // Fin du tour de jeu : nouvel ordre selon le classement.
  const enCourse = classement(suivant).filter((v) => v.statut === 'en course');
  if (enCourse.length === 0) return { ...suivant, terminee: true };
  return {
    ...suivant,
    tourDeJeu: suivant.tourDeJeu + 1,
    ordre: enCourse.map((v) => v.id),
    indexOrdre: 0,
  };
}

/** Étape 1 du coup : la voiture active choisit son rapport, puis lance le dé. */
export function choisirRapport(etat, rapport) {
  if (etat.terminee) throw new Error('La course est terminée');
  if (etat.coup.etape !== 'rapport') throw new Error('Le rapport a déjà été choisi');

  const voiture = voitureActive(etat);
  const apres = changerRapport(voiture, rapport); // lève une erreur si interdit
  if (apres.elimine) {
    const epuisee = categorieEpuisee(voiture.usure, coutChangementRapport(voiture.rapport, rapport));
    return finirCoup(eliminer(etat, apres, `casse : plus de points de ${epuisee}`));
  }

  const resultat = lancerDe(rapport, etat.generateur);
  return { ...remplacerVoiture(etat, apres), coup: { etape: 'deplacement', resultat } };
}

/** Étape 2 du coup : la voiture active se déplace selon l'option choisie. */
export function jouerOption(etat, option) {
  if (etat.coup.etape !== 'deplacement') throw new Error("Il faut d'abord choisir un rapport");

  const voiture = voitureActive(etat);
  const depart = voiture.position;
  let suivant = noter(etat, {
    type: 'coup',
    id: voiture.id,
    rapport: voiture.rapport,
    de: etat.coup.resultat,
    depart,
    arrivee: option.position,
    cases: option.cases,
    cout: option.cout,
  });

  if (option.elimination) {
    return finirCoup(eliminer(suivant, voiture, option.elimination));
  }

  const { points } = depenserPoints(voiture.usure, option.cout);
  const deplacee = { ...voiture, position: option.position, virage: option.virage, usure: points };

  if (deplacee.position.distance >= distanceArrivee(suivant)) {
    const rang = suivant.arrivees.length + 1;
    suivant = remplacerVoiture(suivant, { ...deplacee, statut: 'arrivee', rang });
    suivant = { ...suivant, arrivees: [...suivant.arrivees, voiture.id] };
    suivant = noter(suivant, { type: 'arrivee', id: voiture.id, rang });
  } else {
    suivant = remplacerVoiture(suivant, deplacee);
  }

  return finirCoup(suivant);
}
