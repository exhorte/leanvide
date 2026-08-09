# Equipe Claude de Fluent

Cette configuration utilise deux mecanismes complementaires:

- **Agent Teams** pour 3 a 5 leads travaillant en parallele sur des lots independants.
- **Sous-agents** pour une delegation locale et bornee par un lead.

Le manager est charge automatiquement par `.claude/settings.json`. Apres la creation initiale de `.claude/agents`, redemarrer Claude Code une fois pour que tous les agents soient decouverts.

## Demarrage

Depuis la racine du projet:

```powershell
claude
```

Prompt conseille:

```text
Demarre un cycle de projet. Analyse l'etat du depot, propose le plus petit objectif
vertical livrable, constitue une equipe de 3 a 5 agents maximum, attribue des fichiers
sans chevauchement, attends leurs resultats, integre, teste, puis publie le rapport de cycle.
```

## Modeles

Le classificateur commun et les regles d'escalade sont dans `docs/project-management/MODEL_ROUTING.md`. Le tableau ci-dessous indique les familles par defaut; le manager doit adapter le modele a la difficulte reelle du lot.

| Role | Modele | Usage |
|---|---|---|
| Project manager, architecture critique, audio/ASR, plateformes | Opus | Arbitrages complexes et risques eleves |
| Frontend, backend, QA, securite, implementation courante | Sonnet | Developpement quotidien |
| Recherche ciblee, inventaire, documentation, tests mecaniques | Haiku | Rapidite et cout reduit |

Les aliases `opus`, `sonnet` et `haiku` suivent les versions recommandees par le fournisseur Claude configure.

Codex utilise la meme roadmap via `AGENTS.md`, `.codex/config.toml` et `.codex/agents/*.toml`.

## shadcn/ui MCP

Les agents frontend referencent le serveur de projet `shadcn`, defini dans `.mcp.json`. VS Code utilise la definition equivalente de `.vscode/mcp.json`.

- Ne jamais enregistrer le PAT GitHub dans un fichier du depot.
- VS Code demande le PAT comme entree masquee au premier demarrage.
- Claude Code herite de `GITHUB_TOKEN` depuis l'environnement du processus.

Le token est facultatif pour le registre shadcn public, mais utile pour les appels GitHub authentifies. Utiliser un fine-grained PAT en lecture seule avec la portee minimale.

## Limite importante

Le projet n'est pas encore un depot Git. Tant que Git n'est pas initialise, l'isolation par worktree est indisponible. Les agents doivent donc respecter strictement la matrice de possession des fichiers de `team/TEAM.md`.
