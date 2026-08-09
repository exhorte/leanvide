# Phase 06 — Integration macOS

## But

Rendre le parcours complet fiable et conforme aux politiques macOS.

## Responsables

- Lead: `platform-lead`
- UX permissions: `frontend-lead`
- Tests: `qa-release-lead`
- Securite: `security-reviewer`

## Travaux

1. Gerer permissions microphone et Accessibilite avec onboarding progressif.
2. Implementer hotkeys via API native et verifier key-down/key-up.
3. Capturer application, fenetre et element cible au debut.
4. Revalider/restaurer la cible avant injection.
5. Implementer NSPasteboard et simulation de collage avec fallback copie seule.
6. Tester champs riches, navigateurs, IDE, messageries et mots de passe.
7. Construire tray/menu bar, autostart et comportement multi-ecrans/Spaces.
8. Gerer sleep/wake, changement microphone et session verrouillee.
9. Configurer entitlements, signature, Hardened Runtime et notarisation.
10. Documenter diagnostics et remediation des permissions.

## Gate 06

- [ ] Taux d'injection reussi atteint la cible sur la matrice d'applications.
- [ ] Aucun collage dans une cible differente sans avertissement/fallback.
- [ ] Refus ou revocation des permissions est recuperable.
- [ ] Build signe et notarise installe sur machine propre.
- [ ] Tests Intel/Apple Silicon couverts selon perimetre Phase 00.

