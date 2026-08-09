# Machine à états normative d'une session de dictée

- Statut: **Proposé — contrat de conception PHASE-02**
- Portée: une session locale active au maximum dans le MVP
- Propriétaire: SessionOrchestrator, single-writer dans le cœur Rust
- ADR associé: [ADR-0002](ADR-0002-MODULAR-RUNTIME.md)

Cette machine est l'autorité de capture. La WebView, le hotkey et les
adaptateurs émettent des intentions ou des résultats; ils ne changent jamais
directement l'état.

## 1. États canoniques

| État | Définition | Données que le core peut détenir | Effets autorisés |
|---|---|---|---|
| Idle | aucune session active, aucune capture | réglages C1-C2; dernier résultat déjà purgé | accepter Start |
| Arming | capacité, permission, cible minimale et pipeline audio sont préparés | SessionId/Epoch, TargetRef opaque, format/pool sans audio valide | probe, target snapshot, AudioSource.start |
| Listening | le flux audio est ouvert et le callback peut produire | slots audio C3 bornés, format, TargetRef | capture et indicateur actif |
| Finalizing | aucun nouvel audio utile ne doit entrer; le flux devient quiescent et le segment est scellé | slots/segment C3 | stop, quiescence, drain, validation continuité |
| Transcribing | un segment final est détenu par le moteur local | AudioSegmentLease C3 | décodage local annulable |
| Rewriting | transformation facultative du brut; état bypassé au MVP | RawTranscript immuable C3 et candidat séparé C3 | réécriture approuvée ou fallback brut |
| ValidatingTarget | la cible initiale est revalidée et un niveau L0-L3 est choisi | brut, candidat éventuel, TargetRef | capability/permission/target validation |
| Injecting | un plan de remise L0-L3 est exécuté une seule fois | brut récupérable et DeliveryLease C3 | injection/copie/résultat interne |
| Error | la session ne peut continuer automatiquement; la récupération est explicite | ErrorRecord expurgé; brut C3 seulement s'il existait déjà | retry delivery, copie, discard/ack |
| Cancelled | annulation effective, effets neutralisés et purge en cours/terminée | motif C1, jamais de contenu une fois CleanupComplete | ack vers Idle |

Il n'existe pas d'état Success persistant. Une réussite produit un
CompletionOutcome versionné, purge les données selon zero-history, puis revient
à Idle. Error et Cancelled sont observables au moins par un snapshot terminal;
la perte de l'événement UI ne change pas la vérité native.

## 2. Vue des transitions nominales

~~~text
Idle
  -> Arming
  -> Listening
  -> Finalizing
  -> Transcribing
  -> Rewriting --------+
       | bypass/fallback|
       +--------------- v
                   ValidatingTarget
                         |
                         v
                     Injecting
                         |
                         v
                        Idle

Tout état actif -> Cancelled -> Idle
Tout état actif -> Error
Error --retry remise--> ValidatingTarget
Error --ack/discard--> Idle
~~~

« Tout état actif » est affiné ci-dessous: Injecting ne peut devenir Cancelled
que si l'adaptateur prouve qu'aucun effet n'a eu lieu. Sinon il devient Error
avec outcome inconnu et le texte brut reste récupérable.

## 3. Modèle d'événement et atomicité

Chaque événement externe porte:

- SessionId et Epoch;
- ActionId pour toute complétion asynchrone;
- un type fermé et des champs bornés;
- une origine authentifiée parmi UI locale autorisée, adaptateur, timer ou
  watchdog natif;
- aucune chaîne de contenu libre dans les événements de contrôle.

L'orchestrateur traite un événement à la fois:

1. rejeter un SessionId/Epoch obsolète;
2. rejeter ou ignorer idempotemment un ActionId déjà terminé;
3. vérifier que l'événement est permis dans l'état courant;
4. committer la nouvelle révision d'état et les effets à lancer;
5. lancer les effets hors de la boucle;
6. accepter uniquement leurs complétions portant les mêmes SessionId, Epoch et
   ActionId.

La publication UI arrive après le commit d'état. Un événement UI perdu ne peut
donc ni annuler un commit ni créer un deuxième propriétaire.

## 4. Table de transition complète

