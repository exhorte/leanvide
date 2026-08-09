# Revue securite des contrats PHASE-02

- Cycle: `CYCLE-20260809-04`
- Relecteur: `security-reviewer`
- Niveau: D2, revue independante sans implementation produit
- Union auditee: worktree `validation-phase02-cycle04`, branche
  `validation/phase02-cycle04`, base `origin/develop`
  `03f8206f8df762f812b748d8b21f28825dd53b43`
- Lots audites:
  - architecture `work/product-architecture@f2d74d7c81ede76f88db3fd354fe8bc1c0ef97d7`;
  - Rust/core `work/rust-core@b540198ccf045180d491e4317d4e536b32a7c42f`;
  - plateforme `work/platform@abdb89289bc70e0ff6b1ad1ebff49aac6bf6e479`;
  - ASR `work/ai-asr@ee3f40f9e1877e3c89fe922f90088b5aec1c9a03`.
- Perimetre: les huit documents ajoutes par ces quatre lots; les memoires de
  roles presentes dans l'union ne sont pas des contrats audites
- Verdict initial du Gate contrat: **FAIL — ADR-0002 reste `Proposed`**
- Verdict courant apres re-review r2: **PASS — ADR-0002 peut devenir
  `Accepted-for-spike` sous les conditions de la section 6.6**
- Menace critique exploitable observee: **aucune**; aucune escalade critique
  d'incident n'est requise

Le verdict FAIL ci-dessus conserve l'historique de la premiere union. La
re-review r2 de la section 6 leve le blocker documentaire. Aucun des deux
verdicts ne ferme le Gate 02 ni ne constitue une preuve de faisabilite native:
aucun spike n'a encore ete execute.

## 1. Synthese

Les frontieres local-first sont solides: aucun Cloud, compte, endpoint,
telemetrie ou failover distant n'est autorise dans le MVP; l'acquisition de
modeles est separee des campagnes offline; OCR et contexte d'accessibilite sont
hors perimetre; l'updater reste desactive. Audio et texte sont C3, volatils par
defaut, et les plans imposent zero egress, artefacts allowlist et zero-history.

Les garanties temps reel sont egalement coherentes: callback sans I/O, log,
allocation evitable ni verrou bloquant; SPSC preallouee; overflow fail-closed;
Stop/Cancel hors file; `SessionId`/`Epoch`/`ActionId`; quiescence avant liberation;
rejet des resultats tardifs et backpressure bornee.

La revue initiale a bloque la promotion sur un contrat d'erreur divergent entre
la machine a etats, les ports et le plan ASR. Elle a aussi exige des conditions
explicites pour la frontiere C4 du coffre natif et l'oracle d'accessibilite du
controle/indicateur de capture. La section 6 conserve leur resolution et le
verdict courant.

| Severite initiale | Nombre | Effet sur le verdict initial |
|---|---:|---|
| BLOCKER | 1 | interdit `Accepted-for-spike` |
| HIGH | 2 | preconditions obligatoires avant les spikes concernes |
| MEDIUM | 3 | dette bornee, owner et preuve requis |
| LOW | 0 | aucun |

## 2. Findings

### B-01 — BLOCKER — Taxonomies d'erreur et de recuperabilite incompatibles

- Scenario: le core, l'orchestrateur ou le harnais ASR compile/implemente l'un
  des vocabulaires proposes. Une erreur de remise inconnue peut alors etre
  mappee vers un cas absent ou generique; une UI peut proposer un retry qui ne
  respecte pas l'at-most-once, ou purger/ne pas exposer le brut alors que sa
  recuperation est requise. Les tests ASR peuvent aussi valider une enum
  differente de celle du port qu'ils pretendent consommer.
