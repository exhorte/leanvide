# Registre initial des risques

| ID | Risque | Probabilite | Impact | Proprietaire | Mitigation initiale |
|---|---|---|---|---|---|
| R-001 | Restrictions Wayland sur hotkeys/focus/injection | haute | critique | platform-lead | matrice compositor, portals, fallback clipboard |
| R-002 | Callback audio bloque ou perd des echantillons | moyenne | critique | rust-core-lead | ring buffer SPSC, aucune I/O, stress tests |
| R-003 | Latence ASR excessive sur materiel faible | haute | eleve | ai-asr-lead | profils materiels, modeles adaptatifs, benchmarks p95 |
| R-004 | Hallucination de la reecriture | moyenne | eleve | ai-asr + security | texte brut conserve, opt-in, diff/fallback |
| R-005 | Permissions macOS refusees ou mal expliquees | haute | eleve | platform + frontend | onboarding progressif et diagnostics |
| R-006 | Fuite via audio, accessibilite, OCR ou clipboard | moyenne | critique | security-reviewer | threat model, minimisation, indicateurs visibles |
| R-007 | Taille des modeles et mises a jour couteuses | haute | moyen | ai-asr + QA | manifestes, reprise, checksum, delta si utile |
| R-008 | Conflits de fichiers entre agents | moyenne | eleve | project-manager | ownership par cycle, contrats figes |
| R-009 | Backend surdimensionne trop tot | moyenne | moyen | backend + architect | monolithe modulaire et ADR obligatoire |
| R-010 | Divergence comportementale entre OS | haute | eleve | QA + platform | suites de contrat et matrice de compatibilite |
| R-011 | Supply-chain npm/cargo/modeles | moyenne | critique | security + QA | lockfiles, provenance, checksums, audit |
| R-012 | Cout tokens/coordination des agents | moyenne | moyen | project-manager | 3-5 agents actifs et cycles bornes |
| R-013 | Decisions produit D-01 a D-14 non confirmees | haute | critique | project-manager + utilisateur | registre argumente, Gate 00 bloque, aucune Phase 01 |
| R-014 | Depot public sans licence de code | haute | eleve | project-manager + product-architect | choisir visibilite et licence avant contributions/publication |
| R-015 | Existence et perimetre d'une application WPF externe inconnus | moyenne | eleve | project-manager + platform-lead | inventaire ou confirmation greenfield avant fondation irreversible |
| R-016 | Seuils et materiels candidats non valides par prototype | haute | eleve | QA + ai-asr + platform | confirmer D-03/D-05/D-06, puis baselines reproductibles en Phase 02 |
| R-017 | Preuves concurrentielles principalement publiees par les fournisseurs | moyenne | moyen | docs-researcher + product-architect | registre de preuves, certitude explicite, aucun choix fonde sur le marketing seul |
| R-018 | Liens croises repartis entre plusieurs draft PR | moyenne | moyen | project-manager | valider l'union localement et integrer le lot documentaire de facon coordonnee apres Gate 00 |

Chaque risque recoit ensuite: date de revue, indicateurs, plan de contingence et statut.

## Revue CYCLE-20260809-01 — 2026-08-09

