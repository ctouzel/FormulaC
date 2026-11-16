// L'application dans le navigateur : écran de départ, piste, animation de la
// course, classement et journal.
//
// Rappel : aucune règle ici. On appelle le moteur (src/moteur/) et on affiche
// ce qu'il renvoie.

import { validerPiste } from '../moteur/piste.js';
import {
  creerCourse,
  choisirRapport,
  jouerOption,
  optionsDuCoup,
  voitureActive,
  classement,
  tourDePiste,
  voitureParId,
  VOITURES_MAX,
} from '../moteur/course.js';
import { choisirRapportIA, meilleureOption } from '../moteur/ia.js';
import { calculerGeometrie } from './geometrie.js';
import { creerSvg, dessinerPiste } from './dessin-piste.js';

const FICHIER_PISTE = 'pistes/ovale-essai.json';

const COULEURS = [
  { nom: 'Rouge', fond: '#e53935', texte: '#fff' },
  { nom: 'Bleu', fond: '#1e88e5', texte: '#fff' },
  { nom: 'Vert', fond: '#43a047', texte: '#fff' },
  { nom: 'Jaune', fond: '#fdd835', texte: '#111' },
  { nom: 'Orange', fond: '#fb8c00', texte: '#111' },
  { nom: 'Violet', fond: '#8e24aa', texte: '#fff' },
  { nom: 'Blanc', fond: '#f5f5f5', texte: '#111' },
  { nom: 'Noir', fond: '#263238', texte: '#fff' },
];

// Durées (ms) : un pas d'animation, et la pause entre deux coups.
const VITESSES = {
  lente: { pas: 220, pause: 900 },
  normale: { pas: 110, pause: 450 },
  rapide: { pas: 45, pause: 150 },
  eclair: { pas: 0, pause: 0 },
};

const $ = (id) => document.getElementById(id);
const attendre = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));
const ordinal = (n) => (n === 1 ? '1re' : `${n}e`);

// ---------------------------------------------------------------------------
// État de l'application

const app = {
  piste: null,
  geo: null,
  etat: null, // l'état de la course, renvoyé par le moteur
  couleurs: new Map(), // id de voiture → couleur
  groupeVoitures: null,
  elementsVoitures: new Map(), // id → <g> SVG
  enLecture: false,
  coupEnCours: false,
};

const vitesse = () => VITESSES[$('vitesse').value];

// ---------------------------------------------------------------------------
// Voitures sur la piste

function placerVoiture(id, position) {
  let g = app.elementsVoitures.get(id);
  if (!g) {
    const couleur = app.couleurs.get(id);
    g = creerSvg('g', { class: 'voiture' }, app.groupeVoitures);
    creerSvg('circle', { r: 0.3, fill: couleur.fond }, g);
    creerSvg('text', { fill: couleur.texte }, g).textContent = voitureParId(app.etat, id).nom.slice(0, 2);
    app.elementsVoitures.set(id, g);
  }
  const { x, y } = app.geo.centreCase(position.distance, position.voie);
  g.style.transform = `translate(${x}px, ${y}px)`;
}

function retirerVoiture(id) {
  app.elementsVoitures.get(id)?.remove();
  app.elementsVoitures.delete(id);
}

/** Met les voitures à jour d'après l'état (sans animation). */
function synchroniserVoitures() {
  const active = voitureActive(app.etat);
  for (const v of app.etat.voitures) {
    if (v.statut !== 'en course') {
      retirerVoiture(v.id);
      continue;
    }
    placerVoiture(v.id, v.position);
    app.elementsVoitures.get(v.id).classList.toggle('active', v.id === active?.id);
  }
}

/** Fait avancer une voiture case par case le long de son chemin. */
async function animerChemin(id, chemin) {
  const { pas } = vitesse();
  const g = app.elementsVoitures.get(id);
  g.style.setProperty('--duree-pas', `${pas}ms`);
  for (const position of chemin) {
    placerVoiture(id, position);
    if (pas > 0) await attendre(pas);
  }
}

// ---------------------------------------------------------------------------
// Panneau : coup en cours, classement, journal

function afficherCoup(voiture, rapport, de, texte) {
  const zone = $('coup-en-cours');
  if (!voiture) {
    zone.replaceChildren();
    return;
  }
  const couleur = app.couleurs.get(voiture.id);
  zone.innerHTML = `
    <div class="de" style="background:${couleur.fond};color:${couleur.texte}">${de ?? '…'}</div>
    <div class="details">
      <strong></strong>
      <small></small>
    </div>`;
  zone.querySelector('strong').textContent = `${voiture.nom} — ${ordinal(rapport)} rapport`;
  zone.querySelector('small').textContent = texte;
}