- Preuve:
  - `CORE-CONTRACTS.md:53-66` fixe `RetryOperation` et `OutcomeUnknown` dans
    `PortError.recoverability`;
  - `STATE-MACHINE.md:234-257` omet `RetryOperation` et emploie
    `DeliveryUnknown`, tandis que le meme document emploie aussi
    `OutcomeUnknown` aux lignes 275 et `DeliveryOutcomeUnknown` aux lignes
    162/257;
  - `CORE-CONTRACTS.md:245-250` fixe notamment `ModelMissing`, `ModelInvalid`,
    `ModelIncompatible`, `UnsupportedAudioFormat`, `NoSpeech` et
    `BackendUnavailable`;
  - `PHASE-02-LOCAL-ASR-SPIKE-PLAN.md:419-432` redeclare une taxonomie dite de
    domaine avec `NotReady`, `ModelMissingOrInvalid` et `UnsupportedFormat`;
  - `STATE-MACHINE.md:97` utilise encore `AudioUnavailable` et
    `UnsupportedFormat` sans mapping canonique.
- Impact: politique de retry divergente, perte du fallback brut, double effet de
  remise apres issue inconnue, schemas IPC incompatibles et suites de
  substituabilite non probantes.
- Proprietaire: `product-architect`; contributeur requis `ai-asr-lead`; revue
  `security-reviewer` et `frontend-lead` pour les mappings IPC/UX.
- Remediation: definir une seule enum normative de recuperabilite et un seul
  catalogue de codes par domaine. Les documents de plan doivent mapper leurs
  fautes de harnais vers ces codes sans creer une seconde enum. Separer
  explicitement `PortError`, `ErrorRecord`, `DeliveryResult` et
  `CompletionOutcome`, avec conversion totale et fail-closed.
- Preuve attendue: diff des trois documents, recherche globale sans alias
  orphelin, table de mapping exhaustive, golden fixtures IPC et test de modele
  couvrant retry, brut disponible, annulation et outcome inconnu.
- Risque residuel apres correction: derive future lors de l'ajout d'un code;
  borne par enums fermees, generation/CI du catalogue et tests de compatibilite.

### H-01 — HIGH — Le spike coffre C4 n'a pas de frontiere architecturale executable

- Scenario: le prochain lot implemente CRUD coffre et compensation SQLite/coffre
  via une API privee ad hoc. Un crash entre les deux stores peut laisser un
  credential orphelin, un handle pointant vers une valeur absente, ou pousser un
  implementateur a journaliser/transporter la valeur pour diagnostiquer.
- Preuve:
  - `COMPONENT-MODEL.md:61-63` et `ADR-0002-MODULAR-RUNTIME.md:222-233`
    placent les credentials hors des cinq ports et reportent le coffre natif;
  - `PHASE-02-AUDIO-STORAGE-PLAN.md:15-23` attribue l'integration native au
    `platform-lead` et la revue C4 a Security;
  - le meme plan, lignes 280-292, exige un coffre reel par OS et un protocole de
    compensation SQLite/coffre tout en refusant un sixieme port avant decision.
- Impact: lifecycle C4 non substituable, incoherence apres crash, suppression ou
  revocation incomplete et risque de fuite dans les diagnostics.
- Proprietaire: `product-architect` pour la frontiere; `platform-lead` pour
  l'adaptateur natif; `rust-core-lead` pour la compensation; revue
  `security-reviewer`.
- Remediation: avant tout code de coffre, choisir et documenter soit une
  frontiere de harnais strictement jetable et non reutilisable, soit un contrat
  versionne/ADR dedie. Fixer ownership, idempotence, ordre des effets,
  compensation, etat inconnu, cleanup et interdiction de valeur C4 hors coffre.
- Preuve attendue: contrat approuve avant manifeste/lockfile, matrice
  create/read/replace/delete/restart/refus/verrou/crash/logout, scan canari zero
  hors coffre et aucun secret dans arguments, environnement, IPC ou artefacts.
- Risque residuel: metadonnees exposees par le coffre OS et absence de transaction
  distribuee; explicites par backend et bornees par compensation idempotente.

### H-02 — HIGH — Le fallback accessible et l'indicateur de capture n'ont pas d'oracle AT

