# shadcn/ui et MCP

## Autorite

Cette convention s'applique a `frontend-lead` et `ui-researcher`.

## Configurations

- Claude Code: `.mcp.json`, serveur `shadcn`.
- VS Code: `.vscode/mcp.json`, serveur `shadcn`.
- Catalogue et destinations: futur `components.json`, cree pendant la Phase 03 apres initialisation React/Tailwind.

## GitHub Personal Access Token

Le PAT n'est jamais commite. VS Code demande une entree masquee `github-token` et la transmet au processus comme `GITHUB_TOKEN`. Pour Claude Code, definir `GITHUB_TOKEN` dans l'environnement avant de lancer `claude`.

Exemple PowerShell pour la session courante, sans inscrire la valeur dans un fichier:

```powershell
$env:GITHUB_TOKEN = Read-Host 'GitHub PAT' -MaskInput
claude
```

Utiliser de preference un fine-grained PAT:

- lecture seule;
- acces limite aux depots necessaires;
- expiration courte;
- aucune permission d'administration ou d'ecriture si inutile.

L'API GitHub accorde typiquement 60 requetes/heure aux appels REST non authentifies et 5 000/heure aux requetes authentifiees d'un utilisateur. Ces limites restent soumises aux politiques GitHub et aux limites secondaires.

## Processus obligatoire pour un composant

1. Rechercher dans le registre via MCP `shadcn`.
2. Examiner API, dependances, accessibilite et exemples.
3. Preferer un composant existant a une recreation.
4. Previsualiser l'installation et son diff lorsque disponible.
5. Installer dans le chemin defini par `components.json`.
6. Adapter par composition; conserver la primitive accessible.
7. Ajouter tests d'interaction, clavier et etats visuels.
8. Documenter le composant adopte dans la memoire frontend.

Le widget flottant est une exception de performance: une primitive plus petite peut etre justifiee si un composant shadcn introduit un cout mesure incompatible avec son budget.

