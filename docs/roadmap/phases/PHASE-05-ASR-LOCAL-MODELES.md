# Phase 05 — ASR local et gestion des modeles

## But

Transformer l'audio en texte local avec precision, latence et consommation mesurables.

## Responsables

- Lead: `ai-asr-lead`
- Integration: `rust-core-lead`
- Benchmarks: `performance-benchmarker`
- Securite: `security-reviewer`

## Travaux

1. Implementer `TranscriptionEngine` et premiere integration whisper.cpp.
2. Detecter CPU/GPU/Metal et choisir un profil compatible.
3. Definir catalogue de modeles, tailles, langues, licences et exigences RAM.
4. Implementer telechargement reprenable, checksum, espace disque et suppression.
5. Ajouter warm-up, chargement paresseux, cache et liberation memoire.
6. Integrer VAD, decoupage, langue auto/manuelle et timestamps internes.
7. Creer corpus d'evaluation representatif et versionne sans donnees sensibles.
8. Mesurer WER/CER, RTF, latence, energie et memoire par classe materielle.
9. Tester bruit, silence, accents, code-switching et longues dictees.
10. Evaluer Parakeet uniquement derriere le meme contrat et sans engagement premature.

## Livrables

- transcription locale end-to-end;
- gestionnaire de modeles;
- matrice modele/materiel/langue;
- corpus et rapport de benchmark;
- fallback clair si aucun moteur n'est disponible.

## Gate 05

- [ ] Le moteur fonctionne entierement hors ligne apres telechargement.
- [ ] Modeles verifies cryptographiquement et licences documentees.
- [ ] Precision et latence atteignent les seuils MVP sur materiel de reference.
- [ ] Echec/annulation ne perd pas l'audio ou ne bloque pas l'UI.
- [ ] Ajout d'un second moteur ne requiert pas de modifier le frontend.

