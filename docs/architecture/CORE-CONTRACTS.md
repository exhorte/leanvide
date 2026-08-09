# Contrats normatifs des cinq ports du cœur

- Statut: **Proposé — contrats à valider par spikes PHASE-02**
- Portée: sémantique Rust indépendante d'une crate async, d'une API OS et d'un
  moteur concret
- Machine à états: [STATE-MACHINE.md](STATE-MACHINE.md)
- Topologie: [COMPONENT-MODEL.md](COMPONENT-MODEL.md)

Ces contrats décrivent ownership, concurrence, annulation, erreurs et
confidentialité. Les signatures Rust exactes seront dérivées dans un lot
d'implémentation après revue croisée; aucune dépendance n'est autorisée par ce
document.

## 1. Lois communes

### 1.1 Identité et complétions

Toute opération liée à une dictée porte SessionId, Epoch et ActionId. Une
complétion n'est valide que si les trois correspondent à l'action en attente.
Les identifiants sont opaques, bornés et ne dérivent d'aucune donnée
utilisateur.

Les opérations peuvent être implémentées par un appel bloquant sur leur worker
ou par une complétion asynchrone. Elles NE DOIVENT PAS rappeler
l'orchestrateur de manière réentrante avant d'avoir rendu le contrôle. Une complétion est
émise au plus une fois; les doublons sont tolérés par le core et ignorés.

### 1.2 Annulation

CancelToken expose au minimum une lecture atomique non bloquante. Le core
avance Epoch avant d'annuler. Chaque port:

- vérifie le token aux points sûrs définis par son adaptateur;
- arrête dès que son backend le permet sans corrompre les ressources;
- rend Cancelled s'il peut confirmer l'absence de nouvel effet;
- accepte qu'un backend natif rende tardivement, mais le résultat obsolète est
  alors détruit par le core;
- ne transforme jamais une annulation en retry ou failover implicite.

L'annulation est une garantie d'acceptation par le core, pas une promesse que
tout FFI s'interrompt instantanément.

### 1.3 Concurrence

Sauf mention contraire, une instance de port accepte une opération mutante à
la fois. Un deuxième appel concurrent rend CONTRACT_BUSY; il n'attend pas dans une file
non bornée. Les handles transférables entre threads doivent être Send au sens
conceptuel; aucun contrat n'exige Sync. Les adaptateurs qui requièrent un
thread OS particulier sérialisent en interne sans déplacer l'état métier.

### 1.4 Taxonomie canonique fermée des erreurs

PortError et ErrorRecord utilisent exactement le même quadruplet normatif:

| Champ | Type fermé et sémantique |
|---|---|
| domain | Contract, Audio, Transcription, Platform, Delivery ou Settings |
| code | une valeur exacte du catalogue ci-dessous; aucun code libre ou alias |
| retryable | indique seulement qu'une nouvelle action explicitement gardée peut réussir; n'autorise jamais à elle seule un retry |
| recoverability | None, RetryOperation, RetrySession, RawAvailable ou OutcomeUnknown |
| messageKey | clé locale expurgée dérivée du code; jamais le message natif brut |
| safeDetails | map allowlist C0-C1, bornée et sans texte libre utilisateur |

Recoverability a une seule définition:

| Valeur | Sémantique et transition permise |
|---|---|
| None | aucune reprise de l'opération/session fautive; cleanup puis acknowledge/discard |
| RetryOperation | aucun effet externe ambigu et ressources de l'opération encore valides; nouvelle ActionId dans l'état de retry déclaré |
| RetrySession | session courante invalide et sans C3 à réutiliser; nouveaux SessionId/Epoch après cleanup |
| RawAvailable | RawTranscript exact reste volatile; seul un fallback L0/L1 ou un nouvel essai de remise explicitement gardé est permis, jamais un nouvel ASR du même audio |
| OutcomeUnknown | réservé exclusivement à Delivery: un effet L2/L3 a pu avoir lieu; retryable est toujours false, aucun retry/copie automatique, résolution utilisateur explicite avant toute autre remise |

retryable est une condition nécessaire, jamais suffisante. L'état courant, la
recoverability, la présence des ressources et la politique d'effet doivent
aussi autoriser l'action. En particulier, aucune erreur Delivery ne déclenche
un retry automatique, même lorsque retryable vaut true.

Catalogue exhaustif:

