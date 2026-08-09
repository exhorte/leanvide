# Memoire project-manager

- PHASE-01 est complete: le depot contient un shell Tauri 2/React strict, un coeur Rust minimal, un IPC `health_check` type et une CI Windows/macOS/Linux.
- Architecture cible: Tauri 2, React/TypeScript/Vite, core Rust, ASR local, Cloud facultatif.
- Activer 3 a 5 leads par cycle; pas de boucle infinie.
- Plan directeur: `docs/roadmap/README.md`; source d'etat: `docs/roadmap/STATUS.md`.
- Aucun gate ne peut etre valide sans preuves et rapport de cycle.
- `CYCLE-20260809-01` a livre le cadrage produit/architecture, recherche, securite et qualite dans les draft PR #1 a #5; les seuils QA restent candidats jusqu'aux prototypes.
- D-01 a D-14 ont ete acceptees explicitement le 2026-08-09, consolidees et propagees par `CYCLE-20260809-02`; le Gate 00 est PASS (6/6), PHASE-00 est DONE et PHASE-01 est READY mais non demarree.
- Faits confirmes au 2026-08-09: depot GitHub public sous Apache-2.0, projet greenfield sans migration WPF en l'absence d'un inventaire externe, MVP francais local sans compte ni Cloud.
- Plateforme de reference acceptee: macOS Apple Silicon si une machine est disponible; ordre macOS, Linux, Windows. Minimum candidat: 4 coeurs modernes, 8 Gio RAM, 2 Gio libres, sans GPU dedie; reference 16 Gio. Les seuils restent a prouver en Phase 02.
- Ne jamais confondre `PHASE-01 READY` avec le demarrage d'une phase: un cycle explicite reste obligatoire.
- Pour les cycles multi-branches documentaires, valider l'union sur une branche locale temporaire: conflits, ownership, liens, secrets et chemins personnels avant ouverture des PR.
- Validation d'union CYCLE-20260809-02: cinq branches sans conflit, 18/18 livrables, 29 fichiers uniques sans overlap, 82 Markdown sans lien local casse ni fence desequilibree, scans sensibles PASS; `project_context.md` preserve et `LICENSE` identique au texte Apache-2.0 officiel.
- Le 2026-08-09, l'utilisateur a donne un objectif persistant jusqu'a l'achevement de toutes les phases. Chaque phase reste executee par cycles bornes et gates preuves; cet objectif n'autorise ni boucle aveugle ni contournement d'un blocage securite/permission.
- Les cinq PR de PHASE-00 ont ete fusionnees par squash dans `develop` (`34926a5` en tete apres integration). `CYCLE-20260809-03` ouvre PHASE-01 avec frontend, rust-core et QA, puis revue securite.
- `CYCLE-20260809-03` est COMPLETE: PR #7 a #11 integrees, union locale install/lint/test/check/build PASS, puis CI PR `31328840492` et CI `develop` `31329298017` SUCCESS sur Ubuntu, macOS et Windows.
- Le premier run CI d'union a detecte `icons/icon.png` manquant sur macOS/Linux; le correctif reproductible `70697cd` a ete valide sur les trois OS. Garder la matrice multiplateforme comme gate, meme pour un scaffold minimal.
- Dette supply chain: `glib 0.18.5` transitif Linux/RUSTSEC-2024-0429 (moyen) a reevaluer en PHASE-02 et a resoudre, prouver inatteignable ou accepter par ADR avant Gate 12; automatiser advisories/licences/sources avant Gate 12.
- PHASE-02 est READY mais non active tant qu'un cycle explicite architecture/prototypes n'est pas ouvert.
