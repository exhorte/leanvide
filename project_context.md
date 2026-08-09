# Fluent Multiplatform — contexte de projet normalise

Mis a jour : 2026-08-09. La roadmap sous `docs/roadmap/` est normative ; ce fichier est un contexte concis et non une specification.

## Mission

Fluent est une application de dictee vocale multiplateforme, local-first, avec Tauri 2, React/TypeScript/Vite, un coeur Rust et un backend Cloud strictement facultatif. Le premier moteur local vise whisper.cpp, derriere une interface stable permettant des comparaisons mesurees.

## Principes non negociables

- L'audio ne quitte jamais l'appareil sans consentement explicite.
- Le texte brut deterministe reste disponible lorsque toute reecriture echoue.
- Sous Wayland, aucune promesse d'injection universelle : fallback explicite requis.
- Le callback audio ne fait ni I/O, ni journalisation synchrone, ni verrou bloquant.
- Les choix structurants passent par ADR et prototypes mesures.

## Direction de produit

- Boucle prioritaire : hotkey → capture → transcription locale → injection/fallback → feedback clair.
- Widget flottant minimal ; dashboard React charge a la demande.
- Dictionnaire, profils contextuels et historique restent locaux avant toute synchronisation consentie.
- Le Cloud, s'il existe, est une passerelle remplaçable pour sync/reecriture/ASR, jamais une dependance du parcours local.

## Etat de recherche

Les constats concurrents et leur niveau de confiance sont dans `docs/research/`. Ne pas reprendre les analyses non sourcees d'anciennes notes comme des faits (framework client Wispr, helpers natifs, fournisseurs LLM, stockage exact ou APIs OS).

## Etat de la roadmap

PHASE-00 est `READY` au 2026-08-09. Les decisions de plateforme, de metriques, de threat model et de stack attendent les livrables et gates de cette phase.
