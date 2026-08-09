# Protocole de cycle

Chaque cycle suit cette sequence bornee:

1. **Observer**: lire l'etat du depot, les memoires et les resultats du cycle precedent.
2. **Choisir**: definir un seul increment vertical livrable et ses non-objectifs.
3. **Classifier**: noter chaque lot D0-D3 avec `docs/project-management/MODEL_ROUTING.md` et choisir modele/effort.
4. **Contracter**: figer les contrats partages, proprietaires de fichiers et criteres d'acceptation.
5. **Deleguer**: activer 3 a 5 agents maximum sur des lots independants.
6. **Synchroniser**: chaque lead rapporte avancement, blocages, fichiers touches et preuves de test.
7. **Integrer**: le manager attend les agents, resout les dependances et lance la verification globale.
8. **Revoir**: QA et securite examinent le diff integre selon le risque.
9. **Documenter**: le manager ecrit `docs/project-management/cycles/CYCLE-YYYYMMDD-NN.md` depuis le modele officiel et met a jour `docs/roadmap/STATUS.md`.
10. **Memoriser**: chaque agent met a jour son `MEMORY.md` avec les apprentissages stables.
11. **Arreter**: le cycle finit par `complete`, `blocked` ou `failed`. Aucun redemarrage automatique silencieux.

Les commits et pushes suivent obligatoirement `docs/project-management/GIT_WORKFLOW.md`. Le rapport de cycle doit indiquer branche, commit, push et pull request.

## Definition of Done

- criteres d'acceptation satisfaits;
- tests pertinents passes;
- aucun secret ou donnee sensible introduit;
- contrats et documentation synchronises;
- regressions connues et dette documentees;
- rapport indiquant fichiers, commandes, resultats et prochain objectif recommande.

## Conditions d'arret obligatoires

- trois tentatives echouent sur le meme blocage;
- une decision produit ou permission utilisateur manque;
- deux agents doivent modifier le meme fichier sans contrat prealable;
- le budget de tours du cycle est atteint;
- les tests de securite ou d'integrite echouent.
