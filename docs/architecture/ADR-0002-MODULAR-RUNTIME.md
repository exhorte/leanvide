# ADR-0002 — Runtime modulaire, single-writer et contrats bornés

- Statut: **Proposed**
- Date: 2026-08-09
- Décideurs proposés: project-manager, product-architect, rust-core-lead,
  ai-asr-lead, platform-lead et security-reviewer
- Portée: architecture runtime desktop locale et contrats des prototypes
  PHASE-02
- Décision supérieure: [ADR-0001](ADR-0001-STACK-CIBLE.md)
- Retour arrière: documentaire tant que le statut reste Proposed; adaptateurs
  jetables jusqu'à promotion explicite

## 1. Statut et niveau de preuve

Cet ADR est une décision d'architecture **proposée**, pas une preuve de
faisabilité et pas une acceptation produit. Il reste Proposed jusqu'à la revue
croisée technique et sécurité du cycle. Il n'autorise aucune implémentation
runtime, dépendance, permission, commande IPC supplémentaire ou WebView.

États de décision utilisés:

| Statut | Signification |
|---|---|
| Proposed | contrat rédigé; revues et plans de preuve pas encore consolidés |
| Accepted-for-spike | frontières assez stables pour des prototypes jetables, sans engagement produit |
| Accepted-for-product | preuves Gate 02 satisfaites et risques critiques mitigés; nouveau changement via ADR |
| Rejected/Superseded | option abandonnée ou remplacée avec chemin de rollback documenté |

Le passage Accepted-for-spike exige la section 13. Accepted-for-product exige
en plus les résultats des spikes et le Gate 02; il ne peut pas résulter de ce
cycle contracts-first seul.

## 2. Contexte

Fluent doit capturer une dictée, transcrire localement puis remettre le texte
sur macOS, Linux X11/Wayland et Windows. Les décisions D-01 à D-14 confirment:

- chemin local sans compte ni Cloud au MVP;
- français, push-to-talk par défaut et toggle accessible;
- zero-history par défaut, historique texte local seulement opt-in et aucun
  audio persisté par défaut;
- macOS Apple Silicon comme référence si disponible, Windows comme référence
  pratique sinon, sans changer l'ordre produit macOS, Linux, Windows;
- Tauri 2, React/TypeScript/Vite et cœur Rust sous conditions des spikes;
- moteur ASR et plateformes remplaçables;
- texte brut déterministe toujours récupérable après une transformation
  défaillante;
- aucune injection universelle promise, notamment sous Wayland.

La PHASE-01 a livré un shell mono-WebView avec une seule commande health_check.
Elle n'a livré ni audio, ASR, stockage, permission native, clipboard, modèle ou
Cloud. La revue supply chain a identifié:

- F-01: glib 0.18.5 transitif Linux visé par RUSTSEC-2024-0429;
- F-02: seize advisories RustSec informatives unmaintained transitives;
- F-03: audits advisories/yanked/licences/sources non encore bloquants en CI;
- F-05: toute future commande Tauri serait accessible aux WebViews locales par
  défaut sans capability explicite.

Ces faits imposent une architecture réversible et des conditions de promotion;
ils ne prouvent pas que les prototypes réussiront.

## 3. Sources et preuves utilisées