### 4.1 Idle et Arming

| Depuis | Événement / garde | Vers | Effets et postconditions |
|---|---|---|---|
| Idle | StartRequested et configuration valide | Arming | créer SessionId/Epoch et CancelToken; armer timers; aucun micro avant ce commit |
| Idle | CancelRequested, StopRequested ou résultat tardif | Idle | no-op idempotent; compter seulement un code technique |
| Idle | StartRequested pendant shutdown | Error | CONTRACT_INVALID_STATE, retryable false, None; aucune session créée |
| Arming | TargetCaptured + capability/permission suffisante + AudioStarted | Listening | publier indicateur actif; conserver TargetRef minimal |
| Arming | permission microphone refusée/révoquée | Error | AUDIO_PERMISSION_DENIED ou AUDIO_PERMISSION_REVOKED; arrêter toute ouverture partielle; aucun audio conservé |
| Arming | permission plateforme non micro refusée, mais capture possible | Arming | PLATFORM_PERMISSION_DENIED est converti en dégradation contrôle UI/L1/L0; ne pas ouvrir Error |
| Arming | capability absente mais contrôle UI/copie reste possible | Arming | dégrader le plan; poursuivre seulement si capture autorisée |
| Arming | périphérique/format/pool/stream impossible | Error | code exact parmi AUDIO_NO_DEVICE, AUDIO_NEGOTIATION_FAILED, AUDIO_UNSUPPORTED_FORMAT ou AUDIO_STREAM_START_FAILED; cleanup |
| Arming | délai d'armement expiré | Error | AUDIO_STREAM_START_TIMEOUT; annuler les actions, fermer tout flux partiel |
| Arming | CancelRequested, UI bridge perdu, verrouillage ou shutdown | Cancelled | avancer Epoch, poser CancelToken, stop/cleanup |

Les demandes de permission sont déclenchées seulement par une action utilisateur
au moment utile. Un probe ne doit pas provoquer lui-même une invite OS.

### 4.2 Listening

| Depuis | Événement / garde | Vers | Effets et postconditions |
|---|---|---|---|
| Listening | StopRequested, key-up valide ou toggle off | Finalizing | poser StopLatch sans attendre dans le callback, lancer stop hors RT |
| Listening | durée maximale atteinte | Finalizing | arrêt de sécurité et motif LimitReached; la valeur est fixée par spike/UX |
| Listening | overflow, séquence manquante, erreur callback ou périphérique perdu | Error | AUDIO_OVERFLOW, AUDIO_DISCONTINUITY, AUDIO_CALLBACK_FAULT ou AUDIO_DEVICE_LOST; callback pose seulement compteur/flag atomique; abandon/stop/purge hors callback; aucun ASR lacunaire |
| Listening | permission microphone révoquée | Error | AUDIO_PERMISSION_REVOKED; avancer Epoch, stop et purge avant tout RetrySession |
| Listening | contrôle de capture global perdu | Error | PLATFORM_CONTROL_LOST; avancer Epoch, stop et purge avant tout RetrySession |
| Listening | session OS verrouillée/suspendue, UI/indicateur perdu, CancelRequested ou shutdown | Cancelled | avancer Epoch, stop et purge; aucune reprise automatique |
| Listening | nouveau StartRequested | Listening | réponse CONTRACT_BUSY, true, RetryOperation; ne pas créer de session ou file supplémentaire et ne pas entrer Error |
| Listening | événement progrès | Listening | mise à jour métrique bornée/coalescée seulement |

Le callback NE DOIT jamais attendre la transition. Il peut uniquement observer
les latches, écrire dans un slot préalloué, try-push et retourner.

### 4.3 Finalizing

