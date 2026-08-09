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

Chaque risque recoit ensuite: date de revue, indicateurs, plan de contingence et statut.

