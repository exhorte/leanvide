# Roadmap directrice de Fluent

Ce dossier est la source de verite du projet, du cadrage au suivi post-lancement. Il est normatif pour le `project-manager` et tous les leads.

## Objectif produit

Livrer une application de dictee vocale multiplateforme, local-first, rapide et fiable, avec:

- capture audio et transcription locale;
- insertion dans l'application cible;
- widget flottant et dashboard accessibles;
- dictionnaire et profils contextuels;
- macOS, Linux X11/Wayland et Windows;
- Cloud, synchronisation et reecriture uniquement en option;
- confidentialite visible et controlee par l'utilisateur.

## Ordre des phases

| Phase | Intitule | Resultat attendu | Responsable principal |
|---:|---|---|---|
| [00](phases/PHASE-00-GOUVERNANCE-CADRAGE.md) | Gouvernance et cadrage | vision, perimetre, metriques, risques | project-manager + product-architect |
| [01](phases/PHASE-01-FONDATION-DEPOT.md) | Fondation du depot | monorepo, toolchains, CI minimale | rust-core + frontend + QA |
| [02](phases/PHASE-02-ARCHITECTURE-PROTOTYPES.md) | Architecture et prototypes de risque | contrats valides par spikes | product-architect |
| [03](phases/PHASE-03-UX-DESIGN-SYSTEM.md) | UX et design system | parcours, shell UI, shadcn/ui | frontend-lead |
| [04](phases/PHASE-04-CORE-AUDIO-RUST.md) | Core audio Rust | capture stable et pipeline temps reel | rust-core-lead |
| [05](phases/PHASE-05-ASR-LOCAL-MODELES.md) | ASR local et gestion des modeles | transcription locale mesurable | ai-asr-lead |
| [06](phases/PHASE-06-INTEGRATION-MACOS.md) | Integration macOS | hotkey, focus, collage, permissions | platform-lead |
| [07](phases/PHASE-07-INTEGRATION-LINUX.md) | Integration Linux | matrice X11/Wayland et fallbacks | platform-lead |
| [08](phases/PHASE-08-INTEGRATION-WINDOWS.md) | Integration Windows | comportement natif et migration | platform-lead |
| [09](phases/PHASE-09-INTELLIGENCE-PRODUIT.md) | Intelligence produit | dictionnaire, contexte, formatage | ai-asr + frontend |
| [10](phases/PHASE-10-DONNEES-PRIVACY.md) | Donnees locales et confidentialite | SQLite, secrets, retention | rust-core + security |
| [11](phases/PHASE-11-CLOUD-OPTIONNEL.md) | Cloud facultatif | auth, sync, passerelles et abonnement | backend-lead |
| [12](phases/PHASE-12-QUALITE-HARDENING.md) | Qualite et hardening | tests, securite, performance, a11y | QA + security |
| [13](phases/PHASE-13-PACKAGING-BETA.md) | Packaging et beta | builds signes et programme beta | QA + platform |
| [14](phases/PHASE-14-LANCEMENT-EXPLOITATION.md) | Lancement et exploitation | release stable, support, SLO | project-manager |

## Regles de progression

1. `STATUS.md` contient l'unique etat officiel.
2. Une seule phase structurante est `ACTIVE`; des travaux preparatoires independants peuvent avancer si le manager les trace.
3. Chaque phase commence par un kickoff et finit par un gate.
4. Aucun gate ne repose sur une declaration: chaque critere pointe vers un test, benchmark, ADR, capture ou rapport.
5. Une regression rouvre la phase concernee ou cree une dette explicitement acceptee.
6. Les dates sont des previsions, jamais des raisons de contourner securite ou qualite.

## Documents

- `STATUS.md`: tableau d'avancement vivant.
- `EXECUTION_PROTOCOL.md`: processus obligatoire par phase et par cycle.
- `RISKS.md`: registre des risques transversaux.
- `phases/`: specification complete de chaque phase.
- `../project-management/cycles/`: rapports successifs d'execution.
- `../project-management/decisions/`: ADR.