- Scenario: un hotkey global est refuse, entre en conflit ou perd son key-up. Un
  utilisateur qui depend du toggle UI ou d'une technologie d'assistance ne peut
  pas demarrer/arreter la capture ou percevoir qu'elle reste active. Le plan peut
  declarer le mecanisme natif `PASS` sans avoir prouve le chemin accessible de
  securite.
- Preuve:
  - `STATE-MACHINE.md:185-200` exige un indicateur actif et accessible pendant
    toute la capture;
  - `PHASE-02-OS-FEASIBILITY-PLAN.md:274-287` teste le fallback toggle mais sans
    nom/role/etat, navigation clavier, annonce ou technologie d'assistance;
  - les lignes 366-378 demandent un etat "accessible" du helper, sans matrice,
    commande, artefact ni oracle AT.
- Impact: exclusion fonctionnelle et, dans le pire cas, capture prolongee non
  perceptible ou impossible a arreter.
- Proprietaire: `frontend-lead` pour le contrat UI accessible,
  `platform-lead` pour les evenements et fallbacks, `qa-release-lead` pour la
  matrice; revue `security-reviewer` sur l'indicateur de capture.
- Remediation: ajouter avant la campagne plateforme un oracle clavier seul et
  AT pour toggle, conflit, permission, capture active, key-up perdu,
  verrouillage et annulation. Fixer nom/role/etat, focus, annonce non uniquement
  visuelle et comportement quand l'indicateur devient indisponible.
- Preuve attendue: matrice par OS/AT disponible, traces d'etat expurgees,
  captures non sensibles et tests du watchdog/annulation avec UI inaccessible.
- Risque residuel: variations des lecteurs d'ecran, desktops et compositors;
  bornees par environnements nommes et fallback UI teste.

### M-01 — MEDIUM — F-03 disparait des gates de supply chain PHASE-02

- Scenario: le prochain spike ajoute wrapper, crate, outil ou backend natif.
  Sans controle CI bloquant, une advisory exploitable, source non approuvee,
  crate yanked ou licence hors politique peut entrer alors que les tests produit
  restent verts.
- Preuve:
  - la revue PHASE-01, `PHASE-01-SUPPLY-CHAIN-REVIEW.md:41-47`, definit F-03:
    audits advisories/licences/sources absents de la CI;
  - `ADR-0002-MODULAR-RUNTIME.md:235-265` et ses conditions lignes 286-303 ne
    citent que F-01, F-02 et F-05;
  - `PHASE-02-AUDIO-STORAGE-PLAN.md:353-390` ne rend executables que F-01/F-02.
- Impact: detection tardive d'une regression supply chain ou juridique.
- Proprietaire: `qa-release-lead` pour CI/tooling; `security-reviewer` pour la
  politique et les exceptions; chaque lead reste owner de ses dependances.
- Remediation: reintegrer F-03 au registre du prochain cycle. Avant toute
  modification de manifeste/lockfile, imposer au minimum une revue manuelle
  versionnee; automatiser ensuite advisories, yanked, licences et sources avec
  exceptions bornees. Conserver l'echeance Gate 12 pour SBOM/notices complets.
- Preuve attendue: outil/version/hash, configuration allow/deny, fixture CI
  negative, inventaire du lockfile et exception avec owner/expiration.
- Risque residuel: retard des bases d'advisories et faux positifs; borne par
  mise a jour controlee, revue humaine et expiration des exceptions.

### M-02 — MEDIUM — Trust root, revocation et quarantaine des modeles restent incomplets

- Scenario: un artefact compromis peut correspondre a un nouveau manifeste mal
  approuve, ou des telechargements invalides repetes peuvent remplir le disque
  car les `.part`/quarantaines n'ont pas de TTL, quota et inventaire de cleanup
  testables. Le digest protege contre la corruption par rapport au manifeste,
  pas contre la compromission de son autorite.
