# PHASE-02 — Plan de preuve audio et stockage local

- Statut: protocole D3 pour le cycle de prototypes suivant; aucune preuve de faisabilite n'est acquise par ce document
- Proprietaire du plan: `rust-core-lead`
- Portee d'implementation future: capture sans UI, chemin temps reel, file SPSC, stockage SQLite et integration aux coffres natifs
- Hors portee de ce cycle: code, schema de production, signature de trait, permission, dependance, migration utilisateur et mesure revendiquee
- Reference materielle: `HW-MAC` Apple Silicon seulement si la machine est reellement disponible; sinon `HW-WIN` est la reference pratique et l'absence de baseline macOS est archivee

Ce plan rend executables les preuves demandees par la [Phase 02](../roadmap/phases/PHASE-02-ARCHITECTURE-PROTOTYPES.md), le [cycle actif](../project-management/cycles/CYCLE-20260809-04.md), l'[ADR-0001](../architecture/ADR-0001-STACK-CIBLE.md), les [budgets proposes](../quality/PERFORMANCE-BUDGETS.md) et le [plan de mesure](../quality/MEASUREMENT-PLAN.md). Il applique aussi la [DoD](../quality/DEFINITION-OF-DONE.md), la [matrice de test](../quality/TEST-MATRIX.md), le [threat model](../security/THREAT-MODEL-V0.md), les [flux de donnees](../security/DATA-FLOWS.md) et la [revue supply chain](../security/PHASE-01-SUPPLY-CHAIN-REVIEW.md).

## 1. Autorite, coordination et stop conditions

Le prochain cycle ne commence qu'apres acceptation par le `product-architect` des contrats normatifs et de la machine a etats. Ce plan ne choisit ni signature, ni enum partagee, ni crate audio/SQLite/coffre. Les noms de binaires et de commandes ci-dessous sont l'interface requise du harnais, pas des API produit existantes.

| Sujet | Proprietaire ou relecteur requis | Condition avant implementation partagee |
|---|---|---|
| Cinq ports, etats, epochs et erreurs | `product-architect` | ADR et contrats acceptes; les tests de ce plan importent leurs types sans les redefinir |
| Capture et coffre natif par OS | `platform-lead` | API, permission et environnement nommes; aucun comportement macOS/Linux deduit de Windows |
| Handoff audio vers ASR | `ai-asr-lead` | format source et derive par hash; conversion chronometree hors callback; backpressure observable |
| Etat visible et IPC | `frontend-lead` + `product-architect` | aucun buffer audio, secret ou chemin local dans l'IPC; aucune seconde commande avant allowlist F-05 |
| Benchmarks et statistiques | `performance-benchmarker` | campagne executee selon le plan de mesure, sans modifier les seuils apres observation |
| Repetitions et fault injection | `qa-release-lead` | commandes, fixtures et oracles revus avant campagne qualifiante |
| `unsafe`, secrets, retention et egress | `security-reviewer` | revue independante obligatoire avant tout verdict `PASS` |

Stopper et arbitrer avant implementation si un port normatif est encore ambigu, si deux leads proposent des formats incompatibles, si une dependance native ou un `unsafe` est necessaire sans revue, si un test exige des donnees reelles, ou si le changement impose un manifeste/lockfile sans ownership explicite du manager.

## 2. Regles communes de preuve

### 2.1 Environnement

Chaque commande part de la racine d'un clone/worktree propre et d'un build `--release --locked`. Une campagne enregistre:

- commit, `rustc -Vv`, OS/build, architecture, CPU, RAM, alimentation et etat thermique;
- `machine_id` dans `HW-MAC`, `HW-LNX`, `HW-WIN` et `platform_id` dans `macos`, `x11`, `wayland`, `windows`;
- backend audio, version du pilote, peripherique pseudonymise, format demande et format negocie;
- sur Linux: distribution, noyau, session, desktop, compositor et versions GTK/WebKit/Tauri;
- hashes des sources, lockfile, fixture, derive audio, harnais et configuration;
- nombre d'essais demandes, valides, invalides et raison de chaque exclusion.

Un identifiant de peripherique, nom de compte ou chemin personnel n'est jamais archive. L'environnement est structure, pas copie en vrac depuis les variables du processus. Le mode local est teste reseau coupe; aucun endpoint de telemetrie ou de crash report n'est autorise.

### 2.2 Artefacts

Chaque campagne produit le contrat immuable suivant sous `artifacts/quality/<run-id>/`, a collecter comme artefact QA et non a committer:

