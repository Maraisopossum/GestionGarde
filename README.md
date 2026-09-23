# Gestion de garde — maquette

Maquette d'interface web destinée à remplacer le tableau magnétique de garde.
**Toutes les données sont fictives** : le but est de recueillir l'avis des officiers avant un développement complet.

**Démo en ligne :** https://maraisopossum.github.io/GestionGarde/

## Ce que la maquette permet

- **Tableau de garde** : Incendie (départs VO + autopompe, échelles, AMB INC), Ambulances, Véhicules techniques, Coordination.
- **Indicateurs** en en-tête : personnel disponible, véhicules en mission, plongeurs / HAZMAT / RISC / GRIMP disponibles (rouge à 0, orange à 1).
- **Sortir / faire revenir** un véhicule en un clic : l'équipage passe « en mission », les compteurs se mettent à jour.
- **Glisser-déposer** du personnel vers un poste, entre postes (dépôt sur un poste occupé = permutation) ou vers le panneau (= libérer le poste). Les postes incompatibles sont grisés.
- **Clic sur un poste** : sélecteur rapide (utile sur tablette / téléphone).
- **Alertes** : spécialité à 0, dernier spécialiste engagé, équipage incomplet, personne affectée deux fois.
- **Annuler** la dernière action (bouton dans la notification ou `Ctrl+Z`).
- Pages **Personnel**, **Véhicules**, **Spécialités**, **Missions**, **Historique**, **Paramètres** ; fiche individuelle au clic sur une personne.
- **Application installable (PWA)** sur téléphone et tablette, utilisable hors connexion.

Les manipulations sont conservées dans le navigateur ; *Paramètres → Réinitialiser la démo* restaure le scénario de départ.

## Hypothèses à valider

Les règles de qualification sont des hypothèses de travail : N°6 ≥ Sgt, N°5 et chauffeurs = qualification Chauffeur, Plong. 1/2 = spécialité Plongeur, chef d'échelle ≥ Cpl, Adj 1-3 = Adj, fonctions « Sgt … » ≥ Sgt.
Une fonction de coordination peut se cumuler avec un poste véhicule (comme sur le tableau actuel) ; un seul poste véhicule par personne.

## Développement

```bash
npm install
npm run dev      # http://localhost:5173/GestionGarde/
npm run build    # vérification TypeScript + build de production
```

Stack : Vite, React, TypeScript, Tailwind CSS, Zustand, dnd-kit, vite-plugin-pwa.
Le déploiement sur GitHub Pages est automatique à chaque push sur `main` (`.github/workflows/deploy.yml`).
