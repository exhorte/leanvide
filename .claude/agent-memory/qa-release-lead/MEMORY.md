# Memoire qa-release-lead

- Aucune baseline executable n'existe encore (Phase 00, 2026-08-09).
- Les contrats QA de cadrage vivent sous `docs/quality/`: budgets proposes,
  plan de mesure reproductible, DoD et matrice cross-platform.
- Ne pas figer les seuils definitifs avant les prototypes Phase 02 : moteur et
  modele ASR, VAD, corpus/normaliseur, materiel de reference et capabilities
  Wayland restent a confirmer.
- Toute demande de correctif QA doit etre precedee d'un cas reproductible
  (commande, environnement, sortie, artefact); escalader flakiness systemique
  et rollback complexe.