function afficherClassement() {
  const { etat } = app;
  const active = voitureActive(etat);
  const table = $('classement');
  table.replaceChildren();

  classement(etat).forEach((v, i) => {
    const ligne = table.insertRow();
    if (v.id === active?.id) ligne.classList.add('active');

    const rang = ligne.insertCell();
    rang.className = 'rang';
    rang.textContent = v.statut === 'eliminee' ? '—' : i + 1;

    const nom = ligne.insertCell();
    const div = document.createElement('div');
    div.className = 'nom';
    const pastille = document.createElement('span');
    pastille.className = 'pastille';
    pastille.style.background = app.couleurs.get(v.id).fond;
    div.append(pastille, v.nom);
    nom.append(div);

    const etatVoiture = ligne.insertCell();
    if (v.statut === 'arrivee') etatVoiture.textContent = '🏁';
    else if (v.statut === 'eliminee') etatVoiture.textContent = '💥';
    else etatVoiture.textContent = `${ordinal(v.rapport)} · T${Math.min(tourDePiste(etat, v), etat.tours)}/${etat.tours}`;

    const usure = ligne.insertCell();
    const blocs = document.createElement('div');
    blocs.className = 'usure';
    for (const [lettre, cle] of [['P', 'pneus'], ['F', 'freins'], ['B', 'boite'], ['M', 'moteur'], ['C', 'carrosserie']]) {
      const s = document.createElement('span');
      s.textContent = `${lettre}${v.usure[cle]}`;
      s.title = `${cle} : ${v.usure[cle]}`;
      if (v.usure[cle] === 0) s.classList.add('bas');
      blocs.append(s);
    }
    usure.append(blocs);
  });
}

function noterJournal(texte, important = false) {
  const li = document.createElement('li');
  li.textContent = texte;
  if (important) li.classList.add('important');
  $('journal').prepend(li);
}

function texteCout(cout) {
  return Object.entries(cout)
    .map(([categorie, n]) => `−${n} ${categorie}`)
    .join(', ');
}

/** Raconte dans le journal les événements ajoutés depuis l'index donné. */
function raconter(depuis) {
  for (const e of app.etat.journal.slice(depuis)) {
    const nom = voitureParId(app.etat, e.id).nom;
    if (e.type === 'coup') {
      const cout = texteCout(e.cout);
      noterJournal(`T${e.tourDeJeu} · ${nom} : ${ordinal(e.rapport)}, dé ${e.de}, ${e.cases} case(s)${cout ? ` (${cout})` : ''}`);
    } else if (e.type === 'arrivee') {
      noterJournal(`🏁 ${nom} termine ${ordinal(e.rang)} !`, true);
    } else if (e.type === 'abandon') {
      noterJournal(`💥 ${nom} abandonne : ${e.raison}`, true);
    }
  }
}

function mettreAJourBoutons() {
  const fini = app.etat?.terminee;
  $('btn-lecture').textContent = app.enLecture ? '⏸ Pause' : '▶ Lecture';
  $('btn-lecture').disabled = !app.etat || fini;
  $('btn-coup').disabled = !app.etat || fini || app.enLecture || app.coupEnCours;
  $('sous-titre').textContent = app.etat
    ? `${app.piste.nom} · ${app.etat.tours} tour(s) · graine ${app.etat.graine} · tour de jeu ${app.etat.tourDeJeu}`
    : app.piste?.nom ?? '';
}

// ---------------------------------------------------------------------------
// Déroulement de la course

/** Joue le coup de la voiture active, avec animation. */
async function jouerUnCoup() {
  if (!app.etat || app.etat.terminee || app.coupEnCours) return;
  app.coupEnCours = true;
  mettreAJourBoutons();

  const debutJournal = app.etat.journal.length;
  const voiture = voitureActive(app.etat);
  const rapport = choisirRapportIA(app.etat);
  app.etat = choisirRapport(app.etat, rapport);

  if (app.etat.coup.etape === 'deplacement') {
    const option = meilleureOption(optionsDuCoup(app.etat));
    const cout = texteCout(option.cout);
    afficherCoup(voiture, rapport, app.etat.coup.resultat, `Avance de ${option.cases} case(s)${cout ? ` · ${cout}` : ''}`);
    await animerChemin(voiture.id, option.chemin);
    app.etat = jouerOption(app.etat, option);
  } else {
    afficherCoup(voiture, rapport, '💥', 'Casse en rétrogradant');
  }

  raconter(debutJournal);
  synchroniserVoitures();
  afficherClassement();
  app.coupEnCours = false;
  mettreAJourBoutons();

  if (app.etat.terminee) {
    app.enLecture = false;
    mettreAJourBoutons();
    afficherFin();
  }
}

