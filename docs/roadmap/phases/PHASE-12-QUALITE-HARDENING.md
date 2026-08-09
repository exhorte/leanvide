# Phase 12 — Qualite, performance et hardening

## But

Prouver que l'ensemble integre respecte les exigences produit, securite et performance.

## Responsables

- Lead: `qa-release-lead`
- Securite: `security-reviewer`
- Performance: `performance-benchmarker`
- Corrections: leads proprietaires

## Travaux

1. Completer tests unitaires, contrats, integration et end-to-end.
2. Executer matrice OS, materiel, microphone, application cible et langues.
3. Lancer soak tests audio, suspend/resume, changements de device et longues sessions.
4. Mesurer demarrage, memoire, CPU, energie, latence et WER contre baselines.
5. Tester accessibilite, localisation et themes.
6. Auditer dependances npm/cargo/python et licences de modeles.
7. Realiser threat-model review, fuzzing des frontieres et tests updater.
8. Verifier migrations, sauvegardes, rollback et comportement offline.
9. Trier crashes, flakiness et erreurs UX avec seuils de sortie.
10. Geler API/IPC MVP et preparer release candidate.

## Gate 12

- [ ] Zero vulnerabilite critique/haute non acceptee.
- [ ] Zero bug bloquant; seuil defini pour bugs majeurs.
- [ ] Budgets p95 de performance respectes sur materiels cibles.
- [ ] Matrice de compatibilite publiee et verifiee.
- [ ] Release candidate reproductible depuis CI.

