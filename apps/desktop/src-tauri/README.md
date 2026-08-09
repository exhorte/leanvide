# Shell Tauri de Fluent

Ce dossier contient uniquement la fondation Tauri 2 et la commande IPC de smoke test `health_check`.

L'identifiant `io.github.exhorte.fluent` est un identifiant de developpement **provisoire**. Il devra etre remplace seulement apres la verification de la marque, du domaine et des exigences de signature. Le bundling reste desactive pendant ce gate de fondation.

`icons/placeholder.svg` est une source neutre et explicitement non destinee a l'identite visuelle. `icons/icon.ico`, requis par `tauri-build` sous Windows meme sans bundling, est regenere avec la CLI verrouillee par le frontend:

```powershell
pnpm dlx @tauri-apps/cli@2.11.4 icon icons/placeholder.svg --output icons
```

Seuls la source et l'artefact Windows requis sont conserves dans ce lot.

Les hooks Tauri executent `pnpm dev` et `pnpm build` depuis `apps/desktop` (`cwd: ".."` relativement a ce dossier).

Ce shell ne contient ni capture audio, ni ASR, ni integration OS, ni stockage, ni acces reseau ou Cloud.
