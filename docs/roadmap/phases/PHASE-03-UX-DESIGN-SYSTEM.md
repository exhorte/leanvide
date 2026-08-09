# Phase 03 — UX et design system

## But

Construire l'experience complete du dashboard et du widget sans alourdir le chemin critique.

## Responsables

- Lead: `frontend-lead`
- Recherche: `ui-researcher`
- Revue: `product-architect`, `qa-release-lead`, `security-reviewer`

## Travaux

1. Cartographier onboarding, permissions, premiere dictee, erreurs, modeles, historique et reglages.
2. Initialiser shadcn/ui avec `components.json`, theme, tokens et conventions.
3. Inventorier via MCP avant tout composant generique.
4. Construire primitives: boutons, formulaires, dialogues, tabs, tooltips, toasts, tables et etats vides.
5. Separer entrypoints dashboard/widget et budgets de bundle.
6. Creer widget Idle/Listening/Processing/Error/Hidden avec waveform coalesce par frame.
7. Ajouter themes clair/sombre, densite, localisation et raccourcis clavier.
8. Implementer tous les etats offline, permission refusee, modele absent et echec d'injection.
9. Tester WCAG, focus, contrastes, lecteur d'ecran et reduction des animations.
10. Ajouter tests composants et captures de reference.

## Livrables

- design tokens et catalogue de composants;
- parcours cliquables puis implementes;
- dashboard et widget branches sur mocks types;
- budget bundle/demarrage;
- rapport accessibilite.

## Gate 03

- [ ] Tous les parcours MVP ont loading/empty/error/success.
- [ ] Aucun composant standard n'est duplique sans justification shadcn.
- [ ] Navigation clavier et lecteur d'ecran passent les tests definis.
- [ ] Widget respecte le budget de rendu et ne charge pas le dashboard.
- [ ] Les appels natifs passent uniquement par l'IPC type.