| Source | Fait/contrainte retenu | Ce qu'elle ne prouve pas |
|---|---|---|
| [Décisions produit](../project-management/PHASE-00-PRODUCT-DECISIONS.md) | D-01 à D-14 confirmées | performance ou API OS |
| [PRD MVP](../product/PRD-MVP.md) | parcours local, brut récupérable, PTT/toggle | UX validée ou taux d'injection |
| [ADR-0001](ADR-0001-STACK-CIBLE.md) | stack cible et rollback avant Gate 02 | Tauri/whisper.cpp/SQLite qualifiés |
| [Threat model](../security/THREAT-MODEL-V0.md) | TM-02 capture orpheline, TM-05 mauvaise cible, TM-14 IPC, TM-18 résidus mémoire | audit de l'implémentation |
| [Budgets](../quality/PERFORMANCE-BUDGETS.md) | définitions de latence, pertes, ressources et fallback | seuils déjà atteints |
| [Plan de mesure](../quality/MEASUREMENT-PLAN.md) | artefacts et campagnes reproductibles | harnesses déjà disponibles |
| [Revue supply chain](../security/PHASE-01-SUPPLY-CHAIN-REVIEW.md) | F-01/F-02/F-03/F-05 et baseline minimale | innocuité future des dépendances |
| dépôt PHASE-01 | health_check sans requête, main WebView unique, aucune capability/permission/plugin sensible | sécurité d'une extension IPC |

## 4. Forces de décision

1. Le callback audio ne fait aucune I/O, aucun log synchrone, aucune allocation
   évitable et ne prend aucun verrou bloquant.
2. Une saturation ne peut ni bloquer le callback, ni produire silencieusement
   une transcription lacunaire.
3. L'état de capture reste natif et autoritaire malgré UI perdue, focus, veille,
   révocation ou backend lent.
4. L'ASR, les API OS et le stockage doivent être remplaçables sans changer les
   transitions métier.
5. Audio et texte sont C3, volatils par défaut et sans egress.
6. Une cible doit être revalidée au dernier moment; un résultat d'injection est
   plus riche qu'un booléen.
7. Les files, timeouts, copies et payloads IPC sont bornés.
8. X11 et Wayland sont des environnements distincts; L1/L0 est un fallback de
   premier rang.
9. Les permissions sont progressives et minimales.
10. Le rollback ne doit dépendre d'aucune migration de donnée utilisateur
    pendant les spikes.

## 5. Décision proposée

Adopter l'option A: **un runtime local dans un processus, un orchestrateur
single-writer et des adaptateurs hexagonaux derrière cinq ports**, avec workers
et canaux bornés.

### 5.1 Autorité et modules

- SessionOrchestrator est l'unique propriétaire de la machine à états.
- Le domaine ne dépend ni de Tauri, ni d'une API OS, ni d'un moteur ou store.
- Les cinq ports normatifs sont AudioSource, TranscriptionEngine,
  PlatformAdapter, TextInjector et SettingsStore.
- Le shell Tauri compose les adaptateurs et valide l'IPC; la WebView ne possède
  ni état d'enregistrement ni accès direct aux ports.
- Le MVP accepte une seule session active; une seconde demande reçoit
  CONTRACT_BUSY avec RetryOperation sans transition Error.
- Les implémentations Cloud sont absentes. Un port n'autorise aucun endpoint.

### 5.2 Topologie d'exécution

Le runtime sépare:

1. callback audio temps réel;
2. orchestrateur single-writer;
3. worker de drain/conversion audio;
4. worker de décodage ASR;
5. exécuteur natif OS;
6. worker I/O SettingsStore;
7. bridge IPC/UI;
8. diagnostics allowlist hors temps réel.

Q-AUDIO est SPSC, préallouée et bornée. Les autres canaux sont bornés. Stop et
Cancel possèdent un latch atomique indépendant des files. Toute opération
longue porte SessionId/Epoch/ActionId; un résultat tardif d'un ancien Epoch est
détruit.

Sur overflow, le callback incrémente un compteur atomique, pose un flag et
rejette le bloc entrant sans attente. L'orchestrateur arrête et purge hors
callback. La session est invalide et n'est pas envoyée à l'ASR.

### 5.3 État et données

La machine contient exactement les états Idle, Arming, Listening, Finalizing,
Transcribing, Rewriting, ValidatingTarget, Injecting, Error et Cancelled.
Rewriting est bypassé au MVP. RawTranscript est immuable, volatile et distinct
de toute normalisation ou réécriture. Il est purgé à la remise/acquittement, à
l'annulation ou au discard conformément au zero-history; aucune persistance
implicite n'est permise.

