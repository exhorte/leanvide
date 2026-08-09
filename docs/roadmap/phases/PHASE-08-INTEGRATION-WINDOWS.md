# Phase 08 — Integration Windows

## But

Fournir une implementation Windows native et organiser la transition depuis l'application WPF si elle existe.

## Responsables

- Lead: `platform-lead`
- Migration: `product-architect`
- Tests: `qa-release-lead`

## Travaux

1. Inventorier comportements et donnees de l'application WPF existante.
2. Implementer hotkeys bas niveau avec watchdog de relachement.
3. Gerer foreground restrictions, fenetre cible et UI Automation.
4. Implementer clipboard/SendInput avec validation de cible et fallback.
5. Gerer microphones, sleep/wake, RDP et changements de session.
6. Tester UAC, integrite de processus et applications elevees.
7. Construire tray, autostart et notifications.
8. Definir migration des preferences/historique sans perte.
9. Produire installateur signe, upgrade et rollback.
10. Comparer performance/memoire avec baseline WPF.

## Gate 08

- [ ] Parite MVP atteinte ou ecarts explicitement acceptes.
- [ ] Aucun enregistrement bloque apres perte de KeyUp.
- [ ] Migration de donnees testee avec sauvegarde/rollback.
- [ ] Injection protegee contre mauvaise cible et elevation incompatible.
- [ ] Install/upgrade/uninstall signes valides sur Windows supportes.

