# Phase 04 — Core audio Rust

## But

Fournir une capture audio fiable, deterministe et observable sans compromettre le temps reel.

## Responsables

- Lead: `rust-core-lead`
- Mesures: `performance-benchmarker`
- Verification: `qa-release-lead`

## Travaux

1. Enumerer microphones et gerer selection, changement et disparition.
2. Construire callback minimal vers ring buffer SPSC prealloue.
3. Normaliser format, canaux et sample rate hors callback.
4. Implementer pre-roll, niveaux, clipping et detection de silence.
5. Integrer VAD derriere interface configurable.
6. Implementer demarrage/arret/cancel et watchdogs bornes.
7. Reconstituer automatiquement les streams morts ou silencieux.
8. Exposer evenements UI agreges sans saturer IPC.
9. Ajouter fixtures audio deterministes, tests de longue duree et fault injection.
10. Mesurer pertes, jitter, CPU, memoire et latence p50/p95/p99.

## Livrables

- crate audio documentee;
- machine a etats integree;
- simulateur/fixtures;
- benchmarks reproductibles;
- diagnostics expurges.

## Gate 04

- [ ] Aucune allocation/I/O/mutex bloquant dans le callback.
- [ ] Aucun echantillon perdu dans le stress test cible.
- [ ] Microphone debranche/rebranche recupere sans redemarrage applicatif.
- [ ] Annulation et relachements manques ne laissent jamais un enregistrement bloque.
- [ ] Budgets CPU/memoire/latence de Phase 00 respectes ou ADR de deviation valide.

