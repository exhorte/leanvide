# Matrice de test qualite

## Statut

Matrice de cadrage pour les phases 01 a 13. Les cas sont obligatoires quand la
fonction existe; ils ne pretendent pas qu'une integration OS soit deja livree.
Chaque execution joint la commande, l'environnement, la sortie et un artefact
suivant [MEASUREMENT-PLAN.md](MEASUREMENT-PLAN.md). Les valeurs a atteindre sont
des **cibles MVP proposees** dans
[PERFORMANCE-BUDGETS.md](PERFORMANCE-BUDGETS.md), non des engagements confirmes.
Le francais, les trois configurations `HW-*` et le parcours local sans compte ni
reseau sont des candidats de validation dependants de D-03 a D-06 et D-09/D-10;
ils ne confirment ni une plateforme, ni une langue, ni un perimetre MVP.

## Axes de couverture

| Axe | Valeurs minimales |
|---|---|
| OS | Windows 11 x64; macOS Apple Silicon; Ubuntu LTS x86_64 |
| Session Linux | X11; Wayland, compositor/version declares |
| Audio | micro integre; fixture WAV 16 kHz mono; peripherique USB en non-regression quand disponible |
| Mode | candidat local hors ligne sans compte apres acquisition du modele; Cloud opt-in futur uniquement; PTT; toggle; VAD |
| ASR | modele par defaut a confirmer; sous-corpus francais candidat; propre; bruit controle; dictionnaire desactive/active separement |
| Cible texte | editeur natif, navigateur, IDE, application non cooperative/securisee |
| Etat | permission accordee/refusee, micro indisponible, cible detruite, clipboard occupe, modele absent/corrompu, reseau coupe |

## Cas de contrat

| ID | Fonction | Windows | macOS | Linux X11 | Linux Wayland | Oracle / resultat attendu |
|---|---|---|---|---|---|---|
| QA-AUD-01 | Armement PTT | requis | requis | requis | si hotkey autorise | premier bloc capture, trace p95/p99 |
| QA-AUD-02 | Fin PTT et flush | requis | requis | requis | si hotkey autorise | dernier bloc remis, aucune capture orpheline |
| QA-AUD-03 | Fin VAD | requis | requis | requis | requis si capture possible | surcout VAD et seuil de silence declares |
| QA-AUD-04 | Continuite audio 10 min | requis | requis | requis | requis | sequence trames, taux/perte max |
| QA-AUD-05 | Micro absent/silencieux/bascule | requis | requis | requis | requis | erreur visible, recovery borne, aucune boucle |
| QA-ASR-01 | Decode local hors ligne | requis | requis | requis | requis | texte brut, RTF, modele declare |
| QA-ASR-02 | Exactitude propre/bruit | requis | requis | requis | requis | WER/CER par sous-corpus + IC |
| QA-ASR-03 | Modele absent/corrompu/espace insuffisant | requis | requis | requis | requis | checksum, reprise/erreur, aucun usage partiel |
| QA-ASR-04 | Fin -> texte brut disponible, 10 s | requis | requis | requis | requis | p50 <= 1.0 s, p95 <= 2.5 s; texte brut affichable/copiable avant injection/reecriture |
| QA-INJ-01 | Editeur natif cible | requis | requis | requis | capability dependant | texte exact dans bonne fenetre, une seule fois |
| QA-INJ-02 | Navigateur et IDE cible | requis | requis | requis | capability dependant | meme oracle, cible/focus revalides |
| QA-INJ-03 | Cible detruite/focus change | requis | requis | requis | capability dependant | pas de texte dans mauvaise cible; fallback explicite |
| QA-INJ-04 | Cible securisee/non cooperative | requis | requis | requis | requis | echec explicite ou fallback clipboard, jamais faux succes |
| QA-WAY-01 | Capability probe | n/a | n/a | n/a | requis | compositor, portal/API, permission et limite archives |
| QA-WAY-02 | Fallback clipboard | n/a | n/a | n/a | requis | clipboard attendu + instruction utilisateur visible |
| QA-SYS-01 | CPU/RSS arme, capture, ASR | requis | requis | requis | requis | serie 5 min, p95 par mode |
| QA-SYS-02 | Demarrage chaud/froid | requis | requis | requis | requis | `ready` trace apres hotkey + UI disponibles |
| QA-REL-01 | Crash/fault injection | requis | requis | requis | requis | reprise sure, sessions/crashes comptabilises |
| QA-REL-02 | Confidentialite local-first | requis | requis | requis | requis | reseau coupe; aucune sortie audio/texte dans logs |