La remise suit L0 résultat interne, L1 clipboard préparé, L2 collage automatisé
et L3 insertion native. ConfirmedExact, ClipboardPrepared,
InternalRecoveryAvailable, RejectedBeforeEffect et OutcomeUnknown sont
distincts. OutcomeUnknown correspond exclusivement au code
DELIVERY_OUTCOME_UNKNOWN et à Recoverability OutcomeUnknown; il n'existe aucun
faux succès, retry ou copie automatique après cette issue.

### 5.4 IPC

Le registre exécutable reste health_check v0 uniquement. Le protocole v1
candidat utilise des enveloppes versionnées, schémas allowlist, limites par
message, révisions d'état et erreurs expurgées. Avant toute extension, F-05
exige capabilities minimales par fenêtre/origine, registre contrôlé et tests
négatifs. Aucun audio ou C4 ne traverse l'IPC.

Les spécifications détaillées sont:

- [COMPONENT-MODEL.md](COMPONENT-MODEL.md);
- [STATE-MACHINE.md](STATE-MACHINE.md);
- [CORE-CONTRACTS.md](CORE-CONTRACTS.md);
- [IPC-VERSIONING.md](IPC-VERSIONING.md).

## 6. Options comparées

| Option | Description | Coût initial | Temps réel/concurrence | OS et UI | Confidentialité | Réversibilité |
|---|---|---:|---|---|---|---|
| A — single-writer + ports + files bornées | cœur de domaine unique, workers dédiés, adaptateurs derrière cinq ports | élevé: contrats et suites avant code | forte: ownership et backpressure explicites; callback isolé | adaptateurs reconnaissent les différences; UI mince | C3 borné/volatile, egress absent, IPC minimisé | forte tant que les ports restent stables |
| B — graphe async/event bus partagé | composants publient/s'abonnent librement, état distribué | moyen au début | faible à moyenne: ordre, files et annulation plus difficiles à prouver; runtime async potentiellement dans chemin RT | portable mais risques de réentrance et divergences | diffusion accidentelle de C3 plus probable | moyenne; dépendances implicites du bus |
| C — orchestration React/WebView | UI pilote capture, ASR, timeouts et erreurs via IPC | faible au prototype | faible: crash/reload UI peut orpheliner la capture; audio/IPC élargi | homogène UI mais APIs natives toujours requises | frontière WebView élargie, TM-02/TM-14 aggravées | faible après multiplication des commandes |
| D — service/sidecar local multi-processus | audio/ASR dans un daemon, Tauri client | très élevé: protocole processus, lifecycle, packaging | isolation crash possible, mais transport audio/cop ies/latence à prouver | complexifie service, permissions et installation par OS | meilleure isolation potentielle, nouvelle surface IPC locale C3 | moyenne si le domaine est conservé; coût rollback opérationnel élevé |
| E — adaptateur monolithique par OS | chaque plateforme implémente tout le parcours | moyen sur un OS | invariants dupliqués et divergence de races | expressivité native forte, parité coûteuse | politiques de données répétées | faible après trois implémentations |

## 7. Motifs du choix A

- single-writer rend l'ordre et les courses testables sans prétendre éliminer
  les contraintes des FFI;
- le callback ne connaît qu'un producteur préalloué et non bloquant;
- les ports permettent de remplacer moteur, backend audio, remise et stockage;
- PlatformAdapter et TextInjector séparés empêchent qu'une capability probe
  devienne implicitement une permission d'écrire;
- le brut reste indépendant de la transformation et de la remise;
- la dégradation par capability modélise Wayland sans branche spéciale
  prétendant une universalité;
- l'IPC mince réduit F-05 et TM-14;
- un prototype échoué peut être supprimé sans schéma utilisateur, compte ou
  permission permanente.

Option A coûte davantage avant le premier parcours, mais concentre ce coût sur
les risques du Gate 02: temps réel, annulation, cible, permissions,
substituabilité et données.

## 8. Coûts acceptés