- Preuve:
  - `PHASE-02-LOCAL-ASR-SPIKE-PLAN.md:95-126` epingle revision, taille, digest et
    licence et interdit le script upstream non verifiant;
  - les lignes 258-265 conservent l'artefact invalide dans une quarantaine dite
    bornee sans definir sa borne ou sa purge;
  - la ligne 596 reporte signature, catalogue et revocation a `ASR-O7`.
- Impact: denial of service local par disque, chargement futur d'un modele
  mal approuve ou impossibilite de retirer rapidement un artefact compromis.
- Proprietaire: `ai-asr-lead` pour acquisition/quarantaine;
  `product-architect` + `security-reviewer` pour trust root, signature et
  revocation; `qa-release-lead` pour les fautes disque/rollback.
- Remediation: autoriser le spike uniquement avec manifeste manuel epingle et
  revue independante, sans auto-download produit. Definir quota, nombre maximal,
  TTL, cleanup idempotent et comportement disque plein. Avant promotion produit,
  accepter un design signe de catalogue/revocation et son rollback.
- Preuve attendue: tests digest/taille/type, interruption/reprise, quota et
  disque plein; inventaire avant/apres; test de signature/revocation negative
  avant tout updater ou gestionnaire automatique.
- Risque residuel: compromission amont avant mise a jour du manifeste; borne par
  double revue, provenance/SBOM, retrait et absence d'execution automatique.

### M-03 — MEDIUM — L'etat clipboard apres crash doit etre explicitement fail-closed

- Scenario: Fluent ecrit C3 puis crashe avant cleanup. Au redemarrage, ownership
  et sequence peuvent etre inconnus. Une tentative de nettoyage peut effacer le
  nouveau clipboard d'une autre application; l'absence de nettoyage peut laisser
  le texte dans un historique ou une synchronisation OS.
- Preuve:
  - `CORE-CONTRACTS.md:363-373` interdit lecture/restauration/effacement sans
    specification et preuve de non-course;
  - `PHASE-02-OS-FEASIBILITY-PLAN.md:197-209` utilise ownership + sequence et
    reconnait exposition, historique et synchronisation;
  - la ligne 205 demande crash/redemarrage "best-effort" sans oracle explicite
    pour l'etat inconnu apres perte de la memoire du processus.
- Impact: destruction du clipboard d'un tiers ou retention involontaire de C3.
- Proprietaire: `platform-lead`; UX `frontend-lead`; revue
  `security-reviewer`.
- Remediation: rendre normatif `ownership/sequence inconnu => aucune mutation`;
  ne jamais persister le contenu pour recuperer le cleanup; avertir avant copie
  que le clipboard n'est pas confidentiel; conserver L0/brut recuperable selon
  le TTL volatile; tester crash avec processus sentinelle.
- Preuve attendue: oracle par OS montrant zero effacement apres changement ou
  etat inconnu, aucun contenu/ancien clipboard lu ou archive, et disclosure
  accessible du risque.
- Risque residuel: clipboard managers, historique et sync hors controle de
  Fluent; accepte seulement avec action explicite et information utilisateur.

## 3. Controles sans finding bloquant

### Local-first, Cloud, OCR et updater

- Le runtime, les ports et l'IPC n'ont aucun acces reseau dans le MVP. Aucun
  endpoint, file d'egress, compte, token, telemetrie ou failover Cloud n'est
  autorise. Les campagnes locales exigent reseau bloque et traitent toute
  tentative comme un echec.
- Le Cloud et sa retention sont exclusivement post-MVP; aucun TTL ou fournisseur
  n'est invente dans ces contrats. Toute activation future reste soumise a un
  nouveau cadrage, consentements distincts, revocation et Gate 11.
- OCR et lecture de contexte d'accessibilite restent explicitement hors scope;
  l'usage de la permission Accessibility pour cible/remise ne doit jamais etre
  interprete comme autorisation de lire le contenu.