| Depuis | Événement / garde | Vers | Effets et postconditions |
|---|---|---|---|
| Finalizing | SourceQuiesced + drain complet + segment continu non vide | Transcribing | transférer exactement un AudioSegmentLease à Q-ASR |
| Finalizing | segment vide | Error | AUDIO_EMPTY_CAPTURE; purge audio |
| Finalizing | discontinuité/overflow détecté | Error | AUDIO_DISCONTINUITY ou AUDIO_OVERFLOW; ne jamais transcrire |
| Finalizing | stop/quiescence/drain timeout | Error | AUDIO_QUIESCENCE_TIMEOUT, false, None; avancer Epoch et mettre en quarantaine tout buffer encore référençable |
| Finalizing | permission microphone révoquée | Error | AUDIO_PERMISSION_REVOKED; avancer Epoch et purger sans lancer l'ASR |
| Finalizing | CancelRequested, verrouillage ou shutdown | Cancelled | avancer Epoch; purge sans lancer l'ASR |
| Finalizing | résultat source dupliqué/tardif | Finalizing | ignorer idempotemment |

Finalizing ne peut être sauté: TranscriptionEngine ne reçoit jamais un flux
encore alimenté ou un format non figé.

### 4.4 Transcribing et Rewriting

| Depuis | Événement / garde | Vers | Effets et postconditions |
|---|---|---|---|
| Transcribing | RawTranscriptReady exact et non obsolète; réécriture désactivée | ValidatingTarget | core prend ownership du brut volatile; purge l'audio dès que le moteur rend le lease |
| Transcribing | RawTranscriptReady; transformation approuvée pour cette session | Rewriting | conserver le brut immuable; créer une opération séparée |
| Transcribing | erreur moteur/modèle/ressource/timeout | Error | code ASR exact du catalogue sauf ASR_CANCELLED; appliquer son quadruplet, purger audio, aucun texte partiel final |
| Transcribing | ASR_CANCELLED ou CancelRequested/verrouillage/révocation/shutdown | Cancelled | avancer Epoch; demander cancel moteur; tout résultat tardif est détruit |
| Rewriting | CandidateReady | ValidatingTarget | conserver brut et candidat séparés; la politique choisit le candidat |
| Rewriting | SkipRewrite, erreur ou timeout de réécriture | ValidatingTarget | détruire le candidat et sélectionner exactement RawTranscript |
| Rewriting | CancelSession, verrouillage, révocation ou shutdown | Cancelled | détruire brut/candidat; aucun fallback n'est injecté après annulation de session |

Au MVP Rewriting est systématiquement bypassé. Cet état ne constitue pas une
autorisation Cloud. Toute implémentation future doit avoir son propre cadrage,
et un échec retourne le brut octet-pour-octet sans normalisation silencieuse.

### 4.5 ValidatingTarget et Injecting

| Depuis | Événement / garde | Vers | Effets et postconditions |
|---|---|---|---|
| ValidatingTarget | cible identique, non protégée et capability L2/L3 prouvée | Injecting | créer ValidatedTarget à TTL court et DeliveryAttemptId unique |
| ValidatingTarget | cible absente/différente/ambiguë/protégée ou permission insuffisante | Injecting | choisir L1 si explicitement autorisé, sinon L0; ne pas forcer le focus |
| ValidatingTarget | invariant interne empêche même L0 | Error | CONTRACT_INTERNAL, false, None; aucune tentative OS et purge au discard |
| ValidatingTarget | validation timeout/erreur | Injecting | dégrader vers L1/L0 selon politique; jamais vers L2/L3 sans preuve |
| ValidatingTarget | CancelRequested, verrouillage ou shutdown | Cancelled | purger brut/candidat; aucun essai de remise |
| Injecting | ConfirmedExact une fois dans la cible | Idle | CompletionOutcome Delivered L2/L3; acquitter puis purger toutes les copies internes |
| Injecting | ClipboardPrepared et plan L1 explicite | Idle | CompletionOutcome CopiedNotPasted; ne jamais annoncer injecté; purger après acquittement |
| Injecting | InternalRecoveryAvailable L0 | Error | DELIVERY_MANUAL_ACTION_REQUIRED, false, RawAvailable; brut conservé volatile pour affichage/copie |
| Injecting | RejectedBeforeEffect | Error | code exact DELIVERY_* dont recoverability RawAvailable; brut conservé; retry seulement si code.retryable et action explicite |
| Injecting | CancelRequested et NoSideEffect confirmé | Cancelled | avancer Epoch et purger |
| Injecting | OutcomeUnknown, timeout/annulation après effet possible | Error | DELIVERY_OUTCOME_UNKNOWN, false, OutcomeUnknown; aucun retry ou copie automatique; brut visible seulement en L0 jusqu'à résolution explicite |
| Injecting | complétion dupliquée ou ancien DeliveryAttemptId | Injecting | ignorer; ne jamais exécuter une deuxième remise |

