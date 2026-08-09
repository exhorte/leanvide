# Memoire product-architect

- Initialiser les ADR avant les decisions difficilement reversibles.
- Le cadrage Phase 00 distingue systematiquement contrainte normative, fait observe, hypothese, recommandation et decision utilisateur confirmee.
- D-01 a D-14 ont ete explicitement acceptees telles que recommandees par l'utilisateur le 2026-08-09; la preuve canonique est le registre manager `docs/project-management/PHASE-00-PRODUCT-DECISIONS.md` et `CYCLE-20260809-02`.
- Le produit s'appelle Fluent et vise d'abord le professionnel desktop a forte production ecrite, sensible a la confidentialite. Le MVP est francais, en push-to-talk par defaut avec toggle accessible, sans ecoute continue.
- La reference est macOS Apple Silicon si une machine de test est disponible; a defaut Windows devient la reference pratique. L'ordre produit reste macOS, Linux, Windows. Ne pas pretendre que la disponibilite materielle est deja prouvee.
- Le minimum provisoire est 4 coeurs modernes, 8 Gio de RAM et 2 Gio libres, sans GPU dedie requis; la reference vise 16 Gio. Les seuils et le support definitif restent a qualifier par les prototypes de Phase 02.
- Le defaut est zero-history; l'historique texte local est opt-in avec retention configurable et aucun audio n'est persiste par defaut. Aucun compte n'est requis pour le chemin local et le Cloud est absent du MVP, avec seulement des ports sans implementation distante.
- Le depot reste public, le code adopte Apache-2.0, le coeur local est gratuit et de futurs services Cloud/synchronisation facultatifs seront payants. Les dependances, modeles, donnees, marques et frontieres commerciales gardent leurs validations propres.
- Fluent est greenfield: aucune migration WPF sans depot ou inventaire externe fourni et nouvel ADR.
- Le support Linux doit separer X11 et Wayland; sous Wayland, documenter les capacites par compositor et maintenir un fallback recuperable sans promettre l'injection universelle.
- L'ADR de stack retient Tauri 2, React/TypeScript/Vite, coeur Rust, moteur ASR interchangeable, SQLite local et Cloud facultatif, avec revalidation au gate de Phase 02.
- Aucun artefact WPF n'existe dans le depot actuel; cela ne prouve pas l'absence d'une source externe mais ne change pas le cadrage greenfield sans inventaire et nouvel ADR.
- `docs/quality/PERFORMANCE-BUDGETS.md` est la source canonique des seuils et protocoles quantitatifs; les documents produit decrivent les observables et lient cette source sans recopier les chiffres.
