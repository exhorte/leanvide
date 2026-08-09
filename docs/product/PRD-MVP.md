# PRD — MVP de Fluent

Statut: **périmètre produit confirmé — seuils et capacités à prouver**

Cycle: `CYCLE-20260809-02`

Phase: `PHASE-00`

Référence de vision: [VISION.md](VISION.md)

## 1. Objet

Ce PRD décrit le MVP confirmé de dictée vocale desktop. Il sépare:

- les contraintes déjà normatives dans le dépôt;
- les hypothèses à valider;
- les décisions de périmètre confirmées le 2026-08-09;
- les capacités et performances qui restent à prouver.

Les décisions D-01 à D-14 de la [vision](VISION.md#6-registre-des-14-décisions-produit) sont confirmées. Cette confirmation ne transforme pas les hypothèses d'usage, les budgets provisoires ni les capacités OS en résultats démontrés.

## 2. Résultat utilisateur visé

Sur macOS Apple Silicon si une machine de test est disponible, sinon sur Windows comme référence pratique, un professionnel desktop peut déclencher une dictée en push-to-talk par défaut ou avec un toggle accessible, parler, arrêter la capture, obtenir en français un texte local et le remettre à l'application cible. Le parcours fonctionne sans compte ni réseau. Chaque échec laisse le texte récupérable et indique une action de repli.

## 3. Hypothèses de produit

| ID | Hypothèse | Méthode de validation | Critère de décision |
|---|---|---|---|
| H-01 | la dictée fréquente sur desktop justifie un raccourci global | entretiens et observation de tâches auprès du persona D-02 | fréquence et gain observés suffisants |
| H-02 | un chemin local est une valeur différenciante | test de proposition de valeur | préférence nette du segment et tolérance mesurée au compromis précision/ressources |
| H-03 | le push-to-talk retenu par défaut réduit les captures accidentelles | test comparatif push-to-talk/toggle | erreurs, abandon et charge perçue acceptables |
| H-04 | l'injection automatique couvre assez d'applications | matrice d'applications et d'OS | taux de succès conforme au budget retenu; fallback compris |
| H-05 | le texte brut réduit le coût d'un échec de réécriture | test de récupération | aucun texte déjà transcrit perdu dans les scénarios d'échec |
| H-06 | un widget visible augmente la confiance sans gêner | test UX et accessibilité | états compris; gêne, focus et lecture d'écran acceptables |
| H-07 | le matériel minimal peut exécuter un modèle local utile | benchmark reproductible | RTF, latence et mémoire sous les seuils finalement approuvés |

Toutes ces hypothèses de valeur, d'utilisabilité et de performance restent à valider; elles ne rouvrent pas D-01 à D-14.

## 4. Périmètre MVP confirmé

### 4.1 Inclus, avec faisabilité à prouver

| ID | Capacité | Exigence MVP | Statut |
|---|---|---|---|
| FR-001 | déclenchement | push-to-talk par défaut et toggle accessible; aucune écoute continue | périmètre confirmé; hotkeys et repli UI à prouver |
| FR-002 | capture | sélectionner un microphone et capturer sans I/O, log synchrone, allocation évitable ni verrou bloquant dans le callback | contrainte technique confirmée; UX ouverte |
| FR-003 | état visible | rendre perceptibles `prêt`, `écoute`, `traitement`, `succès`, `fallback` et `erreur` | proposition à valider |
| FR-004 | transcription | produire un texte avec un moteur local derrière une interface interchangeable | proposition cohérente avec la stack cible; critères ASR ouverts |
| FR-005 | résultat brut | conserver en mémoire le texte ASR brut jusqu'à remise réussie ou copie explicite | proposition à confirmer |
| FR-006 | remise | tenter la méthode autorisée sur l'environnement puis offrir un fallback presse-papiers explicite | proposition; capacités exactes à prouver par OS |
| FR-007 | récupération | afficher ou copier le texte si l'injection échoue, sans relancer l'ASR | proposition à confirmer |
| FR-008 | configuration | gérer localement microphone, raccourci, modèle, français et comportement de remise | français confirmé; options techniques et accessibilité à prouver |
| FR-009 | permissions | expliquer le besoin d'une permission au moment utile et diagnostiquer un refus | exigence candidate forte |
| FR-010 | diagnostics | exposer versions, capacités et erreurs techniques sans audio ni contenu dicté par défaut | proposition soumise au threat model |
| FR-011 | fonctionnement déconnecté | le cœur de dictée fonctionne sans compte, authentification ni réseau | périmètre confirmé; test E2E réseau bloqué requis |
| FR-012 | gestion du modèle | téléchargement, validation d'intégrité, reprise et suppression contrôlée du modèle local | proposition; licence et source du modèle à valider |

### 4.2 V1 proposée

- dictionnaire personnel et substitutions déterministes;
- profils de formatage par application;
- historique textuel local opt-in, à rétention configurable, le défaut restant zero-history;
- moteurs ASR ou accélérateurs additionnels derrière les contrats stables;
- réécriture optionnelle avec aperçu/diff et retour au texte brut;
- couverture des plateformes non retenues comme référence;
- mise à jour signée et gestion de compatibilité des modèles;
- Cloud ou synchronisation facultatifs et payants uniquement après un cadrage ultérieur; aucun compte requis pour le chemin local.

### 4.3 Ultérieur

- collaboration et fonctions d'organisation;
- politiques administrateur, SSO et SCIM;
- mobile;
- contexte enrichi par accessibilité ou OCR;
- personnalisation ou apprentissage à partir des corrections;
- backend analytique spécialisé après preuve de volume.

### 4.4 Non-objectifs du MVP

- écoute continue;
- historique audio implicite;
- toute implémentation Cloud, synchronisation ou compte;
- injection universelle garantie;
- lecture silencieuse du contenu de l'application active;
- OCR d'écran;
- synchronisation multi-appareils;
- facturation et gestion d'organisation;
- prise en charge de toutes les langues ou de tout matériel;
- parité fonctionnelle immédiate sur trois OS;
- migration WPF; Fluent est greenfield tant qu'un dépôt ou inventaire externe n'entraîne pas un nouvel ADR.

## 5. Parcours principal visé

1. L'utilisateur configure une langue, un microphone, un modèle et un contrôle de capture.
2. L'application vérifie les capacités et permissions nécessaires, sans activer le microphone en arrière-plan.
3. L'utilisateur place le curseur dans une application cible puis déclenche la capture.
4. Le widget signale visiblement l'écoute; le pipeline enregistre les échantillons nécessaires à la dictée en cours.
5. L'utilisateur arrête la capture; le widget signale le traitement.
6. Le moteur produit un texte brut.
7. Fluent tente la remise autorisée pour l'environnement et confirme son résultat.
8. Si la remise ne peut être confirmée, Fluent préserve le texte et propose de le copier ou de le récupérer.
9. Les buffers audio de la dictée sont détruits après traitement; aucun audio n'est persisté par défaut.

### États candidats

```text
IDLE -> ARMING -> LISTENING -> PROCESSING -> DELIVERING -> SUCCESS
  ^         |          |             |             |
  |         +----------+-------------+-------------+-> RECOVERABLE_ERROR
  |                                                        |
  +--------------------------------------------------------+
```

Les transitions, timeouts et contrats IPC seront figés en Phase 02. `RECOVERABLE_ERROR` doit conserver le texte disponible lorsqu'il existe.

## 6. User stories MVP

| ID | User story | Critère d'acceptation |
|---|---|---|
| US-01 | En tant qu'utilisateur, je déclenche la capture sans quitter mon application. | le contrôle fonctionne sur l'environnement de référence et un état perceptible apparaît dans le budget d'armement retenu |
| US-02 | Je vois sans ambiguïté si le microphone écoute ou si le texte est en traitement. | chaque état est distinguable visuellement et par technologie d'assistance selon le parcours testé |
| US-03 | Je dicte sans réseau et sans compte. | le test E2E du chemin local passe avec réseau bloqué et sans authentification |
| US-04 | Je récupère ma transcription même si l'application cible refuse l'insertion. | le texte brut reste copiable; aucune nouvelle transcription n'est nécessaire |
| US-05 | Je comprends pourquoi une permission est demandée ou refusée. | la vue de diagnostic nomme capacité, état et action; elle ne prétend pas contourner l'OS |
| US-06 | Je peux changer de microphone ou de modèle. | la configuration persiste localement et les erreurs de ressource sont récupérables |
| US-07 | Je peux effacer les données que Fluent conserve. | les paramètres et modèles sont supprimables; tout historique texte opt-in futur expose sa rétention et sa purge |
| US-08 | Je sais que le MVP ne réalise aucune opération Cloud. | le build MVP n'implémente que des ports sans destination distante et le test réseau bloqué réussit |

## 7. Données et confidentialité

### 7.1 Catégories provisoires

| Catégorie | Besoin MVP | Lieu prévu | Rétention | Statut |
|---|---|---|---|---|
| échantillons audio de la dictée | nécessaire au traitement | buffer borné en mémoire locale par défaut; aucun fichier temporaire implicite | purge à la fin, à l'annulation ou à la révocation; aucun audio persisté par défaut | D-08 confirmée |
| texte ASR brut | nécessaire à la récupération | mémoire; stockage local seulement dans un historique explicitement activé | zero-history par défaut; rétention configurable si opt-in | D-08 confirmée |
| texte final | remise et éventuel historique | local | zero-history par défaut; rétention configurable si opt-in | D-08 confirmée |
| paramètres | nécessaire | stockage local | jusqu'à réinitialisation | proposition |
| dictionnaire | V1 proposée | stockage local | jusqu'à suppression | proposition |
| modèles | nécessaire au local | fichiers locaux vérifiés | jusqu'à suppression | proposition |
| diagnostics techniques | support | local par défaut | durée bornée à décider | proposition/threat model |
| compte et synchronisation | absents du MVP et non requis pour le chemin local | aucune implémentation distante; ports seulement | aucune au MVP | D-09/D-10 confirmées |

### 7.2 Garanties minimales actuelles

- aucune donnée audio ne quitte la machine sans consentement explicite;
- aucun secret, token ou contenu dicté n'est écrit dans les logs;
- aucun accès à l'écran, au texte accessible ou au presse-papiers n'est ajouté sans finalité, permission et threat model;
- une option Cloud, si elle existe, doit être distinguée du traitement local avant l'action;
- les durées de rétention ne seront pas inventées par l'implémentation.

D-08 confirme le zero-history par défaut, l'historique texte local uniquement sur opt-in avec rétention configurable, et l'absence de persistance audio par défaut. La baseline de sécurité impose donc des buffers audio bornés en mémoire locale, leur purge à la fin, à l'annulation ou à la révocation, et aucun fichier temporaire implicite. Toute persistance audio future exige une décision et une conception sécurité distinctes.

## 8. Budgets et méthodes de mesure

[PERFORMANCE-BUDGETS.md](../quality/PERFORMANCE-BUDGETS.md) est l'unique source canonique des valeurs, unités, percentiles, matériels candidats et conditions de qualification. Le PRD ne duplique aucun seuil numérique: toute divergence est résolue en faveur du document QA, dont les cibles restent proposées jusqu'aux prototypes de Phase 02. D-03, D-05 et D-06 fixent respectivement la référence macOS Apple Silicon si disponible avec fallback pratique Windows, le français et le plancher matériel provisoire, mais ne prouvent aucun seuil. [MEASUREMENT-PLAN.md](../quality/MEASUREMENT-PLAN.md) définit les campagnes et artefacts reproductibles.

| Observable produit | Résultat mesurable attendu | Preuve canonique | Statut produit |
|---|---|---|---|
| armement et fin de parole | transitions horodatées par horloge monotone, percentiles publiés pour PTT et comportement du toggle; VAD hors MVP | budgets « Armement PTT », « Fin de parole PTT/VAD » et campagne de latence QA | interaction confirmée; seuils Phase 02 provisoires |
| vitesse ASR locale | RTF par fichier et sous-corpus avec moteur, modèle, quantification et préchargement déclarés | budget « RTF ASR local » et campagne ASR QA | référence/langue/plancher confirmés; résultat à mesurer |
| exactitude brute | WER et CER avec normaliseur, corpus, sous-corpus et intervalle de confiance versionnés | budgets « WER/CER » et campagne d'exactitude QA | persona et français confirmés; corpus/seuils à valider |
| ressources | CPU en cœurs logiques équivalents et RSS du processus avec enfants, mesurés séparément en mode armé, capture et ASR | budgets « CPU » et « Mémoire », série temporelle QA | plancher provisoire confirmé; qualification Phase 02 requise |
| remise du texte | taux par OS, application et capability; succès seulement si le texte exact apparaît une fois dans la bonne cible | budget « Injection réussie » et matrice d'injection QA | ordre OS confirmé; capacités à prouver |
| fallback Wayland | presse-papiers préparé, instruction visible et absence de faux succès, compositor identifié | budget « Fallback Wayland » et campagne dédiée QA | capacité à prouver après macOS, sans universalité promise |
| continuité audio | taux de trames perdues et trou maximal issus de numéros de séquence, sous charge et sur campagne microphone | budget « Perte d'échantillons » et campagne de continuité QA | matériel provisoire confirmé; seuils Phase 02 |
| fiabilité | sessions éligibles, crashs et borne d'intervalle de confiance selon une collecte consentie | budget « Sessions sans crash » et campagne de fault injection QA | dépend du consentement et de la politique de collecte |
| démarrage et modèles | temps chaud/froid jusqu'à `ready`, taille d'artefact et espace temporaire de téléchargement vérifié | budgets « Démarrage » et « Disque des modèles » | référence/plancher confirmés; résultat à mesurer |
| récupération après échec | le texte brut existant reste récupérable sans relancer l'ASR | tests d'injection refusée, cible changée et focus perdu | proposition produit à confirmer |

Chaque résultat doit référencer une campagne QA avec commit, version OS, CPU, RAM, architecture, accélérateur, moteur, modèle, quantification, langue, corpus ou fixture, périphérique audio et profil d'alimentation. Une moyenne isolée ou l'absence d'erreur observée ne constitue pas une preuve.

## 9. Compatibilité et dégradation

La source de vérité détaillée est [PLATFORM-CAPABILITIES.md](PLATFORM-CAPABILITIES.md).

- Windows, macOS, Linux X11 et Linux Wayland sont des environnements distincts;
- une permission absente entraîne une dégradation expliquée, jamais une boucle silencieuse;
- sous Wayland, l'absence d'une voie d'injection autorisée entraîne le fallback presse-papiers et collage utilisateur;
- une accélération indisponible entraîne un moteur/profil compatible ou un diagnostic, sans crash;
- un service Cloud indisponible ne détruit jamais le texte brut déjà produit.

## 10. Critères de sortie du MVP

Le MVP ne peut être déclaré atteint que si:

- la confirmation de D-01 à D-14 reste tracée et sans contradiction dans les livrables;
- le parcours E2E passe sur la plateforme et le matériel de référence nommés;
- les budgets approuvés ont un protocole reproductible et un résultat enregistré;
- la matrice applications/OS documente réussite, dégradation et fallback;
- le threat model et les contrôles de stockage, rétention et suppression sont approuvés;
- la capture audio respecte les contraintes temps réel;
- les erreurs de permission, modèle, microphone, ASR, focus et remise sont récupérables;
- aucune donnée audio n'est envoyée sans consentement explicite;
- les licences du code, des dépendances et des modèles sont compatibles avec D-11 à D-13;
- le retour arrière prévu par [ADR-0001](../architecture/ADR-0001-STACK-CIBLE.md) reste possible jusqu'aux spikes de Phase 02.

## 11. Décisions confirmées et travail restant

| Décisions | Conséquence confirmée | Travail non couvert par la décision |
|---|---|---|
| D-01/D-02 | identité Fluent et persona principal priorisé | vérification marque/domaine et validation des hypothèses d'usage |
| D-03 à D-06 | référence Apple Silicon si disponible, sinon fallback pratique Windows; ordre produit macOS/Linux/Windows; français et plancher provisoire | disponibilité de la machine, activation éventuelle du fallback, versions supportées, corpus et benchmarks Phase 02 |
| D-07 | push-to-talk par défaut, toggle accessible, aucune écoute continue au MVP | fiabilité hotkeys/release, repli UI et tests d'accessibilité |
| D-08 | zero-history par défaut, historique texte opt-in configurable, aucun audio persisté par défaut | schéma, purge, UX et threat model de l'option d'historique |
| D-09/D-10 | chemin local sans compte; Cloud absent du MVP, ports seulement | tests offline et frontières de ports |
| D-11/D-12 | dépôt public et code Apache-2.0 | revue historique, dépendances, modèles, actifs et contributions |
| D-13 | cœur local gratuit; Cloud/sync futurs facultatifs et payants | frontière commerciale, coûts et entitlements futurs |
| D-14 | développement greenfield sans migration WPF | nouvel inventaire et ADR uniquement si une source externe apparaît |
