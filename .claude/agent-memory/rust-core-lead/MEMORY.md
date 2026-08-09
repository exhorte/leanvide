# Memoire rust-core-lead

- Chemin audio sans blocage; ring buffer SPSC; workers pour VAD et ASR.
- Fondation PHASE-01: workspace Rust 1.97.1, edition 2024, `tauri` 2.11.5 et `tauri-build` 2.6.3 verrouilles exactement.
- Le shell Tauri vit sous `apps/desktop/src-tauri`; le domaine testable et independant de Tauri sous `crates/core`.
- Contrat IPC de fondation: `health_check` sans requete retourne `{ status: "ok", version: string }`; aucun contenu utilisateur, secret, log ou reseau.
- L'identifiant `io.github.exhorte.fluent` reste strictement provisoire et le bundling est desactive jusqu'aux travaux de packaging.
- Aucun chemin audio/ASR/OS/stockage/Cloud n'est introduit en PHASE-01; les contrats correspondants restent a figer en PHASE-02.
- `tauri-build` genere `apps/desktop/src-tauri/gen/schemas/**`; ces artefacts ne doivent pas etre commits et la regle d'ignore appartient au lot QA.
- Les builds desktop Tauri exigent les deux derives du placeholder: `icon.ico` sous Windows et `icon.png` sous macOS/Linux; les regenerer ensemble depuis `placeholder.svg` avec la CLI Tauri verrouillee.
- Plan PHASE-02 audio/stockage: `docs/prototypes/PHASE-02-AUDIO-STORAGE-PLAN.md`; il est preparatoire et ne constitue ni implementation, ni resultat de benchmark, ni contrat de port.
- Invariant audio coordonne avec architecture/ASR/plateforme: stream possede par `AudioSource`, buffer OS emprunte copie seulement vers slots SPSC prealloues, format negocie explicite, conversion/downmix/resampling hors callback et lease finalise vers ASR.
- Overflow candidat: refuser le bloc entrant, compter/latcher le trou et invalider la session; aucun segment lacunaire ne peut etre remis comme valide. Annulation par epoch atomique independant de la file; shutdown `cancel -> stop/quiesce -> purge/drain -> join` hors temps reel.
- Le prochain prototype doit prouver zero alloc/dealloc, I/O, log et attente bloquante dans le callback, puis publier sequences, pertes, occupation, p50/p95/p99/max, stress, faults et artefacts sans audio.
- Stockage candidat hors chemin RT: worker unique, reglages C1-C2 uniquement, fixtures jetables, migrations transactionnelles/failpoints, rollback/crash recovery, zero-history/retention et scan des copies possedees. SQLite ne conserve que des handles opaques; secrets factices uniquement dans Keychain/Secret Service-KWallet/Credential Manager selon environnement.
- Les cinq ports sont testes par des doubles prives qui consomment le contrat du product-architect; leurs signatures ne sont jamais redefinies dans le plan Rust. Frontend, plateforme et ASR doivent revoir toute frontiere partagee avant implementation.
- F-01 est toujours present dans le graphe verrouille courant via `glib 0.18.5`; un `cargo tree` ne prouve ni reachability runtime ni inatteignabilite. F-02 exige un inventaire regenere et une allowlist avec owner, expiration et hash de lockfile.