Un fallback Wayland L1/L0 est une capacité normale, pas une preuve d'échec de
la plateforme. En revanche ClipboardPrepared n'est jamais équivalent à
ConfirmedExact.

### 4.6 Error et Cancelled

| Depuis | Événement / garde | Vers | Effets et postconditions |
|---|---|---|---|
| Error | RetryOperationRequested et recoverability = RetryOperation et retryable = true | état retry déclaré | même SessionId/Epoch, nouvelle ActionId; seulement après preuve de zéro effet |
| Error | RetryDelivery et recoverability = RawAvailable et retryable = true | ValidatingTarget | nouveau DeliveryAttemptId; cible revalidée; jamais réutiliser un target token expiré |
| Error | CopyRequested et recoverability = RawAvailable | ValidatingTarget | politique plafonnée à L1, action utilisateur explicite; autorisé même si retryable = false |
| Error | RetrySession et recoverability = RetrySession, aucun C3 détenu, cleanup complet | Arming | nouveaux SessionId/Epoch et nouvelles ressources |
| Error | ResolveOutcome(NotDelivered) et recoverability = OutcomeUnknown | Error | remplacer le record par DELIVERY_MANUAL_ACTION_REQUIRED, false, RawAvailable; aucune injection automatique, L0/L1 explicite seulement |
| Error | ResolveOutcome(Delivered) ou Discard et recoverability = OutcomeUnknown | Idle | purger le brut et clore sans nouvelle remise |
| Error | Acknowledge ou Discard et recoverability != OutcomeUnknown | Idle | avancer Epoch; purger C3; publier résultat terminal expurgé |
| Error | CancelRequested, verrouillage ou shutdown | Cancelled | purger et neutraliser toute action restante |
| Cancelled | CleanupComplete puis Acknowledge automatique/UI | Idle | aucun C3, stream ou action en vol pour l'ancien Epoch |
| Cancelled | StartRequested avant CleanupComplete | Cancelled | CONTRACT_BUSY; ne pas chevaucher les ressources |

Error n'est récupérable que si Recoverability l'indique. Un bouton Retry ne peut
pas être déduit de retryable seul: la garde d'état et la présence de l'artefact
requis doivent aussi être vraies. OutcomeUnknown bloque RetryDelivery et
CopyRequested jusqu'à ResolveOutcome; cette résolution est une déclaration
utilisateur, jamais une déduction de Fluent.

## 5. Invariants par phase

| Invariant | États concernés |
|---|---|
| aucun flux microphone ouvert | Idle, Transcribing, Rewriting, ValidatingTarget, Injecting, Error après cleanup, Cancelled après cleanup |
| indicateur de capture actif et accessible | Listening puis début de Finalizing; de l'ouverture effective à SourceQuiesced |
| au plus un producteur callback et un consommateur Q-AUDIO | Listening, Finalizing |
| aucune transcription si overflow/discontinuité | Finalizing et toutes les sorties suivantes |
| RawTranscript ne peut exister avant Transcribing completion | Rewriting, ValidatingTarget, Injecting, Error récupérable |
| le brut reste immuable pendant une réécriture | Rewriting et après |
| aucune injection sans validation du même Epoch | Injecting |
| aucune donnée C3 persistée par défaut | tous |
| aucun résultat tardif ne change l'état | tous |
| Cancelled + CleanupComplete implique zéro C3 détenu | Cancelled |

Les assertions d'invariant DEVRAIENT être exécutables dans les tests de modèle.
Une violation en build de production entraîne fail-closed et Error/Internal;
elle n'est pas réparée par une transition inventée.

## 6. Annulation, timeouts et watchdogs

CancelToken est idempotent et atomique. L'annulation avance Epoch avant de
demander aux adaptateurs de s'arrêter; l'absence de coopération d'un FFI ne
permet donc pas à sa complétion d'agir. Les timeouts utilisent une horloge
monotone et sont liés à ActionId.