| domain | code exact | retryable | recoverability | Sens normatif |
|---|---|---:|---|---|
| Contract | CONTRACT_INVALID_STATE | false | None | intention interdite dans l'état courant |
| Contract | CONTRACT_INVALID_INPUT | false | None | structure ou valeur invalide |
| Contract | CONTRACT_UNSUPPORTED | false | None | contrat/capacité non supporté |
| Contract | CONTRACT_BUSY | true | RetryOperation | ressource occupée, aucun effet commencé |
| Contract | CONTRACT_CANCELLED | false | None | acquittement d'annulation; transition Cancelled, pas Error |
| Contract | CONTRACT_RESOURCE_EXHAUSTED | true | RetryOperation | admission refusée avant effet |
| Contract | CONTRACT_INTERNAL | false | None | invariant interne violé |
| Audio | AUDIO_NO_DEVICE | true | RetrySession | aucun périphérique utilisable |
| Audio | AUDIO_DEVICE_LOST | true | RetrySession | périphérique perdu pendant la session |
| Audio | AUDIO_PERMISSION_DENIED | true | RetrySession | permission micro refusée avant capture |
| Audio | AUDIO_PERMISSION_REVOKED | true | RetrySession | permission micro révoquée |
| Audio | AUDIO_NEGOTIATION_FAILED | true | RetrySession | format/périphérique non négocié |
| Audio | AUDIO_UNSUPPORTED_FORMAT | false | None | contrat source/préprocesseur incompatible |
| Audio | AUDIO_STREAM_START_FAILED | true | RetrySession | ouverture du flux échouée sans callback actif |
| Audio | AUDIO_STREAM_START_TIMEOUT | true | RetrySession | armement expiré sans flux utilisable |
| Audio | AUDIO_CALLBACK_FAULT | true | RetrySession | défaut callback; session courante invalide |
| Audio | AUDIO_OVERFLOW | true | RetrySession | bloc rejeté, session lacunaire invalide |
| Audio | AUDIO_DISCONTINUITY | true | RetrySession | séquence/trame manquante |
| Audio | AUDIO_EMPTY_CAPTURE | true | RetrySession | segment final vide |
| Audio | AUDIO_QUIESCENCE_TIMEOUT | false | None | arrêt non prouvé; ressources mises en quarantaine |
| Transcription | ASR_MODEL_MISSING | true | RetrySession | modèle local absent; nouvelle session après acquisition volontaire |
| Transcription | ASR_MODEL_INVALID | true | RetrySession | modèle/digest/format invalide; nouvelle session après remplacement |
| Transcription | ASR_MODEL_INCOMPATIBLE | true | RetrySession | modèle incompatible avec le backend/build |
| Transcription | ASR_UNSUPPORTED_LANGUAGE | true | RetrySession | langue non supportée par la configuration choisie |
| Transcription | ASR_UNSUPPORTED_AUDIO_FORMAT | false | None | violation du contrat audio/engine |
| Transcription | ASR_DECODE_FAILED | true | RetrySession | décodage échoué; audio courant purgé |
| Transcription | ASR_NO_SPEECH | true | RetrySession | aucun texte brut exploitable |
| Transcription | ASR_RESOURCE_EXHAUSTED | true | RetrySession | ressource insuffisante; audio courant purgé |
| Transcription | ASR_BACKEND_UNAVAILABLE | true | RetrySession | backend local indisponible |
| Transcription | ASR_TIMEOUT | true | RetrySession | deadline dépassée; résultat tardif rejeté par Epoch |
| Transcription | ASR_CANCELLED | false | None | acquittement d'annulation; transition Cancelled, pas Error |
| Platform | PLATFORM_PERMISSION_DENIED | true | RetryOperation | permission OS non micro refusée, aucun effet |
| Platform | PLATFORM_PERMISSION_PROMPT_FAILED | true | RetryOperation | invite OS échouée sans effet |
| Platform | PLATFORM_CONTROL_CONFLICT | true | RetryOperation | hotkey/contrôle indisponible, fallback à replanifier |
| Platform | PLATFORM_CONTROL_LOST | true | RetrySession | contrôle actif perdu; session invalidée |
| Platform | PLATFORM_TARGET_UNAVAILABLE | true | RetryOperation | cible initiale non capturée avant effet |
| Platform | PLATFORM_TARGET_CHANGED | true | RetryOperation | cible initiale obsolète avant effet |
| Platform | PLATFORM_PROTECTED_TARGET | false | None | cible protégée; L2/L3 interdits |
| Platform | PLATFORM_INTEGRITY_MISMATCH | false | None | frontière d'intégrité incompatible |
| Platform | PLATFORM_EXECUTOR_UNAVAILABLE | true | RetryOperation | exécuteur OS indisponible avant effet |
| Platform | PLATFORM_SESSION_LOCKED | false | None | événement sécurité; transition Cancelled, pas Error |
| Delivery | DELIVERY_TARGET_EXPIRED | true | RawAvailable | token expiré avant effet; revalidation requise |
| Delivery | DELIVERY_TARGET_CHANGED | true | RawAvailable | cible différente avant effet |
| Delivery | DELIVERY_PROTECTED_TARGET | false | RawAvailable | remise automatique interdite; L0/L1 reste possible |
| Delivery | DELIVERY_PERMISSION_REVOKED | true | RawAvailable | permission retirée avant effet confirmé |
| Delivery | DELIVERY_CLIPBOARD_UNAVAILABLE | true | RawAvailable | L1 non préparé; brut intact |
| Delivery | DELIVERY_INJECTION_REJECTED | true | RawAvailable | adaptateur confirme zéro effet |
| Delivery | DELIVERY_TIMEOUT_NO_EFFECT | true | RawAvailable | deadline expirée avec preuve de zéro effet |
| Delivery | DELIVERY_MANUAL_ACTION_REQUIRED | false | RawAvailable | seul L0/L1 explicite reste autorisé |
| Delivery | DELIVERY_OUTCOME_UNKNOWN | false | OutcomeUnknown | L2/L3 a pu agir; aucun retry/copie automatique |
| Settings | SETTINGS_NOT_INITIALIZED | true | RetryOperation | store non prêt, aucune mutation |
| Settings | SETTINGS_SCHEMA_UNSUPPORTED | false | None | schéma incompatible |
| Settings | SETTINGS_VALIDATION_FAILED | false | None | patch rejeté avant I/O |
| Settings | SETTINGS_CONFLICT | true | RetryOperation | révision obsolète, aucun commit |
| Settings | SETTINGS_STORAGE_UNAVAILABLE | true | RetryOperation | backend indisponible avant commit |
| Settings | SETTINGS_CORRUPT_DATA | false | None | données illisibles, aucun défaut silencieux |
| Settings | SETTINGS_MIGRATION_FAILED | false | None | migration rollbackée ou état isolé |
| Settings | SETTINGS_COMMIT_FAILED | true | RetryOperation | ancien snapshot reste autoritaire |

