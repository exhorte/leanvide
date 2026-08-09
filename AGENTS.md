# Fluent Multiplatform — Instructions Codex

## Mission

Construire Fluent, une application de dictee vocale local-first pour macOS, Linux et Windows avec Tauri 2, React/TypeScript/Vite, un coeur Rust et un backend Cloud facultatif.

## Sources de verite obligatoires

Avant toute planification ou modification, lire:

- `docs/roadmap/README.md`
- `docs/roadmap/STATUS.md`
- le fichier de la phase active sous `docs/roadmap/phases/`
- `docs/roadmap/EXECUTION_PROTOCOL.md`
- `docs/project-management/MODEL_ROUTING.md`
- `docs/project-management/GIT_WORKFLOW.md`
- `.claude/team/TEAM.md` pour l'ownership partage Claude/Codex

Le nom `.claude` n'implique pas une propriete exclusive: la roadmap, TEAM, WORKFLOW et `.claude/agent-memory/` sont partages par Claude Code et Codex.

## Role du thread principal Codex

Le thread principal agit comme `project-manager` et integrateur:

1. identifier la phase active et le prochain lot autorise;
2. classifier la difficulte avec `MODEL_ROUTING.md`;
3. deleguer uniquement les lots independants qui beneficient du parallelisme;
4. utiliser normalement 3 a 5 sous-agents au maximum;
5. attribuer des fichiers sans chevauchement;
6. attendre tous les agents requis avant l'integration;
7. verifier les resultats et faire relire selon le risque;
8. mettre a jour `STATUS.md`, le rapport de cycle et les memoires;
9. terminer le cycle par `COMPLETE`, `BLOCKED` ou `FAILED`.

Ne jamais demarrer une boucle autonome infinie. Un nouveau cycle exige un objectif explicite.

## Delegation et modeles

- Niveau D0: `gpt-5.6-terra`, effort `low` — inventaire, recherche ciblee, tests mecaniques.
- Niveau D1: `gpt-5.6-terra`, effort `medium` — implementation locale claire.
- Niveau D2: `gpt-5.6-terra high` ou `gpt-5.6-sol high` — changement transversal, debug difficile, revue securite.
- Niveau D3: `gpt-5.6-sol`, effort `xhigh` ou `max` — architecture irreversible, temps reel, concurrence, migration et risque de perte de donnees.

Utiliser les agents personnalises de `.codex/agents/`. Escalader le modele seulement si les criteres D2/D3 sont presents; revenir a Terra pour l'execution mecanique une fois la decision prise.

## Regles de travail

- Local-first; aucune donnee audio ne quitte la machine sans consentement explicite.
- Un seul agent possede un fichier pendant un cycle.
- Les contrats IPC/API/traits sont figes avant les implementations paralleles.
- Ne jamais lire, afficher, journaliser ou committer des secrets, tokens ou `.env`.
- Toute decision difficilement reversible exige un ADR.
- Toute modification est testee proportionnellement au risque.
- Chaque sous-agent lit puis met a jour sa memoire stable sous `.claude/agent-memory/<role>/MEMORY.md`; aucun secret dans la memoire.
- Chaque agent travaille dans le worktree et la branche `work/*` de son domaine. Aucun commit direct sur `main` ou `develop`.
- Apres un commit coherent et teste, le hook pousse automatiquement la branche de travail. Signaler tout echec de push au manager.
- Le serveur MCP frontend est `shadcn`; consulter `docs/frontend/SHADCN-MCP.md`.

## Revue de code

- Prioriser bugs, regressions, races, securite, confidentialite et tests manquants.
- Le callback audio ne fait aucune I/O, aucun log synchrone, aucune allocation evitable et ne prend aucun verrou bloquant.
- Sous Wayland, ne jamais promettre une injection universelle; exiger un fallback explicite.
- Toute reecriture generative conserve un retour deterministe au texte brut.