- L'updater est hors scope et desactive. Aucun check updater/modeles n'est lance
  dans `RUN-OFFLINE`; signature, revocation et rollback restent une condition
  avant gestion automatique ou packaging, pas une autorisation implicite.

### Audio, annulation et backpressure

- Les invariants callback, SPSC, overflow `drop-newest` explicite, conservation
  des compteurs, quiescence, quarantaine de buffers, epoch et purge couvrent les
  scenarios de capture orpheline et de segment lacunaire.
- Stop/Cancel/lifecycle ont un latch atomique independant des files; les
  resultats tardifs ne changent ni etat, injection ni persistance.
- Un timeout de quiescence ne libere pas une memoire encore referencable. La
  reprise de session exige cleanup et absence de C3.

### Cible, Wayland et clipboard nominal

- La cible est opaque, minimale, revalidee juste avant effet et protegee par TTL
  et nonce; champs proteges, integrite differente et cible inconnue echouent
  fermes.
- `ConfirmedExact`, `ClipboardPrepared`, `Unconfirmed` et `OutcomeUnknown` sont
  conceptuellement separes; aucun retry automatique n'est admis apres issue
  inconnue.
- Wayland est borne par compositor/portal; L1/L0 est un resultat normal et
  aucune injection universelle n'est promise. Une permission Remote Desktop
  disproportionnee n'est pas un fallback par defaut.

### Stockage, zero-history et credentials factices

- `SettingsStore` reste C1-C2; audio, transcript, cible, clipboard et C4 sont
  interdits. L'historique est logiquement separe, desactive par defaut et teste
  avec canaris synthetiques.
- Purge/inventaire couvrent DB, WAL, SHM, index, FTS, caches, snapshots et
  backups possedes. Le plan ne promet pas l'effacement physique SSD/swap.
- Les tests de coffre utilisent uniquement une valeur factice generee en
  memoire; aucun test ou rapport ne doit lire ou reproduire un credential reel.

### IPC et supply chain

- F-05 est fail-closed: `health_check` reste l'unique commande; toute extension
  exige capability minimale par fenetre/origine, catalogue, tailles, etats,
  CSP, tests negatifs et CI.
- F-01 reste `OPEN_UNPROVEN` jusqu'a migration ou preuve de reachability revue;
  F-02 exige allowlist par advisory avec owner, expiration et sortie. Aucun de
  ces plans ne transforme l'absence de crash ou de machine Linux en PASS.

## 4. Conditions de relecture et verdict

ADR-0002 peut etre repropose `Accepted-for-spike` lorsque:

1. B-01 est corrige dans `CORE-CONTRACTS.md`, `STATE-MACHINE.md` et le plan ASR,
   puis les mappings sont revalides dans une nouvelle union;
2. H-01 dispose d'une frontiere de coffre/harness et d'un owner exclusif avant
   tout code C4;
3. H-02 dispose d'un oracle accessible avant la campagne hotkey/fallback;
4. F-03 est inscrit comme precondition de tout changement de dependance;
5. les gardes modeles/quarantaine et clipboard inconnu sont ajoutees aux plans
   avant execution de leurs scenarios respectifs.

Les points 2 a 5 peuvent etre des preconditions bornees du prochain cycle; ils
ne requierent pas de promouvoir un port, un updater, un modele ou une permission
produit. B-01, lui, doit etre corrige avant le changement de statut de l'ADR.

## 5. Validations de l'union

| Controle | Resultat | Portee/limite |
|---|---|---|
| `git status --short --branch` | PASS | quatre `MERGE_HEAD`, 12 fichiers indexes, zero modification non indexee |
| ownership | PASS | huit documents + quatre memoires, fichiers uniques entre les quatre commits |
| `git diff --cached --check` | PASS | aucune erreur whitespace |
| liens Markdown locaux des huit documents | PASS | zero lien local casse dans l'union |
| scans secrets/chemins/artefacts transmis par le manager | PASS | aucun contenu sensible reproduit dans cette revue |
| `pnpm install --frozen-lockfile` puis `pnpm check` transmis par le manager | PASS | TypeScript, ESLint, Vitest 2/2, Rust 2/2 + doc-tests, fmt et Clippy; ne prouve aucun spike |
| CI PR #13/#14/#15 | PASS x3 | macOS, Ubuntu et Windows verts selon preuve manager |
| CI PR #16 | PASS x3 | macOS, Ubuntu et Windows verts; verification directe du status rollup |