Aucun adaptateur ne peut changer retryable/recoverability pour un code selon le
contexte. S'il ne peut distinguer zéro effet d'un effet Delivery possible, il
DOIT rendre DELIVERY_OUTCOME_UNKNOWN. Une erreur native reste dans une chaîne
de cause locale expurgée; elle ne traverse ni IPC ni télémétrie et ne peut
contenir audio, texte, clipboard, cible, chemin personnel ou credential.

### 1.5 Confidentialité et effacement

- C3 et C4 n'implémentent pas d'affichage Debug contenant leur valeur.
- Aucune méthode de port ne journalise ses entrées ou sorties sensibles.
- Aucun port n'effectue d'egress réseau dans le MVP.
- Les destructions C3 appliquent une zeroisation best-effort lorsque le type et
  le backend le permettent; la preuve principale reste l'absence de
  persistance et le nombre borné de copies.
- Un panic, crash dump ou métrique ne doit pas sérialiser le payload d'un port.
- Les valeurs retournées ont un propriétaire et une fin de vie explicites.

## 2. Types partagés

### 2.1 Format et blocs audio

CaptureFormat est créé hors callback et contient:

| Champ | Règle |
|---|---|
| formatId | identifiant local de la négociation; aucune donnée utilisateur |
| sampleEncoding | enum explicite, au minimum PCM signé ou flottant selon les candidats du spike |
| sampleRateHz | entier non nul |
| channelCount | entier non nul et borné |
| layout | interleaved/planar explicite |
| endian | explicite lorsque pertinent |
| framesPerBlockMax | maximum garanti par le pool |

Aucune fréquence, mono/stéréo, endianness ou durée de trame n'est implicite. Le
format canonique d'entrée ASR et la capacité du pool restent des décisions de
spike. Une conversion ou un resampling se fait dans le worker audio, jamais
dans le callback.

FrameBlock contient un slot préalloué et un en-tête:

- SessionId/Epoch;
- numéro de séquence strictement croissant;
- horodatage monotone dans un domaine d'horloge déclaré;
- nombre de frames valides;
- formatId;
- indicateur de discontinuité/overflow.

AudioSegmentLease représente un segment final, continu et fini. Il possède ses
buffers et son CaptureFormat. Il ne peut être cloné implicitement; son transfert
au moteur déplace l'ownership.

### 2.2 Texte brut et candidat

RawTranscript est la sortie UTF-8 exacte du moteur pour la session. Son champ
text est C3, immuable et non normalisé par le core. Les métadonnées techniques
allowlist peuvent inclure l'identité/version du moteur et du modèle, la langue
demandée et des durées; tout token, timestamp lexical ou segment textuel reste
C3.

Une normalisation déterministe produit un type distinct DerivedText avec une
provenance de transformation. Une réécriture produit CandidateText. Ni l'un ni
l'autre ne remplace ou ne modifie RawTranscript. Le fallback renvoie exactement
RawTranscript.

### 2.3 Cible et remise

TargetRef est un handle opaque minimal issu de PlatformAdapter. Il n'expose ni
titre de fenêtre, URL, nom de document ni contenu. Il est lié à SessionId/Epoch
et expire sur changement de focus, événement lifecycle, timeout ou fin de
session.

ValidatedTarget est produit uniquement par validateTarget. Il contient:

- l'identité opaque liée à TargetRef;
- un capability level maximal L2/L3;
- l'état protégé/intégrité déjà contrôlé;
- un instant monotone d'expiration;
- un nonce d'usage unique.

Il est non forgeable par la WebView et consommé par une tentative de remise.
La durée exacte du TTL est qualifiée par spike pour chaque OS.

## 3. Port AudioSource

### 3.1 Responsabilité

AudioSource encapsule périphérique, négociation de format et stream natif. Il
produit des blocs dans un sink temps réel fourni par le core; il ne connaît ni
l'ASR, ni l'UI, ni le stockage.

### 3.2 Opérations sémantiques

| Opération | Entrée | Sortie / ownership | Garanties |
|---|---|---|---|
| enumerate | aucune | liste bornée AudioDeviceInfo C1 | hors callback; aucun prompt permission |
| negotiate | device selector + AudioRequirements + limites pool | CapturePlan immuable | aucune ouverture durable; format explicite |
| start | SessionId/Epoch, CapturePlan, ProducerLease préalloué, CancelToken | CaptureHandle possédé par le contrôle | une seule activation; callback ne commence qu'après ressources prêtes |
| stopAndQuiesce | CaptureHandle + cause | CaptureStopReport | idempotent; au succès aucun callback futur et ProducerLease rendu |
| status | CaptureHandle | état technique expurgé | non bloquant; aucun contenu |

ProducerLease donne au callback un unique producteur SPSC et un pool de slots
déjà alloués. Le callback emprunte le buffer fourni par l'OS, copie au plus la
taille négociée dans un slot, remplit l'en-tête, appelle tryPush et retourne.

### 3.3 Invariants temps réel

Dans le callback AudioSource:

- aucune I/O, aucun log synchrone, aucune allocation évitable;
- aucun mutex, condvar, join, sleep ou verrou bloquant;
- aucune attente lorsque le pool ou Q-AUDIO est plein;
- aucun appel Tauri, ASR, SettingsStore ou API de permission;
- aucune conversion lourde ou croissance de collection.

Si aucun slot ou emplacement n'est disponible, le callback incrémente un
compteur atomique, pose OverflowLatch et rejette le bloc entrant. L'orchestrateur
abandonne ensuite la session hors callback. Il est interdit d'écraser un bloc
non lu, de masquer le trou ou de transcrire silencieusement un segment lacunaire.

stopAndQuiesce s'exécute hors callback. Si la quiescence ne peut être prouvée
avant timeout, les buffers potentiellement référencés sont mis en quarantaine
jusqu'à la preuve de fin ou la sortie du processus; ils ne sont jamais libérés
sous un callback possible.

### 3.4 Erreurs propres

AudioSource retourne exclusivement les codes Audio du catalogue canonique:
AUDIO_NO_DEVICE, AUDIO_DEVICE_LOST, AUDIO_PERMISSION_DENIED,
AUDIO_PERMISSION_REVOKED, AUDIO_NEGOTIATION_FAILED, AUDIO_UNSUPPORTED_FORMAT,
AUDIO_STREAM_START_FAILED, AUDIO_STREAM_START_TIMEOUT, AUDIO_CALLBACK_FAULT,
AUDIO_OVERFLOW, AUDIO_DISCONTINUITY, AUDIO_EMPTY_CAPTURE et
AUDIO_QUIESCENCE_TIMEOUT. Le quadruplet de chaque code est invariant.

AUDIO_OVERFLOW et AUDIO_DISCONTINUITY invalident toujours la session courante.
AUDIO_QUIESCENCE_TIMEOUT interdit un retry dans le processus tant que la fin du
callback n'est pas prouvée.

### 3.5 Suite de substituabilité

Tout adaptateur AudioSource doit prouver:

- format et limites exacts, séquences monotones et ownership des slots;
- zéro allocation/I/O/log/verrou bloquant sur chemin instrumenté du callback;
- saturation non bloquante et fail-closed hors callback;
- stop répété, cancel avant/durant start, perte périphérique et callback tardif;
- quiescence avant libération;
- purge à fin, erreur, cancel et shutdown.

## 4. Port TranscriptionEngine

### 4.1 Responsabilité

TranscriptionEngine consomme un segment audio final local et retourne un texte
brut atomique. Le premier candidat peut être whisper.cpp, mais aucune sémantique
du port ne dépend de son ABI, de son modèle ou de son accélérateur.

### 4.2 Opérations sémantiques

| Opération | Entrée | Sortie / ownership | Garanties |
|---|---|---|---|
| capabilities | aucune | EngineCapabilities C0-C1 | formats, langues, accélérateurs et limites déclarés |
| prepareLocalModel | ModelSpec vérifié et chemin géré hors port | PreparedModelHandle local | aucune acquisition réseau; vérifie compatibilité avant chargement |
| transcribe | PreparedModelHandle, AudioSegmentLease, TranscriptionRequest, CancelToken | RawTranscript ou PortError | consomme le lease; une sortie finale au plus; local uniquement |
| releaseModel | PreparedModelHandle | acquittement | idempotent hors opération active ou CONTRACT_BUSY explicite |

