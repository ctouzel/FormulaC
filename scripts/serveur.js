// Petit serveur web local, sans dépendance, pour jouer dans le navigateur.
// Usage : npm run serveur        puis ouvrir http://localhost:8000
//         npm run serveur -- 3000   (autre port)
//
// Pourquoi un serveur ? Les navigateurs refusent de charger des modules
// JavaScript (import/export) depuis un fichier ouvert en double-clic.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.argv[2] ?? process.env.PORT ?? 8000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer(async (requete, reponse) => {
  let chemin;
  try {
    chemin = decodeURIComponent(new URL(requete.url, 'http://localhost').pathname);
  } catch {
    reponse.writeHead(400).end('Requête invalide');
    return;
  }
  const fichier = resolve(join(racine, chemin === '/' ? 'index.html' : chemin));

  // Sécurité : on ne sert que les fichiers du projet.
  if (fichier !== racine && !fichier.startsWith(racine + sep)) {
    reponse.writeHead(403).end('Interdit');
    return;
  }

  try {
    const contenu = await readFile(fichier);
    reponse.writeHead(200, {
      'Content-Type': TYPES[extname(fichier)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    reponse.end(contenu);
  } catch {
    reponse.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Fichier introuvable');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`FormulaC est prêt : http://localhost:${port}`);
  console.log('Ctrl+C pour arrêter.');
});