La branche de securite ne copie aucun fichier de l'union: ce rapport reference
les branches, commits et lignes audites.

## 6. Re-review de l'union corrigee r2

### 6.1 Perimetre exact

- Worktree lecture seule: `validation-phase02-cycle04-r2`
- Branche: `validation/phase02-cycle04-r2`
- Base `origin/develop`:
  `03f8206f8df762f812b748d8b21f28825dd53b43`
- Architecture:
  `work/product-architecture@3f3a6d2bf10c73b5950895281e0922dd716dffd8`
- Rust/core:
  `work/rust-core@ed043d9b623fd5d07a8b1c251f84371d9bea5758`
- Plateforme:
  `work/platform@e01acf228a8930e43dc86032976880bfbdcdae56`
- ASR:
  `work/ai-asr@840ae994d1a0636d5a89cd0eb69bcd7050ca0662`

Les diffs complets entre chaque SHA initial de la section 1 et son SHA r2 ont
ete relus. L'union contient les memes huit documents et quatre memoires, sans
conflit, fichier partage ou modification non indexee. Aucun fichier de cette
union n'est copie dans `work/security`.

### 6.2 Verdict par finding

| ID | Etat r2 | Preuve de remediation | Risque residuel / preuve future |
|---|---|---|---|
| B-01 | **CLOSED** | `CORE-CONTRACTS.md:51-145` definit le quadruplet et un catalogue exhaustif; `STATE-MACHINE.md:245-296`, `IPC-VERSIONING.md:287-305` et le plan ASR lignes 441-459 le consomment sans taxonomie concurrente | les golden tests et tests de modele ne sont pas executes; `product-architect` + `rust-core-lead` + `ai-asr-lead`, preuve au prochain cycle |
| H-01 | **CLOSED** au niveau contrat | `CORE-CONTRACTS.md:548-605` impose soit un `VaultHarness` test-only, soit un ADR produit; le plan stockage lignes 282-355 fixe ownership, etats, compensation SQLite/coffre, quarantaine et cleanup | aucun coffre OS n'est execute; `rust-core-lead` + `platform-lead`, revue Security avant code et artefacts `STO-VLT-01` |
| H-02 | **MITIGATED** | plan plateforme lignes 234-325: preflight AT bloquant, roles/noms/etats, clavier, focus, annonces, watchdog, matrice OS/AT, owners et artefacts; les campagnes hotkey/fallback refusent de demarrer sans run-id | helper et oracle sont `NOT_RUN`; `frontend-lead` + `platform-lead` + `qa-release-lead`, preuve par couple OS/AT ou `UNAVAILABLE_ENVIRONMENT` explicite |
| M-01 | **MITIGATED** | ADR lignes 263-279 et plan stockage lignes 397-428: F-03 bloque toute mutation manifest/lockfile avant commit, avec inventaire, advisories/yanked, licences, sources, outils et exceptions owner+expiration | automatisation CI, fixture negative, SBOM et notices restent dus avant Gate 12; owner `qa-release-lead`, politique/revue `security-reviewer` |
| M-02 | **MITIGATED** pour spike uniquement | plan ASR lignes 226-228: manifeste manuel epingle, auteur exclu et deux revues independantes; lignes 271-289: quota 2 Gio, huit entrees, TTL 24 h, reserve, inventaire et cleanup fail-closed | trust root/catalogue signe/rotation/revocation/rollback restent OPEN pour le produit et bloquent toute auto-acquisition; owners `ai-asr-lead` + `product-architect` + Security |
| M-03 | **CLOSED** au niveau contrat | plan plateforme lignes 210-230: `CHANGED`/`UNKNOWN` implique aucune mutation, crash/redemarrage commence toujours `UNKNOWN`, sentinelle et 30 essais avec `mutation_attempted=false` | comportement natif non execute; `platform-lead` + `qa-release-lead`, revue Security avant promotion du cleanup `MATCHED` |

