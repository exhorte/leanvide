# Registre de preuves concurrentielles

Date de consultation pour chaque entree : 2026-08-09. `Fournisseur` signifie que le fait est publie par l'editeur, sans audit independant.

| ID | Source directe | Version/date publiee | Assertions exploitees | Niveau | Nature | Consequence Fluent |
|---|---|---|---|---|---|---|
| WF-01 | [Wispr — Platform Engineer](https://jobs.ashbyhq.com/wispr-flow/c5df87d4-73df-467c-91ca-db9a0da64a0a) | page active | Stack plateforme ; modeles deployes ; cible P50 annoncee | haute pour stack, moyenne pour perf | fournisseur | Cloud facultatif modulaire ; mesures Fluent propres. |
| WF-02 | [Wispr — Privacy Mode](https://docs.wisprflow.ai/articles/4709791908-understanding-privacy-mode-and-cloud-sync) | maj. env. 2026-08-07 | Deux controles confidentialite | haute | fournisseur | Consentements separes. |
| WF-03 | [Wispr — Security FAQ](https://docs.wisprflow.ai/articles/3467817258-security-and-compliance-faq) | maj. env. 2026-07-30 | retention, dictionnaire, contexte accessibilite/OCR | haute | fournisseur | Minimisation du contexte, OCR hors MVP. |
| BV-01 | [BridgeVoice produit](https://www.bridgemind.ai/products/bridgevoice) | page active | Tauri 2/Rust, ASR local/Cloud, plateformes, objectifs de perf | haute pour stack, moyenne pour perf | fournisseur | Spikes Tauri/Rust et ASR interchangeable. |
| BV-02 | [BridgeVoice docs](https://docs.bridgemind.ai/docs/bridgevoice) | page active | PTT/Toggle, injection, widget, dictionnaire, historique | haute | fournisseur | Automate widget et fallback clipboard. |
| BV-03 | [BridgeMind changelog](https://www.bridgemind.ai/changelog) | BridgeVoice 2.2.57/2.5.3, 2026-06-10/12 | recovery micro, PTT, focus, code splitting | moyenne | fournisseur, retour de version | Tests de resilience et budgets UI. |

## Regle d'usage

Une preuve fournisseur etablit ce que son editeur affirme/documente, non une garantie independante. Aucune source de retro-ingenierie n'est employee dans ce registre. Toute decision de stack Fluent reste une recommandation et requiert les ADR/prototypes prevus par la roadmap.