TranscriptionRequest est borné à la langue, au mode et aux options déterministes
supportées. Il ne contient ni contexte d'application, ni credential, ni endpoint
Cloud au MVP.

Le moteur ne publie aucun partiel comme RawTranscript final. S'il produit
internement des partiels, ils restent C3 dans son worker et sont détruits sur
cancel/erreur. Une sortie vide est explicite et la machine d'états décide si
elle devient ASR_NO_SPEECH.

### 4.3 Concurrence et backpressure

Une instance PreparedModelHandle traite au plus un segment au MVP. Q-ASR a une
capacité logique de un. Une demande concurrente rend CONTRACT_BUSY; elle n'est ni
persistée, ni envoyée à un autre moteur, ni mise en attente non bornée.

Le moteur vérifie CancelToken à ses points sûrs. Si un binding natif ne peut
être interrompu, il peut finir en arrière-plan, mais le core rejette son Epoch
obsolète et détruit le résultat avant toute remise.

### 4.4 Erreurs propres

TranscriptionEngine retourne exclusivement la projection suivante du catalogue
§1.4. Elle n'est pas une taxonomie indépendante et ne peut pas redéfinir un
quadruplet:

| code exact | retryable | recoverability |
|---|---:|---|
| ASR_MODEL_MISSING | true | RetrySession |
| ASR_MODEL_INVALID | true | RetrySession |
| ASR_MODEL_INCOMPATIBLE | true | RetrySession |
| ASR_UNSUPPORTED_LANGUAGE | true | RetrySession |
| ASR_UNSUPPORTED_AUDIO_FORMAT | false | None |
| ASR_DECODE_FAILED | true | RetrySession |
| ASR_NO_SPEECH | true | RetrySession |
| ASR_RESOURCE_EXHAUSTED | true | RetrySession |
| ASR_BACKEND_UNAVAILABLE | true | RetrySession |
| ASR_TIMEOUT | true | RetrySession |
| ASR_CANCELLED | false | None |

ASR_MODEL_INVALID inclut signature/digest/format non conformes, sans révéler de
chemin personnel. ASR_CANCELLED produit Cancelled, jamais Error. Tous les autres
codes détruisent le segment courant avant Error; aucun ne permet RetryOperation
sur le même audio.

Un moteur ne peut jamais répondre à une erreur locale par un moteur distant ou
un autre fournisseur. La sélection d'un autre moteur local exige une nouvelle
session/politique explicite.

### 4.5 Suite de substituabilité

- même fixture et AudioSegmentLease donnent un RawTranscript attribuable au
  moteur, sans transformation aval cachée;
- formats/langues non supportés sont rejetés avant décodage;
- cancel avant, pendant et juste après la complétion;
- modèle absent, tronqué, digest faux, ressource insuffisante et backend crashé;
- un seul résultat final, aucun contenu dans logs/disque/réseau;
- ownership et purge du segment sur chaque sortie;
- résultats RTF/WER/CER publiés séparément de toute réécriture.

## 5. Port PlatformAdapter

### 5.1 Responsabilité

PlatformAdapter représente les capacités, permissions, contrôles globaux,
cycle de vie OS et identité minimale de la cible. Il ne livre aucun texte;
TextInjector reste une frontière distincte.

### 5.2 Opérations sémantiques

| Opération | Entrée | Sortie / ownership | Garanties |
|---|---|---|---|
| probeCapabilities | environnement local | CapabilitySnapshot C1 | aucun prompt, capability inconnue = Unknown et non Supported |
| permissionStatus | capability nommée | Granted, Denied, Restricted, NotDetermined ou Unsupported | lecture seule, sans invite |
| requestPermission | PermissionIntent liée à une action utilisateur | PermissionOutcome | une permission minimale à la fois; aucun retry en boucle |
| registerCaptureControl | PTT/toggle spec + ControlSink borné | ControlLease | événements down/up/toggle ordonnés; fallback UI déclarable |
| subscribeLifecycle | LifecycleSink borné | LifecycleLease | lock, sleep, wake, focus invalidation et révocation pertinents |
| captureTarget | TargetCapturePolicy minimale | TargetRef opaque | aucun contenu/titre/URL; avant capture selon parcours |
| validateTarget | TargetRef, SessionId/Epoch, politique | TargetValidation | identité, champ protégé, niveau d'intégrité/capability et expiration |
| release | lease/TargetRef | acquittement | idempotent; handles natifs invalidés |

CapabilitySnapshot porte environnement exact et raisons stables, jamais une
promesse de famille OS entière. Une permission accordée n'implique pas que la
capability fonctionne; l'adaptateur distingue permission et preuve.