`CLOSED` signifie ici que le defaut de contrat initial est corrige. Cela ne
transforme jamais une campagne future en `PASS`. `MITIGATED` signifie que le
risque est borne par une precondition executable et un rollback, mais qu'une
preuve produit ou CI reste attendue a la phase indiquee.

### 6.3 B-01 — coherence canonique revalidee

Le catalogue r2 contient 58 codes exacts dans les six domaines Contract, Audio,
Transcription, Platform, Delivery et Settings. Une extraction des huit
documents trouve exactement les memes 58 identifiants:

- zero reference orpheline;
- zero code du catalogue non reference;
- zero ancien alias `DeliveryUnknown`, `DeliveryOutcomeUnknown`,
  `ModelMissingOrInvalid`, `UnsupportedFormat`, `NoSpeechOrEmptyCapture`,
  `AudioUnavailable`, `Unconfirmed`, `NotReady` ou resultat
  `delivered_confirmed/unconfirmed`;
- les onze codes ASR reprennent les memes `retryable`/`recoverability` que le
  catalogue;
- `ASR_CANCELLED` mene a `Cancelled`, jamais `Error`;
- une erreur ASR purge le segment et exige une nouvelle session, jamais un
  `RetryOperation` sur le meme audio;
- `DELIVERY_OUTCOME_UNKNOWN` est le seul code produit avec
  `OutcomeUnknown`, `retryable=false`; il bloque retry et copie automatique;
- `MutationUnknown` du `VaultHarness` est explicitement test-only, hors
  `PortError` et hors IPC produit.

La resolution utilisateur d'un outcome Delivery inconnu reste une intention a
tester par modele: `ResolveOutcome(NotDelivered)` ouvre uniquement L0/L1
explicite via `RawAvailable`; `ResolveOutcome(Delivered)` ou `Discard` clot sans
nouvelle remise. Aucun resultat natif ou message libre ne peut prendre cette
decision.

### 6.4 Absence de regression de confidentialite

- Local-first reste inchangable: aucun endpoint, compte, telemetrie, failover
  Cloud ou file d'egress dans le MVP. `ACQUIRE-ONLINE` est une action operateur
  separee; build et campagnes restent offline.
- OCR et lecture de contexte d'accessibilite restent hors scope. L'oracle AT ne
  lit que la surface Fluent synthetique et interdit arbre/texte de la cible.
- Le callback audio, les latches Stop/Cancel, l'epoch, l'overflow fail-closed,
  la quiescence et la purge ne sont pas elargis par les corrections.
- Le `VaultHarness` ne lit aucun secret reel et n'accepte aucun C4 par argument,
  environnement, fixture, fichier, IPC ou WebView. Aucun hash/fingerprint C4
  ne sort de sa frontiere.
- Clipboard `CHANGED` ou `UNKNOWN` ne declenche aucune API mutante. Le risque
  residuel d'historique/synchronisation OS est annonce avant la copie explicite.
- L'updater reste hors scope. Le manifeste manuel de spike n'est ni un
  catalogue produit ni une autorisation d'auto-download.
- F-01 et F-02 restent ouverts et non prouves; F-03 devient une condition avant
  mutation. Aucun `NOT_RUN` ou `UNAVAILABLE_ENVIRONMENT` n'est converti en PASS.

Aucune nouvelle permission, dependance, commande IPC, WebView, donnees
persistantes ou implementation distante n'est introduite par l'union r2.

### 6.5 Validations r2