```text
manifest.json
command.txt
environment.json
raw.ndjson
summary.json
stdout.txt
stderr.txt
checksums.sha256
audio-config.json          # campagne audio uniquement
frames.ndjson              # sequences, compteurs et durees; jamais d'echantillons
faults.ndjson              # fautes demandees et effectivement observees
storage-inventory.json     # campagne stockage uniquement
integrity.json             # SQLite, retention et scan de canaris
dependency-inventory.json  # campagne F-01/F-02 uniquement
```

`<run-id>` suit `YYYYMMDD-HHMMSS-<commit-court>-<scenario>`. `stdout.txt` et `stderr.txt` sont expurges avant archivage. Les fichiers ne contiennent ni audio, ni transcription, ni secret factice en clair, ni requete SQL libre, ni chemin personnel. Un canari synthetique est identifie dans les resultats par son SHA-256 seulement.

### 2.3 Statistiques et verdicts

- Les durees utilisent une horloge monotone dans le meme processus. Un pont d'horloges publie son erreur de calibration; sans cela, la mesure est indicative.
- Le percentile par defaut est le nearest-rank: trier `n` valeurs et prendre l'element `ceil(p * n)`, indexe a partir de 1. `summary.json` repete cet algorithme.
- Les campagnes courtes font 3 chauffes puis 30 repetitions; la continuite audio fait 3 fois 10 minutes par peripherique.
- Publier p50, p95, p99 et maximum pour callback, occupation/retard de file, annulation, arret et shutdown. Publier aussi p50/p95/p99/max pour les operations de stockage, sans inventer de budget produit.
- Un essai interrompu reste dans `raw.ndjson` avec `valid=false` et une cause. Aucune exclusion post-hoc n'est permise.
- `PASS` signifie que tous les criteres obligatoires du scenario sont satisfaits. `FAIL` nomme le premier oracle viole et conserve tous les artefacts. `unavailable_environment` et `not_run` ne sont jamais comptes comme `PASS`.
- Une campagne Windows seule peut fournir la baseline pratique; elle ne prouve rien pour macOS ou Linux et ne ferme pas le Gate 02 multiplateforme.

## 3. Prototype audio sans UI

### 3.1 Questions de preuve

Le spike doit montrer, pas seulement affirmer, que:

1. le callback copie un buffer OS emprunte vers une file SPSC preallouee sans I/O, log synchrone, allocation/deallocation, verrou bloquant ou travail ASR;
2. le producteur et le consommateur ont un ownership exclusif et ne lisent jamais simultanement le meme slot;
3. overflow, trou, erreur de device, annulation et shutdown sont observables et ne produisent jamais une transcription pretendument valide;
4. la conversion, le downmix, le resampling, le chunking et les metriques lourdes restent sur worker;
5. la capture s'arrete et les donnees ephemeres sont purgees lors d'une annulation, d'une revocation, d'une erreur ou d'un resultat tardif d'epoch obsolete.

### 3.2 Topologie candidate a eprouver

```text
API audio OS
  -> callback producteur unique
     -> copie bornee vers slots prealloues de la SPSC
        -> worker audio consommateur unique
           -> validation sequence/format
           -> conversion/downmix/resampling hors callback
           -> segment finalise remis au double ASR

thread de controle
  -> token/epoch atomique d'annulation
  -> stop du stream, quiescence callback, purge/drain et join hors RT

worker stockage (separe)
  -> aucune reference, file ou appel depuis le callback
```

Le handle/stream natif appartient au futur `AudioSource`. Le callback emprunte le buffer OS et ne conserve jamais ce pointeur. Il copie au plus le bloc entrant vers un slot libre deja alloue. Le worker prend ensuite l'ownership logique du slot jusqu'a sa liberation. Le segment finalise transmis au moteur ASR porte un lease explicite selon le contrat architecture; ce plan n'en fixe pas la representation.

### 3.3 SPSC, atomiques et memoire

Le prototype compare au moins une implementation safe, bornee et sans allocation apres armement. Toute bibliotheque candidate exige inventaire de licence/advisories et accord d'ownership avant modification du manifeste.

Invariants a verifier:

- exactement un endpoint producteur est deplace dans le callback et exactement un endpoint consommateur dans le worker;
- capacite, slots, metadonnees et compteurs sont alloues avant le demarrage du stream;
- l'indice publie par le producteur devient visible par une operation `Release`, puis est acquis par le consommateur avec `Acquire`; le retour d'un slot suit le sens inverse;
- chaque indice n'a qu'un writer; les valeurs lues par l'autre thread peuvent etre cachees localement; les compteurs purement diagnostiques peuvent etre `Relaxed` si aucune decision de securite n'en depend;
- indices producteur/consommateur et compteurs frequents sont separes par cache line quand le type le permet; l'effet du false sharing est mesure, pas suppose;
- le token/epoch d'annulation est atomique, idempotent et independant de la file. Un message de controle ne peut donc pas rester bloque derriere l'audio;
- un slot publie est immuable jusqu'a sa restitution; un slot libre n'est pas lu; aucun pointeur OS ne survit au callback;
- le wrap des compteurs est couvert par modele reduit/property test et par compteurs suffisamment larges en production candidate.

