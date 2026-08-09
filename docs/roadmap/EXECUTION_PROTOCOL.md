# Protocole d'execution et de suivi

## 1. Ouverture d'une phase

Le manager:

1. verifie que les dependances sont `DONE`;
2. relit les risques et ADR applicables;
3. transforme les livrables en epics et tranches verticales;
4. affecte un proprietaire unique a chaque zone de fichiers;
5. renseigne objectif, baseline, criteres et preuves attendues dans `STATUS.md`;
6. passe la phase de `READY` a `ACTIVE`.

## 2. Cycle d'implementation

Chaque cycle est borne a un resultat demonstrable:

- identifiant: `CYCLE-YYYYMMDD-NN`;
- phase et objectif uniques;
- entrees et dependances;
- agents actifs, modele et chemins possedes;
- criteres d'acceptation mesurables;
- budget de tours ou temps;
- commandes de validation;
- risques et plan de retour arriere.

Le manager active 3 a 5 agents au maximum et attend leurs livrables avant integration.

## 3. Rapport obligatoire

Copier `docs/project-management/templates/CYCLE_TEMPLATE.md` vers `docs/project-management/cycles/CYCLE-YYYYMMDD-NN.md`, puis renseigner:

- objectif et statut;
- modifications par agent;
- fichiers et contrats affectes;
- tests, mesures et resultats;
- erreurs, decisions et dettes;
- mise a jour des risques;
- prochaine action autorisee.

Un cycle sans rapport est incomplet.

## 4. Gate de phase

Le manager organise quatre controles:

1. **Produit**: criteres et parcours fonctionnels.
2. **Technique**: architecture, tests et performance.
3. **Securite/confidentialite**: permissions, secrets et flux de donnees.
4. **Operationnel**: build reproductible, diagnostic et retour arriere.

Chaque controle est `PASS`, `FAIL` ou `WAIVED`. Un `WAIVED` exige un ADR, un responsable et une echeance.

## 5. Cloture

La phase passe `DONE` uniquement apres:

- validation de toutes les preuves;
- mise a jour de `STATUS.md` et `RISKS.md`;
- consolidation des memoires d'agents;
- rapport final de phase;
- identification des prerequis de la phase suivante.

## 6. Blocage et changement de plan

- Apres trois echecs sur le meme obstacle: statut `BLOCKED` et demande d'arbitrage.
- Un changement de stack, de perimetre ou de gate exige un ADR.
- Une phase peut etre `SKIPPED` uniquement sur decision utilisateur documentee.
- Aucun agent ne relance automatiquement une boucle terminee.

