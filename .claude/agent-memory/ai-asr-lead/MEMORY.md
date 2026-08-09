# Memoire ai-asr-lead

- whisper.cpp est le premier moteur cible; Parakeet reste conditionne a un benchmark.
- Le plan executable Phase 02 est `docs/asr/PHASE-02-LOCAL-ASR-SPIKE-PLAN.md`: aucun moteur ne peut entrer sans benchmark reproductible, provenance, digests, licences, SBOM et matrice materielle avec fallback CPU.
- Baseline de recherche au 2026-08-09: whisper.cpp `v1.9.2` commit `306c88f4d1286aec1bf96e544632897886af5501`; depot GGML epingle a `5359861c739e955e79d9a303bcbc70fb988958b1`. Le script upstream mutable sans verification de digest n'est pas une acquisition qualifiante.
- Separer strictement `RawTranscript` fidele et immuable, normalisation deterministe versionnee, puis reecriture generative distincte avec fallback exact au brut.
- Contrat provisoire: `AudioSegmentLease` final/continu/deplace et lie a `SessionId`/`Epoch`; un segment en vol, `Busy` sans spool; annulation atomique et resultats tardifs invalides par epoch.
- Fixture smoke candidate: audio Wikimedia Commons CC0 « quand le chat n'est pas la... », derive 10 s seulement apres verification et SHA-256 reel. Corpus de precision candidat: FLEURS `fr_fr` CC-BY-4.0 revision `70bb2e84b976b7e960aa89f1c648e09c59f894dd`; parole lue, donc insuffisante seule pour le Gate 05.
- Decisions ouvertes: materiel macOS/plancher 8 Gio reel, binding Rust et exception `unsafe` eventuelle, modele/quantification, acceleration par OS, seuils apres mesure, corpus dictee spontanee/metier, catalogue et revocation des modeles.