L'implementation par defaut reste sans `unsafe`, conformement au workspace. Si un `unsafe` devient necessaire, le lot s'arrete jusqu'a production de: justification de l'impossibilite d'une alternative safe, invariants ligne par ligne, surface minimale, tests de concurrence/property, Miri lorsque applicable, sanitizer/outil natif lorsque applicable et revue du `security-reviewer`. Miri ne prouve pas la surete d'une FFI audio et un test de stress ne prouve pas l'absence de race.

### 3.4 Capacite et politique d'overflow

Le harnais calcule la capacite minimale a partir des valeurs observees, sans figer un format produit:

```text
octets_par_seconde = sample_rate * channels * octets_par_sample
slots_requis = ceil((octets_par_seconde * stall_worker_cible_s) / payload_slot_octets)
capacite = prochaine puissance/decomposition supportee >= slots_requis + marge de callback
```

La matrice couvre au minimum les formats natifs effectivement proposes par le device (`i16`, `u16`, `f32` si disponibles), mono/stereo, 16/44.1/48/96 kHz si exposes, buffer fixe et taille variable. Aucun callback ne resample ni ne downmixe. Le format negocie est explicite: sample format, rate, channels, layout, frames du bloc, sequence et timestamp monotone si sa lecture est prouvee RT-safe. L'absence d'un format dans un environnement est archivee, pas simulee comme support.

En coordination avec le lot ASR, le worker evalue une derive candidate PCM mono 16 kHz (`f32` et/ou WAV PCM16 selon le harnais), tout en conservant separement le hash de la source et de chaque derive. Le temps et les copies de conversion sont mesures hors callback. Cette derive est une hypothese de spike; le format canonique final reste une decision architecture/ASR apres resultats.

Si le bloc entrant ne tient pas ou si la file est pleine, la politique candidate est `drop-newest-block`: ne pas ecraser un slot non consomme, incrementer les compteurs atomiques frames/blocs perdus, latcher l'overflow et associer le trou a l'epoch. La session devient invalide/erreur et aucun segment lacunaire n'est remis comme transcription valide. L'overflow provoque volontairement par fault injection passe seulement si cette conservation est vraie:

```text
blocs_presentes = blocs_acceptes + blocs_refuses
frames_presentes = frames_acceptees + frames_refusees
```

### 3.5 Finalisation, cancel et shutdown

Les noms d'etat definitifs viennent du contrat architecture. Le spike exerce cependant les proprietes suivantes:

| Action | Proprietes obligatoires |
|---|---|
| finaliser | stopper les nouvelles publications, obtenir la quiescence du callback, drainer uniquement les slots valides de l'epoch courant, fermer le segment une fois |
| annuler | publier un epoch/token atomique idempotent, stopper le stream, purger les slots de l'epoch, detruire/ignorer tout resultat tardif, ne rien persister |
| erreur device/permission | latcher une erreur structuree hors callback, arreter sans boucle de restart, purger et rendre une action de recovery |
| shutdown | `cancel -> stop/quiesce -> drain ou purge -> join`, toutes les attentes et destructions hors callback |
| appel repete | `stop`, `cancel` et `shutdown` restent idempotents; aucun double-free, double-finalize ou callback sur memoire liberee |

Un watchdog de harnais de 5 secondes detecte un hang; ce n'est pas un budget UX. Les durees cancel/stop/quiescence/join sont publiees afin que l'architecte fixe ensuite des deadlines. Le flush PTT conserve les cibles proposees p95 <= 150 ms et p99 <= 250 ms; elles restent candidates jusqu'au verdict prototype.

### 3.6 Instrumentation du callback

L'instrumentation ne doit pas introduire la violation qu'elle mesure:

- compteurs atomiques prealloues pour entrees, frames, pushes, refus, occupation haute et codes d'erreur bornes;
- traces detaillees ecrites dans un second buffer prealloue ou reconstruites hors callback a partir des sequences; jamais `println!`, logger ou fichier dans le callback;
- allocateur compteur calibre avant l'armement; le thread callback et sa fenetre sont identifies sans initialisation paresseuse. Toute invocation de `alloc`, `realloc` ou `dealloc` dans la fenetre callback est un echec;
- revue statique de la call graph du callback et traceur OS quand disponible pour detecter filesystem, reseau, attente de verrou et allocation;
- mesure externe de la duree quand l'horloge plateforme n'est pas documentee RT-safe. Une lecture d'horloge dans le callback exige la meme justification qu'un autre appel natif.

### 3.7 Scenarios audio

