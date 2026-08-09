# Memoire rust-core-lead

- Chemin audio sans blocage; ring buffer SPSC; workers pour VAD et ASR.
- Fondation PHASE-01: workspace Rust 1.97.1, edition 2024, `tauri` 2.11.5 et `tauri-build` 2.6.3 verrouilles exactement.
- Le shell Tauri vit sous `apps/desktop/src-tauri`; le domaine testable et independant de Tauri sous `crates/core`.
- Contrat IPC de fondation: `health_check` sans requete retourne `{ status: "ok", version: string }`; aucun contenu utilisateur, secret, log ou reseau.
- L'identifiant `io.github.exhorte.fluent` reste strictement provisoire et le bundling est desactive jusqu'aux travaux de packaging.
- Aucun chemin audio/ASR/OS/stockage/Cloud n'est introduit en PHASE-01; les contrats correspondants restent a figer en PHASE-02.
- `tauri-build` genere `apps/desktop/src-tauri/gen/schemas/**`; ces artefacts ne doivent pas etre commits et la regle d'ignore appartient au lot QA.
