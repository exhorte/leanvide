# Etat officiel de la roadmap

Derniere mise a jour: 2026-08-09  
Responsable: `project-manager`

## Phase active

`PHASE-00` — `READY`

## Tableau global

| Phase | Etat | Progression | Gate | Preuves | Blocage |
|---:|---|---:|---|---|---|
| 00 | READY | 0% | non evalue | aucune | aucun |
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

## Mode de mise a jour

- Le manager met a jour ce fichier au debut et a la fin de chaque cycle.
- La progression est basee sur les criteres coches, pas sur une estimation intuitive.
- Toute preuve utilise un chemin de fichier, une commande reproductible ou un lien d'artefact.
- Ne jamais supprimer l'historique; ajouter une ligne au journal.