- plus de types, leases, identifiants d'action et suites de contrat;
- workers/exécuteurs distincts et coordination de shutdown;
- copies audio bornées entre buffer OS, pool et format ASR;
- backpressure fail-closed pouvant abandonner une dictée sous surcharge;
- effort de preuve par OS au lieu d'une abstraction de parité;
- conservation temporaire du brut dans le core pour garantir la récupération;
- mapping des erreurs natives vers des codes stables expurgés;
- capabilities Tauri et catalogues IPC à maintenir avec le code;
- modèle de test de courses/états plus important qu'un prototype linéaire.

Ces coûts sont visibles et mesurables. La capacité, les TTL et timeouts ne sont
pas fixés sans campagne.

## 9. Compatibilité OS

| Environnement | Décision d'architecture | Permissions/capacités minimales | Rollback de capability |
|---|---|---|---|
| macOS Apple Silicon, référence si disponible | exécuteur OS conforme aux exigences main-thread; target token opaque | microphone au moment utile; Input Monitoring/Accessibility seulement si la voie prouvée les exige | désactiver L2/L3 ou hotkey, conserver contrôle UI et L1/L0; aucun contournement Secure Input |
| Linux X11 | adaptateur distinct, distribution/DE/WebKitGTK bornés | pile audio, hotkey, cible et injection chacune sondée | désactiver voie non fiable, contrôle UI + L1/L0 |
| Linux Wayland | environnement séparé par compositor/portal | aucune permission ou API globale présumée | L1/L0 obligatoire et mesuré; ne jamais compter absence L2/L3 comme succès d'injection |
| Windows 11 x64, référence pratique si macOS indisponible | adaptateur natif, niveau d'intégrité de cible explicite | micro, hotkey, focus/remise selon applications qualifiées | cible élevée/différente: aucune injection, L1/L0 |

Le fallback Windows de référence modifie seulement l'ordre d'exécution des
mesures si la machine macOS est indisponible; il ne modifie ni D-04 ni les
contrats.

## 10. Confidentialité et classes de données

| Actif | Classe | Propriétaire | Rétention proposée |
|---|---:|---|---|
| audio et blocs | C3 | pool/worker/moteur, un owner à la fois | mémoire jusqu'à fin ASR/cancel/error; jamais fichier par défaut |
| RawTranscript/candidat | C3 | core de session | volatile jusqu'à remise/récupération/acquittement; zero-history |
| TargetRef | C1-C2 opaque | PlatformAdapter puis core | session/TTL, invalidé sur lifecycle/focus |
| réglages | C1-C2 | SettingsStore | jusqu'à reset selon schéma; aucun contenu de dictée |
| diagnostics | C1 allowlist | sink local | bornée; aucune valeur C3/C4 |
| credential | C4 | aucun des cinq ports | hors périmètre; futur coffre natif |

Le callback, les ports et l'IPC n'ont aucun accès réseau au MVP. Le téléchargement
volontaire de modèle est un flux de distribution C0-C1 séparé. Aucun failover
Cloud n'est possible et aucune file d'egress n'existe.

## 11. Supply chain F-01, F-02, F-03 et F-05

### F-01 — glib transitif Linux

L'architecture isole le domaine et les ports de Tauri/WebKitGTK, mais cette
isolation ne prouve pas l'inatteignabilité de RUSTSEC-2024-0429. Le spike Linux
doit produire le graphe verrouillé, la version exacte, les chemins d'appel
observés et l'une des dispositions:

1. chaîne migrée vers une version corrigée;
2. chemin affecté prouvé non atteignable pour l'artefact et les parcours
   qualifiés, avec revalidation à chaque mise à jour;
3. risque résiduel accepté par ADR avec propriétaire et échéance avant beta.

Sans disposition, l'adaptateur Linux ne peut pas être promu produit. Aucune
nouvelle dépendance n'est ajoutée ici.

### F-02 — dépendances non maintenues

