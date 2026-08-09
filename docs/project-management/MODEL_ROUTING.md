# Routage des modeles par difficulte

Ce document est commun a Claude Code et Codex. Le manager classe chaque lot avant delegation et enregistre le niveau dans le rapport de cycle.

## Matrice

| Niveau | Caracteristiques | Claude | Codex | Effort | Exemples |
|---|---|---|---|---|---|
| D0 mecanique | procedure claire, faible ambiguite, lecture/repetition | Haiku | `gpt-5.6-terra` | low | inventaire, recherche ciblee, lancer tests, resumer logs |
| D1 standard | changement local, contrat stable, rollback simple | Sonnet | `gpt-5.6-terra` | medium | composant UI, endpoint simple, fixture, documentation |
| D2 complexe | plusieurs modules, edge cases, risque moyen/eleve | Sonnet high ou Opus | Terra high ou `gpt-5.6-sol` high | high | debug transversal, migration DB, revue securite, packaging OS |
| D3 critique | architecture, concurrence, temps reel, perte de donnees, decision irreversible | Opus | `gpt-5.6-sol` | xhigh/max | callback audio, modele ASR, injection OS, crypto, migration majeure |

## Score de classification

Ajouter un point pour chaque critere:

- plus de deux modules ou contrats affectes;
- concurrence, temps reel, FFI ou `unsafe`;
- donnees utilisateur, secrets, auth ou confidentialite;
- comportement different selon les OS;
- migration ou rollback difficile;
- panne difficile a reproduire;
- specification incomplete ou options concurrentes;
- performance/precision exigeant un benchmark;
- impact sur packaging, updater ou signature;
- resultat faux difficile a detecter automatiquement.

Interpretation:

- 0-1 point: D0;
- 2-3 points: D1;
- 4-6 points: D2;
- 7+ points ou critere critique explicite: D3.

Le manager peut surclasser un lot avec justification. Il ne le sous-classe pas pour economiser des tokens lorsque securite, donnees ou temps reel sont en jeu.

## Routage en deux temps

Une meme fonctionnalite peut changer de niveau:

1. architecture ou diagnostic avec D2/D3;
2. contrats et plan figes;
3. implementation mecanique deleguee en D1;
4. tests repetitifs en D0;
5. revue finale D2 si la surface est sensible.

Cela evite d'utiliser le modele le plus couteux pour chaque edition tout en preservant la qualite aux points de decision.

## Regles d'escalade

Escalader d'un niveau lorsque:

- deux tentatives conformes echouent;
- des preuves se contredisent;
- le lot depasse son perimetre initial;
- un nouveau risque securite/donnees apparait;
- les tests sont non deterministes;
- un agent demande explicitement un arbitrage.

Arreter et demander une decision utilisateur lorsque l'escalade modifie le produit, le budget, la stack ou une garantie de confidentialite.

## Regles de retour au niveau inferieur

Redescendre lorsque le contrat est stable, les fichiers sont attribues, le comportement attendu est testable et le rollback est simple. Documenter cette transition dans le rapport de cycle.

## Choix par role

| Role | Niveau par defaut | Escalade typique |
|---|---|---|
| project-manager | D2 | D3 pour arbitrage de roadmap ou release |
| product-architect | D3 | max pour decision irreversible |
| frontend-lead | D1/D2 | D2 pour architecture d'etat/performance/a11y |
| rust-core-lead | D3 | max pour concurrence, FFI ou corruption |
| platform-lead | D2/D3 | D3 pour permissions/injection/signature |
| ai-asr-lead | D3 | max pour evaluation/selection de moteur |
| backend-lead | D1/D2 | D3 pour auth, sync ou migration sensible |
| qa-release-lead | D1/D2 | D3 pour flakiness systemique ou rollback |
| security-reviewer | D2 | D3 pour menace critique |
| chercheurs/test-runner | D0 | D1 si synthese ambigue |

