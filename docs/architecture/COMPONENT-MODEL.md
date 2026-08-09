# Modèle normatif des composants du runtime

- Statut: **Proposé — contrat de conception PHASE-02**
- Portée: runtime desktop local du MVP; aucune implémentation Cloud
- Autorité: le cœur Rust est l'unique propriétaire de l'état de session
- ADR associé: [ADR-0002](ADR-0002-MODULAR-RUNTIME.md)

Les termes **DOIT**, **NE DOIT PAS**, **DEVRAIT** et **PEUT** sont normatifs. Ce
document fixe des frontières; il n'autorise aucun crate, package, plugin,
permission, seconde commande IPC ou seconde WebView.

## 1. Vue logique

~~~text
Z0 OS / microphone / application cible
   | audio C3                   | événements OS et cible opaque C1-C2
   v                            v
+----------------+      +-------------------+
| AudioSource   |      | PlatformAdapter   |
+-------+--------+      +---------+---------+
        | Q-AUDIO SPSC            | Q-CONTROL
        v                         v
+----------------+      +-------------------+       +------------------+
| Audio worker  |----->| SessionOrchestrator|<----->| IPC bridge Tauri |
| normalisation |      | single writer      |       | validation seule |
+-------+--------+      +--+------+-------+--+       +---------+--------+
        | segment C3       |      |       |                    |
        v                  |      |       |                    v
+--------------------+     |      |       |              Z2 WebView/UI
| TranscriptionEngine|-----+      |       |
+--------------------+ texte brut |       +-----> SettingsStore ----> Z3
                                  |               réglages C1-C2
                                  v
                         +------------------+
                         | TextInjector     |----> Z0 cible/clipboard
                         +------------------+
~~~

Les adaptateurs implémentent les cinq ports définis dans
[CORE-CONTRACTS.md](CORE-CONTRACTS.md). Les flèches sont des flux autorisés,
pas des dépendances circulaires: les adaptateurs dépendent des contrats du
domaine; le domaine ne dépend ni de Tauri, ni d'une API OS, ni d'un moteur ASR
concret.

## 2. Composants et responsabilités

| Composant | Responsabilité exclusive | Exclusions obligatoires | Données maximales | Contexte d'exécution |
|---|---|---|---|---|
| SessionOrchestrator | valider les intentions, appliquer la machine à états, attribuer session/epoch, décider annulation, erreur et remise | aucune API Tauri/OS directe, aucune I/O, aucun calcul ASR | C1-C3 éphémères; C3 détenu par session | boucle single-writer hors callback |
| AudioSource adapter | négocier le périphérique/format, ouvrir et fermer le flux, déposer les blocs préalloués | ASR, UI, stockage, réseau, log depuis le callback | audio C3 et métadonnées C1 | contrôle hors RT + callback OS temps réel |
| Audio worker | drainer Q-AUDIO, détecter séquences manquantes, convertir hors callback, construire le segment final | stockage audio, réseau, état métier | audio C3 | worker dédié |
| TranscriptionEngine adapter | vérifier modèle/capacités et transformer un segment en texte brut local | injection, UI, historique, failover Cloud | audio et texte C3 | worker natif bloquant/CPU |
| Rewrite policy | décider si une transformation approuvée est appelée, tout en conservant le brut immuable | activation Cloud implicite, remplacement du brut | texte C3 | worker hors MVP; bypass au MVP |
| PlatformAdapter | sonder capacités/permissions, capter une référence minimale de cible, revalider la cible, produire les événements de cycle de vie | lire le contenu de la cible, injecter du texte, stocker des handles | C1-C2 opaque; jamais le texte dicté | exécuteur exigé par l'OS |
| TextInjector adapter | exécuter un plan L0-L3 autorisé avec une cible validée et rendre une preuve typée | décider la politique produit, forcer le focus aveuglément, annoncer un faux succès | texte C3 et cible opaque C1-C2 | exécuteur exigé par l'OS |
| SettingsStore adapter | charger/committer des réglages typés et versionnés | audio, transcript, historique, cible, credential | C1-C2 seulement | worker I/O sérialisé |
| IPC bridge | authentifier fenêtre/origine, borner/désérialiser, traduire commandes et publier snapshots/événements expurgés | porter l'état métier, exposer C4 ou audio, inventer des transitions | C0-C2; C3 seulement pour une récupération explicitement autorisée | thread Tauri/UI |
| UI WebView | rendre l'état, recueillir une intention et afficher un fallback | accès direct microphone/OS/store, vérité concurrente sur la session | minimum d'affichage; C3 éphémère si récupéré | WebView locale main unique |
| Diagnostics | métriques allowlist, codes et durées monotones | audio, texte, payload IPC, cible brute, chemin personnel | C1 | consommateur hors RT, borné |