async function lecture() {
  app.enLecture = !app.enLecture;
  mettreAJourBoutons();
  while (app.enLecture && !app.etat.terminee) {
    await jouerUnCoup();
    await attendre(vitesse().pause);
  }
}

function demarrerCourse({ voitures, tours, graine }) {
  app.enLecture = false;
  app.couleurs = new Map(voitures.map((v, i) => [v.id, COULEURS[i]]));
  app.etat = creerCourse({ piste: app.piste, voitures, tours, graine });
  app.groupeVoitures = dessinerPiste($('piste'), app.piste, app.geo);
  app.elementsVoitures = new Map();
  $('journal').replaceChildren();
  noterJournal(`Départ ! Grille : ${app.etat.ordre.map((id) => voitureParId(app.etat, id).nom).join(', ')}`, true);
  afficherCoup(null);
  synchroniserVoitures();
  afficherClassement();
  mettreAJourBoutons();
}

// ---------------------------------------------------------------------------
// Écrans de départ et d'arrivée

function graineAuHasard() {
  return Math.floor(Math.random() * 100000);
}

function remplirListeVoitures() {
  const nombre = Number($('nb-voitures').value);
  const liste = $('liste-voitures');
  const nomsActuels = [...liste.querySelectorAll('input[type="text"]')].map((i) => i.value);
  liste.replaceChildren();
  for (let i = 0; i < nombre; i++) {
    const li = document.createElement('li');
    const pastille = document.createElement('span');
    pastille.className = 'pastille';
    pastille.style.background = COULEURS[i].fond;
    const nom = document.createElement('input');
    nom.type = 'text';
    nom.maxLength = 14;
    nom.value = nomsActuels[i] ?? COULEURS[i].nom;
    nom.setAttribute('aria-label', `Nom de la voiture ${i + 1}`);
    const pilote = document.createElement('select');
    pilote.setAttribute('aria-label', `Pilote de la voiture ${i + 1}`);
    pilote.innerHTML = '<option value="ia">Ordinateur</option><option value="humain" disabled>Humain (bientôt)</option>';
    li.append(pastille, nom, pilote);
    liste.append(li);
  }
}

function ouvrirDepart() {
  app.enLecture = false;
  mettreAJourBoutons();
  $('graine').value = graineAuHasard();
  $('ecran-depart').showModal();
}

function lireDepart() {
  const voitures = [...$('liste-voitures').children].map((li, i) => {
    const nom = li.querySelector('input').value.trim() || COULEURS[i].nom;
    return { id: `v${i + 1}`, nom, pilote: li.querySelector('select').value };
  });
  const graine = Number.parseInt($('graine').value, 10);
  return {
    voitures,
    tours: Number($('nb-tours').value),
    graine: Number.isInteger(graine) ? graine : graineAuHasard(),
  };
}

function afficherFin() {
  const liste = $('resultats');
  liste.replaceChildren();
  for (const v of classement(app.etat)) {
    const li = document.createElement('li');
    li.textContent = v.statut === 'arrivee' ? v.nom : `${v.nom} — abandon`;
    liste.append(li);
  }
  $('ecran-fin').showModal();
}

// ---------------------------------------------------------------------------
// Démarrage

async function initialiser() {
  const reponse = await fetch(FICHIER_PISTE);
  app.piste = validerPiste(await reponse.json());
  app.geo = calculerGeometrie(app.piste);
  dessinerPiste($('piste'), app.piste, app.geo);

  const choixNombre = $('nb-voitures');
  for (let n = 1; n <= VOITURES_MAX; n++) choixNombre.add(new Option(n, n, false, n === 4));
  choixNombre.addEventListener('change', remplirListeVoitures);
  remplirListeVoitures();

  $('btn-graine').addEventListener('click', () => ($('graine').value = graineAuHasard()));
  $('form-depart').addEventListener('submit', () => demarrerCourse(lireDepart()));
  $('btn-lecture').addEventListener('click', lecture);
  $('btn-coup').addEventListener('click', jouerUnCoup);
  $('btn-nouvelle').addEventListener('click', ouvrirDepart);
  $('btn-revoir').addEventListener('click', () => $('ecran-fin').close());
  $('btn-rejouer').addEventListener('click', () => {
    $('ecran-fin').close();
    ouvrirDepart();
  });

  mettreAJourBoutons();
  ouvrirDepart();
}

initialiser().catch((erreur) => {
  console.error(erreur);
  $('sous-titre').textContent = `Erreur au chargement : ${erreur.message}`;
});
