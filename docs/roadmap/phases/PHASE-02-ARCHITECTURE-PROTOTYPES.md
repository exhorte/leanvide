# Phase 02 — Architecture et prototypes de risque

## But

Eliminer les inconnues les plus dangereuses avant de construire le produit complet.

## Responsables

- Lead: `product-architect`
- Spikes: `rust-core-lead`, `platform-lead`, `ai-asr-lead`, `frontend-lead`

## Travaux

1. Definir diagrammes de composants, flux, threads et donnees.
2. Specifier la machine a etats: Idle, Arming, Listening, Finalizing, Transcribing, Rewriting, ValidatingTarget, Injecting, Error, Cancelled.
3. Prototyper capture audio + ring buffer sans UI.
4. Prototyper chargement whisper.cpp et transcription d'un fixture.
5. Tester hotkey, capture de cible et collage sur chaque OS prioritaire.
6. Mesurer cout de deux WebViews/bundles et demarrage du widget.
7. Valider SQLite, coffre de secrets et format des migrations.
8. Definir traits `AudioSource`, `TranscriptionEngine`, `PlatformAdapter`, `TextInjector`, `SettingsStore`.
9. Specifier versionnement des commandes/evenements IPC.
10. Documenter limites Wayland et permissions macOS avec preuves.

## Livrables

- ADR architecture modulaire;
- contrats Rust et IPC;
- prototypes jetables ou promus explicitement;
- baseline de performance;
- matrice de faisabilite OS;
- liste des risques retires, reduits ou ouverts.

## Gate 02

- [ ] Aucun risque critique de faisabilite sans mitigation.
- [ ] Les contrats permettent de remplacer ASR et plateformes.
- [ ] Le callback audio respecte les invariants temps reel sous stress.
- [ ] Une transcription locale et une injection de preuve fonctionnent sur la plateforme de reference.
- [ ] Les ADR precisent les compromis et retours arriere.

