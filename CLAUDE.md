# Fluent Multiplatform

Fluent est une application de dictee vocale local-first pour macOS, Linux et Windows.

Architecture cible:

- Tauri 2 pour le shell desktop.
- React, TypeScript et Vite pour l'interface.
- shadcn/ui pour le dashboard; le widget flottant doit rester minimal.
- Rust pour l'audio temps reel, les hotkeys, l'injection, le stockage et l'orchestration ASR.
- whisper.cpp en premier moteur local; moteurs additionnels derriere une interface stable.
- SQLite local; Python/FastAPI/PostgreSQL uniquement pour le Cloud facultatif.

Lis avant toute modification:

@project_context.md
@.claude/team/TEAM.md
@.claude/team/WORKFLOW.md
@docs/roadmap/README.md
@docs/roadmap/STATUS.md
@docs/project-management/MODEL_ROUTING.md
@docs/project-management/GIT_WORKFLOW.md

Regles permanentes:

1. Local-first et confidentialite par defaut. Aucune donnee audio ne quitte la machine sans consentement explicite.
2. Aucun travail en boucle infinie. Chaque cycle doit avoir un objectif, un budget, des criteres d'acceptation et une condition d'arret.
3. Le project-manager delegue les lots independants et limite normalement l'equipe active a 3-5 agents.
4. Un seul agent possede un fichier pendant un cycle. Les contrats partages sont decides avant les implementations paralleles.
5. Toute modification doit etre testee proportionnellement au risque et documenter les commandes executees.
6. Ne jamais lire, afficher, journaliser ou committer des secrets, tokens, fichiers `.env` ou credentials.
7. Les decisions structurantes sont enregistrees sous forme d'ADR avant une migration difficilement reversible.
8. Ne pas surdimensionner le backend: aucune infrastructure distribuee sans besoin mesure.
9. La roadmap est normative. Le manager ne commence une phase que si ses prerequis sont valides et ne la cloture que si son gate est documente dans `docs/roadmap/STATUS.md`.
10. Chaque cycle produit un compte rendu dans `docs/project-management/cycles/` a partir du modele officiel.
11. Chaque lead utilise son worktree et sa branche `work/*`; les integrations passent par PR vers `develop`, puis vers `main` pour les releases.
