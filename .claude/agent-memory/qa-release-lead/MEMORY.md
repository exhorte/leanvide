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
- Le budget utilisateur `fin de parole -> texte brut disponible` est distinct
  du flush PTT/VAD : scenario 10 s, p50 <= 1.0 s et p95 <= 2.5 s restent des
  cibles candidates tant que les decisions et prototypes ne sont pas clos.
- Le 2026-08-09, l'utilisateur a confirme D-01 a D-14. Pour QA: reference
  macOS Apple Silicon (MacBook Air M2 16 Gio propose si disponible), ordre de
  validation macOS puis Linux puis Windows, francais MVP, plancher provisoire
  4 coeurs modernes/8 Gio RAM/2 Gio libres/GPU non requis et reference 16 Gio.
- Si la machine macOS de reference n'est pas disponible, Windows devient la
  reference pratique de mesure. Ne pas presumer la disponibilite reelle; ce
  repli ne modifie pas l'ordre produit macOS puis Linux puis Windows lorsque
  macOS peut servir de baseline.
- Le MVP est PTT par defaut avec toggle accessible, sans ecoute continue; il
  est local sans compte ni Cloud, en zero-history par defaut. Un historique
  texte local est opt-in avec retention configurable; aucun audio ne persiste.
  Ces choix produit ne sont pas des resultats de benchmark: tous les seuils
  restent candidats jusqu'aux prototypes Phase 02.
