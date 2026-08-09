# Revue securite et supply chain — PHASE-01

- Date: 2026-08-09
- Relecteur: `security-reviewer`
- Niveau: D2, revue independante et sans implementation produit
- Union auditee: `validation-phase01-cycle03`, base `origin/develop` `34926a5`
- Lots audites: project-management `3f2aad6`, frontend `1913086`, Rust/Tauri `7848094`, QA/CI `92623ac`
- Verdict securite du Gate 01: **PASS**

Le verdict vaut pour la fondation minimale de PHASE-01. Aucun constat critique ou haut exploitable, aucun secret, aucun chemin personnel, aucun egress applicatif et aucune surface audio, accessibilite, clipboard, OCR, credential, updater, modele, stockage ou Cloud n'ont ete trouves. Les dettes F-01 a F-06 restent obligatoires aux phases indiquees et doivent etre reevaluees si le perimetre IPC ou les dependances changent.

## Resume des constats

| ID | Severite | Blocant Gate 01 | Constat | Echeance |
|---|---|---|---|---|
| F-01 | Moyenne | Non pour le shell minimal | `glib 0.18.5`, transitif Linux de Tauri/WebKitGTK, est vise par `RUSTSEC-2024-0429` (unsoundness) | spike PHASE-02; resolution ou preuve d'inatteignabilite avant PHASE-12/13 |
| F-02 | Faible | Non | seize avis RustSec `unmaintained` concernent des crates GTK3, macro et Unicode transitives | inventaire/allowlist bornee en PHASE-02; revue PHASE-12 |
| F-03 | Moyenne | Non, compense par cette revue manuelle | la CI n'impose encore ni audit RustSec/OSV ni politique de licences/sources | automatiser avant le Gate 12 |
| F-04 | Faible | Non | le bootstrap pnpm, les images `*-latest` et les paquets APT ne sont pas epingles par digest | durcir la reproductibilite avant packaging PHASE-13 |
| F-05 | Faible | Non | les commandes applicatives Tauri sont globales aux WebViews locales par defaut; le perimetre courant ne contient que `health_check` | figer une allowlist avant toute deuxieme commande ou fenetre en PHASE-02 |
| F-06 | Faible | Non | aucun inventaire de notices tierces/SBOM n'est genere; une dependance de donnees npm est CC-BY-4.0 et deux outils sont MPL-2.0 | produire notices et SBOM avant distribution PHASE-12/13 |

## Constats detailles

### F-01 — Unsoundness transitive Linux dans `glib 0.18.5`

