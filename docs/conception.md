# FormulaC — Document de conception

> Document vivant : on le met à jour chaque fois qu'une règle change.
> Les valeurs chiffrées sont des **premiers réglages** ; on les ajustera en jouant.

## 1. Vision

Un jeu de course au tour par tour, joué dans le navigateur, inspiré des jeux de
course sur plateau : on gère sa vitesse avec une boîte de vitesses, on lance un
dé propre à chaque rapport, et on doit freiner à temps avant les virages.

- De 1 à 8 voitures.
- Chaque voiture est pilotée par un **humain** ou par l'**ordinateur**.
- On peut lancer une partie avec **zéro humain** et regarder l'ordinateur jouer.
- Tout se joue sur le même écran (chacun son tour).

## 2. La piste

- La piste est une **grille en boucle** : des **colonnes** (de 0 à
  longueur − 1) et 2 ou 3 **voies** côte à côte. La ligne de départ est avant
  la colonne 0.
- **Un pas** = avancer d'une colonne, en restant dans sa voie ou en diagonale
  vers une voie voisine. On ne change donc que d'une voie par pas.
- Dans un virage, toutes les voies ont la même longueur : prendre la corde ne
  fait pas gagner de cases (modèle simple, choisi pour démarrer).
- **On ne traverse pas une voiture** : une case occupée est infranchissable,
  il faut la contourner par une voie libre. Si on est bloqué, on avance de
  moins que le dé en payant des points de **freins** (voir 5).
- Les **virages** sont des plages de colonnes, avec un nombre d'**arrêts
  requis** (1, 2 ou 3). La **ligne de sortie** est juste après leur dernière
  colonne.
- Une course dure 1 à 3 tours (réglable).

Format d'un fichier de piste (`pistes/*.json`) :

```json
{
  "nom": "Ovale d'essai",
  "voies": 3,
  "longueur": 48,
  "virages": [
    { "nom": "V1", "debut": 12, "fin": 17, "arrets": 2 }
  ]
}
```

## 3. Le tour de jeu

**Départ.** L'ordre de la grille est tiré au hasard (avec la graine de la
partie). Les voitures se placent 2 par rangée derrière la ligne : la 1re sur
la voie extérieure, la 2e sur la voie 0, puis la rangée suivante une colonne
plus loin derrière. Toutes partent en rapport 1. Une course dure **2 tours**
par défaut.

**Ordre de jeu.** Au début de chaque tour de jeu, l'ordre suit le classement :
la voiture la plus avancée joue en premier ; à égalité, celle qui jouait avant
garde son avance. L'ordre ne change pas pendant le tour de jeu.

**Arrivée.** Une voiture qui franchit la ligne au dernier tour est classée
dans l'ordre d'arrivée et quitte la piste. La course se termine quand plus
aucune voiture n'est en course.

**Abandon.** Une voiture éliminée (casse, sortie de piste) est **retirée de la
piste** tout de suite et classée en fin de classement.

À son tour, une voiture :

1. **Choisit son rapport** : elle peut monter d'un seul rapport, rester, ou
   descendre. Descendre de plus d'un rapport coûte des points d'usure (voir 5).
2. **Lance le dé** du rapport choisi.
3. **Avance** d'exactement ce nombre de cases, en choisissant son chemin
   (voies, dépassements).
4. **Résout les effets** : virages, aspiration, collisions.

## 4. La boîte de vitesses

Chaque rapport a son propre dé. Plus le rapport est haut, plus on va loin,
mais moins on contrôle.

| Rapport | Résultats possibles |
|:-------:|:-------------------:|
| 1       | 1 – 2               |
| 2       | 2 – 4               |
| 3       | 3 – 7               |
| 4       | 6 – 11              |
| 5       | 10 – 16             |
| 6       | 15 – 24             |

Chaque résultat d'un dé a la même probabilité. Le jeu utilise un générateur
aléatoire **avec une graine** (seed) : avec la même graine, on rejoue
exactement la même partie. C'est indispensable pour tester et déboguer.

