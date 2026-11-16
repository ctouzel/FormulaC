// Dessine la piste en SVG : cases, bords, ligne d'arrivée, virages.

import { virageEn } from '../moteur/piste.js';

const NS = 'http://www.w3.org/2000/svg';

/** Crée un élément SVG avec ses attributs, et l'ajoute au parent. */
export function creerSvg(nom, attributs = {}, parent = null) {
  const el = document.createElementNS(NS, nom);
  for (const [cle, valeur] of Object.entries(attributs)) el.setAttribute(cle, valeur);
  if (parent) parent.appendChild(el);
  return el;
}

const enPoints = (liste) => liste.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');

/**
 * Dessine toute la piste dans l'élément <svg>.
 * @returns {SVGGElement} le groupe où placer les voitures
 */
export function dessinerPiste(svg, piste, geo) {
  svg.replaceChildren();
  const { x, y, largeur, hauteur } = geo.cadre;
  svg.setAttribute('viewBox', `${x} ${y} ${largeur} ${hauteur}`);

  // Les cases.
  const groupeCases = creerSvg('g', { class: 'cases' }, svg);
  for (let colonne = 0; colonne < piste.longueur; colonne++) {
    const dansVirage = Boolean(virageEn(piste, colonne));
    for (let voie = 0; voie < piste.voies; voie++) {
      creerSvg(
        'polygon',
        {
          class: dansVirage ? 'case virage' : 'case',
          points: enPoints(geo.polygoneCase(colonne, voie)),
          'data-colonne': colonne,
          'data-voie': voie,
        },
        groupeCases,
      );
    }
  }

  // Les bords blancs de la piste.
  const bord = (ecart) =>
    creerSvg(
      'polygon',
      { class: 'bord-piste', points: enPoints(geo.bords.map((_, k) => geo.pointBord(k, ecart))) },
      svg,
    );
  bord(geo.demiLargeur);
  bord(-geo.demiLargeur);

  // La ligne de départ / arrivée (damier), sur le bord 0.
  const damier = creerSvg('g', { class: 'damier' }, svg);
  const carreaux = piste.voies * 4;
  const taille = (2 * geo.demiLargeur) / carreaux;
  const { cap } = geo.bords[0];
  const sens = { x: Math.cos(cap), y: Math.sin(cap) }; // direction de la course
  const decaler = (p, f) => ({ x: p.x + sens.x * f, y: p.y + sens.y * f });
  for (let i = 0; i < carreaux; i++) {
    const a = geo.pointBord(0, -geo.demiLargeur + i * taille);
    const b = geo.pointBord(0, -geo.demiLargeur + (i + 1) * taille);
    for (let rangee = 0; rangee < 2; rangee++) {
      const avant = rangee * taille;
      const apres = (rangee + 1) * taille;
      const coins = [decaler(a, avant), decaler(b, avant), decaler(b, apres), decaler(a, apres)];
      creerSvg('polygon', { points: enPoints(coins), fill: (i + rangee) % 2 === 0 ? '#f4f4f4' : '#111' }, damier);
    }
  }

  // Étiquettes des virages, à l'extérieur de la courbe.
  for (const { virage: v, x: ex, y: ey } of geo.etiquettes) {
    const texte = creerSvg('text', { class: 'etiquette-virage', x: ex, y: ey }, svg);
    texte.textContent = `${v.nom} · `;
    const arrets = creerSvg('tspan', { class: 'arrets' }, texte);
    arrets.textContent = `${v.arrets} arrêt${v.arrets > 1 ? 's' : ''}`;
  }

  // Numéros de colonnes, côté intérieur (pratique pour comparer avec le terminal).
  for (let colonne = 0; colonne < piste.longueur; colonne += 6) {
    const p = geo.pointHorsPiste(colonne, geo.demiLargeur + 0.35);
    creerSvg('text', { class: 'numero-colonne', x: p.x, y: p.y }, svg).textContent = colonne;
  }

  return creerSvg('g', { class: 'voitures' }, svg);
}
