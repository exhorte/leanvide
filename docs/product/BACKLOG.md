# Backlog produit initial

Statut: **décisions produit confirmées — priorisation technique proposée**

Phase: `PHASE-00`

Références: [VISION.md](VISION.md), [PRD-MVP.md](PRD-MVP.md), [PLATFORM-CAPABILITIES.md](PLATFORM-CAPABILITIES.md)

## 1. Convention

- `P0`: nécessaire pour fermer le cadrage ou rendre le premier parcours démontrable;
- `P1`: nécessaire à une V1 crédible après le MVP;
- `P2`: ultérieur, conditionné par preuves d'usage;
- `DONE`: décision ou livrable acquis avec preuve;
- `BLOCKED`: une décision ou preuve externe manque;
- `READY`: contrat et critères suffisants pour planifier un lot;
- `DISCOVERY`: recherche ou spike borné, sans engagement produit.

Le backlog n'autorise pas à lui seul l'implémentation. Le manager ouvre chaque lot avec ownership, niveau D0-D3, critères, validations et rollback.

## 2. P0 — décisions de Phase 00

| ID | Élément | Sortie vérifiable | Dépendance | État |
|---|---|---|---|---|
| DEC-001 | décider le nom définitif | **Fluent**; vérification marque/domaine séparée avant publication | confirmation utilisateur du 2026-08-09 | `DONE` — D-01 confirmée |
| DEC-002 | choisir le persona principal | professionnel desktop à forte production écrite, sensible à la confidentialité | confirmation utilisateur; hypothèses d'usage à valider | `DONE` — D-02 confirmée |
| DEC-003 | choisir plateforme de référence | macOS Apple Silicon si une machine de test est disponible; sinon Windows comme référence pratique | disponibilité du parc à établir | `DONE` — D-03 confirmée; machine ou fallback à enregistrer |
| DEC-004 | décider l'ordre des OS | macOS -> Linux -> Windows | D-02/D-03 confirmées | `DONE` — D-04 confirmée |
| DEC-005 | décider langues MVP | français; termes anglais/code dans le corpus sans promesse bilingue | corpus et normalisation à versionner | `DONE` — D-05 confirmée |
| DEC-006 | décider matériel minimal | minimum provisoire 4 cœurs modernes, 8 Gio, 2 Gio libres, sans GPU dédié; référence 16 Gio | benchmarks Phase 02 | `DONE` — D-06 confirmée; qualification provisoire |
| DEC-007 | choisir interaction de capture | push-to-talk par défaut, toggle accessible, aucune écoute continue au MVP | faisabilité hotkey/release et a11y à prouver | `DONE` — D-07 confirmée |
| DEC-008 | approuver politique d'historique | zero-history par défaut; texte local opt-in à rétention configurable; aucun audio persisté par défaut | threat model et contrôles de purge | `DONE` — D-08 confirmée |
| DEC-009 | décider obligation de compte | aucun compte requis pour installer ou utiliser le chemin local | tests offline | `DONE` — D-09 confirmée |
| DEC-010 | décider Cloud dans le MVP | absent; contrats/ports seulement, sans implémentation distante | tests de frontière réseau | `DONE` — D-10 confirmée |
| DEC-011 | décider visibilité du dépôt | dépôt public | revue sécurité de l'historique | `DONE` — D-11 confirmée |
| DEC-012 | choisir la licence | Apache-2.0 pour le code; licences propres pour modèles, données et marques | licence matérialisée par le manager; revue des dépendances | `DONE` — D-12 confirmée |
| DEC-013 | choisir le modèle économique | cœur local gratuit; futurs Cloud/sync facultatifs payants | frontière commerciale future | `DONE` — D-13 confirmée |
| DEC-014 | statuer sur l'application WPF | greenfield; aucune migration sans dépôt ou inventaire fourni | nouvel ADR si une source externe apparaît | `DONE` — D-14 confirmée |
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

## 4. P0 — parcours MVP

| ID | User story / capacité | Critères principaux | Dépendances | État |
|---|---|---|---|---|
| MVP-001 | configurer microphone, modèle et langue | validation locale, erreurs récupérables, persistance définie | SPIKE-001/002/006 | `BLOCKED` |
| MVP-002 | déclencher et visualiser une dictée | états accessibles, budget d'armement, aucun focus volé | SPIKE-003/004 | `BLOCKED` |
| MVP-003 | transcrire localement | budget ASR approuvé et mode offline testé sans compte | SPIKE-001/002 | `BLOCKED` |
| MVP-004 | remettre le texte | voie compatible + L1/L0; cible revalidée | SPIKE-005 | `BLOCKED` |
| MVP-005 | récupérer après échec | texte brut copiable dans 100 % des cas où il existe | MVP-003/004 | `BLOCKED` |
| MVP-006 | diagnostiquer permission/périphérique/modèle | cause, impact et action sans contenu sensible | GOV-002, spikes | `BLOCKED` |
| MVP-007 | supprimer données et modèles | comportement conforme à D-08, espace libéré vérifié | SPIKE-006/007 | `BLOCKED` |
| MVP-008 | démonstration E2E de référence | parcours PRD + budgets + fallback + réseau coupé, sans compte ni Cloud | MVP-001..007 | `BLOCKED` |

## 5. P1 — V1 proposée

| ID | Epic | Valeur à prouver avant entrée | Risque/rollback |
|---|---|---|---|
| V1-001 | deuxième puis troisième plateforme | demande du persona et machine de test disponible | adaptateurs isolés; ne pas dégrader la référence |
| V1-002 | dictionnaire personnel | erreurs de noms propres fréquentes et mesurées | désactivation par profil; brut intact |
| V1-003 | profils par application | formatage répétitif observé | profil explicite; défaut neutre |
| V1-004 | historique textuel local | opt-in explicite avec rétention configurable, le défaut restant zero-history | désactivable, purge/migration testées |
| V1-005 | réécriture optionnelle | besoin mesuré et mécanisme d'évaluation | diff/fallback déterministe vers brut |
| V1-006 | accélération matérielle | gain significatif sur profils nommés | backend CPU conservé lorsque viable |
| V1-007 | packaging et mises à jour signées | canal bêta et clés gérées | canal/version précédente conservés |
| V1-008 | Cloud/synchronisation futurs payants | nouveau cadrage produit + threat model + budget | facultatifs, feature flag et chemin local indépendant sans compte |
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
| backend prématuré | implémentation distante au MVP ou infrastructure distribuée avant besoin mesuré | V1-008, FUT-007 conditionnés |
| incompatibilité Apache-2.0 | dépendance, modèle ou actif redistribué sous termes incompatibles | SEC-001 + revue avant intégration |
| source WPF externe découverte tardivement | données ou core réutilisables révélés après fondation | inventaire borné + nouvel ADR; aucune migration implicite |

## 8. Ordre recommandé du prochain travail

1. Établir la disponibilité et l'identité de la machine macOS Apple Silicon de référence; à défaut, enregistrer Windows comme référence pratique.
2. Versionner corpus français, normalisation et budgets provisoires.
3. Valider threat model v0 et contrôles de rétention/suppression selon D-08 à D-10.
4. Laisser le manager réévaluer et fermer le Gate 00 avec preuves.
5. Après autorisation explicite de la phase suivante, figer les contrats en ARC-001.
6. Exécuter les spikes de risque avant l'implémentation parallèle.
7. Construire une seule tranche E2E sur la plateforme de référence.
8. Étendre vers Linux puis Windows seulement après résultats mesurés et revue des fallbacks.
