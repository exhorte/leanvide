# Architecture de l'equipe

```text
project-manager (Opus)
├── product-architect (Opus)
├── frontend-lead (Sonnet)
│   └── ui-researcher (Haiku)
├── rust-core-lead (Opus)
│   └── performance-benchmarker (Sonnet)
├── platform-lead (Opus)
│   └── docs-researcher (Haiku)
├── ai-asr-lead (Opus)
│   └── performance-benchmarker (Sonnet)
├── backend-lead (Sonnet)
├── qa-release-lead (Sonnet)
│   └── test-runner (Haiku)
└── security-reviewer (Sonnet)
```

Tous les agents existent, mais ils ne doivent pas tous etre actifs simultanement. Le manager selectionne normalement 3 a 5 leads selon le cycle.

## Clients d'agents

Cette equipe est logique et independante du client:

- Claude Code charge `.claude/agents/*.md`.
- Codex charge `.codex/agents/*.toml` et les instructions racine `AGENTS.md`.
- Les deux utilisent la meme roadmap, le meme `STATUS.md`, le meme ownership et les memes memoires sous `.claude/agent-memory/`.
- Le routage des modeles par difficulte est defini dans `docs/project-management/MODEL_ROUTING.md`.

| Role logique | Claude | Codex |
|---|---|---|
| project-manager | `project-manager` | thread principal / `project_manager` |
| product-architect | `product-architect` | `product_architect` |
| frontend-lead | `frontend-lead` | `frontend_lead` |
| rust-core-lead | `rust-core-lead` | `rust_core_lead` |
| platform-lead | `platform-lead` | `platform_lead` |
| ai-asr-lead | `ai-asr-lead` | `ai_asr_lead` |
| backend-lead | `backend-lead` | `backend_lead` |
| qa-release-lead | `qa-release-lead` | `qa_release_lead` |
| security-reviewer | `security-reviewer` | `security_reviewer` |

## Propriete des zones

| Agent | Zone principale | Ne modifie pas sans accord |
|---|---|---|
| frontend-lead | `apps/desktop/src/**` | API Rust, backend Cloud |
| rust-core-lead | `crates/core/**`, audio, stockage local | UI et integrations OS specialisees |
| platform-lead | `crates/platform/**`, packaging OS | moteur ASR et dashboard |
| ai-asr-lead | `crates/asr/**`, modeles et VAD | UI et auth Cloud |
| backend-lead | `services/api/**` | coeur desktop |
| qa-release-lead | `tests/**`, CI, packaging de test | code metier sauf correctif convenu |
| security-reviewer | lecture globale, rapports | aucune implementation par defaut |
| product-architect | `docs/architecture/**`, ADR | implementation sans delegation explicite |

Les fichiers racine, manifests de workspace, schemas IPC, contrats d'API et workflows CI sont des zones partagees: le manager designe un proprietaire unique avant chaque modification.

## Regles de delegation

- Un lead peut deleguer un sous-probleme autonome avec l'outil Agent.
- Profondeur maximale: deux niveaux sous le manager.
- Un sous-agent recoit un livrable, des chemins autorises, des criteres d'acceptation et un budget de tours.
- Un lead reste responsable de la verification et de la synthese de ses sous-agents.
- Les agents ne creent jamais une nouvelle boucle autonome lorsqu'aucun objectif de cycle n'est ouvert.
