# Synthese competitive — implications pour Fluent

Consultation : 2026-08-09. Cette synthese ne transpose pas des affirmations marketing en garanties techniques.

| Sujet | Wispr Flow | BridgeVoice | Type/certitude | Recommandation Fluent |
|---|---|---|---|---|
| Confidentialite | Pipeline Cloud avec controles distincts pour entrainement et conservation. | Voie locale publiee, Cloud optionnel. | faits fournisseur, haute/moyenne | Local par defaut, consentements granulairement separes pour Cloud, sync, retention et amelioration. |
| ASR | Modeles vocaux proprietaires deploiement serveur annonces. | whisper.cpp/Parakeet local et Groq Cloud annonces. | faits fournisseur, moyenne/haute | Trait `AsrEngine`, mesure WER/RTF/latence avant selection ; aucun verrou fournisseur. |
| Insertion | Non documentee dans les sources retenues. | Presse-papiers + raccourci de collage. | fait, haute | Capture de cible avant dictee, revalidation avant injection, texte conserve au presse-papiers en fallback. |
| Contexte | Accessibilite par defaut, OCR opt-in. | Non retenu comme element documente. | fait, haute | Contextualisation accessible minimale et opt-in par application ; OCR hors MVP. |
| UX | Valeur : texte final pret a envoyer. | PTT/Toggle et widget a etats explicites. | fait, haute | Widget leger, dashboard charge a la demande, automate deterministe `idle → recording → processing → success/error`. |
| Resilience | Non evaluee publiquement dans cette recherche. | Changelog : micro, PTT, focus et mise a jour durcis. | fait fournisseur, moyenne | Spikes et tests de recuperation pour micro, hotkey, focus et injection. |

## Architecture cible recommandee (recommandation, certitude : moyenne)

```text
Widget WebView minimal + dashboard React/TypeScript charge a la demande
                         │ IPC type et versionne
Rust : automate / hotkey / capture / buffer SPSC / injection / SQLite
                         │
              ASR local par defaut (whisper.cpp derriere trait)
                         │
      passerelle Cloud facultative, consentie, remplaçable et sans audio par defaut
```

Consequences : ne pas adopter la plateforme Cloud de Wispr (Temporal/SQS/Redis) en phase 00 ; elle repond a une echelle non demontree pour Fluent. Ne pas deduire une injection universelle Wayland du precedent BridgeVoice : le fallback explicite presse-papiers reste obligatoire (R-001).

## Priorites de prototype

1. Audio : callback sans I/O/log/verrou bloquant, buffer SPSC et mesures de pertes/latence.
2. Plateformes : permissions, PTT, capture/revalidation de cible, puis matrice X11/Wayland avec fallback.
3. ASR : benchmark materiels de reference, RTF/WER/memoire et telechargement verifie des modeles.
4. UX : widget froid rapide et renderer de niveau audio isole.
5. Donnees : texte brut deterministe conserve avant toute reecriture ; Cloud et contexte toujours opt-in.

