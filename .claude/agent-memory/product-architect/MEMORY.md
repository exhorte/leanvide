# Memoire product-architect

- Initialiser les ADR avant les decisions difficilement reversibles.
- Le cadrage Phase 00 distingue systematiquement contrainte normative, fait observe, hypothese, recommandation et decision utilisateur confirmee.
- Les decisions produit D-01 a D-14 restent ouvertes tant qu'une reponse explicite et datee ne les ferme pas; un etat du depot ne vaut pas decision.
- Le support Linux doit separer X11 et Wayland; sous Wayland, documenter les capacites par compositor et maintenir un fallback recuperable sans promettre l'injection universelle.
- L'ADR de stack retient Tauri 2, React/TypeScript/Vite, coeur Rust, moteur ASR interchangeable, SQLite local et Cloud facultatif, avec revalidation au gate de Phase 02.
- L'eventuelle application WPF externe n'est pas etablie: aucun artefact WPF n'existe dans le depot actuel, ce qui ne prouve pas son absence ailleurs.
- `docs/quality/PERFORMANCE-BUDGETS.md` est la source canonique des seuils et protocoles quantitatifs; les documents produit decrivent les observables et lient cette source sans recopier les chiffres.