## 5. Les points d'usure

Chaque voiture commence avec une réserve de points (exemple : 18 au total).

| Catégorie   | Points | Sert à…                                                 |
|-------------|:------:|---------------------------------------------------------|
| Pneus       | 6      | Dépasser la ligne de sortie d'un virage sans assez d'arrêts |
| Freins      | 4      | Avancer moins que le résultat du dé (1 point par case)  |
| Boîte       | 4      | Descendre de 2 rapports ou plus d'un coup               |
| Moteur      | 2      | Descendre de 3 rapports ou plus (en plus de la boîte)   |
| Carrosserie | 2      | Encaisser une collision                                 |

Quand une catégorie tombe à 0 et qu'on aurait dû en dépenser encore, la voiture
est **éliminée** (abandon). Tomber pile à 0 n'élimine pas.

**Coût d'une descente de rapports.** Descendre de *n* rapports coûte :

- *n* − 1 points de **boîte** (chaque rapport au-delà du premier) ;
- *n* − 2 points de **moteur**, à partir de 3 rapports (chaque rapport au-delà
  du deuxième).

| Descente | Exemple | Boîte | Moteur |
|:--------:|:-------:|:-----:|:------:|
| 1        | 5 → 4   | 0     | 0      |
| 2        | 5 → 3   | 1     | 0      |
| 3        | 6 → 3   | 2     | 1      |
| 4        | 6 → 2   | 3     | 2      |
| 5        | 6 → 1   | 4     | 3 (élimination avec la réserve de départ) |

Au départ de la course, toutes les voitures sont en rapport 1.

## 6. Les virages

- Pour sortir proprement d'un virage, la voiture doit **terminer son
  déplacement** dans la zone du virage le nombre de fois indiqué (arrêts requis).
- Si elle franchit la ligne de sortie **sans** avoir fait assez d'arrêts :
  - il lui manquait 1 arrêt : elle paie en points de **pneus**, 1 par case
    dépassée au-delà de la ligne ;
  - il lui manquait 2 arrêts ou plus : **sortie de piste**, élimination.
- Un déplacement de 0 case (freinage complet) dans un virage compte aussi
  comme un arrêt.
- Les arrêts ne valent que pour le virage où ils ont été faits.

## 7. L'aspiration

Si une voiture termine son déplacement juste derrière une autre (case
directement devant, même voie), en rapport 4 ou plus, et hors virage :
elle peut avancer de **3 cases bonus**. Ces cases peuvent la faire dépasser.

## 8. Les collisions

À la fin du déplacement, pour chaque voiture adjacente : on lance un dé à
20 faces. Sur un **1**, la voiture perd 1 point de carrosserie.

## 9. L'ordinateur (IA)

Premier niveau d'IA, simple et prudente (`src/moteur/ia.js`) :

- **Rapport** : pour chaque rapport permis, elle essaie *tous* les résultats
  possibles du dé et garde, pour chacun, la meilleure option. Le « pire cas »
  d'un rapport est le coût de son plus mauvais résultat, plus le coût du
  changement de rapport. Elle choisit le pire cas le plus bas ; à égalité, le
  rapport qui avance le plus en moyenne.
- **Déplacement** : l'option qui n'élimine pas, qui coûte le moins de points,
  puis qui va le plus loin.
- Limite connue : elle ne voit qu'un coup à l'avance. Elle arrive parfois trop
  vite à un virage et doit alors dépenser de la boîte pour rétrograder.

Mesure sur 200 courses de 6 voitures (ovale d'essai, 2 tours) : environ 18
tours de jeu par course, aucune élimination, 14 points d'usure restants sur 18
en moyenne.

On rendra l'IA plus fine plus tard (prise de risque, aspiration, etc.).

## 10. Questions ouvertes

On décidera en jouant :

- Combien de voies par défaut ? (2 ou 3)
- Faut-il des arrêts au stand pour récupérer des points ?
- Faut-il de la météo ?
- Le pilote joue-t-il contre le temps (contre-la-montre) en solo ?