Le futur stockage d'historique texte n'est pas SettingsStore. Il demanderait un
port, un schéma, un opt-in et un lot distinct. Les credentials relèvent d'un
coffre natif distinct, également hors des cinq ports de ce cycle.

## 3. Règles de dépendance

1. Le domaine définit états, identifiants opaques, erreurs et ports. Il NE DOIT
   PAS importer Tauri, une API OS, SQLite ou un binding ASR.
2. Le shell compose les adaptateurs et le domaine. Aucun adaptateur ne peut
   appeler un autre adaptateur en contournant l'orchestrateur.
3. Une session active est unique au MVP. Une nouvelle demande pendant un état
   autre que Idle est refusée par CONTRACT_BUSY/RetryOperation sans transition
   Error; elle n'est jamais mise dans
   une file non bornée.
4. La WebView n'est jamais autoritaire pour Listening. Une perte ou un crash UI
   ne prolonge pas une capture; le watchdog natif applique la politique de
   [STATE-MACHINE.md](STATE-MACHINE.md).
5. Une implémentation distante de TranscriptionEngine ou de réécriture est
   interdite au MVP. Un port ne constitue ni consentement ni permission réseau.
6. Toute API nécessitant le thread principal macOS/Windows/Linux est appelée
   via l'exécuteur de l'adaptateur; l'orchestrateur attend un résultat borné et
   ne migre pas son ownership d'état vers cet exécuteur.

## 4. Exécuteurs et frontières de threads

| ID | Producteur / propriétaire | Travail autorisé | Travail interdit | Arrêt |
|---|---|---|---|---|
| T-RT | callback AudioSource créé par l'API audio | copier dans un slot déjà réservé, écrire séquence/timestamp, try-push, poser des atomiques | I/O, log, allocation évitable, verrou bloquant, attente, conversion lourde, IPC | observe le latch stop; le contrôle attend ensuite sa quiescence hors RT |
| T-ORCH | SessionOrchestrator | une transition atomique à la fois, décisions, timers, ownership des résultats | blocage OS/ASR/stockage, attente non bornée | annule, ordonne les stops, attend les acquittements bornés |
| T-AUDIO | audio worker | drain, validation séquence, conversion et assemblage du segment | persistance ou log de contenu | purge les slots puis rend le pool |
| T-ASR | adaptateur moteur | chargement/décodage local, vérification annulation | réseau, UI, stockage implicite, callback audio | annulation coopérative; résultat tardif rejeté par epoch |
| T-OS | exécuteur natif | capacités, permissions, cible et remise | état métier, stockage de texte | timeout puis résultat typé |
| T-STORE | SettingsStore | lecture, migration et commit atomique de réglages | C3/C4 et appel depuis T-RT | termine ou annule avant shutdown final |
| T-IPC | shell Tauri | validation enveloppe, routage, coalescence des progrès | transition métier directe, sérialisation d'audio | se déconnecte sans modifier l'autorité native |

T-OS peut correspondre au main thread du processus sur un OS et à un worker sur
un autre. Cette différence est interne à l'adaptateur et fait partie de la
preuve de plateforme.

## 5. Canaux, capacité et backpressure

Tous les canaux sont bornés. Leur taille finale est un paramètre de promotion
du spike, jamais une constante déduite silencieusement par l'implémentation.

