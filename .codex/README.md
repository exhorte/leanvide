# Configuration Codex de Fluent

Codex partage la meme roadmap, le meme statut et le meme ownership que Claude Code. Il ne maintient pas une seconde copie du plan.

## Demarrage

1. Ouvrir `C:\Ebrain\Projets\leanvide\leanvibeApp` dans Codex.
2. Marquer le projet comme approuve afin que `.codex/config.toml` soit charge.
3. Verifier le serveur `shadcn` dans les MCP actifs.
4. Demander: `Demarre le prochain cycle autorise de la roadmap avec les sous-agents appropries.`

## Structure

- `config.toml`: modele principal, multi-agent, concurrence et MCP.
- `agents/*.toml`: roles specialises et routage modele/effort.
- `../AGENTS.md`: regles persistantes du depot et comportement du manager.
- `../docs/project-management/MODEL_ROUTING.md`: classificateur commun Claude/Codex.
- `../.claude/agent-memory/`: memoire projet partagee explicitement par les deux systemes.

## Limites

- Cinq sous-agents simultanes maximum; viser 3 a 5 seulement quand les lots sont independants.
- Les workflows a ecritures paralleles exigent un ownership de fichiers explicite.
- Le PAT GitHub est lu depuis `GITHUB_TOKEN`; il n'est jamais stocke ici.

