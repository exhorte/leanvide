# Contribuer a Fluent

Fluent est une application de dictee locale par defaut. Le chemin MVP ne
requiert ni compte ni service Cloud et aucune contribution ne doit ajouter un
transfert d'audio ou de texte sans consentement explicite, une decision produit
et une revue securite.

## Avant de contribuer

1. Creer un worktree de domaine avec `./scripts/agent-worktree.ps1 -Role <role>`.
2. Travailler uniquement sur la branche `work/<role>` associee.
3. Lire `AGENTS.md`, la roadmap et les contrats applicables avant toute edition.
4. Garder les secrets hors du depot : les fichiers `.env` sont bloques par le
   hook pre-commit et ne doivent jamais etre affiches dans une issue, un log ou
   une capture.
5. Avant une pull request vers `develop`, executer les commandes de validation
   de [developpement local](docs/development/LOCAL-DEVELOPMENT.md).

## Definition minimale d'une pull request

Une PR indique son proprietaire, les contrats affectes, les commandes lancees,
l'environnement et leur sortie. Un echec doit etre reproductible (commande,
environnement, sortie et artefact) avant de demander une correction au lead
proprietaire. Les pull requests restent en brouillon tant que les controles
applicables ne sont pas prouves.

Ne modifiez pas directement `main` ou `develop`. N'ajoutez ni lockfile ignore,
ni dependance flottante, ni artefact contenant des donnees utilisateur.
