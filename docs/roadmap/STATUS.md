# Etat officiel de la roadmap

Derniere mise a jour: 2026-08-09  
Responsable: `project-manager`

## Phase active

Aucune phase `ACTIVE`. `PHASE-00` est `DONE`; `PHASE-01` est `READY` mais n'est pas demarree.

## Tableau global

| Phase | Etat | Progression | Gate | Preuves | Blocage |
|---:|---|---:|---|---|---|
| 00 | DONE | 100% | **PASS** | `docs/project-management/cycles/CYCLE-20260809-02.md`, acceptation utilisateur du 2026-08-09 | aucun |
| 01 | READY | 0% | entree autorisee; Gate 01 non evalue | Gate 00 PASS | attend un objectif et un cycle explicites |
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
| 2026-08-09 | Acceptation explicite de D-01 a D-14 et ouverture du cycle de reevaluation du Gate 00 | utilisateur + project-manager | `docs/project-management/cycles/CYCLE-20260809-02.md` |
| 2026-08-09 | Cloture `COMPLETE` de PHASE-00 apres propagation, revue croisee et validation d'union | project-manager | `docs/project-management/cycles/CYCLE-20260809-02.md` |

## Evaluation du Gate 00

La progression de 100% correspond aux six criteres du gate satisfaits sur six; elle n'est pas une estimation intuitive. Les performances restent a mesurer: le Gate 00 valide leur cible et leur methode, pas les resultats des prototypes.

| Critere | Verdict | Preuve ou blocage |
|---|---|---|
| MVP compris sans ambiguite par chaque lead | PASS | D-01 a D-14 confirmees dans `docs/project-management/PHASE-00-PRODUCT-DECISIONS.md`; vision, PRD, architecture, securite et QA alignees |
| Metriques critiques avec cible et methode | PASS | `docs/quality/PERFORMANCE-BUDGETS.md`, `docs/quality/MEASUREMENT-PLAN.md` dans la draft PR #4 |
| Plateforme de reference et materiel identifies | PASS | macOS Apple Silicon et MacBook Air M2 16 Gio proposes si disponibles; Windows `HW-WIN` comme reference pratique a defaut; minimum provisoire D-06 documente dans `docs/quality/PERFORMANCE-BUDGETS.md` |
| Flux local/Cloud cartographies | PASS | `docs/security/DATA-FLOWS.md` dans la draft PR #3 |
| Risques critiques avec proprietaire | PASS | `docs/security/THREAT-MODEL-V0.md` et `docs/roadmap/RISKS.md` |
| Decision utilisateur sur les choix bloquants | PASS | acceptation explicite « J’accepte D-01 à D-14 telles que recommandées. » recue le 2026-08-09 |

## Mode de mise a jour

- Le manager met a jour ce fichier au debut et a la fin de chaque cycle.
- La progression est basee sur les criteres coches, pas sur une estimation intuitive.
- Toute preuve utilise un chemin de fichier, une commande reproductible ou un lien d'artefact.
- Ne jamais supprimer l'historique; ajouter une ligne au journal.