Le spike doit générer une allowlist bornée par advisory, dépendance transitive,
justification, propriétaire, date d'expiration et signal de sortie. Un avis
nouveau ou une chaîne modifiée rouvre la revue. Une allowlist n'est ni un
silence global, ni une preuve de sécurité.

### F-03 — gate avant mutation de manifests ou lockfiles

Avant toute modification d'un manifest, lockfile, action CI ou source de
dépendance, le lot doit produire une revue différentielle de:

- advisories RustSec/OSV et crates/paquets yanked;
- licences SPDX et obligations nouvelles;
- sources registre, Git, path, tarball et intégrités;
- dépendances directes/transitives ajoutées, retirées ou changées;
- exceptions exactes avec advisory/source, justification, propriétaire et date
  d'expiration.

Une exception sans propriétaire ou expiration est interdite. Cette revue est
une condition préalable au commit de la mutation, même avant l'automatisation.
Les contrôles advisories/yanked/licences/sources deviennent bloquants en CI au
plus tard avant le Gate 12, conformément à la revue PHASE-01.

### F-05 — commandes Tauri

Le registre reste health_check. Avant une extension: capability minimale par
fenêtre/origine, schémas/limites, mapping états, tests de refus et contrôle CI.
Une deuxième WebView, une origine distante ou une commande sensible déclenche
une revue du threat model. Le choix d'un dispatch unique ne dispense jamais
d'une autorisation par opération.

## 12. Risques, mitigations et déclencheurs de rollback

| Risque | Coût/impact | Mitigation proposée | Déclencheur |
|---|---|---|---|
| Q-AUDIO déborde ou callback bloque | audio faux, confidentialité si capture orpheline | SPSC préallouée, flag/compteur atomique, fail-closed hors callback | une attente/allocation/I/O/verrou ou pertes inexpliquées après deux implémentations conformes |
| arrêt/FFI tardif | use-after-free, capture prolongée | epoch, quiescence, quarantaine des buffers | callback après quiescence annoncée ou impossibilité de borner l'arrêt |
| ASR ne s'annule pas | CPU/RSS et résultat tardif | rejet par epoch, un job en vol | backend monopolise le process au-delà des budgets et ne peut être isolé |
| état single-writer devient goulot | latence de contrôle | effets hors boucle, événements bornés/coalescés | budgets ratés par l'orchestrateur malgré profil conforme |
| cible change pendant remise | fuite ou commande accidentelle | target token court, revalidation, at-most-once, DELIVERY_OUTCOME_UNKNOWN/OutcomeUnknown | mauvaise cible ou faux succès stable |
| Wayland non automatisable | parcours dégradé | L1/L0 premier rang, capability par compositor | aucun contrôle capture utilisable sur cible prioritaire |
| IPC permissif/XSS | appel de capacité native | F-05, CSP, origin/window/schema/state checks | seconde surface non bornable ou origine distante nécessaire |
| C3 reste en mémoire | récupération locale | copies bornées, purge toutes sorties, crash dump exclu | besoin de spool/reprise persistante |
| SettingsStore mélange historique/secrets | fuite/migration | scope C1-C2 strict, ports distincts futurs | exigence de C3/C4 ou sync dans le store |
| F-01/F-02/F-03 bloquent dépendances/distribution | sécurité et traçabilité | disposition, allowlist bornée et revue avant mutation; CI bloquante avant Gate 12 | mutation non revue, exception expirée ou aucune disposition avant beta |

Un déclencheur n'autorise pas un correctif silencieux. Le project-manager arrête
les lots dépendants et ouvre un ADR si la frontière de processus, la machine
d'états, un port ou la garantie local-first doit changer.

## 13. Conditions de passage Accepted-for-spike

Toutes les conditions suivantes sont requises:

- revue croisée rust-core, ASR, plateforme et sécurité sans contradiction
  bloquante;
- machine à états complète, y compris races, cancel, résultat tardif, erreur et
  shutdown;