- Severite: **Moyenne**.
- Scenario: sur Linux, Tauri `2.11.5` depend de `tauri-runtime-wry`, `wry`, `webkit2gtk` puis `glib 0.18.5`. Si le runtime appelle les implementations affectees de `VariantStrIter`, une ecriture non conforme aux garanties Rust peut mener a un comportement indefini et a un dereferencement nul.
- Preuve: `Cargo.lock` contient `glib 0.18.5`; `cargo tree --locked --target all -i glib@0.18.5` prouve le chemin jusqu'a `fluent-desktop`. L'avis primaire [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html) marque les versions `>=0.15,<0.20` affectees et `>=0.20` corrigees. Les releases officielles de [Wry](https://github.com/tauri-apps/wry/releases) publient encore ce warning dans leur propre audit.
- Impact: disponibilite et integrite memoire du shell Linux; aucun chemin etabli vers une fuite ou une execution de code, et aucun appel direct aux fonctions affectees n'existe dans Fluent.
- Remediation: pendant PHASE-02, tester le shell Linux avec les outils d'analyse disponibles, suivre la migration Tauri/Wry/GTK vers une branche corrigee et documenter l'inatteignabilite eventuelle. Interdire une beta publique tant que le risque n'est ni supprime, ni prouve non atteignable, ni accepte par ADR avec proprietaire et echeance.

### F-02 — Dependances Rust non maintenues

- Severite: **Faible**.
- Scenario: une faille future dans une crate abandonnee peut ne recevoir aucun correctif, ou forcer une migration tardive de la chaine desktop Linux/build.
- Preuve: l'interrogation OSV des 428 paquets crates.io verrouilles renvoie seize avis RustSec `informational = "unmaintained"`: dix crates GTK3, `proc-macro-error` et cinq crates `unic-*`. Aucun de ces avis n'a de version corrigee dans sa branche; les chemins proviennent de Tauri/Wry/`tauri-utils`, pas du code metier Fluent.
- Impact: delai de correction et dette de migration; pas d'exploitation connue dans le shell audite.
- Remediation: ajouter une allowlist explicite avec justification, proprietaire et date d'expiration; surveiller les migrations amont; supprimer toute dependance devenue inutile.

### F-03 — Audits Rust et licences non imposes par la CI

- Severite: **Moyenne**.
- Scenario: Dependabot propose des mises a jour, mais une PR peut introduire une advisory, une source Git ou une licence hors politique sans controle bloquant immediat.
- Preuve: `.github/workflows/ci.yml` execute lint, tests, checks et build, sans `cargo audit`/`cargo deny`, OSV ni controle de licences/sources. `.github/dependabot.yml` couvre npm, Cargo et GitHub Actions chaque semaine. La revue manuelle a trouve F-01/F-02 alors que les checks standards restent verts.
- Impact: detection retardee d'une regression supply chain ou juridique.
- Remediation: avant le Gate 12, ajouter un outil versionne et verrouille qui refuse vulnerabilites exploitables, crates yanked, licences inconnues et sources non approuvees; gerer les advisories informatives par exceptions bornees. Generer un SBOM et les notices tierces sur les artefacts de release.

### F-04 — Reproductibilite partielle des environnements CI

- Severite: **Faible**.
- Scenario: une image GitHub `*-latest`, un paquet APT ou le bootstrap Corepack/pnpm peut evoluer sans diff du depot et modifier le build.
- Preuve: Node `24.15.0`, pnpm `11.8.0`, Rust `1.97.1` et Python reserve `3.14.5` existent dans leurs distributions officielles et sont fixes par les manifests. Le champ `packageManager` n'inclut toutefois pas le hash Corepack; les runners et paquets Linux restent flottants.
- Impact: derive de reproductibilite et exposition a une compromission amont, limitees par les lockfiles et les integrites de paquets.
- Remediation: ajouter l'integrite Corepack du package manager, relever l'identite des images, puis utiliser une baseline ou des snapshots de prerequis pour les builds de release.

### F-05 — Frontiere IPC a figer avant extension

- Severite: **Faible**.
- Scenario: une future WebView ou commande ajoutee sans contrat pourrait acceder a toutes les commandes applicatives enregistrees localement.
- Preuve: `tauri::generate_handler![health_check]` n'enregistre actuellement qu'une commande sans requete et a reponse publique `{ status, version }`. Aucun fichier de capability, plugin ou origine distante n'est present. La documentation officielle [Tauri Capabilities](https://v2.tauri.app/security/capabilities/) indique que les commandes applicatives enregistrees sont, par defaut, accessibles a toutes les fenetres/WebViews locales et recommande `AppManifest::commands` pour restreindre cette surface.
- Impact: nul dans le shell mono-fenetre courant; risque d'extension accidentelle ensuite.
- Remediation: geler en PHASE-02 le registre de commandes, les origines et les fenetres; ajouter `AppManifest::commands` et des capabilities minimales avant une seconde commande sensible ou une seconde WebView.

### F-06 — Notices tierces a produire avant distribution

- Severite: **Faible**.
- Scenario: un binaire distribue sans attribution/inventaire peut manquer une obligation de licence ou rendre une provenance impossible a auditer.
- Preuve: `pnpm licenses list --json` trouve 230 entrees sous onze familles de licences, sans licence inconnue; elles sont permissives ou faiblement copyleft, avec notamment CC-BY-4.0 et MPL-2.0. `cargo metadata --locked` trouve 428 crates de registre, zero licence inconnue et zero source hors crates.io; les expressions offrent toutes une option compatible avec le projet pour le perimetre audite.
- Impact: risque de conformite lors de la future distribution, pas de blocage puisque `bundle.active` vaut `false` en PHASE-01.
- Remediation: valider la politique de choix de licence SPDX, produire SBOM/notices et verifier le contenu reel de l'artefact avant PHASE-13.

## Controles positifs

### Dependances et provenance

- Les 19 dependances npm directes utilisent des versions exactes. Leurs versions, licences, depots et integrites ont ete recoupes avec `registry.npmjs.org`; les 19 integrites sont presentes dans `pnpm-lock.yaml`.
- Les quatre crates directes (`tauri`, `tauri-build`, `serde`, `serde_json`) sont non yanked, sous licences compatibles et leurs checksums crates.io correspondent a `Cargo.lock`.
- `Cargo.lock` contient 430 blocs de paquets, 428 sources crates.io et aucune source Git/path externe. `pnpm-lock.yaml` ne contient aucune source Git, fichier, lien ou tarball ad hoc.
- `pnpm audit --prod --audit-level high` et `pnpm audit --audit-level high` repondent `No known vulnerabilities found` avec code 0.
- L'interrogation OSV de tous les paquets Rust verrouilles produit 18 correspondances: un meme avis d'unsoundness represente sous deux identifiants, plus seize avis de maintenance; aucun avis critique ou haut exploitable n'a ete identifie.

### CI et scripts

- `actions/checkout@11bd719...`, `actions/setup-node@49933ea...` et `actions/cache@0400d5f...` sont epingles par SHA complet. `git ls-remote` sur les trois depots officiels confirme respectivement les tags `v4.2.2`, `v4.4.0` et `v4.2.4`.
- Le workflow a `permissions: contents: read`, un timeout, une concurrence bornee et n'interpole aucune donnee de PR dans un shell. Aucun secret n'est demande et aucun artefact n'est publie.
- Les commandes de build sont statiques; le seul `build.rs` appelle `tauri_build::build()` et interdit `unsafe` dans le code proprietaire.
- Dependabot couvre npm, Cargo et GitHub Actions.

### Tauri, CSP et IPC

- La CSP de production autorise uniquement les ressources locales, les protocoles IPC/asset locaux et les images `data:`; aucun domaine distant, `unsafe-inline` ou `unsafe-eval` n'est autorise en production. La `devCsp` ajoute seulement localhost/WebSocket et le style inline necessaires au serveur local.
- Aucun plugin Tauri de reseau, shell, filesystem, updater, clipboard, stockage ou OS n'est present. Le bundling et donc l'updater sont desactives.
- `health_check` ne prend aucune entree, n'effectue ni I/O, ni reseau, ni log, et ne renvoie que le statut et la version. L'UI masque le detail natif en cas d'erreur.
- Tauri Rust `2.11.5` est posterieur aux correctifs de securite d'origine distante annonces dans la release officielle [Tauri 2.11.1](https://v2.tauri.app/release/tauri/v2.11.1/); aucune capability distante n'est declaree.

### Donnees, secrets et hygiene

- Scan de 146 fichiers suivis: zero `.env`, motif credential/cle privee, chemin utilisateur, artefact genere ou fichier suivi superieur a 1 Mio.
- `.gitignore` couvre secrets, environnements, caches, sorties JavaScript/Rust/Python et schemas Tauri generes. Les lockfiles restent suivis.
- Aucun indicateur de runtime audio, accessibilite, OCR, clipboard, credential, updater, modele, base locale, auth ou Cloud dans les manifests et sources produit. `services/api` ne contient qu'un README de reservation.
- `git diff --cached --check` passe sans erreur dans l'union.

## Conditions pour les phases suivantes

### Avant la sortie de PHASE-02

1. Figer le contrat de commandes/fenetres/origines Tauri et rendre toute nouvelle permission explicite.
2. Reevaluer F-01 sur Linux et consigner le chemin de migration Tauri/Wry/GTK ou la preuve d'inatteignabilite.
3. Definir l'allowlist temporaire et datee des advisories `unmaintained`.
4. Interdire l'ajout d'audio, clipboard, OCR, accessibilite, modele, updater, credential, stockage ou reseau sans threat model et consentement applicables.

### Avant le Gate 12 et toute beta/package

1. Rendre les audits advisories, licences, sources, crates yanked et lockfiles bloquants en CI.
2. Resoudre F-01 ou l'accepter par ADR borne; aucune acceptation silencieuse pour un binaire Linux public.
3. Produire SBOM, notices tierces, provenance d'artefact, signature et verification de rollback/updater.
4. Refaire les scans secrets/chemins/artefacts sur un clone propre et sur chaque binaire/package.
5. Revoir separement audio, accessibilite, clipboard, OCR, credentials, modeles et retention Cloud des qu'une de ces surfaces devient executable.

## Verdict

**PASS securite/confidentialite pour le Gate 01.** Le shell audite respecte le perimetre local-first et minimal de la phase. F-01 et F-03 sont des dettes moyennes tracees, non exploitables de facon demontree dans `health_check`, mais elles deviennent bloquantes au plus tard avant le Gate 12/la beta si elles ne sont pas resolues ou formellement acceptees selon le protocole.
