# Backlog produit initial

Statut: **priorisation proposée**

Phase: `PHASE-00`

Références: [VISION.md](VISION.md), [PRD-MVP.md](PRD-MVP.md), [PLATFORM-CAPABILITIES.md](PLATFORM-CAPABILITIES.md)

## 1. Convention

- `P0`: nécessaire pour fermer le cadrage ou rendre le premier parcours démontrable;
- `P1`: nécessaire à une V1 crédible après le MVP;
- `P2`: ultérieur, conditionné par preuves d'usage;
- `BLOCKED`: une décision ou preuve externe manque;
- `READY`: contrat et critères suffisants pour planifier un lot;
- `DISCOVERY`: recherche ou spike borné, sans engagement produit.

Le backlog n'autorise pas à lui seul l'implémentation. Le manager ouvre chaque lot avec ownership, niveau D0-D3, critères, validations et rollback.

## 2. P0 — décisions de Phase 00

| ID | Élément | Sortie vérifiable | Dépendance | État |
|---|---|---|---|---|
| DEC-001 | décider le nom définitif | D-01 datée, vérification marque/domaine séparée si publication | sponsor | `BLOCKED` |
| DEC-002 | choisir le persona principal | D-02 + preuves d'entretiens/tâches | recherche utilisateurs | `BLOCKED` |
| DEC-003 | choisir plateforme de référence | OS, version, architecture et machine nommés | D-02, parc de test | `BLOCKED` |
| DEC-004 | décider l'ordre des OS | ordre et justification par usage/risque/coût | D-02/D-03 | `BLOCKED` |
| DEC-005 | décider langues MVP | langues, locales, corpus et normalisation | D-02 | `BLOCKED` |
| DEC-006 | décider matériel minimal | CPU, RAM, architecture, stockage, accélérateur requis ou non | D-03/D-05 | `BLOCKED` |
| DEC-007 | choisir interaction de capture | push-to-talk/toggle/continue, comportement key-up et accessibilité | test UX | `BLOCKED` |
| DEC-008 | approuver politique d'historique | catégories, valeurs par défaut, durées, suppression et audio temporaire | threat model | `BLOCKED` |
| DEC-009 | décider obligation de compte | matrice fonctions anonymes/authentifiées | D-02/D-13 | `BLOCKED` |
| DEC-010 | décider Cloud dans le MVP | absent/optionnel et flux autorisés | D-08/D-09, coûts | `BLOCKED` |
| DEC-011 | décider visibilité du dépôt | public/privé et traitement de l'historique public actuel | sponsor/sécurité | `BLOCKED`; dépôt actuellement public |
| DEC-012 | choisir la licence | licence code + politique contributions/dépendances | D-011/D-13, conseil si nécessaire | `BLOCKED`; aucune licence détectée |
| DEC-013 | choisir le modèle économique | gratuit, achat, abonnement ou hybride; hypothèses de coûts | D-02/D-09/D-10 | `BLOCKED` |
| DEC-014 | statuer sur l'application WPF | source/inventaire ou confirmation greenfield | accès externe éventuel | `BLOCKED`; aucun artefact WPF dans ce dépôt |
| GOV-001 | approuver les budgets MVP | seuils, méthode et propriétaire pour chaque métrique | DEC-003/005/006 | `BLOCKED` |
| GOV-002 | threat model v0 | flux, actifs, menaces, mesures et risques résiduels | DEC-007/008/009/010 | `BLOCKED` |
| GOV-003 | gate Phase 00 | chaque critère pointe vers une preuve | DEC-001..014, GOV-001/002 | `BLOCKED` |

## 3. P0 — fondation et prototypes de risque

Ces éléments deviennent `READY` seulement après les décisions qu'ils citent.

| ID | Epic / tranche | Critère d'acceptation principal | Dépendances | Niveau suggéré |
|---|---|---|---|---|
| ARC-001 | figer contrats core/adaptateurs/IPC | états, erreurs, timeouts, données et versionnement revus | DEC-003/007/008/010, ADR-0001 | D3 |
| ARC-002 | squelette Tauri/React/Rust minimal | builds reproductibles; dashboard et widget séparables; aucun produit implicite | Gate 00 | D2 |
| SPIKE-001 | capture audio temps réel | preuve pertes/jitter/CPU; callback conforme | DEC-003/006 | D3 |
| SPIKE-002 | moteur ASR local | RTF/WER/latence/mémoire sur corpus et matériel nommés | DEC-003/005/006 | D3 |
| SPIKE-003 | hotkey et relâchement | 1 000 cycles, conflits et recovery documentés | DEC-003/007 | D3 |
| SPIKE-004 | widget sans vol de focus | latence, a11y, DPI/multi-écrans prouvés | DEC-003/007 | D2 |
| SPIKE-005 | remise et fallback | matrice d'applications; texte récupérable à chaque échec | DEC-003, GOV-002 | D3 |
| SPIKE-006 | stockage local et suppression | migration/rollback, permissions fichiers et effacement testés | DEC-008, GOV-002 | D3 |
| SPIKE-007 | modèle/package/updater | provenance, checksum, reprise, espace disque et suppression | DEC-003/006/012 | D2/D3 |
| QA-001 | harness de budgets | mesures monotones, profils machine, p50/p95 et artefacts | GOV-001 | D2 |
| SEC-001 | revue supply-chain initiale | dépendances et modèles compatibles, lockfiles et provenance | DEC-012, choix techniques | D2 |

