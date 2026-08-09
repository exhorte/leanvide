# Developpement local

Ce guide permet de verifier un clone propre de la fondation Fluent. Les
commandes racine sont le contrat commun aux developpeurs et a la CI : ne les
remplacez pas par des variantes propres a un poste.

## Outils verrouilles

| Outil | Version | Usage |
|---|---:|---|
| Node.js | 24.15.0 | interface React/TypeScript et scripts de depot |
| pnpm | version declaree dans `package.json` | installation determinee par `pnpm-lock.yaml` |
| Rust | 1.97.1 | coeur et application Tauri |
| Python | 3.14.5, futur seulement | aucun service Cloud executable dans cette phase |

## Prerequis par systeme

| Systeme | Prerequis complementaires |
|---|---|
| macOS Apple Silicon | Xcode Command Line Tools (`xcode-select --install`) ; les permissions Microphone et Accessibilite ne sont requises que pour les futures integrations natives. |
| Ubuntu LTS / Debian | `build-essential`, `pkg-config`, `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf`. |
| Windows 11 | Visual Studio Build Tools avec Desktop development with C++, WebView2 Runtime et Microsoft Edge WebView2 SDK lorsque le paquet Tauri le demande. |

Installez Node 24.15.0 et Rust 1.97.1, puis activez Corepack. La CI installe les
paquets Linux Tauri explicitement; les postes locaux Linux font de meme avant le
premier build.

## Clone propre et validation

```powershell
git clone <url-du-depot> fluent
Set-Location fluent
corepack enable
rustup toolchain install 1.97.1 --profile minimal
rustup default 1.97.1
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm check
pnpm build
```

`pnpm install --frozen-lockfile` echoue volontairement si le manifeste et le
lockfile ne correspondent pas. Ne regenerez le lockfile que dans une PR qui
explique et teste le changement de dependances.

## Boucle de developpement

```powershell
pnpm dev
pnpm lint
pnpm test
pnpm check
pnpm build
```

`pnpm dev` lance l'application de bureau une fois les lots frontend et Rust
integres. Les quatre autres commandes sont celles executees, dans cet ordre, par
la CI sous Linux, macOS et Windows.

## Diagnostic

- Verifier les versions avec `node --version`, `pnpm --version`, `rustc
  --version` et `cargo --version`.
- En cas d'echec d'installation Linux, reinstaller les paquets Tauri listes
  plus haut puis relancer `pnpm install --frozen-lockfile`.
- En cas d'echec natif Windows, confirmer Build Tools et WebView2 avant de
  supprimer un cache. En cas d'echec macOS, verifier Xcode Command Line Tools.
- Conserver un echec QA sous la forme : commande, OS/architecture, versions,
  sortie, commit et artefact non sensible. Ne joignez jamais audio, texte dicte,
  contenu du presse-papiers, `.env` ou token.

## Worktrees

Les worktrees isolent les domaines sans recopier de configuration locale :

```powershell
./scripts/agent-worktree.ps1 -Role qa-release
```

Le script cree ou ouvre le worktree frere `leanvibe-worktrees/<role>` sur
`work/<role>`. Un worktree ne doit pas contenir de secret; aucun fichier local
ne doit etre copie automatiquement dans un autre worktree.

## Aucun Cloud executable en phase 01

`services/api/` est reserve au backend facultatif futur. Il n'y a ni serveur,
ni cle, ni endpoint, ni commande Python a demarrer dans cette phase. Le parcours
MVP demeure local, sans compte et sans reseau une fois un modele local acquis
volontairement.
