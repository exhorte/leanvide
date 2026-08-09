# Phase 01 — Fondation du depot

## But

Creer un monorepo reproductible, testable et adapte au travail parallele.

## Responsables

- Lead integration: `project-manager`
- Implementation: `rust-core-lead`, `frontend-lead`, `qa-release-lead`
- Revue: `security-reviewer`

## Travaux

1. Initialiser Git, branches protegees et conventions de commits.
2. Creer le workspace Rust et les repertoires `apps/desktop`, `crates/*`, `services/api`, `tests`, `docs`.
3. Initialiser Tauri 2, React, TypeScript strict et Vite.
4. Choisir et verrouiller Node, Rust, Python et package manager.
5. Configurer formatters, linters, type-check, tests et hooks locaux non bloquants.
6. Creer CI Windows/macOS/Linux avec caches et artefacts minimaux.
7. Configurer Dependabot/Renovate selon decision et audits supply-chain.
8. Definir gestion des secrets, fichiers ignores et `.worktreeinclude` si necessaire.
9. Ajouter schemas des messages IPC et conventions d'erreur.
10. Documenter installation, build, test et diagnostic.

## Livrables

- application Tauri vide demarrant sur les OS cibles;
- commandes uniques `dev`, `build`, `test`, `lint`, `check`;
- lockfiles committes;
- CI verte;
- documentation de contribution;
- isolation worktree utilisable par les agents.

## Gate 01

- [ ] Clone propre vers build reussi avec instructions seules.
- [ ] CI verte sur les trois familles d'OS.
- [ ] Aucun secret ou chemin utilisateur dans le depot.
- [ ] Frontend et Rust echangent une commande IPC typee de smoke test.
- [ ] Les agents peuvent travailler sur des worktrees sans conflit.