| ID | Campagne | Charge/fautes | Oracle obligatoire |
|---|---|---|---|
| AUD-PROP-01 | modele SPSC et property tests | capacites 1/2/N, wrap accelere, ordonnancements producteurs/consommateurs | ordre strict, conservation des compteurs, aucun slot lu avant publication ou reecrit avant restitution |
| AUD-SYN-01 | source synthetique sans device | impulsions et numeros de trame, formats/taille limites | derive worker bit-exacte selon conversion declaree; aucun trou non compte |
| AUD-DEV-01 | negotiation device | chaque format/buffer expose, silence puis motif synthetique si loopback autorise | format reel archive; erreur structuree pour format refuse; aucune conversion callback |
| AUD-LONG-01 | continuite | 3 x 10 min, micro integre puis USB si disponible | cible proposee <= 0.01 % frames perdues et aucun trou > 30 ms; sequences recalculables |
| AUD-LOAD-01 | stress | saturation CPU/memoire hors callback, worker ralenti, priorites normales | p99/max et ratio au block period publies; aucun deadline miss/reentrance; drops tous comptes; aucune attente bloquante |
| AUD-OVF-01 | overflow force | pause consommateur 1/10/100/1000 ms et bloc surdimensionne | drop du bloc entrant, latch erreur, conservation, segment invalide, recovery au prochain epoch |
| AUD-CAN-01 | races d'annulation | annuler avant start, pendant chaque slot, pendant finalisation, 1 000 cycles | aucun frame/resultat obsolete remis; appels idempotents; aucun hang au watchdog |
| AUD-DEV-02 | fautes plateforme | micro absent, revoke, debranchement, changement format, zero frame, callback tardif simule | etat terminal sur, purge, action recovery, aucun restart infini |
| AUD-WRK-01 | faute worker | panic/exit/retard consommateur simule | callback ne panic pas; overflow/worker failure observable; shutdown borne par watchdog |
| AUD-RT-01 | audit temps reel | compteur allocator + call graph + trace OS | zero alloc/realloc/dealloc, zero I/O/reseau/log, zero mutex/attente bloquante dans callback |
| AUD-SYS-01 | ressources | capture seule pendant 5 min, 30 runs arm/flush | p95 CPU/RSS, callback p50/p95/p99/max, occupation et retard publies |

`AUD-LONG-01` est `FAIL` si le seuil candidat est depasse, mais ce resultat n'en fait pas encore un seuil de release approuve. `AUD-OVF-01` n'echoue pas parce que des drops sont injectes; il echoue si un drop est silencieux, mal compte, ecrase des donnees ou laisse continuer une session valide.

### 3.8 Commandes contractuelles du futur harnais audio

Ces commandes doivent etre livrees au cycle prototype; elles ne sont pas disponibles dans le depot au moment de rediger ce plan:

```powershell
$env:FLUENT_MACHINE_ID = 'HW-WIN' # HW-MAC seulement si la machine existe
$env:FLUENT_PLATFORM_ID = 'windows'
$env:FLUENT_ARTIFACT_ROOT = 'artifacts/quality'

cargo test --locked -p fluent-core audio_prototype -- --nocapture
cargo run --locked --release -p fluent-audio-spike -- synthetic --runs 30 --fault-matrix all --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-audio-spike -- capture --device default --duration 600s --runs 3 --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-audio-spike -- lifecycle --cycles 1000 --fault-matrix cancel,device-loss,worker-stall,late-callback --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-audio-spike -- audit-rt --allocator-count --platform-trace auto --output $env:FLUENT_ARTIFACT_ROOT
```

Le `performance-benchmarker` execute les campagnes de duree/CPU/RSS/percentiles. Rust core fournit le harnais et les compteurs; QA rejoue les campagnes longues et de fault injection.

### 3.9 Verdict audio

Le lot audio est `PASS` sur une plateforme seulement si:

- `AUD-PROP-01`, `AUD-SYN-01`, `AUD-OVF-01`, `AUD-CAN-01`, `AUD-DEV-02`, `AUD-WRK-01` et `AUD-RT-01` passent sans exclusion;
- `AUD-DEV-01`, `AUD-LONG-01` et `AUD-SYS-01` sont executes sur le device et l'environnement qualifies;
- la perte nominale satisfait la cible proposee et chaque overflow injecte est exact et explicite;
- aucune invocation mesuree du callback n'atteint sa deadline negociee et aucun callback ne se reentre; si la mesure fiable est indisponible, le scenario n'est pas `PASS`;
- aucune allocation/deallocation, I/O, log, attente bloquante, conversion ou ASR n'est observe dans le callback;
- aucun audio brut ne figure dans la base, les fichiers, logs, IPC ou artefacts, et un test reseau coupe ne detecte aucun egress;
- le rapport contient les distributions, maximums, formats negocies, tailles de file et commandes exactes.