- cinq ports avec ownership, backpressure, erreurs et suites de substituabilité;
- plans audio/stockage, ASR et OS qui référencent ces contrats sans inventer de
  signature concurrente;
- protocole de spike avec fixtures, environnement, commandes, artefacts,
  métriques et PASS/FAIL;
- aucune implémentation distante, permission, deuxième commande/WebView,
  dépendance ou donnée persistée introduite par l'ADR;
- F-01/F-02/F-03/F-05 présents dans les gates des plans concernés;
- avant tout code C4, choix explicite entre le harnais coffre test-only jetable
  de [CORE-CONTRACTS.md](CORE-CONTRACTS.md) et un ADR/contrat produit versionné;
- liens et cohérence documentaire validés dans l'union du cycle;
- security-reviewer confirme absence d'egress implicite et permissions minimales.

Accepted-for-spike signifie seulement que les prototypes peuvent tester les
ports. Il ne promeut ni Tauri, ni whisper.cpp, ni SQLite, ni une voie OS.

## 14. Conditions de promotion des spikes

### Audio et stockage

- instrumenter le callback et prouver les invariants temps réel sous saturation;
- fixer CaptureFormat interne, capacité Q-AUDIO/pool et timeouts à partir des
  artefacts, pas d'une intuition;
- exercer overflow fail-closed, discontinuité, perte périphérique, cancel,
  quiescence et shutdown;
- mesurer perte, latence, CPU/RSS selon les budgets;
- prouver SettingsStore atomique, corruption/migration/rollback et absence de
  C3/C4;
- aucun audio ou texte sur disque/réseau/log.

### ASR

- modèle, moteur, quantification, licence, provenance et digest nommés;
- même contrat avec double et backend réel;
- format incompatible rejeté, modèle malformé refusé;
- RTF, WER/CER, mémoire et fin vers brut avec artefacts;
- cancel/résultat tardif/resource exhaustion exercés;
- RawTranscript séparé de normalisation/réécriture et toujours récupérable.

### Plateformes

- environnement exact, permission et capability sondés séparément;
- hotkey/toggle, lock/sleep/revocation, target-switch et champs protégés;
- résultat ConfirmedExact distinct de ClipboardPrepared et de
  DELIVERY_OUTCOME_UNKNOWN/OutcomeUnknown;
- L1/L0 exercé sur chaque OS, obligatoire sous Wayland sans voie autorisée;
- aucune permission plus large que le parcours prouvé;
- fallback Windows activé seulement si indisponibilité macOS archivée.

### Shell, IPC et supply chain

- coûts main/widget/WebView mesurés si le spike correspondant est autorisé;
- aucun changement du registre health_check dans ce cycle;
- avant extension ultérieure, Gate F-05 de
  [IPC-VERSIONING.md](IPC-VERSIONING.md) complet;
- disposition F-01 et allowlist F-02 versionnées pour Linux;
- revue F-03 avant toute mutation de manifest/lockfile, exceptions avec
  propriétaire/expiration, puis automatisation bloquante avant Gate 12;
- aucun harnais C4 promu ou réutilisé; tout besoin produit déclenche son
  ADR/contrat versionné.

Un spike est promu seulement après revue QA/sécurité proportionnée, seuils
acceptés, capability flag/rollback et mise à jour de l'ADR. Un résultat indicatif
ou une unique exécution ne suffit pas.

## 15. Stratégie de retour arrière

### Avant les spikes

Supprimer ou amender les documents Proposed. Aucun binaire, permission, store
ou donnée n'est affecté.

### Pendant les spikes

- compiler les prototypes comme harnesses jetables sans chemin de migration;
- remplacer l'adaptateur derrière le port;
- désactiver une capability OS et conserver L0/L1;
- changer moteur/modèle sans modifier état, UI ou remise;
- changer backend SettingsStore via les mêmes fixtures;
- conserver le registre IPC existant et tester le domaine sans WebView.

### Après une promotion limitée

