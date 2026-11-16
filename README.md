# FormulaC

Un jeu de course au tour par tour, joué dans le navigateur.
Gère ta boîte de vitesses, lance les dés, et freine à temps avant les virages.

- Règles du jeu : [docs/conception.md](docs/conception.md)
- Avancement : [docs/feuille-de-route.md](docs/feuille-de-route.md)

## Jouer

Il faut [Node.js](https://nodejs.org) 20 ou plus récent. Aucune installation de
paquets n'est nécessaire.

```bash
npm run serveur
```

Puis ouvrir <http://localhost:8000> dans le navigateur.

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm test` | Lance tous les tests automatiques |
| `npm run serveur` | Démarre le jeu sur http://localhost:8000 |
| `npm run course -- 2026 4 2` | Raconte une course IA dans le terminal (graine, voitures, tours) |
| `npm run piste -- 8 1 7 10:1` | Montre les arrivées possibles d'une voiture |
| `npm run demo -- 2026` | Montre la répartition des dés |

## Organisation du code

- `src/moteur/` : les règles du jeu, en JavaScript pur (testé avec `npm test`).
- `src/interface/` : l'affichage dans le navigateur. Aucune règle ici.
- `pistes/` : les pistes, au format JSON.
- `scripts/` : les petits outils en ligne de commande.
- `tests/` : les tests automatiques.