## 4. P0 — parcours MVP candidat

| ID | User story / capacité | Critères principaux | Dépendances | État |
|---|---|---|---|---|
| MVP-001 | configurer microphone, modèle et langue | validation locale, erreurs récupérables, persistance définie | SPIKE-001/002/006 | `BLOCKED` |
| MVP-002 | déclencher et visualiser une dictée | états accessibles, budget d'armement, aucun focus volé | SPIKE-003/004 | `BLOCKED` |
| MVP-003 | transcrire localement | budget ASR approuvé et mode offline testé si confirmé | SPIKE-001/002 | `BLOCKED` |
| MVP-004 | remettre le texte | voie compatible + L1/L0; cible revalidée | SPIKE-005 | `BLOCKED` |
| MVP-005 | récupérer après échec | texte brut copiable dans 100 % des cas où il existe | MVP-003/004 | `BLOCKED` |
| MVP-006 | diagnostiquer permission/périphérique/modèle | cause, impact et action sans contenu sensible | GOV-002, spikes | `BLOCKED` |
| MVP-007 | supprimer données et modèles | comportement conforme à D-08, espace libéré vérifié | SPIKE-006/007 | `BLOCKED` |
| MVP-008 | démonstration E2E de référence | parcours PRD + budgets + fallback + réseau coupé selon D-10 | MVP-001..007 | `BLOCKED` |

## 5. P1 — V1 proposée

| ID | Epic | Valeur à prouver avant entrée | Risque/rollback |
|---|---|---|---|
| V1-001 | deuxième puis troisième plateforme | demande du persona et machine de test disponible | adaptateurs isolés; ne pas dégrader la référence |
| V1-002 | dictionnaire personnel | erreurs de noms propres fréquentes et mesurées | désactivation par profil; brut intact |
| V1-003 | profils par application | formatage répétitif observé | profil explicite; défaut neutre |
| V1-004 | historique textuel local | valeur supérieure au risque selon D-08 | désactivable, purge/migration testées |
| V1-005 | réécriture optionnelle | besoin mesuré et mécanisme d'évaluation | diff/fallback déterministe vers brut |
| V1-006 | accélération matérielle | gain significatif sur profils nommés | backend CPU conservé lorsque viable |
| V1-007 | packaging et mises à jour signées | canal bêta et clés gérées | canal/version précédente conservés |
| V1-008 | Cloud facultatif | D-09/D-10/D-13 + threat model + budget | feature flag et chemin local indépendant |
| V1-009 | accessibilité complète | audit widget/dashboard/parcours erreurs | repli vers contrôles standards |

## 6. P2 — ultérieur

| ID | Idée | Condition d'entrée |
|---|---|---|
| FUT-001 | moteurs ASR additionnels | lacune mesurée du moteur initial sur un segment prioritaire |
| FUT-002 | synchronisation multi-appareils | demande validée, compte accepté, conflits et chiffrement cadrés |
| FUT-003 | contexte via arbre d'accessibilité | gain précision démontré et menace/confidentialité acceptées |
| FUT-004 | OCR | cas d'usage impossible autrement, consentement et minimisation conçus |
| FUT-005 | équipes, SSO, SCIM | persona administrateur et modèle économique entreprise confirmés |
| FUT-006 | mobile | nouveau PRD, architecture et budget dédiés |
| FUT-007 | analytics spécialisé | volume réel rendant SQLite/PostgreSQL/observabilité simple insuffisants |
| FUT-008 | apprentissage par corrections | évaluation, consentement, suppression et gouvernance modèle approuvés |

## 7. Dette et risques à ne pas masquer

| Risque | Signal d'alerte | Réponse backlog |
|---|---|---|
| Wayland non universel | taux d'injection présenté sans compositor | SPIKE-005 par environnement + L1/L0 testé |
| callback audio bloqué | I/O/log/allocation/verrou dans le callback | SPIKE-001 + revue temps réel |
| matériel faible insuffisant | RTF/mémoire sans profil machine | DEC-006 + SPIKE-002 |
| perte par réécriture | texte final remplace le brut sans trace | V1-005 interdit tant que fallback non prouvé |
| fuite clipboard/contexte | lecture/restauration implicite | GOV-002 + SPIKE-005 |
| backend prématuré | infrastructure distribuée avant D-10/charge | V1-008, FUT-007 conditionnés |
| statut public sans licence | contributions/réutilisation ambiguës | DEC-011/012 avant ouverture organisée |
| fausse migration WPF | plan basé sur une base absente du dépôt | DEC-014 avant tout lot migration |

## 8. Ordre recommandé du prochain travail

1. Fermer D-01 à D-14, en priorité D-02 à D-10 pour le PRD.
2. Nommer plateforme, matériel, langues, corpus et budgets.
3. Valider threat model v0 et rétention.
4. Fermer Gate 00 avec preuves.
5. Figer les contrats en ARC-001.
6. Exécuter les spikes de risque avant l'implémentation parallèle.
7. Construire une seule tranche E2E sur la plateforme de référence.
8. Étendre seulement après résultats mesurés et revue des fallbacks.