Tout oracle de correction viole est `FAIL`. Outil de trace indisponible, device/machine absent ou baseline macOS non executee est `unavailable_environment`/`not_run`, jamais une preuve d'inatteignabilite ni un `PASS` multiplateforme.

## 4. Spike SQLite, reglages, migrations et coffres OS

### 4.1 Frontiere et donnees autorisees

Le stockage tourne sur un worker dedie. Le callback audio n'en connait ni handle, ni queue, ni fonction. Le futur `SettingsStore` ne couvre que des reglages types/versionnes C1-C2. Il ne contient jamais audio, transcription, cible, contenu de presse-papiers, token ou secret C4. L'historique texte, s'il est teste, utilise un store logique separe et reste desactive par defaut.

Le schema de spike est volontairement jetable. Les tables/cles `prototype_*` et les fixtures ci-dessous servent uniquement a tester atomicite et migrations; elles ne constituent pas le schema produit:

| Fixture | Contenu synthetique non sensible | Oracle |
|---|---|---|
| `empty-v0` | base vide, version de schema initiale du spike | ouverture/migration deterministe |
| `settings-v1` | valeurs `prototype.locale=fr`, `prototype.mode=ptt`, `prototype.history=false` | round-trip type et snapshot coherents |
| `settings-v2` | meme fixture avec un champ synthetique ajoute/supprime | migration forward et rollback logique sans perte inattendue |
| `history-opt-in` | canaris texte synthetiques dates par horloge injectee | aucun insert avant opt-in; retention/purge exacte apres opt-in |
| `vault-handle` | identifiant opaque et secret factice genere a l'execution | seul le handle est present en SQLite; valeur seulement dans le coffre de test |

Aucune fixture ne contient voix, dictee, adresse, credential reel ou chemin utilisateur. Le namespace de coffre est unique au `run-id`; son nettoyage est idempotent et verifie meme apres echec.

### 4.2 SQLite et ownership

Le spike evalue un seul owner de connexion SQLite sur le worker stockage, avec requetes parametrees, transactions bornees et erreurs structurees. Les appelants recoivent des snapshots immuables et exercent le compare-and-swap/version attendu par le contrat architecture; ce plan ne fixe ni signature ni format de serialisation.

Les options suivantes sont mesurees et archivees, puis tranchees par ADR/contrat avant promotion: mode journal (`WAL` et rollback journal si supportes), `synchronous`, `foreign_keys`, timeout busy, strategie de backup et permissions de repertoire/fichier. Aucun PRAGMA implicite n'est accepte.

### 4.3 Migrations, rollback et crash recovery

Chaque paire de migrations de spike fournit un generateur deterministe, une verification logique et les failpoints suivants:

1. avant `BEGIN`;
2. apres `BEGIN` et apres chaque instruction DDL/DML;
3. avant puis apres `COMMIT`;
4. apres commit durable mais avant acquittement a l'appelant;
5. pendant checkpoint/backup/compaction lorsqu'applicable.

Le parent du harnais lance un processus enfant, attend le failpoint, le termine brutalement, puis rouvre la base. Ce test prouve la recovery apres crash de processus, pas apres coupure electrique ou panne du controleur disque. Une revendication power-loss exige un banc materiel distinct.

Oracles:

- avant commit, l'etat logique et `user_version` restent a la version precedente;
- apres commit, l'etat est entierement ancien ou entierement nouveau, jamais hybride;
- si le commit a reussi avant perte d'acquittement, un retry idempotent detecte la version et ne reapplique pas la migration;
- `integrity_check`, `foreign_key_check`, compteurs, types et checksums logiques passent a chaque reouverture;
- les fichiers DB/WAL/SHM appartiennent tous a l'inventaire et aucun temporaire orphelin n'apparait hors repertoire de run;
- une migration forward reussie est suivie d'un rollback teste. Un down migration n'est accepte que s'il est sans perte; sinon le rollback restaure une sauvegarde/logical export verifie cree avant migration, apres quiescence et checkpoint explicites;
- corruption/troncature ne declenche ni recreation silencieuse ni ecrasement: erreur structuree, copie preservee pour diagnostic expurge, action de recovery explicite.

### 4.4 Zero-history et retention

Le test commence toujours avec historique desactive. Une tentative d'ecriture dans le store historique doit etre refusee ou ignoree selon le contrat, et aucune ligne/fichier annexe ne doit apparaitre. Apres opt-in explicite de la fixture, une horloge injectee cree des canaris avant, sur et apres une cutoff de test. La valeur de cutoff teste l'algorithme et ne fixe aucune duree produit.

La purge doit:

- supprimer seulement les lignes eligibles et conserver celles apres cutoff;
- couvrir index, FTS, cache, WAL, SHM, snapshots et backups possedes par Fluent;
- checkpoint/tronquer et compacter selon la strategie approuvee, puis rechercher les canaris supprimes dans tous les fichiers logiques possedes;
- remettre le store en zero-history quand l'opt-in est revoque;
- publier l'inventaire avant/apres et la preuve par hash, sans archiver le canari en clair.

L'absence de canari apres ce protocole ne garantit pas l'effacement physique sur SSD, swap, snapshot OS ou sauvegarde externe. Toute garantie plus forte exige threat model, ADR et test materiel/OS; elle ne peut pas etre deduite de `secure_delete` ou `VACUUM` seuls.

### 4.5 Separation des secrets et coffres OS

Rust core teste la separation et le lifecycle; `platform-lead` possede l'integration native. Le spike n'introduit pas un sixieme port partage avant decision architecturale.

| Plateforme | Coffre a exercer si environnement disponible | Preuve minimale |
|---|---|---|
| Windows | Credential Manager sur `HW-WIN` actuel | create/read/replace/delete/restart, verrou/refus simule, ACL et nettoyage du namespace de run |
| macOS | Keychain sur Apple Silicon seulement si machine disponible | memes operations, etats verrouille/refuse et prompts documentes sans capture de valeur |
| Linux | Secret Service ou KWallet selon session declaree | backend/version/session nommes; `unavailable_environment` si aucun service reel n'est present |

Le secret factice est genere en memoire, ecrit directement au coffre et compare par hash en memoire. Il n'apparait jamais en argument de commande, variable d'environnement, SQLite, log, capture ou artefact. SQLite conserve seulement un handle opaque et des metadonnees C1 minimales. Le scan final cherche les octets du canari dans DB/WAL/SHM, stdout/stderr et artefacts avant de detruire la valeur; le rapport ne conserve que son hash et le nombre de correspondances attendu, zero hors coffre.

Les scenarios couvrent valeur absente, coffre verrouille, permission refusee, remplacement interrompu, crash entre mise a jour du coffre et du handle, logout/revocation et cleanup au redemarrage. Un protocole de compensation explicite est requis pour une operation qui traverse SQLite et coffre, car aucune transaction distribuee n'est presumee.

### 4.6 Scenarios stockage

| ID | Campagne | Charge/fautes | Oracle obligatoire |
|---|---|---|---|
| STO-SET-01 | conformance reglages | create/read/update/CAS, 8 clients synthetiques | snapshot coherent, conflit explicite, aucune requete depuis callback |
| STO-MIG-01 | migration | v0->v1->v2, failpoint apres chaque etape, 100 repetitions | ancien ou nouveau schema complet, jamais hybride; retry idempotent |
| STO-ROL-01 | rollback | down lossless puis restauration backup pour cas destructif | checksum logique identique a la baseline attendue; rollback documente |
| STO-CRS-01 | crash recovery | kill avant/apres commit/checkpoint et avant ack | reopen integre, resultat ambigu gere idempotemment, aucun fichier hors inventaire |
| STO-FLT-01 | fautes fichiers | read-only, busy/lock, espace insuffisant quand simulable, troncature/corruption | erreur structuree, aucune perte/ecrasement silencieux, recovery explicite |
| STO-RET-01 | zero-history/retention | opt-in off/on/revoke, cutoff injectee, WAL/backup/cache | zero-history initial/final, purge exacte, zero canari supprime dans fichiers possedes |
| STO-VLT-01 | coffre natif | CRUD/restart/refus/verrou/crash/cleanup | zero valeur hors coffre; handle seul en DB; cleanup idempotent |
| STO-SEC-01 | permissions et egress | inspection ACL/mode, reseau coupe, scan logs/fichiers | acces local minimal selon OS, zero egress et zero contenu sensible |
| STO-PERF-01 | baseline | 3 chauffes + 30 runs par operation/migration/reopen | p50/p95/p99/max, tailles et mode journal publies; aucun seuil invente |

Un test de disque plein qui n'est pas fidelement disponible sur l'hote est marque `unavailable_environment`; une exception applicative simulee peut valider le chemin d'erreur mais ne remplace pas la preuve filesystem.

### 4.7 Commandes contractuelles du futur harnais stockage

