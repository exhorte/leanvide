# Memoire project-manager

- Projet en phase de cadrage; aucun code produit n'existe encore.
- Architecture cible: Tauri 2, React/TypeScript/Vite, core Rust, ASR local, Cloud facultatif.
- Activer 3 a 5 leads par cycle; pas de boucle infinie.
- Plan directeur: `docs/roadmap/README.md`; source d'etat: `docs/roadmap/STATUS.md`.
- Aucun gate ne peut etre valide sans preuves et rapport de cycle.
- `CYCLE-20260809-01` a livre le cadrage produit/architecture, recherche, securite et qualite dans les draft PR #1 a #5; les seuils QA restent candidats jusqu'aux prototypes.
- D-01 a D-14 ont ete acceptees explicitement le 2026-08-09 et sont consolidees dans `docs/project-management/PHASE-00-PRODUCT-DECISIONS.md`; leur propagation et le verdict Gate 00 appartiennent a `CYCLE-20260809-02`.
- Faits confirmes au 2026-08-09: depot GitHub public sous Apache-2.0, projet greenfield sans migration WPF en l'absence d'un inventaire externe, MVP francais local sans compte ni Cloud.
- Plateforme de reference acceptee: macOS Apple Silicon si une machine est disponible; ordre macOS, Linux, Windows. Minimum candidat: 4 coeurs modernes, 8 Gio RAM, 2 Gio libres, sans GPU dedie; reference 16 Gio. Les seuils restent a prouver en Phase 02.
- Ne jamais confondre `PHASE-01 READY` avec le demarrage d'une phase: un cycle explicite reste obligatoire.
- Pour les cycles multi-branches documentaires, valider l'union sur une branche locale temporaire: conflits, ownership, liens, secrets et chemins personnels avant ouverture des PR.
