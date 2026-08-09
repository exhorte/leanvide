---
paths:
  - "apps/desktop/src/**/*.{ts,tsx,css}"
---

# Regles frontend

- Utiliser React, TypeScript strict et Vite.
- Chercher d'abord un composant shadcn/ui adapte avec le MCP `shadcn`; installer et composer le composant source plutot que recreer un equivalent.
- Lire `docs/frontend/SHADCN-MCP.md` avant toute installation de composant.
- Conserver les composants shadcn accessibles et themables; ne pas modifier leur source sans justification.
- Separer les bundles dashboard et widget. Le widget flottant ne charge pas le graphe du dashboard.
- Eviter les rerenders sur les niveaux audio: regrouper les evenements par frame et isoler le waveform.
- Toute interface doit couvrir clavier, focus visible, lecteurs d'ecran, etats loading/empty/error/offline.
- Aucun appel direct aux API natives: passer par des commandes et evenements Tauri types.
