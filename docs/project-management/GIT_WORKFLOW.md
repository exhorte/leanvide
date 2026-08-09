# Strategie Git et publication continue

## Objectif

Conserver `main` stable, integrer les travaux dans `develop`, isoler chaque domaine dans une branche/worktree et pousser automatiquement chaque commit de travail vers GitHub.

## Branches

| Branche | Proprietaire | Usage |
|---|---|---|
| `main` | project-manager | versions stables et jalons valides |
| `develop` | project-manager | integration des cycles termines |
| `work/project-management` | project-manager | roadmap, rapports de cycles et coordination |
| `work/product-architecture` | product-architect | PRD, ADR et architecture |
| `work/frontend` | frontend-lead | React, Tauri UI, shadcn/ui |
| `work/rust-core` | rust-core-lead | audio, etats, SQLite et IPC Rust |
| `work/platform` | platform-lead | macOS, Linux, Windows et packaging natif |
| `work/ai-asr` | ai-asr-lead | VAD, whisper.cpp, modeles et evaluation |
| `work/backend` | backend-lead | FastAPI, PostgreSQL, auth et sync |
| `work/qa-release` | qa-release-lead | tests, CI, builds et releases |
| `work/security` | security-reviewer | rapports et hardening autorise |

Toutes les branches `work/*` partent de `develop`. Elles sont poussees apres chaque commit. Les integrations se font par pull request vers `develop`; les releases se font par pull request de `develop` vers `main`.

## Regles obligatoires

1. Aucun commit produit directement sur `main` ou `develop` apres le bootstrap.
2. Un agent travaille dans un worktree dedie et sur sa branche de domaine.
3. Avant un nouveau cycle, synchroniser la branche avec `origin/develop`.
4. Un commit represente un etat coherent et testable; ne pas committer un secret ou un build casse connu sans marqueur explicite.
5. Le hook `pre-commit` bloque les formats de secrets usuels et les fichiers `.env`.
6. Le hook `post-commit` pousse automatiquement les branches autres que `main` et `develop` lorsque `leanvibe.autoPush=true`.
7. Une PR contient les preuves de test et le rapport de cycle.
8. Le manager attend la CI et la revue requise avant fusion.
9. Apres fusion, mettre a jour `docs/roadmap/STATUS.md` et la memoire du role.

## Worktrees

Creer ou ouvrir le worktree d'un role:

```powershell
.\scripts\agent-worktree.ps1 -Role frontend
```

Les worktrees sont places dans le dossier frere `leanvibe-worktrees/` afin que plusieurs agents puissent travailler sans changer mutuellement de branche.

## Commit et push

Le push automatique est active localement par:

```powershell
git config leanvibe.autoPush true
git config core.hooksPath .githooks
```

Le push ne remplace pas la discipline de commit: les agents doivent committer uniquement apres les controles pertinents. Un echec de push n'annule pas le commit local; il doit etre signale au manager et retente apres diagnostic.

## Pull requests

- `work/*` -> `develop`: integration d'un lot ou cycle.
- `develop` -> `main`: gate de phase, beta ou release.
- Draft PR tant que les criteres d'acceptation ne sont pas tous prouves.
- Squash merge recommande pour garder un historique de cycles lisible.

## Urgence

Un hotfix part de `main` sous `hotfix/<description>`, passe par PR vers `main`, puis est reporte dans `develop`. Aucun contournement des hooks ou de la protection de branche sans incident documente.