- capability flags locaux désactivent une voie native sans faux succès;
- le package UI/core revient en bloc à la version compatible précédente;
- aucun rollback ne réactive un modèle, une dépendance ou un artefact révoqué;
- une évolution de schéma utilisateur fournit export logique et migration
  inverse avant de devenir irréversible;
- si le monoprocessus compromet durablement sécurité/stabilité, réexaminer
  l'option D par nouvel ADR tout en conservant machine et ports.

### Limite du rollback

Après données utilisateur persistées, packages publics, permissions larges ou
plusieurs consommateurs IPC, le rollback devient coûteux. Ces engagements sont
explicitement hors du cycle et exigent leur propre gate.

## 16. Conséquences

### Positives

- invariants de capture et ordre des transitions testables;
- adaptateurs ASR/OS/store substituables;
- saturation et annulation explicites;
- brut exact indépendant de la remise;
- local-first et zero-history portés par les types/frontières;
- dégradation Wayland honnête;
- surface IPC gelée jusqu'à F-05;
- prototypes jetables sans dette de migration.

### Négatives

- coût de conception et de test initial élevé;
- plus de transferts d'ownership et d'états intermédiaires;
- fail-closed peut perdre la session plutôt que fournir un texte partiel;
- une seule session et un job ASR limitent le débit MVP;
- exact-once de l'OS reste impossible à garantir après crash, d'où
  DELIVERY_OUTCOME_UNKNOWN et Recoverability OutcomeUnknown;
- isolation monoprocessus ne protège pas d'une compromission totale du shell.

## 17. Décisions ouvertes

Ces points sont volontairement différés aux spikes et ne doivent pas être
inventés par une implémentation:

| ID | Décision ouverte | Preuve attendue | Autorité |
|---|---|---|---|
| O-01 | CaptureFormat canonique, taille slot/pool/Q-AUDIO | stress audio et budget pertes/latence/mémoire | rust-core + QA + architect |
| O-02 | timeouts audio, durée max et watchdog key-up | campagnes PTT, lock/sleep et fault injection | rust-core + platform + product |
| O-03 | moteur/modèle/quantification/accélérateur et annulation native | RTF/WER/CER/RSS + licence/provenance | ai-asr + security |
| O-04 | APIs hotkey/cible/remise et TTL TargetRef par environnement | matrice OS/applications/compositors | platform + QA + security |
| O-05 | niveaux L1-L3 autorisés et oracle de confirmation par cible | taux + IC, faux succès zéro | platform + product |
| O-06 | backend SettingsStore, migrations et chiffrement futur | crash/corruption/permissions/threat model | rust-core + security |
| O-07 | limites/timeouts de chaque schéma IPC v1 et binding Tauri | fuzz/golden tests/performance + F-05 | architect + frontend + security |
| O-08 | disposition F-01 et allowlist F-02 | audit verrouillé et preuve Linux | security + platform |
| O-09 | coûts et nécessité d'un widget/WebView distinct | démarrage/RSS/focus/a11y | frontend + QA + architect |
| O-10 | frontière coffre C4 produit éventuelle | ADR/contrat versionné; ownership, effets, compensation, état inconnu et cleanup | security + architect + rust-core |

Jusqu'à décision, la valeur est Unknown/Unsupported ou un paramètre explicite de
harness; jamais une constante produit silencieuse.

## 18. Réexamen

Réexaminer cet ADR:

- après revue croisée du cycle pour un éventuel Accepted-for-spike;
- après chaque campagne de prototype avant Accepted-for-product;
- si deux implémentations conformes échouent sur un même invariant critique;
- si le MVP exige persistance C3, Cloud, multi-session, streaming ASR, processus
  séparé ou origine distante;
- si F-01 ne peut être mitigé ou si une nouvelle advisory critique apparaît;
- si une plateforme ne peut offrir ni contrôle de capture ni fallback L0/L1
  acceptable;
- avant toute seconde commande IPC, permission sensible ou WebView.