TargetValidation est l'une de Validated(ValidatedTarget), Changed, Missing,
Protected, IntegrityMismatch, PermissionDenied, Unsupported ou Unknown.
Unknown est fail-closed pour L2/L3.

### 5.3 Compatibilité OS

- macOS: permissions microphone, Input Monitoring et Accessibility restent
  séparées selon la voie prouvée; aucune demande large anticipée.
- X11 et Wayland ont des CapabilitySnapshot distincts.
- Wayland ne retourne jamais Supported globalement par défaut; compositor,
  portal/voie et limites accompagnent la capability.
- Windows: une cible à niveau d'intégrité incompatible ne produit pas de
  ValidatedTarget automatisable.
- Secure Input, champ protégé ou cible ambiguë ne sont jamais contournés.

Les callbacks de contrôle/lifecycle n'envoient aucune donnée C3. Stop/Cancel,
lock et révocation posent un latch de sécurité même si ControlSink est saturé.

### 5.4 Erreurs propres et suite

Les seuls codes Platform sont PLATFORM_PERMISSION_DENIED,
PLATFORM_PERMISSION_PROMPT_FAILED, PLATFORM_CONTROL_CONFLICT,
PLATFORM_CONTROL_LOST, PLATFORM_TARGET_UNAVAILABLE, PLATFORM_TARGET_CHANGED,
PLATFORM_PROTECTED_TARGET, PLATFORM_INTEGRITY_MISMATCH,
PLATFORM_EXECUTOR_UNAVAILABLE et PLATFORM_SESSION_LOCKED. Une capability Unknown
reste une valeur de CapabilitySnapshot, pas un PortError. PLATFORM_SESSION_LOCKED
produit Cancelled; une TargetValidation attendue privilégie L1/L0 plutôt qu'une
erreur de session.

La suite de contrat couvre permission refusée/révoquée, key-up perdu, contrôle
UI, lock/sleep/wake, target-switch, target détruite, champ protégé, niveaux
d'intégrité, X11 et plusieurs compositors Wayland nommés. Un fallback L1/L0
fonctionnel est une réussite de dégradation, pas une preuve L2/L3.

## 6. Port TextInjector

### 6.1 Responsabilité et niveaux

TextInjector exécute un DeliveryPlan déjà autorisé:

| Niveau | Entrée requise | Résultat maximal |
|---|---|---|
| L0 interne | texte seulement | InternalRecoveryAvailable |
| L1 clipboard | action/politique explicite | ClipboardPrepared |
| L2 collage automatisé | ValidatedTarget L2/L3 non expiré | ConfirmedExact seulement avec oracle, sinon OutcomeUnknown/DELIVERY_OUTCOME_UNKNOWN |
| L3 insertion native | ValidatedTarget L3 non expiré | ConfirmedExact seulement avec oracle |

### 6.2 Opération sémantique

deliver consomme DeliveryRequest:

- SessionId/Epoch et DeliveryAttemptId;
- DeliveryLease C3 à usage unique;
- niveau maximal autorisé;
- ValidatedTarget pour L2/L3;
- CancelToken et deadline monotone;
- aucune instruction libre issue de la WebView.

Le core conserve séparément RawTranscript jusqu'au résultat récupérable;
DeliveryLease peut donc être détruit sans perdre le fallback.

DeliveryResult est un enum fermé:

- ConfirmedExact avec niveau L2/L3 et type de preuve;
- ClipboardPrepared, qui ne signifie jamais collé;
- InternalRecoveryAvailable;
- RejectedBeforeEffect avec exactement un code Delivery dont recoverability est
  RawAvailable;
- NoSideEffectCancelled;
- OutcomeUnknown avec code DELIVERY_OUTCOME_UNKNOWN.

Un booléen success est interdit. At-most-once signifie qu'un même
DeliveryAttemptId n'est exécuté qu'une fois dans le processus. Cela ne garantit
pas un exactly-once transactionnel après crash OS; DELIVERY_OUTCOME_UNKNOWN /
OutcomeUnknown empêche alors tout retry ou copie automatique.

### 6.3 Règles de cible et clipboard

- vérifier l'expiration/nonce du ValidatedTarget immédiatement avant l'effet;
- ne jamais forcer aveuglément le focus ou injecter dans une cible différente;
- ne jamais injecter dans un champ protégé;
- ne pas lire ni conserver l'ancien clipboard par défaut;
- ne pas restaurer/effacer automatiquement le clipboard sans specification,
  preuve de non-course et lot sécurité dédié;
- sous Wayland, L1/L0 est le comportement normal lorsque L2/L3 n'est pas
  prouvé pour le compositor/portal courant;
- un timeout avec preuve de zéro effet rend DELIVERY_TIMEOUT_NO_EFFECT;
- un timeout, une confirmation absente ou une annulation après effet possible
  rend DELIVERY_OUTCOME_UNKNOWN;
