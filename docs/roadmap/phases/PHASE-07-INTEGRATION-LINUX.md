# Phase 07 — Integration Linux X11 et Wayland

## But

Offrir le meilleur comportement possible sur Linux sans masquer les limites de securite des compositeurs.

## Responsables

- Lead: `platform-lead`
- Architecture: `product-architect`
- Tests: `qa-release-lead`

## Travaux

1. Definir matrice distributions, desktop environments, display servers et formats de paquet.
2. Implementer adaptateur X11 pour hotkeys, fenetre active, clipboard et injection.
3. Implementer XDG Desktop Portals disponibles sous Wayland.
4. Etudier mecanismes GNOME/KDE et documenter les capacites reelles.
5. Fournir fallback copie clipboard avec instruction utilisateur si injection impossible.
6. Detecter session/compositor et afficher le niveau de support.
7. Gerer PipeWire/PulseAudio/ALSA via la couche audio retenue.
8. Tester sandbox, tray, autostart, scaling, themes et multi-ecrans.
9. Produire AppImage/DEB initiaux et verifier dependances WebKitGTK.
10. Automatiser smoke tests sur distributions supportees.

## Gate 07

- [ ] Matrice X11/Wayland publiee avec aucun comportement surpromis.
- [ ] X11 satisfait le parcours complet sur distributions cibles.
- [ ] Wayland possede fallback coherent et non destructif partout.
- [ ] Detection de capacites et diagnostics sont comprehensibles.
- [ ] Paquets s'installent/desinstallent proprement sur machines neuves.