`capability dependant` n'est jamais interprete comme support universel. Pour
Wayland, l'absence de droit d'injection passe `QA-WAY-01` et `QA-WAY-02` si le
fallback est correct; elle laisse `QA-INJ-*` non applicable avec cause, et ne
peut pas etre comptee comme succes d'injection.

## Applications cibles candidates

Les applications exactes, versions et automatismes d'oracle seront arretes par
les leads plateforme lors des prototypes. Cette liste est un minimum de
diversite, pas une promesse de compatibilite de chaque version.

| Classe | Windows | macOS | Linux X11/Wayland | But |
|---|---|---|---|---|
| Editeur natif | Notepad | TextEdit | GNOME Text Editor ou xterm | insertion/clipboard simple |
| Navigateur | Edge ou Chrome | Safari ou Chrome | Firefox ou Chromium | champ web et focus async |
| IDE | VS Code | VS Code | VS Code | application Electron/CodeMirror |
| Non cooperative | champ de mot de passe du navigateur | champ de mot de passe | champ de mot de passe | aucune injection automatique, feedback explicite |

Les tests password utilisent uniquement une chaine synthetique non sensible et
ne conservent aucune capture de contenu. Les cas doivent verifier que Fluent ne
restaure ni ne journalise le presse-papiers prive.

## Jeux de campagne minimaux

| Campagne | Echantillon minimal | Verdict |
|---|---:|---|
| Latence, CPU, RSS, demarrage | 3 chauffes + 30 repetitions; 5 min pour ressources | p95/p99 contre budget et baseline |
| Continuite audio | 3 x 10 min par peripherique | taux de trames perdues et trou maximal |
| RTF | corpus versionne, 30 repetitions ou tous fichiers si plus grand | p95 ratio par fichier/sous-corpus |
| Fin -> texte brut disponible | 30 repetitions de fixture 10 s par moteur/modele/langue/HW candidats | p50/p95, trace `fin_capture -> texte_brut_disponible`, hors injection/reecriture |
| WER/CER | corpus valide versionne, bootstrap IC 95 % | score par sous-corpus + aggregate pondere |
| Injection par cible | 100 essais par cible/capability au minimum de developpement | taux + IC 95 %, faux succes = echec |
| Fallback Wayland | 100 essais par compositor/capability | clipboard + message, taux + IC 95 % |
| Crash-free | >= 600 sessions eligibles sans crash pour preuve 99.5 % a borne inferieure de Clopper-Pearson unilaterale 95 %; sinon resultat exploratoire | borne inferieure unilaterale, pas seulement point estimate |

## Gating

| Phase | Preuve QA attendue |
|---|---|
| 01 Fondation | harnesses/fixtures prets ou plan de livraison trace; CI execute les controles disponibles |
| 02 Prototypes | baseline materiel, capability map et valeurs figables mises a jour |
| 04 Audio | QA-AUD-01 a 05, QA-SYS-01 avec artefacts |
| 05 ASR | QA-ASR-01 a 03, RTF/WER/CER et tailles modeles |
| 06 macOS | QA-INJ-01 a 04 macOS, permissions et fallback |
| 07 Linux | X11 complet; QA-WAY-01/02, injection seulement quand capability prouvee |
| 08 Windows | QA-INJ-01 a 04 Windows, hotkey/focus/clipboard |
| 12 Hardening | matrice applicable complete, regressions analysees, crash/fault evidence |
| 13 Beta | packages, signatures, update, crash-free et taux injection avec echantillons suffisants |

Un gate sans artefact reproductible est `FAIL` ou `WAIVED`, jamais `PASS`.
