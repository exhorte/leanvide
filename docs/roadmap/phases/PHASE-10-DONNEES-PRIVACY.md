# Phase 10 — Donnees locales, securite et confidentialite

## But

Rendre les garanties local-first verifiables dans le produit et le code.

## Responsables

- Lead technique: `rust-core-lead`
- Controle: `security-reviewer`
- UX: `frontend-lead`

## Travaux

1. Definir schema SQLite, migrations, sauvegarde et recuperation.
2. Separer preferences, historique, dictionnaire, stats et manifestes de modeles.
3. Utiliser Keychain, Secret Service/KWallet et Credential Manager.
4. Rendre historique, retention et telemetrie desactivables.
5. Implementer export et suppression complets des donnees.
6. Rediger threat model detaille et flux de donnees actualises.
7. Expurger logs, crash reports et metriques.
8. Proteger updater, manifestes et modeles par signature/checksum.
9. Tester corruption DB, disque plein, migration interrompue et permissions fichiers.
10. Produire notice de confidentialite correspondant exactement au comportement.

## Gate 10

- [ ] Aucun secret stocke en clair.
- [ ] Suppression/export verifies par tests.
- [ ] Mode zero-history et zero-telemetry fonctionnel.
- [ ] Logs de tests ne contiennent ni audio ni texte dicte sensible.
- [ ] Threat model revu et aucun risque critique ouvert sans acceptation.

