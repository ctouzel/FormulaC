# FormulaC — instructions pour Claude

## Le projet

Jeu de course au tour par tour dans le navigateur (boîte de vitesses, dés,
virages, points d'usure). Règles : `docs/conception.md`. Avancement :
`docs/feuille-de-route.md`.

C'est un jeu **original** : noms, pistes, valeurs et visuels sont les nôtres.

## Le propriétaire apprend

Christian a un niveau intermédiaire en programmation, et c'est son premier vrai
projet avec Claude Code. Donc :

- Communiquer en **français**.
- Avancer par **petites étapes** ; en fin d'étape, dire ce qui a été fait,
  pourquoi, et comment le vérifier soi-même.
- Expliquer les choix techniques en une ou deux phrases, sans jargon inutile.
- Proposer une suggestion pour la suite, sans la faire sans accord.

## Technique

- JavaScript moderne (modules ES), **aucune dépendance** tant que possible.
- Tests : le lanceur intégré de Node (`node --test`), via `npm test`.
- Le **moteur de règles** (`src/moteur/`) est du code pur : pas de DOM, pas
  d'affichage, pas de `Math.random()`. Tout l'aléatoire passe par le générateur
  avec graine. L'affichage (`src/interface/`) lit l'état du moteur, il ne
  contient aucune règle.
- Chaque règle ajoutée au moteur vient avec ses tests.
- Noms de variables et de fonctions en français, sans accents
  (`choisirRapport`, `pointsUsure`).

## Après chaque changement

1. `npm test` doit passer.
2. Mettre à jour `docs/conception.md` si une règle a changé, et cocher la
   feuille de route.
3. Faire un commit avec un message clair en français.