| Canal | Topologie | Contenu / ownership | Politique de saturation |
|---|---|---|---|
| Q-AUDIO | SPSC T-RT vers T-AUDIO | indice d'un slot audio préalloué; le push transfère le slot au consommateur | try-push seulement; poser OverflowLatch, compter le bloc rejeté et abandonner la session. Ne jamais écraser un bloc non lu |
| Q-CONTROL | MPSC vers T-ORCH | intentions bornées sans contenu libre | rejeter explicitement les intentions ordinaires; Stop/Cancel/Lock/PermissionRevoked posent aussi un latch atomique idempotent et un wake coalescé |
| Q-ASR | SPSC logique, capacité un segment MVP | AudioSegmentLease transféré | CONTRACT_BUSY; aucune seconde session ni spool disque |
| Q-OS | requêtes bornées T-ORCH vers T-OS | capability, TargetRef ou DeliveryLease | timeout et erreur; aucune répétition automatique d'une action d'injection |
| Q-STORE | MPSC sérialisé | commandes réglages C1-C2 | backpressure au demandeur; jamais appelée sur le chemin RT |
| Q-EVENT | core vers bridge IPC | snapshots, progrès et résultat terminal sans audio | progrès coalescés; un résultat terminal reste dans le core jusqu'à acquittement/reconnexion, il n'est pas perdu avec l'événement |
| Q-DIAG | métriques allowlist | nombres, codes, versions | perte/coalescence autorisée avec compteur; aucune pression remontée vers T-RT |

L'annulation de sécurité ne dépend jamais de la disponibilité d'une place dans
Q-CONTROL. Chaque opération longue reçoit SessionId, Epoch et CancelToken. Un
résultat d'un epoch différent de l'epoch courant est détruit et ne peut
déclencher aucune transition, injection ou persistance.

## 6. Ownership et durée de vie des données

| Actif | Création et propriétaire | Transfert | Fin de vie obligatoire |
|---|---|---|---|
| SessionId / Epoch | orchestrateur | copiables comme métadonnées C1 | fin de session; jamais réutilisés pour accepter un résultat tardif |
| slots audio C3 | pool préalloué avant start | T-RT vers T-AUDIO par indice; un propriétaire unique | rendus/purgés après consommation, annulation, erreur ou shutdown |
| AudioSegmentLease C3 | T-AUDIO | move vers T-ASR; aucun clone implicite | fin transcribe/cancel/error; zeroisation best-effort puis libération |
| RawTranscript C3 | moteur, puis orchestrateur | immuable; toute réécriture reçoit une vue/copie distincte | après remise confirmée et acquittement produit, ou purge explicite; jamais persistance zero-history |
| CandidateText C3 | réécriture facultative | orchestrateur vers remise | détruit en cas d'échec/cancel; le brut reste inchangé |
| TargetRef C1-C2 | PlatformAdapter | opaque; revalidation produit ValidatedTarget à TTL court | invalide à focus/lifecycle/timeout/fin de session |
| DeliveryLease C3 | orchestrateur | consommation unique par TextInjector; le brut source reste récupérable | retour du résultat/timeout/cancel |
| SettingsSnapshot C1-C2 | SettingsStore | immuable et partageable; commit par révision | remplacé au commit/reset; aucune donnée de session |

La zeroisation de mémoire généraliste est best-effort et ne vaut pas garantie
contre un OS compromis ou le swap. Les garanties vérifiables sont: aucune
persistance audio implicite, nombre de copies borné, ownership explicite,
purge logique à toutes les sorties et crash dumps sans contenu.

## 7. Flux local de session

~~~text
intention PTT/toggle
 -> T-ORCH: Arming
 -> PlatformAdapter: capabilities + permission + TargetRef minimal
 -> AudioSource: pool/format négociés, puis Listening
 -> T-RT --Q-AUDIO--> T-AUDIO
 -> stop/cancel latch
 -> Finalizing: stop + quiescence + drain
 -> AudioSegmentLease --Q-ASR--> TranscriptionEngine
 -> RawTranscript conservé par le core
 -> bypass Rewriting au MVP
 -> PlatformAdapter revalide TargetRef
 -> TextInjector exécute L0/L1/L2/L3 autorisé
 -> résultat typé; le core ne publie jamais un succès supérieur à la preuve
~~~

Ce flux est intégralement local et doit passer réseau bloqué. Le téléchargement
volontaire d'un modèle est un flux de distribution C0-C1 séparé; il ne reçoit
aucun identifiant de session, audio, texte ou cible.

## 8. Classes de données et frontières