- aucune répétition automatique après DELIVERY_OUTCOME_UNKNOWN.

### 6.4 Erreurs propres et suite

Les seuls codes Delivery sont DELIVERY_TARGET_EXPIRED,
DELIVERY_TARGET_CHANGED, DELIVERY_PROTECTED_TARGET,
DELIVERY_PERMISSION_REVOKED, DELIVERY_CLIPBOARD_UNAVAILABLE,
DELIVERY_INJECTION_REJECTED, DELIVERY_TIMEOUT_NO_EFFECT et
DELIVERY_MANUAL_ACTION_REQUIRED et DELIVERY_OUTCOME_UNKNOWN. Les huit premiers
confirment qu'aucun effet ambigu n'existe et conservent RawTranscript; seul
DELIVERY_OUTCOME_UNKNOWN utilise Recoverability OutcomeUnknown et retryable
false.

La suite couvre texte exact une seule fois, cible changée entre validation et
effet, expiration, cancel avant/pendant l'effet, distinction prouvée entre
DELIVERY_TIMEOUT_NO_EFFECT et DELIVERY_OUTCOME_UNKNOWN,
clipboard occupé/modifié, cible non coopérative, Wayland sans injection et
absence totale de faux succès.

## 7. Port SettingsStore

### 7.1 Portée de données

SettingsStore contient exclusivement des réglages typés C1-C2:

- sélecteur de microphone sans chemin personnel;
- contrôle PTT/toggle;
- langue et référence de modèle locale;
- préférences de remise et d'accessibilité UI;
- indicateurs d'opt-in autorisés par leur propre politique.

Il NE contient jamais audio, transcript, texte final, historique, dictionnaire
libre C3, TargetRef, clipboard, token ou secret. Un historique et un coffre sont
des stores/ports distincts hors de ce cycle.

### 7.2 Opérations sémantiques

| Opération | Entrée | Sortie | Garantie |
|---|---|---|---|
| schemaInfo | aucune | version et capacités C1 | lecture seule |
| load | aucune | SettingsSnapshot immuable + Revision | défauts seulement si store absent, jamais pour masquer corruption |
| commit | ExpectedRevision + SettingsPatch typé | nouveau snapshot/revision | compare-and-swap atomique: tout ou rien |
| reset | ExpectedRevision + catégories autorisées | snapshot par défaut/revision | atomique, suppression des seules catégories réglages |
| migrate | version source/cible + plan versionné | revision ou erreur | transactionnelle, reprise/rollback prouvés |

Une Revision obsolète rend Conflict; aucune écriture last-write-wins silencieuse.
Chaque SettingsPatch est validé entièrement avant I/O. Un commit réussi est
durable selon le backend déclaré; un échec laisse l'ancien snapshot lisible.

Toutes les opérations s'exécutent sur T-STORE et sont sérialisées. Le callback
audio, l'orchestrateur pendant une transition et la WebView ne réalisent aucune
I/O directe. Une lecture peut être servie depuis un snapshot core immuable.

### 7.3 Erreurs propres et suite

Les seuls codes Settings sont SETTINGS_NOT_INITIALIZED,
SETTINGS_SCHEMA_UNSUPPORTED, SETTINGS_VALIDATION_FAILED, SETTINGS_CONFLICT,
SETTINGS_STORAGE_UNAVAILABLE, SETTINGS_CORRUPT_DATA,
SETTINGS_MIGRATION_FAILED et SETTINGS_COMMIT_FAILED.

La suite couvre store absent, corruption, révision concurrente, crash à chaque
point de migration/commit, disque plein, reset, permissions fichier, absence de
C3/C4 dans fichiers/journaux/caches et compatibilité avant/arrière explicitement
déclarée.

Le choix concret SQLite reste soumis au spike stockage et à ADR-0001. Le
contrat permet un double mémoire ou un autre backend sans changer le domaine.

## 8. Frontière C4 avant tout code de coffre

SettingsStore interdit C4 et cet ADR ne crée pas un sixième port produit. Avant
toute ligne de code qui manipule C4, exactement une des voies suivantes est
obligatoire:

1. **harnais coffre test-only jetable** conforme au contrat ci-dessous, jamais
   lié ou promu dans le binaire produit;
2. **frontière produit** précédée d'un ADR sécurité et d'un contrat versionné
   qui définit le coffre natif, ses données, erreurs, migrations et preuves.

L'absence de choix bloque le code C4. Un prototype de coffre ne peut pas devenir
implicitement l'implémentation produit.

### 8.1 Contrat strict du harnais jetable

Le harnais utilise uniquement des canaris synthétiques générés à l'intérieur de
son namespace de test. Il ne lit aucun secret réel et n'accepte aucun secret via
argument CLI, variable d'environnement, fixture, fichier, IPC ou WebView.

