# PRD — MVP de Fluent

Statut: **brouillon de décision**

Cycle: `CYCLE-20260809-01`

Phase: `PHASE-00`

Référence de vision: [VISION.md](VISION.md)

## 1. Objet

Ce PRD décrit un MVP candidat de dictée vocale desktop. Il sépare:

- les contraintes déjà normatives dans le dépôt;
- les hypothèses à valider;
- les propositions de périmètre;
- les décisions utilisateur encore ouvertes.

Il ne doit pas être interprété comme une confirmation silencieuse des décisions D-01 à D-14 de la [vision](VISION.md#6-registre-des-14-décisions-produit).

## 2. Résultat utilisateur candidat

Sur une plateforme et un matériel de référence encore à choisir, un utilisateur peut déclencher une dictée, parler, arrêter la capture, obtenir un texte local et le remettre à l'application cible. Chaque échec laisse le texte récupérable et indique une action de repli.

## 3. Hypothèses de produit

| ID | Hypothèse | Méthode de validation | Critère de décision |
|---|---|---|---|
| H-01 | la dictée fréquente sur desktop justifie un raccourci global | entretiens et observation de tâches | segment et fréquence minimale décidés avec D-02 |
| H-02 | un chemin local est une valeur différenciante | test de proposition de valeur | préférence nette du segment et tolérance mesurée au compromis précision/ressources |
| H-03 | le push-to-talk réduit les captures accidentelles | test comparatif push-to-talk/toggle | erreurs, abandon et charge perçue acceptables |
| H-04 | l'injection automatique couvre assez d'applications | matrice d'applications et d'OS | taux de succès conforme au budget retenu; fallback compris |
| H-05 | le texte brut réduit le coût d'un échec de réécriture | test de récupération | aucun texte déjà transcrit perdu dans les scénarios d'échec |
| H-06 | un widget visible augmente la confiance sans gêner | test UX et accessibilité | états compris; gêne, focus et lecture d'écran acceptables |
| H-07 | le matériel minimal peut exécuter un modèle local utile | benchmark reproductible | RTF, latence et mémoire sous les seuils finalement approuvés |

Toutes ces hypothèses restent ouvertes.

## 4. Périmètre MVP proposé

### 4.1 Inclus, sous réserve de validation

| ID | Capacité | Exigence candidate | Statut |
|---|---|---|---|
| FR-001 | déclenchement | démarrer et arrêter une dictée via un contrôle explicite; push-to-talk proposé | D-07 ouverte |
| FR-002 | capture | sélectionner un microphone et capturer sans I/O, log synchrone, allocation évitable ni verrou bloquant dans le callback | contrainte technique confirmée; UX ouverte |
| FR-003 | état visible | rendre perceptibles `prêt`, `écoute`, `traitement`, `succès`, `fallback` et `erreur` | proposition à valider |
| FR-004 | transcription | produire un texte avec un moteur local derrière une interface interchangeable | proposition cohérente avec la stack cible; critères ASR ouverts |
| FR-005 | résultat brut | conserver en mémoire le texte ASR brut jusqu'à remise réussie ou copie explicite | proposition à confirmer |
| FR-006 | remise | tenter la méthode autorisée sur l'environnement puis offrir un fallback presse-papiers explicite | proposition; capacités exactes à prouver par OS |
| FR-007 | récupération | afficher ou copier le texte si l'injection échoue, sans relancer l'ASR | proposition à confirmer |
| FR-008 | configuration | gérer localement microphone, raccourci, modèle, langue et comportement de remise | proposition; options dépendent de D-05 à D-08 |
| FR-009 | permissions | expliquer le besoin d'une permission au moment utile et diagnostiquer un refus | exigence candidate forte |
| FR-010 | diagnostics | exposer versions, capacités et erreurs techniques sans audio ni contenu dicté par défaut | proposition soumise au threat model |
| FR-011 | fonctionnement déconnecté | si le chemin local est confirmé, le cœur de dictée fonctionne sans authentification ni réseau | D-09 et D-10 ouvertes |
| FR-012 | gestion du modèle | téléchargement, validation d'intégrité, reprise et suppression contrôlée du modèle local | proposition; licence et source du modèle à valider |

### 4.2 V1 proposée

- dictionnaire personnel et substitutions déterministes;
- profils de formatage par application;
- historique textuel local selon D-08;
- moteurs ASR ou accélérateurs additionnels derrière les contrats stables;
- réécriture optionnelle avec aperçu/diff et retour au texte brut;
- couverture des plateformes non retenues comme référence;
- mise à jour signée et gestion de compatibilité des modèles;
- compte, synchronisation ou fonctions Cloud uniquement selon D-09 et D-10.

### 4.3 Ultérieur

- collaboration et fonctions d'organisation;
- politiques administrateur, SSO et SCIM;
- mobile;
- contexte enrichi par accessibilité ou OCR;
- personnalisation ou apprentissage à partir des corrections;
- backend analytique spécialisé après preuve de volume.

### 4.4 Non-objectifs du MVP

- écoute continue tant que D-07 ne l'autorise pas;
- historique audio implicite;
- Cloud requis pour le chemin principal;
- injection universelle garantie;
- lecture silencieuse du contenu de l'application active;
- OCR d'écran;
- synchronisation multi-appareils;
- facturation et gestion d'organisation;
- prise en charge de toutes les langues ou de tout matériel;
- parité fonctionnelle immédiate sur trois OS;
- migration WPF tant que D-14 n'établit pas la source à migrer.

## 5. Parcours principal candidat

1. L'utilisateur configure une langue, un microphone, un modèle et un contrôle de capture.
2. L'application vérifie les capacités et permissions nécessaires, sans activer le microphone en arrière-plan.
3. L'utilisateur place le curseur dans une application cible puis déclenche la capture.
4. Le widget signale visiblement l'écoute; le pipeline enregistre les échantillons nécessaires à la dictée en cours.
5. L'utilisateur arrête la capture; le widget signale le traitement.
6. Le moteur produit un texte brut.
7. Fluent tente la remise autorisée pour l'environnement et confirme son résultat.
8. Si la remise ne peut être confirmée, Fluent préserve le texte et propose de le copier ou de le récupérer.
9. Les buffers audio de la dictée sont détruits selon la politique D-08 à confirmer.

### États candidats

```text
IDLE -> ARMING -> LISTENING -> PROCESSING -> DELIVERING -> SUCCESS
  ^         |          |             |             |
  |         +----------+-------------+-------------+-> RECOVERABLE_ERROR
  |                                                        |
  +--------------------------------------------------------+
```

Les transitions, timeouts et contrats IPC seront figés en Phase 02. `RECOVERABLE_ERROR` doit conserver le texte disponible lorsqu'il existe.

## 6. User stories MVP proposées

| ID | User story | Critère d'acceptation candidat |
|---|---|---|
| US-01 | En tant qu'utilisateur, je déclenche la capture sans quitter mon application. | le contrôle fonctionne sur l'environnement de référence et un état perceptible apparaît dans le budget d'armement retenu |
| US-02 | Je vois sans ambiguïté si le microphone écoute ou si le texte est en traitement. | chaque état est distinguable visuellement et par technologie d'assistance selon le parcours testé |
| US-03 | Je dicte sans réseau lorsque le mode local est choisi. | le test E2E passe avec réseau bloqué et sans compte, si D-09/D-10 confirment ce comportement |
| US-04 | Je récupère ma transcription même si l'application cible refuse l'insertion. | le texte brut reste copiable; aucune nouvelle transcription n'est nécessaire |
| US-05 | Je comprends pourquoi une permission est demandée ou refusée. | la vue de diagnostic nomme capacité, état et action; elle ne prétend pas contourner l'OS |
| US-06 | Je peux changer de microphone ou de modèle. | la configuration persiste localement et les erreurs de ressource sont récupérables |
| US-07 | Je peux effacer les données que Fluent conserve. | l'interface reflète la politique D-08 et la suppression est vérifiée par un test de stockage |
| US-08 | Je sais avant toute opération distante quelles données vont quitter la machine. | consentement spécifique, destination/catégorie et annulation sont présentés avant l'envoi |

## 7. Données et confidentialité

### 7.1 Catégories provisoires

| Catégorie | Besoin MVP candidat | Lieu candidat | Rétention | Statut |
|---|---|---|---|---|
| échantillons audio de la dictée | nécessaire au traitement | mémoire ou fichier temporaire local strictement borné | destruction après traitement proposée | D-08 ouverte |
| texte ASR brut | nécessaire à la récupération | mémoire, puis stockage seulement si historique confirmé | à décider | D-08 ouverte |
| texte final | remise et éventuel historique | local | à décider | D-08 ouverte |
| paramètres | nécessaire | stockage local | jusqu'à réinitialisation | proposition |
| dictionnaire | V1 proposée | stockage local | jusqu'à suppression | proposition |
| modèles | nécessaire au local | fichiers locaux vérifiés | jusqu'à suppression | proposition |
| diagnostics techniques | support | local par défaut | durée bornée à décider | proposition/threat model |
| compte et synchronisation | non requis par le MVP candidat | absent ou Cloud opt-in | à décider | D-09/D-10 ouvertes |

### 7.2 Garanties minimales actuelles

- aucune donnée audio ne quitte la machine sans consentement explicite;
- aucun secret, token ou contenu dicté n'est écrit dans les logs;
- aucun accès à l'écran, au texte accessible ou au presse-papiers n'est ajouté sans finalité, permission et threat model;
- une option Cloud, si elle existe, doit être distinguée du traitement local avant l'action;
- les durées de rétention ne seront pas inventées par l'implémentation.

La proposition « aucune rétention audio » reste à confirmer dans D-08, malgré sa cohérence avec la minimisation.

## 8. Budgets et méthodes de mesure

Les chiffres ci-dessous sont des **seuils candidats**, pas des engagements. Ils ne peuvent être validés qu'après D-03, D-05 et D-06.

| Métrique | Définition | Seuil candidat | Méthode proposée | Statut |
|---|---|---:|---|---|
| temps d'armement | événement de contrôle -> premier buffer accepté | p95 <= 100 ms | 100 activations à froid/chaud, horloge monotone | ouvert |
| latence fin-de-parole | dernier échantillon utile -> texte brut disponible | p50 <= 1,0 s; p95 <= 2,5 s pour 10 s de parole | corpus fixe, modèle/langue/matériel nommés | ouvert |
| RTF | durée de calcul ASR / durée audio | p95 <= 1,0 | corpus d'au moins 30 min par profil matériel | ouvert |
| WER | `(S + D + I) / N` après normalisation publiée | cible à fixer après baseline | corpus versionné et revue des règles de normalisation | ouvert; aucune valeur arbitraire |
| mémoire au repos | RSS après stabilisation | <= 200 Mio hors modèle chargé | mesure OS sur 30 min | ouvert |
| mémoire active | pic RSS pendant ASR | cible par modèle à fixer | scénarios courts/longs, sans swap | ouvert |
| CPU au repos | utilisation processus | p95 <= 2 % d'un cœur logique | fenêtre de 30 min sans capture | ouvert |
| crash-free sessions | sessions sans arrêt inattendu | >= 99,5 % en bêta | télémétrie opt-in ou journaux locaux agrégés | ouvert et dépend du consentement |
| remise réussie | texte confirmé dans la cible / tentatives compatibles | >= 95 % sur matrice de référence | harness par application et OS | ouvert |
| récupération | résultat copiable après échec de remise | 100 % des cas où un texte brut existe | tests d'injection refusée/focus perdu | proposition forte |
| perte audio | échantillons manquants dans le pipeline | 0 perte due à un blocage du callback dans le test nominal; taux sous stress à fixer | compteurs hors callback et stress test | ouvert |

Les mesures doivent publier version OS, CPU, RAM, architecture, accélérateur, moteur, modèle, langue, durée audio, build et état thermique. Une moyenne seule ne suffit pas; p50/p95 et échecs sont conservés.

## 9. Compatibilité et dégradation

La source de vérité détaillée est [PLATFORM-CAPABILITIES.md](PLATFORM-CAPABILITIES.md).

- Windows, macOS, Linux X11 et Linux Wayland sont des environnements distincts;
- une permission absente entraîne une dégradation expliquée, jamais une boucle silencieuse;
- sous Wayland, l'absence d'une voie d'injection autorisée entraîne le fallback presse-papiers et collage utilisateur;
- une accélération indisponible entraîne un moteur/profil compatible ou un diagnostic, sans crash;
- un service Cloud indisponible ne détruit jamais le texte brut déjà produit.

## 10. Critères de sortie du MVP candidat

Le MVP ne peut être déclaré atteint que si:

- D-01 à D-10 sont explicitement tranchées pour le périmètre produit; D-11 à D-14 le sont avant publication/licence/migration;
- le parcours E2E passe sur la plateforme et le matériel de référence nommés;
- les budgets approuvés ont un protocole reproductible et un résultat enregistré;
- la matrice applications/OS documente réussite, dégradation et fallback;
- le threat model et la politique de rétention sont approuvés;
- la capture audio respecte les contraintes temps réel;
- les erreurs de permission, modèle, microphone, ASR, focus et remise sont récupérables;
- aucune donnée audio n'est envoyée sans consentement explicite;
- les licences du code, des dépendances et des modèles sont compatibles avec D-11 à D-13;
- le retour arrière prévu par [ADR-0001](../architecture/ADR-0001-STACK-CIBLE.md) reste possible jusqu'aux spikes de Phase 02.

## 11. Décisions bloquantes

| Décisions | Ce qu'elles bloquent |
|---|---|
| D-01 | identité, packaging et communication |
| D-02 | priorisation des parcours et critères d'utilité |
| D-03 à D-06 | benchmarks, définition de support et ordre d'implémentation |
| D-07 | modèle d'interaction, hotkeys, états et consommation |
| D-08 | schéma de stockage, suppression, UI d'historique et threat model |
| D-09/D-10 | auth, fonctionnement offline, backend et consentements |
| D-11/D-12 | contributions, distribution et conformité des dépendances |
| D-13 | entitlement, coûts Cloud et analytics nécessaires |
| D-14 | stratégie greenfield ou migration, inventaire et rollback |
