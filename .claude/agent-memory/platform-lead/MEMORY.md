# Memoire platform-lead

- Wayland exige une matrice par compositor et des fallbacks explicites.
- Le plan PHASE-02 separe `PROVEN`, `FAILED`, `UNSUPPORTED`, `UNAVAILABLE_ENVIRONMENT`, `NOT_RUN` et `HYPOTHESIS`; une documentation ou une compilation croisee n'est pas une preuve native.
- Reference produit: `HW-MAC` Apple Silicon si disponible; sinon `HW-WIN` est la reference pratique et l'absence macOS doit etre archivee sans changer l'ordre produit macOS -> Linux -> Windows.
- Sous Wayland, probe GlobalShortcuts par backend/compositor; sans identite de cible revalidable, interdire L2 et proposer controle UI + copie explicite + collage manuel. Le portail Clipboard n'est pas generique: il depend d'une session consentie telle que Remote Desktop/Input Capture.
- Le garde TOCTOU revalide cible/focus immediatement avant et apres publication clipboard; une cible nulle, changee, protegee, elevee ou non verifiable force L1/L0.
- Ne jamais lire/restaurer l'ancien clipboard par defaut. Nettoyer la valeur Fluent seulement si ownership et sequence/change count n'ont pas change; distinguer `copie`, `collage tente` et `collage confirme`.
- Windows `RegisterHotKey` est candidat toggle, pas preuve suffisante du key-up PTT; comparer a `WH_KEYBOARD_LL`. `SendInput` est borne par UIPI et son succes API ne confirme pas le texte cible.
- macOS separe Microphone, Input Monitoring et Accessibility/post-event; demander au moment utile et tester refus/revocation. Aucune machine Apple Silicon n'etait exposee dans le worktree le 2026-08-09.
- `HW-WIN-ALT-01` observe le 2026-08-09: Windows 11 Pro build 26200 x64, i7-8650U, 15.8 Gio. Il peut porter la faisabilite, mais ne remplace le `HW-WIN` i5-1240P propose comme baseline qu'apres qualification QA.