| Élément | Exigence normative |
|---|---|
| ownership | le coffre du harnais possède SecretMaterial de sa génération à sa suppression; l'appelant ne possède qu'un SecretHandle opaque C1 |
| valeur C4 | jamais retournée, clonée, loggée, sérialisée, exportée ou stockée dans SettingsStore/SQLite; les opérations sont médiées dans le coffre |
| idempotence | chaque mutation porte HarnessOperationId; un doublon confirmé rend le même état sans créer/remplacer une valeur |
| ordre des effets | ReserveNamespace -> ProvisionSynthetic -> UseMediated -> Delete -> VerifyEmpty; aucun use avant Provisioned, aucune provision après Delete demandé |
| résultat | Applied, NotApplied ou MutationUnknown; aucun booléen ambigu |
| compensation | si ProvisionSynthetic est Applied puis une étape ultérieure échoue, Delete idempotent du handle/namespace; NotApplied ne crée rien; tout résultat ni Applied ni NotApplied devient MutationUnknown et interdit la reprovision sous le même identifiant |
| état inconnu | timeout/crash après envoi d'une mutation = MutationUnknown; aucun retry automatique, namespace mis en quarantaine puis probe/delete explicite |
| cleanup | delete idempotent sur succès, erreur, cancel et teardown; cleanup de démarrage limité au namespace de campagne; VerifyEmpty ne lit que métadonnées/handles |
| artefacts | uniquement codes, durées et compteurs C1; aucune valeur, empreinte réversible ou dump C4 |
| durée de vie | harnais et namespace supprimés avec le spike; aucune API, type ou dépendance réutilisée par le produit sans nouvel ADR |

UseMediated exécute une opération allowlist à l'intérieur de la frontière et
retourne seulement un statut C1. Une comparaison de canari se fait dans le
coffre et ne retourne qu'un verdict. Même synthétique, SecretMaterial est traité
C4 afin que le test prouve la frontière et non une exception.

Applied, NotApplied et MutationUnknown forment HarnessVaultMutationState,
strictement test-only. Ce type ne complète pas PortError, ne traverse pas l'IPC
produit et disparaît avec le harnais.

### 8.2 Preuves avant usage du harnais

- test doublon pour chaque mutation;
- fault injection avant/après chaque effet et exercice MutationUnknown;
- compensation et cleanup après crash simulé;
- scan canari de la mémoire sérialisable, logs, stdout/stderr, fichiers,
  SettingsStore, SQLite et IPC;
- preuve que le binaire produit et ses manifests n'incluent pas le harnais;
- revue sécurité de la commande de campagne et du namespace exact.

Toute nécessité de lire une valeur C4 hors coffre, de conserver un handle entre
campagnes ou d'utiliser le harnais dans le produit invalide la voie test-only et
impose l'ADR/contrat versionné de la voie 2.

## 9. Matrice d'ownership synthétique

| Valeur | Créateur | Propriétaire pendant l'appel | Après succès | Après erreur/cancel |
|---|---|---|---|---|
| ProducerLease | core/pool audio | AudioSource callback | rendu au core après quiescence | rendu ou mis en quarantaine, jamais free prématuré |
| AudioSegmentLease | worker audio | TranscriptionEngine | détruit/purgé après RawTranscript | détruit/purgé |
| RawTranscript | TranscriptionEngine | core | volatile jusqu'à remise/acquittement puis purge | conservé seulement si Recoverability RawAvailable |
| TargetRef | PlatformAdapter | core | consommé/invalidé à validation/fin | release idempotent |
| ValidatedTarget | PlatformAdapter | TextInjector pour un attempt | consommé | invalidé |
| DeliveryLease | core | TextInjector | détruit | détruit; RawTranscript séparé reste récupérable |
| SettingsSnapshot | SettingsStore | core immuable | remplacé par revision | ancien snapshot reste autoritaire |

## 10. Conditions de promotion et rollback

Un port est gelé pour implémentation seulement lorsque:

- ses doubles et au moins un adaptateur passent la même suite de contrat;
- les races, annulations, saturations, timeouts et shutdown sont prouvés;
- le format/capacité/TTL encore ouverts ont une valeur et un artefact de spike;
- aucune permission ou donnée supplémentaire n'est requise en silence;
- le remplacement de l'adaptateur ne change pas la machine à états ni l'IPC;
- la revue sécurité accepte les données et erreurs exposées.

Si un adaptateur échoue, il reste prototype jetable. Le rollback consiste à le
retirer ou le remplacer derrière le même port; aucune donnée utilisateur ni
migration n'est créée par les spikes.

## 11. Références

- [ADR-0002](ADR-0002-MODULAR-RUNTIME.md)
- [Machine à états](STATE-MACHINE.md)
- [Versionnement IPC](IPC-VERSIONING.md)
- [Classification des données](../security/DATA-CLASSIFICATION.md)
- [Privacy baseline](../security/PRIVACY-BASELINE.md)
- [Matrice plateformes](../product/PLATFORM-CAPABILITIES.md)