```powershell
$env:FLUENT_MACHINE_ID = 'HW-WIN'
$env:FLUENT_PLATFORM_ID = 'windows'
$env:FLUENT_ARTIFACT_ROOT = 'artifacts/quality'

cargo test --locked -p fluent-core storage_prototype -- --nocapture
cargo run --locked --release -p fluent-storage-spike -- settings --runs 30 --clients 8 --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-storage-spike -- migrations --runs 100 --failpoints all --verify-rollback --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-storage-spike -- retention --history-default off --clock fixture --scan-canaries --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-storage-spike -- vault --backend auto --fault-matrix all --scan-canaries --output $env:FLUENT_ARTIFACT_ROOT
cargo run --locked --release -p fluent-storage-spike -- recovery --fault-matrix crash,readonly,busy,corrupt,disk-full --output $env:FLUENT_ARTIFACT_ROOT
```

### 4.8 Verdict stockage

Le spike est `PASS` sur une plateforme seulement si tous les scenarios applicables ont des artefacts complets et si:

- migrations et crash recovery ne produisent aucun etat hybride, aucune perte silencieuse et aucune recreation implicite;
- rollback/restauration retourne le checksum logique attendu et la strategie destructive est explicite;
- zero-history est le defaut, aucun audio n'est persiste, retention/purge couvrent toutes les copies possedees;
- zero secret factice est trouve hors du coffre; la base ne contient qu'un handle opaque;
- permissions locales minimales, zero egress et diagnostics sans contenu sont verifies;
- toutes les erreurs sont structurees et actionnables, sans requete SQL, valeur, chemin personnel ou secret dans leur rendu;
- latences, tailles et modes sont publies comme baseline. L'absence de budget stockage approuve interdit un verdict performance produit.

Tout secret hors coffre, canari retenu dans une copie possedee, base hybride/corrompue apres scenario supporte, audio persiste, egress ou perte silencieuse est `FAIL`. Un coffre ou banc OS absent est `unavailable_environment` et empeche un `PASS` pour cette plateforme.

## 5. Tester les cinq ports sans les figer

Les suites de conformance sont des consommateurs des contrats du `product-architect`; elles ne declarent aucun trait concurrent. Leurs doubles sont prives au harnais et recompiles quand le contrat normatif change.

| Port futur | Double/scenario de preuve | Proprietes testees sans imposer une signature |
|---|---|---|
| `AudioSource` | source scriptable: buffers empruntes, formats, device loss, callbacks tardifs | ownership du stream, format explicite, ordre/epoch, stop idempotent, quiescence et erreurs |
| `TranscriptionEngine` | moteur factice sans modele qui accepte/refuse/retarde un segment | lease finalise, backpressure, annulation, resultat tardif ignore, texte brut synthetique; aucun choix whisper.cpp |
| `PlatformAdapter` | capability map factice et adaptateur reel possede par plateforme | permission/device/session explicites, `proven`/`unsupported`/`unavailable_environment`/`not_run`, aucun support deduit |
| `TextInjector` | oracle factice avec cible valide/detruite/protegee | resultat confirmable, aucun faux succes, fallback explicite; aucun appel OS dans le spike audio |
| `SettingsStore` | in-memory reference puis adaptateur SQLite de spike | snapshots types/versionnes, CAS, transactions, erreur/recovery, C1-C2 seulement, substituabilite |

Un test de composition instancie les cinq doubles pour un parcours synthetique sans UI, micro, modele, clipboard ni reseau. Il verifie seulement transitions, epochs, erreurs et absence de fuite entre frontieres. Le `frontend-lead` revoit ensuite les etats/evenements expurges; aucune donnee audio, secret ou path ne traverse l'IPC. Une divergence entre ce plan et le futur contrat se resout en mettant a jour le harnais apres arbitrage architecture, jamais en figeant silencieusement une seconde interface ici.

## 6. Reevaluation F-01 et F-02 sous Linux

L'inventaire actuel conserve `glib 0.18.5` dans le graphe Linux via Tauri/Wry/GTK. Cela prouve une dependance, pas l'appel des fonctions affectees, et ne prouve ni exploitabilite ni inatteignabilite. Les seize advisories `unmaintained` rapportees en Phase 01 doivent etre regenerees a partir du lockfile du commit teste; leur ancien compte ne vaut pas inventaire courant.

### 6.1 F-01 — `RUSTSEC-2024-0429`

1. Sur `HW-LNX`, archiver `Cargo.lock`, son hash, les features et `cargo tree --locked --target all -i glib@0.18.5`.
2. Archiver la version primaire de l'advisory utilisee par l'outil d'audit et identifier exactement symboles/types/versions affectes.
3. Rechercher les appels directs et indirects dans le code Fluent et les sources verrouillees; produire une call graph relecturable avec ses limites (FFI, callbacks, dynamic dispatch, code genere).
4. Executer le shell et les scenarios platformes applicables avec les analyseurs memoire disponibles sur Linux; archiver outil/version/options. Miri seul est non probant pour GTK/FFI.
5. Dans une branche temporaire autorisee, evaluer une chaine Tauri/Wry/GTK corrigee, son diff de dependances, build et regression. Ne pas modifier silencieusement le lockfile du lot Rust.
6. Faire relire la preuve par `security-reviewer` et `platform-lead`.

