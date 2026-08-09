# Etat officiel de la roadmap

Derniere mise a jour: 2026-08-09  
Responsable: `project-manager`

## Phase active

`PHASE-02` — `ACTIVE` (`CYCLE-20260809-05`)

## Tableau global

| Phase | Etat | Progression | Gate | Preuves | Blocage |
|---:|---|---:|---|---|---|
| 00 | DONE | 100% | **PASS** | `docs/project-management/cycles/CYCLE-20260809-02.md`, acceptation utilisateur du 2026-08-09 | aucun |
| 01 | DONE | 100% | **PASS** | `docs/project-management/cycles/CYCLE-20260809-03.md`, CI `31328840492` et `31329298017` | aucun |
| 02 | ACTIVE | 40% | **PENDING** | `CYCLE-20260809-04`, ADR-0002 `Accepted-for-spike`, revue securite r2, CI `31335758078` | aucun pour le prochain lot; preuves audio/ASR/OS, materiel macOS et sessions Linux encore requises pour fermer le gate |
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
| 2026-08-09 | Fusion des cinq PR PHASE-00 dans `develop` et ouverture de PHASE-01 | project-manager | PR #1 a #5 fusionnees; `docs/project-management/cycles/CYCLE-20260809-03.md` |
| 2026-08-09 | Cloture `COMPLETE` de PHASE-01 apres correction multiplateforme et deux matrices CI vertes | project-manager | PR #7 a #11; runs `31328840492` et `31329298017`; `docs/project-management/cycles/CYCLE-20260809-03.md` |
| 2026-08-09 | Ouverture du cycle contracts-first de PHASE-02 | project-manager | `docs/project-management/cycles/CYCLE-20260809-04.md` |
| 2026-08-09 | Cloture `COMPLETE` du cycle contracts-first apres remediation et re-review securite r2 | project-manager | PR #13 a #17; `develop@18520033`; run `31335758078` SUCCESS x3 |
| 2026-08-09 | Passage d'ADR-0002 a `Accepted-for-spike` et ouverture des fondations executables | project-manager + product-architect | `docs/architecture/ADR-0002-MODULAR-RUNTIME.md`, `docs/project-management/cycles/CYCLE-20260809-05.md` |

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

## Evaluation du Gate 01

| Critere | Verdict | Preuve ou blocage |
|---|---|---|
| Clone propre vers build reussi avec instructions seules | PASS | checkout CI, toolchains verrouillees, `pnpm install --frozen-lockfile`, lint, tests, checks et build sur les trois OS |
| CI verte sur les trois familles d'OS | PASS | PR run `31328840492` puis push `develop` run `31329298017`, tous deux SUCCESS x3 |
| Aucun secret ou chemin utilisateur dans le depot | PASS | scans de l'union et revue supply chain: zero `.env`, credential ou chemin personnel suivi |
| Frontend et Rust echangent une commande IPC typee de smoke test | PASS | `health_check` sans requete, reponse `{status:"ok",version:string}`; tests TypeScript et Rust 2/2 |
| Worktrees agents sans conflit | PASS | union de 47 fichiers uniques sans overlap d'ownership; integrations Git sans conflit |

## Evaluation du Gate 02

La progression de 40% correspond a deux criteres du gate satisfaits sur cinq.
Elle n'est pas une estimation d'avancement des prototypes. Le Gate 02 reste
`PENDING`: aucune campagne audio, ASR ou plateforme native n'est encore
revendiquee.

| Critere | Verdict | Preuve ou blocage |
|---|---|---|
| Aucun risque critique de faisabilite sans mitigation | PENDING | contrats fail-closed et fallbacks documentes; faisabilite native, materiels et environnements encore non mesures |
| Contrats remplacables pour ASR et plateformes | PASS | cinq ports, machine a etats, taxonomie 58 codes, IPC versionne et revue securite r2 PASS; ADR-0002 `Accepted-for-spike` |
| Callback audio conforme sous stress | NOT_RUN | protocole SPSC/callback et campagnes specifies; aucun harnais executable ni artefact de stress |
| Transcription locale et injection de preuve sur la reference | NOT_RUN | plans ASR/OS specifies; aucun modele, microphone, hotkey ou injection execute dans le cycle contracts-first |
| ADR avec compromis et retours arriere | PASS | ADR-0002 compare les options, borne permissions/egress/IPC et impose rollback + conditions non negociables |

## Mode de mise a jour

- Le manager met a jour ce fichier au debut et a la fin de chaque cycle.
- La progression est basee sur les criteres coches, pas sur une estimation intuitive.
- Toute preuve utilise un chemin de fichier, une commande reproductible ou un lien d'artefact.
- Ne jamais supprimer l'historique; ajouter une ligne au journal.