Valeurs à fixer par spikes:

- délai d'armement et de permission;
- durée maximale Listening et watchdog de key-up perdu;
- stop/quiescence/drain audio;
- annulation/décodage ASR;
- TTL de TargetRef/ValidatedTarget;
- validation et remise OS;
- rétention volatile du brut dans Error en attente d'une action.

Avant qualification, chaque valeur est un paramètre explicite avec borne
conservatrice et aucun infini. La valeur et sa justification apparaissent dans
l'artefact de spike.

Événements de sécurité non négociables:

- verrouillage de session, révocation microphone et perte d'indicateur/UI
  pendant Listening annulent et purgent;
- suspension/veille arrête la capture; aucune reprise automatique au wake;
- changement de périphérique ne bascule pas silencieusement au milieu d'une
  session;
- shutdown suit cancel, quiescence, purge puis join.

## 7. Erreurs et résultats

ErrorRecord est exactement PortError de
[CORE-CONTRACTS.md](CORE-CONTRACTS.md), enrichi seulement de la phase fautive:

- domain fermé;
- code exact du catalogue canonique;
- retryable;
- recoverability parmi None, RetryOperation, RetrySession, RawAvailable ou
  OutcomeUnknown;
- messageKey localisable dérivée du code;
- métadonnées C1 allowlist.

Il NE contient ni texte natif libre non filtré, audio, transcript, cible,
clipboard, chemin personnel, payload IPC ou credential. La cause interne peut
être inspectée localement par un diagnostic structuré, mais ne traverse pas
l'IPC.

### 7.1 Mapping canonique vers les transitions

| Codes / résultats | Entrée | Sortie permise |
|---|---|---|
| CONTRACT_BUSY, CONTRACT_RESOURCE_EXHAUSTED | état courant inchangé, pas Error | nouvelle intention seulement avec nouvelle ActionId |
| CONTRACT_CANCELLED, ASR_CANCELLED, PLATFORM_SESSION_LOCKED | Cancelled | CleanupComplete puis Idle |
| CONTRACT_INVALID_STATE, CONTRACT_INVALID_INPUT, CONTRACT_UNSUPPORTED, CONTRACT_INTERNAL | Error avec None | Acknowledge/Discard vers Idle |
| AUDIO_NO_DEVICE, AUDIO_DEVICE_LOST, AUDIO_PERMISSION_DENIED, AUDIO_PERMISSION_REVOKED, AUDIO_NEGOTIATION_FAILED, AUDIO_STREAM_START_FAILED, AUDIO_STREAM_START_TIMEOUT, AUDIO_CALLBACK_FAULT, AUDIO_OVERFLOW, AUDIO_DISCONTINUITY, AUDIO_EMPTY_CAPTURE | Error avec RetrySession | cleanup/purge, puis nouveaux SessionId/Epoch vers Arming |
| AUDIO_UNSUPPORTED_FORMAT, AUDIO_QUIESCENCE_TIMEOUT | Error avec None | aucune reprise de session; quarantaine si nécessaire, puis Idle |
| ASR_MODEL_MISSING, ASR_MODEL_INVALID, ASR_MODEL_INCOMPATIBLE, ASR_UNSUPPORTED_LANGUAGE, ASR_DECODE_FAILED, ASR_NO_SPEECH, ASR_RESOURCE_EXHAUSTED, ASR_BACKEND_UNAVAILABLE, ASR_TIMEOUT | Error avec RetrySession | audio purgé; nouvelle session seulement |
| ASR_UNSUPPORTED_AUDIO_FORMAT | Error avec None | aucune reprise automatique; corriger le contrat avant une autre session |
| PLATFORM_PERMISSION_DENIED, PLATFORM_PERMISSION_PROMPT_FAILED, PLATFORM_CONTROL_CONFLICT, PLATFORM_TARGET_UNAVAILABLE, PLATFORM_TARGET_CHANGED, PLATFORM_EXECUTOR_UNAVAILABLE | dégradation sans Error si possible; sinon Error avec RetryOperation et retryState = Arming | même SessionId/Epoch, nouvelle ActionId vers Arming après zéro effet prouvé |
| PLATFORM_CONTROL_LOST | Error avec RetrySession | nouvelle session après cleanup |
| PLATFORM_PROTECTED_TARGET, PLATFORM_INTEGRITY_MISMATCH | L1/L0 sans Error; si même L0 viole un invariant, CONTRACT_INTERNAL/None | jamais L2/L3 |
| DELIVERY_TARGET_EXPIRED, DELIVERY_TARGET_CHANGED, DELIVERY_PERMISSION_REVOKED, DELIVERY_CLIPBOARD_UNAVAILABLE, DELIVERY_INJECTION_REJECTED, DELIVERY_TIMEOUT_NO_EFFECT | Error avec RawAvailable et retryable true | RetryDelivery ou CopyRequested explicite; nouvelle cible et DeliveryAttemptId |
| DELIVERY_PROTECTED_TARGET, DELIVERY_MANUAL_ACTION_REQUIRED | Error avec RawAvailable et retryable false | L0 ou CopyRequested L1 explicite; aucune nouvelle injection |
| DELIVERY_OUTCOME_UNKNOWN | Error avec OutcomeUnknown et retryable false | aucune remise/copie; ResolveOutcome explicite selon §4.6 |
| codes Settings | hors machine de session | l'appelant SettingsStore applique exactement RetryOperation ou None du catalogue |