Verdict F-01:

- `RESOLVED` si la version affectee a disparu du graphe qualifie et les tests Linux passent;
- `REACHABLE` si un appel affecte est etabli: `FAIL`, interdiction de beta Linux et remediation/rollback;
- `NOT_REACHED_IN_AUDITED_SCOPE` uniquement si la call graph, les features, les surfaces dynamiques et la revue independante bornent precisement le scope;
- `OPEN_UNPROVEN` dans tous les autres cas. Absence de crash, absence d'appel direct ou machine Linux indisponible ne prouve jamais l'inatteignabilite.

### 6.2 F-02 — dependances non maintenues

Regenerer la liste machine-readable, puis pour chaque advisory enregistrer crate/version, chemins inverses, fonctionnalite qui la tire, direct/transitif, alternative amont, owner, justification d'exception, date d'expiration et trigger de reevaluation. Une allowlist est temporaire, bornee au hash de lockfile et acceptee par security; elle n'est pas un verdict de surete.

Le scenario est `PASS` documentaire seulement si l'inventaire est exhaustif, zero crate inattendue/source non approuvee est introduite, chaque exception a owner et expiration, et la route de migration est testable. Advisory exploitable, exception sans owner/expiration ou derive non expliquee est `FAIL`; outil/advisory DB indisponible est `BLOCKED`, pas liste vide.

### 6.3 Commandes de collecte F-01/F-02

Les outils d'audit doivent etre versions et installes dans un repertoire de tooling ephemere approuve; le rapport consigne version et hash. Les commandes de base sont:

```powershell
cargo tree --locked --target all -i glib@0.18.5
cargo metadata --locked --format-version 1 --all-features
cargo audit --file Cargo.lock --json
cargo deny --all-features --workspace check advisories bans licenses sources
```

Si `cargo audit`/`cargo deny` ne sont pas encore verrouilles et approuves, le responsable supply chain les provisionne avant execution; lancer une version flottante ne donne pas une preuve qualifiante. Les sorties vont dans `dependency-inventory.json` et un rapport de reachability redige, jamais dans une pretention binaire fondee sur le seul `cargo tree`.

## 7. Ordre d'execution du prochain cycle

1. Accepter ADR/ports/etats et obtenir les revues architecture, plateforme, ASR et frontend sur les frontieres partagees.
2. Attribuer ownership des nouveaux fichiers, dependances et lockfile; faire la revue supply chain avant ajout.
3. Construire les doubles safe et tests de proprietes SPSC/epochs; revue securite avant toute exception `unsafe`.
4. Construire le harnais audio sans UI, puis executer synthese/faults avant le microphone reel.
5. Construire le harnais stockage avec fixtures jetables, puis migrations/crash/retention avant coffre reel.
6. Le `performance-benchmarker` capture les baselines; QA rejoue les campagnes longues et fautes.
7. Executer d'abord `HW-MAC` si disponible, sinon archiver son indisponibilite et utiliser `HW-WIN` comme reference pratique. Linux reste requis pour F-01/F-02 et ne peut etre infere de Windows.
8. Faire la revue security globale (callback, egress, artefacts, secrets, SQLite, supply chain), puis seulement proposer les seuils/decisions au manager.

## 8. Preuves minimales a remettre au manager

- commit et diff du prototype, commandes exactes et environnement expurge;
- un dossier d'artefacts complet et checksume par campagne;
- matrices audio/stockage/F-01/F-02 avec `PASS`, `FAIL`, `not_run`, `unavailable_environment` ou `OPEN_UNPROVEN` justifies;
- percentiles, maximums, essais invalides, formats et capacites de file;
- rapport d'allocations/appels interdits du callback;
- inventaire SQLite de toutes les copies, crash/rollback, retention et scan des canaris;
- preuve de coffre par OS execute, sans valeur factice archivee;
- revue security et arbitrages architecture/plateforme/ASR/frontend;
- liste des risques retires, reduits ou toujours ouverts, sans fermer le Gate 02 par declaration.

## 9. Retour arriere

Les prototypes utilisent uniquement des fixtures jetables et des namespaces de coffre propres au `run-id`. Le rollback supprime les binaires/fixtures temporaires, nettoie les entrees de coffre de test et revient aux documents/contrats acceptes; aucune donnee utilisateur ou migration de production n'existe. Une dependance ou permission introduite pour le spike n'est promue qu'apres ADR, supply-chain review et campagne `PASS`. Un echec audio conserve le core et remplace l'adaptateur/file derriere le contrat; un echec SQLite/coffre conserve le modele logique et remplace l'adaptateur apres export logique de fixture.
