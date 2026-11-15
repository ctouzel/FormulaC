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

## Étape 2 — La piste

- [ ] Format de données d'une piste (fichier JSON)
- [ ] Une petite piste ovale de test avec 2 virages
- [ ] Calcul des déplacements possibles (chemins, changements de voie, cases occupées)

**Résultat :** on peut demander « où peut aller cette voiture avec un 7 ? ».

## Étape 3 — Une course complète dans le terminal

- [ ] Virages et arrêts requis
- [ ] Ordre de jeu, tours de piste, arrivée
- [ ] IA de base
- [ ] Un script qui fait courir 4 voitures IA et affiche le résultat

**Résultat :** on regarde une course entière se dérouler en texte.

## Étape 4 — Le navigateur

- [ ] Page web qui dessine la piste et les voitures
- [ ] Animation des tours de l'IA
- [ ] Écran de départ : nombre de voitures, humain ou ordinateur pour chacune

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