| Passage | Autorisé | Interdit |
|---|---|---|
| Z0 microphone vers Z1 | audio C3 après permission microphone utile | capture avant Arming, fichier temporaire, egress |
| Z1 core vers Z2 IPC | état C1, capability C1-C2 minimisée; texte C3 uniquement pour L0/récupération explicite | audio, cible brute, titre/URL/document, C4, cause native libre |
| Z1 vers Z3 réglages | C1-C2 allowlist | audio, transcript, texte final, TargetRef, clipboard, credentials |
| Z1 vers moteur local | audio C3, langue/configuration minimale | endpoint réseau ou failover distant |
| Z1 vers cible/clipboard | texte C3 après validation et plan autorisé | ancien clipboard lu par défaut, champ protégé, cible différente |
| diagnostics | code, durée, compteurs, versions C1 | contenu C3/C4, payload IPC, chemin personnel |

Une donnée dérivée hérite de la classe la plus restrictive de ses sources. Le
bridge IPC et les logs appliquent une allowlist structurelle avant
sérialisation; une regex de redaction après coup est insuffisante.

## 9. Compatibilité OS et dégradation

| Environnement | Capacité minimale du runtime proposé | Dégradation obligatoire |
|---|---|---|
| macOS Apple Silicon si disponible | permissions progressives, capture, target token et exécuteur conforme aux règles main-thread | permission refusée: désactiver seulement la capacité, conserver L0/L1; aucun contournement Secure Input |
| Linux X11 | capability probe distinct, capture et méthodes de cible/remise prouvées | contrôle UI et L1/L0 si hotkey ou injection manque |
| Linux Wayland | probe par compositor/portal; aucune hypothèse globale | L1/L0 est un résultat normal; ne jamais déclarer L2/L3 sans preuve de la session |
| Windows | capture/hotkey/cible avec niveau d'intégrité explicite | cible élevée/différente: ne pas injecter, conserver L0/L1 |

Le runtime ne contient aucune branche « OS inconnu donc succès ». Une capability
non prouvée est Unsupported ou Degraded avec raison stable.

## 10. Démarrage, arrêt et récupération

Ordre de démarrage:

1. valider configuration et schéma sans charger de C3;
2. créer orchestrateur, pools et canaux bornés;
3. sonder les capacités sans demander de permission;
4. enregistrer uniquement les contrôles déjà autorisés;
5. publier Ready quand UI et contrôle effectivement disponible répondent au
   contrat de mesure.

Ordre d'arrêt:

1. avancer l'epoch et poser CancelToken;
2. arrêter AudioSource, attendre la quiescence hors T-RT;
3. drainer ou invalider les files et purger audio/texte;
4. annuler ASR/OS, ignorer toute complétion tardive;
5. terminer les commits de réglages déjà atomiques sans en commencer d'autres;
6. joindre les workers puis fermer le bridge.

Après crash, aucun spool audio/texte n'est récupéré car il n'en existe pas par
défaut. Le démarrage peut nettoyer seulement des artefacts techniques connus et
ne doit pas inventer une reprise de contenu.

## 11. Conditions de promotion des implémentations

Un adaptateur ou choix de queue ne passe de prototype à composant produit que si:

- les suites de contrat du port passent avec un double et l'adaptateur réel;
- saturation, annulation, résultat tardif et shutdown sont exercés;
- les artefacts de mesure suivent
  [MEASUREMENT-PLAN.md](../quality/MEASUREMENT-PLAN.md);
- aucune donnée C3/C4 n'apparaît dans logs, IPC non explicite ou disque;
- la capability et le fallback OS ont une preuve versionnée;
- toute nouvelle permission, dépendance et surface IPC a une revue sécurité;
- F-01 et F-02 ont une disposition bornée pour la plateforme Linux, et F-05 est
  satisfait avant toute extension IPC.

Échouer à ces conditions conserve le prototype jetable derrière le port ou
désactive la capability. Aucun schéma de données utilisateur ni permission
silencieuse ne rend le rollback nécessaire.

## 12. Références

- [Machine à états](STATE-MACHINE.md)
- [Contrats des ports](CORE-CONTRACTS.md)
- [Versionnement IPC](IPC-VERSIONING.md)
- [ADR-0001](ADR-0001-STACK-CIBLE.md)
- [Classification des données](../security/DATA-CLASSIFICATION.md)
- [Flux de données](../security/DATA-FLOWS.md)
- [Threat model v0](../security/THREAT-MODEL-V0.md)
- [Budgets](../quality/PERFORMANCE-BUDGETS.md)
