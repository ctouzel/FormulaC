# Feuille de route

On avance par petites étapes. Chaque étape donne quelque chose qu'on peut
**voir ou tester**, et elle finit par un commit.

## Étape 0 — Fondations ✅

- [x] Document de conception (`docs/conception.md`)
- [x] Feuille de route (ce fichier)
- [x] `CLAUDE.md` : les règles du projet pour Claude

## Étape 1 — Le moteur de règles, sans graphismes ✅

- [x] Squelette du projet (`package.json`, dossiers `src/` et `tests/`)
- [x] Générateur aléatoire avec graine
- [x] Les dés de la boîte de vitesses
- [x] Les changements de rapport et leur coût en usure
- [x] Tests automatiques pour tout ça
- [x] Bonus : `npm run demo` affiche la répartition de chaque dé

**Résultat :** `npm test` passe au vert.

## Étape 2 — La piste ✅

- [x] Format de données d'une piste (fichier JSON), avec vérification
- [x] Une petite piste ovale de test avec 2 virages (`pistes/ovale-essai.json`)
- [x] Calcul des déplacements possibles (chemins, changements de voie, cases occupées, freinage)
- [x] Bonus : `npm run piste` dessine les arrivées possibles dans le terminal

**Résultat :** on peut demander « où peut aller cette voiture avec un 7 ? ».

## Étape 3 — Une course complète dans le terminal ✅

- [x] Virages et arrêts requis (`src/moteur/virages.js`)
- [x] Grille, ordre de jeu, tours de piste, arrivée, abandons (`src/moteur/course.js`)
- [x] IA de base (`src/moteur/ia.js`)
- [x] Un script qui fait courir des voitures IA et raconte la course (`npm run course`)

**Résultat :** on regarde une course entière se dérouler en texte.

## Étape 4 — Le navigateur ✅

- [x] Page web qui dessine la piste et les voitures (SVG, forme calculée depuis le JSON)
- [x] Animation des tours de l'IA (lecture, pause, coup par coup, 4 vitesses)
- [x] Écran de départ : nombre de voitures, tours, graine, nom de chaque voiture
- [ ] Choix humain / ordinateur : présent mais désactivé, il s'active à l'étape 5
- [x] Petit serveur local sans dépendance (`npm run serveur`)

**Résultat :** on regarde une course dans le navigateur.

## Étape 5 — Jouer en humain

- [ ] Choisir son rapport en cliquant
- [ ] Voir les cases atteignables et choisir son chemin
- [ ] Panneau des points d'usure

**Résultat :** la première vraie partie jouable.

## Étape 6 — Aspiration, collisions, finitions

- [ ] Aspiration
- [ ] Collisions
- [ ] Journal de la course, classement final
- [ ] Mise en ligne (GitHub Pages)

## Plus tard

- IA plus fine, éditeur de pistes, météo, arrêts au stand, sons.