| Controle | Resultat | Limite explicite |
|---|---|---|
| merge `--no-commit` des quatre SHA r2 | PASS | quatre `MERGE_HEAD`, zero conflit, base exacte `03f8206` |
| ownership | PASS | 12 fichiers uniques, aucun overlap |
| `git diff --cached --check` | PASS | controle independamment rejoue |
| liens Markdown locaux des huit documents | PASS | zero lien casse, controle independamment rejoue |
| catalogue/aliases | PASS | 58/58 codes, zero orphelin, zero alias interdit; ASR 11/11 |
| scans secrets/chemins/artefacts manager | PASS | aucun secret lu ou reproduit dans cette revue |
| `pnpm install --frozen-lockfile` manager | PASS | installation verrouillee; ne prouve aucun spike |
| `pnpm check` manager | PASS | TypeScript, ESLint, Vitest 2/2, Rust 2/2 + doc-tests, fmt, Clippy strict |
| CI de la PR #17 avant amendement | PASS x3 | macOS, Ubuntu et Windows verts sur `c97db1c`; la CI du nouvel amendement doit encore passer |
| campagnes audio/ASR/OS/stockage/C4/a11y | **NOT_RUN** | aucune faisabilite, performance ou permission native revendiquee |

### 6.6 Verdict final et conditions non negociables

**Gate contrat PHASE-02: PASS. ADR-0002 peut devenir
`Accepted-for-spike`.** Cette acceptation signifie seulement que les frontieres
sont assez coherentes pour le prochain cycle de prototypes jetables. Elle ne
vaut ni `Accepted-for-product`, ni Gate 02 PASS, ni promotion de Tauri,
whisper.cpp, SQLite, coffre, modele, hotkey, injection, permission ou updater.

Conditions non negociables du cycle executable:

1. le manager attribue un owner exclusif a chaque fichier, manifest et lockfile;
2. F-03 obtient `PASS` **avant** toute mutation de dependance; aucune exception
   sans owner, expiration et condition de sortie;
3. tout code C4 choisit explicitement le `VaultHarness` test-only et reste absent
   du binaire produit; sinon ADR securite + contrat versionne avant code;
4. aucun secret reel n'est lu; seules des valeurs synthetiques generees dans la
   frontiere coffre sont permises;
5. le modele est acquis manuellement depuis le manifeste epingle doublement
   revu; aucun auto-download, URL libre, build download ou promotion produit;
6. build et campagnes ASR s'executent reseau bloque; toute tentative egress est
   `FAIL`, meme bloquee par le firewall;
7. la campagne hotkey/fallback d'un couple OS/AT ne demarre qu'apres son
   `a11y-preflight`; environnement absent reste `UNAVAILABLE_ENVIRONMENT`;
8. perte de l'indicateur accessible refuse l'armement ou arrete la capture par
   watchdog; aucun succes n'est deduit du retour de focus;
9. clipboard `CHANGED` ou `UNKNOWN`, notamment apres crash/redemarrage, implique
   zero mutation; seul `MATCHED` peut etre experimente et ne vaut pas choix
   produit;
10. `DELIVERY_OUTCOME_UNKNOWN` interdit retry/copie automatique; les deux
    branches `ResolveOutcome` sont couvertes par tests de modele et une future UX
    accessible avant promotion;
11. aucune seconde commande/WebView/origine/permission Tauri avant Gate F-05;
12. F-01 reste `OPEN_UNPROVEN`, F-02 reste sous allowlist bornee, et aucune voie
    Linux n'est promue sans leur disposition;
13. chaque verdict futur cite commande, environnement, artefacts et oracles;
    une machine, un AT, un coffre ou un outil absent ne produit jamais `PASS`;
14. toute necessite de Cloud, persistance C3, OCR/contexte, auto-updater, port C4
    produit ou changement de garantie local-first arrete le lot et ouvre le
    cadrage/ADR correspondant.

Aucune dette n'est `WAIVED` par ce PASS. Les risques residuels ont leurs owners,
preuves attendues et gates explicites dans la table 6.2.
