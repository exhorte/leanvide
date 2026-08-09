# Shell Tauri de Fluent

Ce dossier contient uniquement la fondation Tauri 2 et la commande IPC de smoke test `health_check`.

L'identifiant `io.github.exhorte.fluent` est un identifiant de developpement **provisoire**. Il devra etre remplace seulement apres la verification de la marque, du domaine et des exigences de signature. Le bundling reste desactive pendant ce gate de fondation.

`icons/placeholder.svg` est une source neutre et explicitement non destinee a l'identite visuelle. `icons/icon.ico`, requis par `tauri-build` sous Windows, et `icons/icon.png`, requis par `generate_context!()` sous macOS et Linux, sont regeneres avec la CLI verrouillee par le frontend:

```powershell
pnpm dlx @tauri-apps/cli@2.11.4 icon icons/placeholder.svg --output icons
```

Seuls la source et les deux artefacts desktop requis sont conserves dans ce lot. Leurs empreintes SHA-256 reproductibles sont:

- `placeholder.svg`: `B55DE8564513B5A9F84A0E3B76E30E243F980A4358947B0BA3B560268DD6EB9E`;
- `icon.ico`: `233403C8167E54F47AD2313512B2EAD22BF5EC59F1541DFDEF059811E8689A35`;
- `icon.png`: `D25F4CD2C509E331F7E98F1118DCF3272F0B83E3DBFD6CEEDA3964F8A8959B7E`.

Les hooks Tauri executent `pnpm dev` et `pnpm build` depuis `apps/desktop` (`cwd: ".."` relativement a ce dossier).

Ce shell ne contient ni capture audio, ni ASR, ni integration OS, ni stockage, ni acces reseau ou Cloud.
