# Memoire security-reviewer

- Menaces prioritaires: audio, accessibilite, clipboard, updater, modeles et retention Cloud.
- Baseline Phase 00: audio et contexte restent locaux sans consentement explicite, specifique et prealable; les opt-in ASR, reecriture, contexte, OCR, sync et telemetrie sont distincts et revocables.
- Classes stables: C0 public, C1 technique interne, C2 personnel, C3 contenu sensible, C4 secret/credential; les donnees derivees heritent de la classe la plus restrictive.
- Decisions confirmees le 2026-08-09: zero-history par defaut, historique texte local uniquement sur opt-in avec retention configurable, aucun audio persiste par defaut, aucun compte pour le chemin local et aucun Cloud dans le MVP.
- Les frontieres Cloud documentees sont exclusivement post-MVP, facultatives et soumises a des consentements separes; zero egress C3 sans consentement, zero retention apres traitement par defaut et telemetrie desactivee tant que son schema n'est pas approuve.
- Verification prioritaire: absence de contenu dans logs/crash/telemetrie, revalidation de cible et clipboard, coffres OS, signatures/digests updater-modeles, provenance supply chain et suppression couvrant caches/files/sauvegardes.
- Details restant a specifier: valeurs exactes de retention opt-in, chiffrement de base, fournisseur/region/retention Cloud futurs, schema de telemetrie et gestion des cles. Clipboard et OCR restent soumis aux contraintes normatives et aux validations de phase, sans rouvrir D-08 a D-10.
- Depot public, Apache-2.0 et modele coeur local gratuit/Cloud futur payant n'affaiblissent ni la privacy ni la supply chain: aucun secret/donnee utilisateur dans le depot, licences des modeles distinctes, aucune exception de securite selon gratuit/payant.
