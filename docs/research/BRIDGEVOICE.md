# BridgeVoice — constats normalises

Consultation : 2026-08-09. Sources : documentation et changelog edites par BridgeMind ; les performances sont donc des declarations fournisseur.

| Affirmation | Source directe | Date/version | Nature | Certitude | Consequence Fluent |
|---|---|---|---|---|---|
| BridgeVoice cible macOS, Windows et Linux et declare etre construit avec Tauri 2 et Rust. | [Produit BridgeVoice](https://www.bridgemind.ai/products/bridgevoice) | consulte le 2026-08-09 | fait (declaration fournisseur) | haute | Confirme que Tauri 2/Rust est une piste plausible multiplateforme, a valider par spikes Fluent. |
| Le produit propose Whisper et NVIDIA Parakeet V3 localement, et Whisper Large-v3-Turbo via Groq en option Cloud. | [Produit BridgeVoice](https://www.bridgemind.ai/products/bridgevoice) | consulte le 2026-08-09 | fait (declaration fournisseur) | haute | Garder une abstraction ASR ; commencer par whisper.cpp puis comparer un moteur multilingue dans une evaluation separee. |
| En mode local, le fournisseur affirme que l'audio reste sur l'appareil ; le mode Cloud utilise HTTPS. | [Produit BridgeVoice](https://www.bridgemind.ai/products/bridgevoice) | consulte le 2026-08-09 | fait (declaration fournisseur) | moyenne | Le selecteur local/Cloud Fluent doit etre explicite, avec aucune transmission sans consentement. |
| L'injection documentee utilise presse-papiers puis Cmd+V/Ctrl+V. | [Documentation BridgeVoice](https://docs.bridgemind.ai/docs/bridgevoice) | consulte le 2026-08-09 | fait | haute | Concevoir une strategie injection = capture cible, collage, verification/fallback ; ne pas promettre l'universalite sous Wayland. |
| Le widget a des etats idle/listening/processing et une visualisation audio ; Push-to-Talk et Toggle sont proposes. | [Documentation BridgeVoice](https://docs.bridgemind.ai/docs/bridgevoice) | consulte le 2026-08-09 | fait | haute | Stabiliser un automate d'etats compact et un widget independant du dashboard. |
| Le changelog 2.5.3 decrit une auto-recuperation du micro silencieux, un durcissement PTT et la re-resolution de cible Windows. | [Changelog BridgeVoice 2.5.3](https://www.bridgemind.ai/changelog) | v2.5.3, 2026-06-12, consulte le 2026-08-09 | fait (retour fournisseur) | moyenne | Inclure tests de panne micro, key-up fantome et fenetre cible detruite dans les prototypes plateformes. |
| Le changelog 2.2.57 decrit le code splitting par WebView et une onde isolee/coalessee par frame. | [Changelog BridgeVoice 2.2.57](https://www.bridgemind.ai/changelog) | v2.2.57, 2026-06-10, consulte le 2026-08-09 | fait (retour fournisseur) | moyenne | Budgeter le demarrage du widget et isoler ses rendus haute frequence. |

## Limites connues

Les APIs natives exactes, crates, format de stockage local et details du ring buffer ne sont pas publies. Les utiliser comme recommandations d'architecture serait une inference ; les presenter comme implementation BridgeVoice serait excessif.
