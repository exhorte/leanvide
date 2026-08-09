# Memoire security-reviewer

- Menaces prioritaires: audio, accessibilite, clipboard, updater, modeles et retention Cloud.
- Baseline Phase 00: audio et contexte restent locaux sans consentement explicite, specifique et prealable; les opt-in ASR, reecriture, contexte, OCR, sync et telemetrie sont distincts et revocables.
- Classes stables: C0 public, C1 technique interne, C2 personnel, C3 contenu sensible, C4 secret/credential; les donnees derivees heritent de la classe la plus restrictive.
- Defauts conservateurs tant que produit/ADR n'a pas tranche: zero egress C3, zero retention Cloud apres traitement, aucun historique C3 implicite et telemetrie desactivee.
- Verification prioritaire: absence de contenu dans logs/crash/telemetrie, revalidation de cible et clipboard, coffres OS, signatures/digests updater-modeles, provenance supply chain et suppression couvrant caches/files/sauvegardes.
- Les decisions de retention chiffree, clipboard, OCR, fournisseurs/regions Cloud, chiffrement local/E2EE et gestion des cles restent ouvertes.
