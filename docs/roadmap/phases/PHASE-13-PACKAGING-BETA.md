# Phase 13 — Packaging et beta

## But

Valider installation, mise a jour et usage reel avant diffusion stable.

## Responsables

- Lead: `qa-release-lead`
- Packaging: `platform-lead`
- Coordination beta: `project-manager`
- Triage: tous les leads

## Travaux

1. Produire artefacts signes: macOS DMG, Linux AppImage/DEB, Windows installer.
2. Configurer canal beta, manifestes signes et staged rollout.
3. Tester install, upgrade, downgrade supporte, uninstall et rollback.
4. Ecrire onboarding, FAQ permissions, diagnostics et support.
5. Recruter cohorte representative des plateformes/langues/materiels.
6. Collecter telemetrie consentie, crashs et retours qualitatifs.
7. Mesurer activation, premiere dictee reussie, retention, latence et erreurs.
8. Triage quotidien avec severite, proprietaire et SLA.
9. Effectuer au moins un exercice de retrait de version.
10. Rediger notes de version, limitations connues et politique de support.

## Gate 13

- [ ] Taux crash-free et injection reussie atteignent les seuils.
- [ ] Aucun incident de confidentialite non resolu.
- [ ] Updater et rollback verifies sur chaque OS.
- [ ] Support sait diagnostiquer les cinq pannes principales.
- [ ] Go/no-go signe par produit, QA, securite et plateforme.

