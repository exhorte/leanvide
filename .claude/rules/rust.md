---
paths:
  - "crates/**/*.rs"
  - "apps/desktop/src-tauri/**/*.rs"
---

# Regles Rust

- Le callback audio ne bloque jamais: pas d'I/O, log, allocation evitables, mutex ou appel reseau.
- Utiliser un ring buffer SPSC et deplacer VAD, ASR et persistance sur des workers.
- Toute integration OS passe par un trait et un adaptateur de plateforme testable.
- Les frontieres IPC utilisent des types Serde explicites et des erreurs structurees.
- Interdire `unsafe` sauf encapsulation minimale documentee, testee et revue par security-reviewer.
- Mesurer avant d'optimiser; conserver les benchmarks reproductibles.