Le mapping est exhaustif. Aucun code ne peut choisir une autre transition en
fonction d'un message natif. Quand Platform ou Delivery ne peut prouver que
l'effet n'a pas eu lieu, la seule sortie autorisée est
DELIVERY_OUTCOME_UNKNOWN.

CompletionOutcome distingue au minimum:

- ConfirmedExact avec niveau L2 ou L3;
- ClipboardPrepared avec niveau L1;
- InternalRecoveryAvailable avec niveau L0 et
  DELIVERY_MANUAL_ACTION_REQUIRED;
- Cancelled;
- Failed avec Recoverability;
- OutcomeUnknown avec DELIVERY_OUTCOME_UNKNOWN.

Ces valeurs décrivent une preuve, jamais une intention. Une tentative OS
retournée sans oracle ne devient pas ConfirmedExact.

## 8. Concurrence et scénarios de course obligatoires

Les tests de modèle doivent couvrir au minimum:

1. key-up et overflow simultanés: Error/AUDIO_DISCONTINUITY gagne, jamais ASR;
2. cancel pendant start puis AudioStarted tardif: résultat détruit, aucune
   transition vers Listening;
3. lock pendant Listening: Cancelled et callback quiescent;
4. cancel pendant ASR non coopératif: retour tardif ignoré;
5. erreur rewrite: brut exact envoyé vers validation;
6. changement de focus entre validation et remise: target token expiré,
   fallback, aucune mauvaise cible;
7. deux complétions d'injection: une seule acceptée;
8. cancel pendant injection: distinction NoSideEffect/OutcomeUnknown;
9. bridge UI perdu: capture arrêtée si active, terminal conservé côté core;
10. file d'événements UI saturée: état terminal récupérable par snapshot;
11. Start répété dans chaque état actif: CONTRACT_BUSY sans seconde ressource;
12. shutdown depuis chacun des dix états: aucune action ou donnée orpheline.

## 9. Observabilité et mesure

Les transitions produisent seulement des traces C1 allowlist:

- SessionId pseudonyme éphémère;
- ancienne/nouvelle phase;
- code de déclencheur;
- durée monotone;
- compteurs queue/pertes;
- version de contrat et environnement généralisé.

Aucun texte, audio ou identifiant de cible ne doit être dérivé du trace ID.
Les points de mesure Armement PTT, fin PTT et fin vers texte brut sont les
commits de transition définis ici, conformément à
[PERFORMANCE-BUDGETS.md](../quality/PERFORMANCE-BUDGETS.md).

## 10. Références

- [Modèle de composants](COMPONENT-MODEL.md)
- [Contrats des ports](CORE-CONTRACTS.md)
- [Versionnement IPC](IPC-VERSIONING.md)
- [Privacy baseline](../security/PRIVACY-BASELINE.md)
- [Threat model v0](../security/THREAT-MODEL-V0.md)
- [Matrice de test](../quality/TEST-MATRIX.md)
