# Etat officiel de la roadmap

Derniere mise a jour: 2026-08-09  
Responsable: `project-manager`

## Phase active

`PHASE-00` — `ACTIVE` (`GATE 00 BLOCKED`)

## Tableau global

| Phase | Etat | Progression | Gate | Preuves | Blocage |
|---:|---|---:|---|---|---|
| 00 | ACTIVE | 50% | BLOCKED | `docs/project-management/cycles/CYCLE-20260809-01.md`, draft PR #1 a #5 | D-01 a D-14 a confirmer |
| 01 | NOT_STARTED | 0% | verrouille | aucune | depend de 00 |
| 02 | NOT_STARTED | 0% | verrouille | aucune | depend de 00-01 |
| 03 | NOT_STARTED | 0% | verrouille | aucune | depend de 01-02 |
| 04 | NOT_STARTED | 0% | verrouille | aucune | depend de 01-02 |
| 05 | NOT_STARTED | 0% | verrouille | aucune | depend de 04 |
| 06 | NOT_STARTED | 0% | verrouille | aucune | depend de 03-05 |
| 07 | NOT_STARTED | 0% | verrouille | aucune | depend de 03-05 |
| 08 | NOT_STARTED | 0% | verrouille | aucune | depend de 03-05 |
| 09 | NOT_STARTED | 0% | verrouille | aucune | depend de 03-08 |
| 10 | NOT_STARTED | 0% | verrouille | aucune | depend de 04-09 |
| 11 | NOT_STARTED | 0% | verrouille | aucune | depend de 09-10 |
| 12 | NOT_STARTED | 0% | verrouille | aucune | depend de 03-11 |
| 13 | NOT_STARTED | 0% | verrouille | aucune | depend de 12 |
| 14 | NOT_STARTED | 0% | verrouille | aucune | depend de 13 |

## Journal des changements

| Date | Changement | Auteur | Preuve |
|---|---|---|---|
| 2026-08-09 | Creation de la roadmap complete | project-manager/configuration | `docs/roadmap/` |
| 2026-08-09 | Ajout de Codex et du routage D0-D3 commun | project-manager/configuration | `AGENTS.md`, `.codex/`, `docs/project-management/MODEL_ROUTING.md` |
| 2026-08-09 | Ajout du workflow GitHub, branches de domaine, hooks et worktrees | project-manager/configuration | `docs/project-management/GIT_WORKFLOW.md`, `.githooks/`, `scripts/agent-worktree.ps1` |
| 2026-08-09 | Ouverture du premier cycle controle de PHASE-00 | project-manager | `docs/project-management/cycles/CYCLE-20260809-01.md` |
| 2026-08-09 | Cloture `BLOCKED` de CYCLE-20260809-01 apres livraison des travaux independants | project-manager | draft PR [#1](https://github.com/exhorte/leanvide/pull/1), [#2](https://github.com/exhorte/leanvide/pull/2), [#3](https://github.com/exhorte/leanvide/pull/3), [#4](https://github.com/exhorte/leanvide/pull/4), [#5](https://github.com/exhorte/leanvide/pull/5) |

## Evaluation du Gate 00

La progression de 50% correspond a trois criteres de gate satisfaits sur six; elle n'est pas une estimation intuitive.

| Critere | Verdict | Preuve ou blocage |
|---|---|---|
| MVP compris sans ambiguite par chaque lead | BLOCKED | recommandations consolidees, mais D-01 a D-14 non confirmees dans `docs/project-management/PHASE-00-PRODUCT-DECISIONS.md` |
| Metriques critiques avec cible et methode | PASS | `docs/quality/PERFORMANCE-BUDGETS.md`, `docs/quality/MEASUREMENT-PLAN.md` dans la draft PR #4 |
| Plateforme de reference et materiel identifies | BLOCKED | candidats documentes, choix D-03/D-06 non confirme |
| Flux local/Cloud cartographies | PASS | `docs/security/DATA-FLOWS.md` dans la draft PR #3 |
| Risques critiques avec proprietaire | PASS | `docs/security/THREAT-MODEL-V0.md` et `docs/roadmap/RISKS.md` |
| Decision utilisateur sur les choix bloquants | BLOCKED | reponse attendue sur D-01 a D-14 |

## Mode de mise a jour

- Le manager met a jour ce fichier au debut et a la fin de chaque cycle.
- La progression est basee sur les criteres coches, pas sur une estimation intuitive.
- Toute preuve utilise un chemin de fichier, une commande reproductible ou un lien d'artefact.
- Ne jamais supprimer l'historique; ajouter une ligne au journal.