| Risque | Statut | Indicateur ou preuve | Contingence / prochaine revue |
|---|---|---|---|
| R-001 | ouvert | Wayland est separe de X11 dans le PRD, la QA et l'ADR; fallback L1/L0 obligatoire | matrice par compositor en Phase 02/07 |
| R-002 | ouvert | budgets de pertes et contrat callback documentes, aucun prototype executable | stress tests audio apres choix du materiel |
| R-006 | ouvert, controle de conception defini | TM-01 a TM-18, flux et classes C0-C4 dans la draft PR #3 | revalider aux phases 02, 10, 11, 12 et 13 |
| R-008 | mitigation exercee | un edit hors ownership de `project_context.md` sur `work/research` a ete restaure; integration finale: 27 fichiers de branche sans chevauchement | controle automatique d'ownership a chaque cycle |
| R-011 | ouvert | exigences SBOM, signatures, digests et provenance documentees | audit des premieres dependances/modeles en Phase 01/02 |
| R-013 | **bloquant** | aucune des 14 decisions n'est confirmee | attendre l'arbitrage utilisateur; ne pas demarrer Phase 01 |
| R-014 | ouvert, eleve | visibilite GitHub publique confirmee; aucune licence suivie | arbitrage D-11/D-12 avant integration publique organisee |
| R-015 | ouvert | zero artefact `.cs`, `.csproj`, `.sln`, `.xaml` dans ce depot | demander depot/chemin externe ou confirmer greenfield |
| R-016 | ouvert | cibles, protocoles et trois machines candidates documentes; aucune baseline | choix D-03/D-05/D-06 puis prototypes |
| R-017 | mitige | sources directes datees et nature fournisseur explicite dans la draft PR #2 | revalidation lors de toute decision issue d'un concurrent |
| R-018 | mitige avant merge | fusion locale temporaire des cinq branches sans conflit; 18/18 livrables et liens locaux valides | ne fusionner qu'apres arbitrage et revue coordonnee |

## Revue CYCLE-20260809-02 — 2026-08-09

| Risque | Statut | Indicateur ou preuve | Contingence / prochaine revue |
|---|---|---|---|
| R-013 | **clos** | D-01 a D-14 acceptees explicitement et enregistrees dans `docs/project-management/PHASE-00-PRODUCT-DECISIONS.md` | rouvrir uniquement sur demande explicite de changement produit |
| R-014 | **clos pour le Gate 00** | depot public confirme; texte Apache-2.0 officiel ajoute dans `LICENSE` | auditer les licences des dependances, modeles, jeux de donnees et actifs a leur introduction |
| R-015 | **clos pour le perimetre courant** | D-14 confirme le projet greenfield et l'absence de migration WPF sans inventaire externe | rouvrir avant fondation irreversible si un artefact WPF externe est fourni |
| R-016 | ouvert, non bloquant pour Gate 00 | D-03/D-05/D-06 fixent macOS Apple Silicon, le francais et les profils materiels candidats; aucune baseline executable | valider ou reviser les seuils et le minimum materiel par prototypes reproductibles en Phase 02 |
| R-018 | mitige avant merge | branches et draft PR restent separees; nouvelle validation d'union requise apres propagation | integrer seulement apres validation croisee finale et accord de merge distinct |

## Revue CYCLE-20260809-03 — 2026-08-09

| Risque | Statut | Indicateur ou preuve | Contingence / prochaine revue |
|---|---|---|---|
| R-008 | **clos pour PHASE-01** | 47 fichiers de lots uniques, zero overlap; unions et merges Git sans conflit | reconduire ownership et controle d'union a chaque cycle |
| R-010 | mitige pour la fondation | un asset Tauri manquant a d'abord casse macOS/Linux; correction `70697cd`, puis CI SUCCESS sur trois OS deux fois | maintenir la matrice a chaque PR et ajouter les tests natifs des que les adaptateurs existent |
| R-011 | ouvert, non bloquant Gate 01 | dependances directes et lockfiles audites; aucun avis critique/haut; F-01 `glib 0.18.5` moyen et F-03 automatisation d'audit restent ouverts | reevaluer F-01 en PHASE-02; rendre advisories/licences/sources bloquants avant Gate 12 |
| R-016 | ouvert, prochain gate | le shell et l'IPC ont une baseline de build mais aucun budget audio/ASR n'est encore mesure | prototypes reproductibles et baselines materiel en PHASE-02 |
| R-018 | **clos** | tous les lots PHASE-00/01 requis sont integres dans `develop`; CI `31329298017` verte x3 | liens et preuves restent verifies dans chaque cycle suivant |
