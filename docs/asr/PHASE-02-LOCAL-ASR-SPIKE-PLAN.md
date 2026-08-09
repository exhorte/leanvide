# PHASE-02 — Plan du spike ASR local whisper.cpp

- Cycle: `CYCLE-20260809-04`
- Responsable: `ai-asr-lead`
- Difficulté: D3 — moteur natif, FFI, concurrence, confidentialité et sélection par benchmark
- Statut: **plan exécutable; aucune implémentation ni mesure produite dans ce cycle**
- Sources primaires vérifiées le: `2026-08-09`
- Portée future: `crates/asr/**`, un harnais de benchmark explicitement attribué et des fixtures vérifiées
- Retour arrière: supprimer l'adaptateur expérimental et ses artefacts; aucun type whisper.cpp ne traverse `TranscriptionEngine`

Ce document prépare le prochain spike. Il n'autorise dans le cycle courant aucun moteur, crate, sous-module, modèle, fixture binaire, téléchargement, manifeste ou lockfile. Les valeurs de [budgets de performance](../quality/PERFORMANCE-BUDGETS.md) restent des **cibles candidates** jusqu'aux campagnes et à la décision du manager; elles ne constituent pas un PASS anticipé.

## 1. Résultat attendu et limites

Le spike suivant doit démontrer, sur des artefacts vérifiables, qu'un adaptateur whisper.cpp peut:

1. charger localement un modèle français admissible;
2. recevoir du PCM en mémoire et rendre un texte ASR brut sans réseau;
3. respecter la frontière de `TranscriptionEngine`, y compris annulation, erreurs, concurrence et backpressure;
4. conserver le texte brut indépendamment de la normalisation déterministe et de toute réécriture générative;
5. publier RTF, WER, CER, latence fin de parole vers texte brut, démarrage, CPU et RAM;
6. comparer CPU et accélérations disponibles sans rendre l'accélération obligatoire;
7. résister aux modèles absents, corrompus, tronqués ou surdimensionnés et aux annulations sous charge;
8. fournir les éléments de décision pour promouvoir, rejeter ou prolonger le candidat.

Le spike ne doit pas:

- introduire une réécriture, un dictionnaire, un profil contextuel, une injection de texte ou une UI;
- inclure VAD, flush audio, injection ou réécriture dans les temps de décodage ASR;
- télécharger quoi que ce soit pendant le build ou une campagne offline;
- exposer un type, pointeur, code d'erreur ou paramètre whisper.cpp dans le domaine;
- persister un audio utilisateur, une transcription utilisateur ou un chemin personnel;
- activer serveur, RPC, URL de modèle, télémétrie ou fallback Cloud;
- évaluer Parakeet ou un second moteur avant d'avoir mesuré une lacune de whisper.cpp;
- traiter un seuil candidat comme une exigence approuvée.

## 2. Frontières fonctionnelles obligatoires

Le contrat normatif de `TranscriptionEngine` appartient aux documents d'architecture de Phase 02. Le spike s'y conforme et ne le redéfinit pas. Les règles suivantes sont des contraintes d'expérience:

```text
PCM finalisé en mémoire
        |
        v
TranscriptionEngine -> RawTranscript immuable ----------------------+
        |                                                           |
        +-> copie -> Normalizer v1 -> texte de score/formatage       |
                                                                    |
        +-> copie -> Rewriter futur -> succès réécrit ou erreur -----+
                                                                    v
                                                    fallback RawTranscript exact
```

### 2.1 Transcription fidèle

- L'entrée architecturale provisoire est un `AudioSegmentLease` finalisé, continu, déplacé vers le moteur, lié à `SessionId`/`Epoch` et portant un format explicite. Le profil candidat du spike est mono `f32`, 16 kHz. La capture peut produire un autre format, mais sa conversion reste hors callback audio et sa durée est mesurée séparément.
- Le moteur est configuré en transcription française, jamais en traduction: langue `fr`, tâche `transcribe` et `translate=false`.
- Avant l'appel, l'adaptateur expose ses capabilities/requirements testables: langues, formats exacts, modèle requis et état `ready/not-ready`; il ne convertit pas silencieusement un format non annoncé.
- Le profil de référence désactive prompt initial, dictionnaire, contexte précédent, VAD interne et toute post-correction.
- Les segments et leur texte sont copiés dans une structure possédée avant de libérer l'état natif. Leur ordre et leurs octets UTF-8 ne sont pas corrigés sémantiquement.
- `raw_text` est la concaténation ordonnée exacte des textes de segments du moteur. Une suppression d'espace, une correction de ponctuation ou une conversion de nombre appartient à une étape distincte.
- Une sortie UTF-8 invalide est une erreur d'adaptateur; elle ne doit pas être remplacée silencieusement par `U+FFFD`.
- Une sortie partielle native pendant un décodage annulé reste un diagnostic interne et n'est jamais publiée comme résultat final ni mélangée à un retry CPU. Le `RawTranscript` atomique n'est publié qu'après succès complet et tant que son `Epoch` est encore courant.
- Les métadonnées de résultat suivent une allowlist technique et ne contiennent aucun extrait. Audio et brut restent volatils: l'audio est purgé en fin/cancel/erreur, le brut après remise ou récupération; aucun historique ASR n'est créé.

### 2.2 Normalisation déterministe

Le normaliseur n'appelle pas le moteur et ne modifie jamais `RawTranscript`. Deux usages restent distincts:

- `eval-fr-v1`: normalisation de référence pour WER/CER, spécifiée en section 7;
- une normalisation produit future: ponctuation, espaces ou substitutions explicites, versionnée et testée séparément.

À entrée, version et options identiques, le résultat et son SHA-256 doivent être identiques sur les trois OS. Toute modification du normaliseur crée une nouvelle baseline; les scores avant/après ne sont pas comparés comme s'ils utilisaient le même oracle.

### 2.3 Réécriture générative

La réécriture est hors spike et hors `TranscriptionEngine`. Une future API reçoit une copie du texte brut et retourne un résultat distinct. Timeout, annulation, sortie vide, validation échouée, indisponibilité ou erreur doivent rendre **exactement** le `RawTranscript` conservé, sans relancer l'ASR. Aucun moteur local ou distant de réécriture n'est activé par ce plan.

## 3. Baseline moteur et modèles

### 3.1 Faits vérifiés dans les sources primaires

| Élément | Version/provenance épinglée | Intégrité connue | Licence déclarée | Lecture pour le spike |
|---|---|---|---|---|
| Moteur | [whisper.cpp v1.9.2](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.2), commit `306c88f4d1286aec1bf96e544632897886af5501` | release GitHub associée à un commit marqué `Verified`; arbre Git à vérifier après acquisition | [MIT](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/LICENSE) | candidat primaire seulement; source hors workspace pendant le spike |
| Poids upstream | OpenAI Whisper | OpenAI publie les URLs/hashes de ses poids; le format GGML est acquis depuis la source ci-dessous | OpenAI déclare [code et poids sous MIT](https://github.com/openai/whisper#license) | fait de licence upstream, pas validation juridique des artefacts convertis |
| Modèles GGML | [ggerganov/whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp/tree/5359861c739e955e79d9a303bcbc70fb988958b1), révision `5359861c739e955e79d9a303bcbc70fb988958b1` | SHA-256 LFS par fichier, tableau ci-dessous | carte du dépôt: MIT | artefacts autorisés pour la comparaison si les digests concordent |

La documentation officielle annonce l'inférence CPU, Metal, Core ML, Vulkan, CUDA, ROCm et OpenVINO, mais ce sont des capacités amont, pas des preuves sur Fluent. Elle indique aussi que l'appel complet sur un même contexte n'est pas thread-safe et expose un callback d'abandon; le spike doit donc mesurer, pas supposer, la sérialisation et l'annulation ([API v1.9.2](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/include/whisper.h)).

### 3.2 Matrice initiale de modèles

Seuls les modèles multilingues sont admissibles pour le français. Les variantes `.en`, modèles fine-tunés, distillés ou communautaires sont hors matrice initiale.

| Profil | Fichier exact | Octets | SHA-256 LFS attendu | Rôle |
|---|---|---:|---|---|
| `base-f16` | `ggml-base.bin` | `147951465` | `60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe` | point bas mémoire/disque |
| `base-q5_1` | `ggml-base-q5_1.bin` | `59707625` | `422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898` | effet de quantification sur coût et précision |
| `small-f16` | `ggml-small.bin` | `487601967` | `1be3a9b2063867b937e64e2ec7483364a79917e157fa98c5d94b5c1fffea987b` | point haut encore sous la cible disque candidate de 600 MiB |
| `small-q5_1` | `ggml-small-q5_1.bin` | `190085487` | `ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb` | compromis précision/ressources candidat |

Ces digests viennent de l'API LFS à la révision épinglée. Le SHA court publié dans le [README des modèles](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/models/README.md) est un SHA-1 et ne remplace pas le SHA-256 du manifeste Fluent.

### 3.3 Décision de licence et supply chain

Faits:

- whisper.cpp et les poids Whisper upstream sont déclarés MIT par leurs mainteneurs;
- le dépôt des conversions GGML se déclare MIT;
- les quatre fichiers candidats ont une révision, une taille et un SHA-256 précis;
- le script officiel `download-ggml-model` utilise la branche mutable `main`, ne vérifie pas le digest et écrit directement le nom final ([script v1.9.2](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/models/download-ggml-model.sh)).

Inférence à faire valider avant distribution:

- MIT est en principe compatible avec le code Apache-2.0 de Fluent si les notices sont conservées;
- la conversion de format paraît conserver la licence des poids, mais cette conclusion n'est pas un avis juridique et exige une revue des notices et de la chaîne de conversion;
- les licences des accélérateurs, SDK, runtimes et wrappers Rust restent séparées et ne sont pas approuvées par la licence du moteur.

Conséquences obligatoires:

1. Ne pas utiliser le script upstream pour une acquisition qualifiante.
2. Épingler URL, révision, taille et SHA-256; télécharger vers `.part`, vérifier, puis renommer atomiquement.
3. Conserver dans le futur manifeste les URL, licences, digests, dates d'accès et notices.
4. Refuser un artefact partiel, trop grand, de type inattendu ou au digest différent; ne jamais tenter de le parser.
5. Lancer un inventaire licence/SBOM du wrapper, de CMake et des backends activés avant leur ajout au workspace.
6. Ne pas empaqueter le modèle dans le dépôt ou le binaire tant que la politique de distribution et les notices ne sont pas approuvées.

## 4. Fixture française et corpus d'évaluation

### 4.1 Fixture de smoke et latence, redistribuable

Source candidate: [« quand le chat n'est pas là, les souris dansent »](https://commons.wikimedia.org/wiki/File:Fr-quand_le_chat_n%27est_pas_l%C3%A0,_les_souris_dansent.ogg), voix masculine de Normandie, 2,9 s.

| Champ | Valeur vérifiée avant acquisition |
|---|---|
| Auteur | Pamputt |
| Licence de l'audio | CC0-1.0, dédicace mondiale incluant droits voisins selon la page du fichier |
| Taille upstream | `65014` octets |
| SHA-1 upstream Wikimedia | `910e0c89c67367465eb5e17e02aadacdb59970c4` |
| Texte de référence | `quand le chat n'est pas là, les souris dansent` |
| URL originale | `https://upload.wikimedia.org/wikipedia/commons/4/4e/Fr-quand_le_chat_n%27est_pas_l%C3%A0%2C_les_souris_dansent.ogg` |

Le SHA-1 upstream et la taille servent à identifier la source, pas à autoriser son chargement. Aucun audio n'est acquis dans ce cycle. Au prochain cycle, l'admission suit cet ordre:

1. relire la page de licence et capturer son URL/permalink;
2. acquérir la source dans une zone de staging hors dépôt;
3. vérifier taille et SHA-1 upstream, puis calculer et consigner un SHA-256 local;
4. décoder avec une version de convertisseur épinglée et enregistrée;
5. convertir en WAV RIFF PCM signé 16 bits, mono, 16 kHz;
6. construire `fr-commons-proverb-10s-v1.wav`: trois répétitions séparées par exactement `8000` échantillons nuls, puis pad nul ou troncature à exactement `160000` échantillons;
7. construire la référence en répétant la phrase trois fois, séparée par `U+0020`;
8. calculer les SHA-256 du WAV, de la référence, de la notice et du manifeste;
9. faire valider la licence et les digests avant tout commit de la fixture au cycle suivant.

Le futur manifeste doit contenir le SHA-256 réellement mesuré. Une valeur placeholder, une taille seule ou le SHA-1 Wikimedia ne suffit pas. La fixture est un smoke test et le scénario de 10 s; elle ne suffit pas à qualifier WER/CER.

### 4.2 Corpus propre WER/CER

Corpus candidat: [Google FLEURS](https://huggingface.co/datasets/google/fleurs) `fr_fr`, CC-BY-4.0, révision immuable `70bb2e84b976b7e960aa89f1c648e09c59f894dd`.

| Split | Rôle | Artefact | Octets | Intégrité upstream |
|---|---|---|---:|---|
| `dev` | comparer modèles, quantifications et paramètres | `data/fr_fr/audio/dev.tar.gz` | `142638560` | SHA-256 `f2f065dec3b02212e27151c51162d2213df55d0a8efc6b88e36992673ddf66e6` |
| `dev` | références | `data/fr_fr/dev.tsv` | `180518` | Git blob `ea5942ff940cc15e6fa8ab75037273e4e0786a26`; calcul SHA-256 obligatoire à l'acquisition |
| `test` | validation finale aveugle du profil retenu | `data/fr_fr/audio/test.tar.gz` | `349036055` | SHA-256 `d23690e102f373554d1b544cd2ff1e76e4fedeb04953c0b72751a1b7c518cfdd` |
| `test` | références | `data/fr_fr/test.tsv` | `456972` | Git blob `9f5c1fd360b1bf9a73924591ede7f13f9edaf9a3`; calcul SHA-256 obligatoire à l'acquisition |

Le harnais utilise `raw_transcription`, puis applique `eval-fr-v1`; il n'utilise pas la transcription déjà normalisée par FLEURS comme oracle caché. L'attribution CC-BY-4.0, la citation FLEURS, la révision et l'indication des transformations accompagnent toute redistribution. Dev sert au choix; test n'est exécuté qu'une fois après gel du profil.

Le corpus est de la parole lue. C'est une limite connue de la [carte officielle](https://huggingface.co/datasets/google/fleurs#other-known-limitations): il ne prouve ni dictée spontanée, ni vocabulaire métier, ni code-switching. Le Gate 05 devra ajouter un corpus MVP représentatif distinct.

### 4.3 Bruit contrôlé

Chaque fichier propre reçoit une dérivée à `10 dB` SNR sans source audio tierce:

- bruit blanc pseudo-aléatoire généré par un algorithme et une seed figés dans le futur normaliseur/harness;
- calcul en `f64`, bruit centré, puis mise à l'échelle par le RMS du signal complet;
- absence de clipping garantie par un gain global commun signal+bruit;
- sortie mono `f32` 16 kHz, SHA-256 inscrite au manifeste;
- algorithme, seed et arrondi testés par vecteurs connus sur les trois OS.

Tant que ces vecteurs et hashes ne sont pas livrés, les résultats « bruit contrôlé » sont non qualifiants. Aucun bruit capturé dans un environnement utilisateur n'est admis.

### 4.4 Alternative écartée

Common Voice Scripted Speech 25.0 annonce CC0, mais les [conditions affichées dans le catalogue Mozilla Data Collective](https://datacollective.mozillafoundation.org/datasets/cmn2avimf019no107bb37vfx8) indiquent aussi « forbidden to re-host or re-share ». Cette restriction opérationnelle contredit le besoin d'une fixture commitée et redistribuable; Common Voice est donc écarté du spike, sauf avis juridique et protocole local-only ultérieurs.

## 5. Choix réversible de l'adaptateur

Le spike emploie deux niveaux de preuve, sans transformer le premier prototype en dépendance irréversible.

### Niveau A — baseline native isolée

- Source whisper.cpp acquise hors workspace au commit exact.
- Build CMake minimal et offline; aucune récupération réseau par CMake.
- Un harnais appelle l'API C depuis un processus de benchmark isolé avec les mêmes PCM et paramètres.
- Ce niveau valide le moteur, les modèles et les profils matériels, pas l'intégration produit.

### Niveau B — adaptateur `crates/asr`

- `WhisperCppEngine` implémente le `TranscriptionEngine` architectural.
- Les types upstream restent dans un module privé; le reste du workspace ne dépend que des types de domaine.
- L'adaptateur reçoit du PCM en mémoire; aucun WAV temporaire et aucun sidecar HTTP.
- Un worker possédant le contexte sérialise les appels. Le MVP accepte un seul segment en vol; une nouvelle soumission concurrente reçoit `Busy`, sans file cachée ni spool. L'état natif n'est jamais utilisé concurremment.
- Le callback d'abandon lit uniquement un drapeau atomique; aucun log, allocation, I/O ou verrou bloquant dans le callback.
- Le mécanisme de bindings n'est choisi qu'après revue de licence, provenance, maintenance, surface `unsafe` et correspondance exacte avec v1.9.2.

Options de binding à comparer avant ajout:

| Option | Avantage | Risque/condition | Décision actuelle |
|---|---|---|---|
| wrapper Rust publié et verrouillé | `unsafe` contenu dans une dépendance; ergonomie | version whisper.cpp potentiellement différente, build script, sous-module transitif et licences à auditer | admissible seulement si la version native exacte et le SBOM sont prouvés |
| couche `sys` Fluent minimale | version/API maîtrisées | déroge à `unsafe_code = "forbid"`; maintenance et audit FFI | exige ADR/exception bornée; pas le défaut silencieux |
| processus CLI | isolation et kill dur | fichier audio/temporaire, coût de process et mesures non représentatives | uniquement oracle de diagnostic sur fixture publique, jamais adaptateur produit |

Le choix provisoire est donc: **baseline native puis adaptateur étroit derrière le trait; aucun wrapper n'est ajouté avant les preuves**. La promotion d'un binding exige que son surcoût RTF/latence soit publié face au niveau A, sans seuil inventé avant mesure.

## 6. Acquisition, build et environnement

### 6.1 Phases réseau séparées

1. `ACQUIRE-ONLINE`: acquisition volontaire des sources, modèles et corpus dans un cache externe, avec licence et digests.
2. `BUILD-OFFLINE`: build depuis ce cache avec réseau bloqué.
3. `RUN-OFFLINE`: toutes les campagnes, fault injections et retries avec réseau bloqué.

Un résultat qui télécharge implicitement au build ou au premier lancement est invalide. Aucun token Hugging Face n'est nécessaire pour les artefacts publics; un harnais qui en demande un est rejeté.

### 6.2 Préflight obligatoire

Le futur `fluent-asr-spike preflight` échoue si un champ manque:

- commit Fluent et worktree propre;
- OS/build, architecture, CPU, cœurs physiques/logiques, RAM, stockage libre;
- alimentation, profil CPU, température/état thermique disponible;
- compilateur C/C++, CMake, Rust et linker;
- moteur commit/tree, options CMake, état dirty;
- modèle URL/révision/taille/SHA-256/licence;
- fixture/corpus URL/révision/taille/SHA-256/licence;
- accélérateur, runtime, pilote et capacité détectée;
- horloge monotone vérifiée;
- réseau bloqué pour les phases offline;
- chemin de cache et chemins personnels exclus des artefacts publiés.

### 6.3 Commandes d'acquisition de référence

Ces commandes sont exécutées uniquement au prochain cycle et dans un répertoire de staging explicite, jamais pendant `cargo build`:

```powershell
$EngineCommit = '306c88f4d1286aec1bf96e544632897886af5501'
$ModelRevision = '5359861c739e955e79d9a303bcbc70fb988958b1'

git clone --filter=blob:none --no-checkout https://github.com/ggml-org/whisper.cpp.git <engine-staging>
git -C <engine-staging> fetch --depth 1 origin $EngineCommit
git -C <engine-staging> checkout --detach $EngineCommit
git -C <engine-staging> rev-parse HEAD
git -C <engine-staging> status --porcelain

curl.exe --fail --location --retry 5 --continue-at - `
  --output <model-staging>.part `
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/$ModelRevision/ggml-base.bin?download=true"
Get-Item -LiteralPath <model-staging>.part | Select-Object -ExpandProperty Length
Get-FileHash -Algorithm SHA256 -LiteralPath <model-staging>.part
```

Le harnais compare taille et digest à la table avant renommage atomique. Une erreur déplace l'artefact en quarantaine bornée pour diagnostic; il n'est ni chargé ni automatiquement promu. Les quatre modèles suivent la même procédure.

### 6.4 Build minimal

Profil CPU de référence, à adapter seulement par un manifeste de build versionné:

```powershell
cmake -S <engine-staging> -B <build-cpu> `
  -DCMAKE_BUILD_TYPE=Release `
  -DBUILD_SHARED_LIBS=OFF `
  -DWHISPER_BUILD_TESTS=OFF `
  -DWHISPER_BUILD_EXAMPLES=OFF `
  -DWHISPER_BUILD_SERVER=OFF `
  -DWHISPER_CURL=OFF `
  -DGGML_RPC=OFF `
  -DGGML_BACKEND_DL=OFF `
  -DGGML_CUDA=OFF `
  -DGGML_HIP=OFF `
  -DGGML_VULKAN=OFF `
  -DGGML_METAL=OFF `
  -DWHISPER_COREML=OFF `
  -DWHISPER_OPENVINO=OFF
cmake --build <build-cpu> --config Release --parallel
```

Chaque accélération part de ce profil et n'active qu'un backend supplémentaire. `WHISPER_CURL=OFF`, `GGML_RPC=OFF` et le serveur désactivé restent invariants.

### 6.5 Matrice matérielle et accélérations

| Matériel | CPU obligatoire | Accélération candidate | Condition | Fallback |
|---|---|---|---|---|
| `HW-MAC` M2 16 Gio si disponible | ARM CPU, Metal désactivé | Metal; Core ML exploratoire seulement après licence/provenance de l'encodeur généré | même commit/modèle/fixture; cold/warm séparés | même modèle sur CPU |
| `HW-LNX` Ryzen 7 7840U 16 Gio | x86 CPU | Vulkan exploratoire si pilote/capability présent | runtime/driver/licence et mémoire GPU consignés | même modèle sur CPU |
| `HW-WIN` i5-1240P 16 Gio | x86 CPU | OpenVINO ou Vulkan exploratoire, un à la fois | runtime/driver/licence et artefact encodeur vérifiés | même modèle sur CPU |
| plancher D-06 réel, 4 cœurs/8 Gio | CPU | aucune exigée | machine physique identifiée; simulation mémoire non qualifiante | CPU est le profil de support |

CUDA/ROCm ne sont testés que si une machine déclarée existe; un GPU dédié ne devient jamais une précondition MVP. L'échec d'initialisation d'une accélération donne un diagnostic et un unique retry CPU local. Un échec pendant le décodage abandonne les sorties partielles, puis peut retenter une fois sur le même PCM si la session n'est pas annulée. Aucun changement silencieux de modèle, de langue ou de fournisseur.

## 7. Paramètres de référence et normalisation `eval-fr-v1`

### 7.1 Décodage

Le profil de reproductibilité fige et publie au minimum:

- `language=fr`, `translate=false`;
- stratégie greedy, `best_of=1`;
- température initiale et incrément à `0`;
- aucun prompt, aucun contexte précédent, aucun dictionnaire;
- VAD interne désactivé;
- timestamps désactivés pour le texte de référence, mais segments conservés si nécessaires aux diagnostics;
- nombre de threads explicite;
- backend et device explicites;
- sorties internes et logs upstream redirigés vers un sink structuré sans texte.

Le harnais lance dix décodages consécutifs par profil sur la fixture et compare SHA-256 des segments/raw text. Toute divergence est publiée; le profil n'est pas qualifié « déterministe ». L'identité entre OS ou entre CPU/GPU n'est pas supposée: elle est une mesure séparée de l'identité intra-profil.

### 7.2 Normaliseur

`eval-fr-v1` applique, dans cet ordre, à la référence et à l'hypothèse:

1. validation UTF-8;
2. Unicode NFC;
3. case-fold Unicode invariant de locale;
4. conversion de `’`, `ʼ` et `ʻ` en apostrophe ASCII `'`;
5. conservation des lettres Unicode, marques combinantes, chiffres décimaux et apostrophes internes;
6. conversion de toute autre ponctuation, symbole, contrôle ou séparateur en espace;
7. suppression d'une apostrophe qui n'est pas entourée de lettres;
8. réduction de toute suite d'espaces à un espace ASCII et trim des bords;
9. tokenisation WER sur l'espace; une contraction comme `n'est` reste un token;
10. chaîne CER égale aux tokens normalisés rejoints par un espace; les espaces comptent comme caractères.

Les accents ne sont pas supprimés. Les nombres ne sont pas développés en mots, les acronymes ne sont pas développés et les traits d'union deviennent des séparateurs. Les cas vides sont explicites: référence vide+hypothèse vide vaut zéro; référence vide+hypothèse non vide est rapportée à part et n'entre pas dans une division artificielle.

Le futur script fournit des vecteurs de test français, son numéro de version et son SHA-256. Une bibliothèque Unicode ou tokenizer supplémentaire requiert version/licence/lockfile au cycle d'implémentation.

### 7.3 WER/CER et intervalles

- Distance de Levenshtein classique, coûts insertion/suppression/substitution égaux à 1.
- Score micro par sous-corpus: somme des éditions / somme des unités de référence.
- Publier aussi éditions et dénominateurs, jamais le pourcentage seul.
- IC 95 % par bootstrap de clips, `10000` réplications, seed `20260809`, méthode percentile; algorithme PRNG/version consignés.
- Publier propre, bruit 10 dB et agrégat pondéré; ne pas laisser l'agrégat masquer un sous-corpus.
- Aucun dictionnaire, normalisation produit ou réécriture dans les scores ASR bruts.

## 8. Campagnes, mesures et artefacts

### 8.1 Contrat de commande à implémenter

Le cycle suivant doit fournir un binaire de harnais dans le lot ASR. Son interface minimale est:

```powershell
cargo run -p fluent-asr --release --bin fluent-asr-bench -- preflight --config <campaign.json>
cargo run -p fluent-asr --release --bin fluent-asr-bench -- smoke --config <campaign.json> --runs 10
cargo run -p fluent-asr --release --bin fluent-asr-bench -- latency --config <campaign.json> --warmups 3 --runs 30
cargo run -p fluent-asr --release --bin fluent-asr-bench -- accuracy --config <campaign.json> --split dev
cargo run -p fluent-asr --release --bin fluent-asr-bench -- resources --config <campaign.json> --duration 300s
cargo run -p fluent-asr --release --bin fluent-asr-bench -- faults --config <campaign.json>
cargo run -p fluent-asr --release --bin fluent-asr-bench -- accuracy --config <frozen-winner.json> --split test
```

Ces commandes sont un contrat cible, pas des commandes disponibles aujourd'hui. Elles doivent refuser de démarrer si modèle, source, corpus, licence ou environnement ne correspond pas au manifeste.

### 8.2 Définitions de mesure

| Mesure | Début | Fin | Inclusion/exclusion |
|---|---|---|---|
| RTF steady-state | entrée du PCM finalisé dans le worker | transcription native complète copiée | `decode wall / audio seconds`; modèle préchargé; conversion, VAD, injection, réécriture exclus |
| fin de parole -> brut | `t_capture_closed`, après dernier échantillon accepté | `RawTranscript` possédé et récupérable | inclut conversion/copie de handoff et dispatch worker d'un appel accepté; VAD/flush avant le début, refus `Busy`, injection et réécriture rapportés séparément |
| VAD exploratoire | fin du silence configuré | segment final remis à ASR | rapport séparé avec fenêtre de silence; hors MVP |
| chargement modèle | début de vérification/initialisation | worker `ready` | publier `integrity_ms` et `native_init_ms` séparément |
| démarrage froid | processus lancé, cache froid selon protocole | worker ASR prêt | 30 essais; protocole de froid et incertitude publiés |
| démarrage chaud | processus lancé après chauffe OS | worker ASR prêt | 3 chauffes + 30 essais |
| annulation | demande d'annulation observée | worker arrêté et buffers rendus/purgés | publier p50/p95 et phase d'annulation |
| CPU | échantillon monotone toutes les 100 ms | fin de phase | temps CPU / temps mur, en cœurs logiques équivalents |
| RAM | même série | fin de phase | RSS processus + enfants; steady p95 et peak séparés |

La latence fin de parole vers texte brut utilise la fixture exacte de 10 s, 3 chauffes puis 30 répétitions indépendantes. Elle est publiée chaude et, si le chargement paresseux est retenu, froide. Le flush PTT et le VAD gardent leurs propres horodatages; aucune soustraction reconstruite depuis deux horloges non calibrées.

### 8.3 Répétitions et percentiles

- 3 chauffes non comptées, puis 30 runs valides pour latence, démarrage et annulation.
- RTF: tous les fichiers du split dev/test, au moins une fois par profil; les échecs restent dans le dénominateur des essais et sont listés.
- CPU/RSS: série de 5 minutes par mode `loaded-idle` et `decode-loop`; période d'échantillonnage 100 ms.
- Percentiles p50/p95/p99 par méthode R-7, identifiée dans `summary.json`.
- Publier médiane, percentile, min/max et nombre valide/invalide; aucune moyenne seule.
- Un essai interrompu n'est pas supprimé: cause, phase et code sont consignés sans contenu audio/texte.
- Comparer uniquement commit, modèle, paramètres, corpus et conditions matériels identiques.

### 8.4 Artefacts

Chaque campagne produit la structure canonique du [plan de mesure](../quality/MEASUREMENT-PLAN.md):

```text
artifacts/quality/<run-id>/
  manifest.json
  command.txt
  environment.json
  raw.ndjson
  summary.json
  stdout.txt
  stderr.txt
  checksums.sha256
  licenses/
  transcripts-fixture-public/
```

`manifest.json` ajoute moteur commit/tree, options CMake, compiler/linker, wrapper/SBOM, modèle URL/révision/digest/taille/licence, fixture/corpus digests/licences, paramètres de décodage, normaliseur hash, backend/device/threads, politique réseau et timestamps monotoniques.

Seuls les textes des fixtures publiques correctement licenciées vont dans `transcripts-fixture-public/`. `stdout`, `stderr` et `raw.ndjson` contiennent IDs de fixture, compteurs, durées et codes allowlist, jamais audio, texte utilisateur, chemin personnel ou transcript utilisateur. Tous les fichiers d'artefact sont couverts par `checksums.sha256`.

## 9. Erreurs, annulation et backpressure

### 9.1 Taxonomie observable

Le contrat architectural doit pouvoir distinguer, sans texte libre upstream:

- modèle absent, digest invalide, format/version incompatible, taille dépassée, accès refusé;
- chargement ou allocation échoué;
- audio vide, non fini, format/durée invalide;
- langue ou option non supportée;
- accélération indisponible et fallback CPU échoué;
- moteur occupé (`Busy`), sans mise en file ni copie supplémentaire;
- annulation avant remise du lease, pendant chargement ou pendant decode;
- timeout;
- erreur native/panic isolée;
- résultat UTF-8 invalide ou sortie vide inattendue.

La taxonomie de domaine provisoire est `NotReady`, `ModelMissingOrInvalid`, `UnsupportedFormat`, `ResourceExhausted`, `DecodeFailed`, `Cancelled`, `Timeout` ou `Internal`; `Busy` est le refus de concurrence. Les cas détaillés ci-dessus s'y mappent sans exposer la cause native. Chaque erreur possède code stable, phase, réessayabilité et `messageKey` expurgé. Les logs ne contiennent ni chemin absolu, ni texte, ni audio, ni message natif non filtré.

### 9.2 Annulation

Scénarios obligatoires, 30 répétitions chacun:

1. annulation avant remise du lease;
2. annulation juste après remise du lease;
3. annulation pendant vérification du modèle;
4. annulation pendant encoder;
5. annulation pendant decoder;
6. annulation simultanée à la fin de decode;
7. annulation pendant fallback accélération -> CPU.

L'annulation est idempotente. Le callback natif ne fait qu'un load atomique du `CancelToken`. Le worker rend `Cancelled`, purge l'audio et redevient utilisable pour le job suivant. Indépendamment de la capacité du backend à s'interrompre, le core invalide par `Epoch` toute complétion tardive: aucun succès tardif n'est observable. La latence d'annulation reste une mesure candidate tant que le callback et les backends n'ont pas été caractérisés.

### 9.3 Backpressure et concurrence

Configuration alignée sur le contrat provisoire: un seul segment en vol, capacité logique `Q-ASR=1`, sans slot d'attente et sans spool. Toute soumission concurrente:

- retourne immédiatement `Busy`;
- ne copie pas l'audio;
- n'écrase ni ne laisse tomber un job silencieusement;
- ne crée pas de file, thread ou contexte supplémentaire;
- incrémente un compteur technique sans identifiant utilisateur.

Campagnes:

- burst de 10 jobs sur fixture;
- producteur plus rapide que le decode pendant 5 minutes, avec tous les refus `Busy` comptés;
- alternance cancel/submit sur 1000 opérations;
- deux appels concurrents visant le même contexte: exactement un est accepté et l'autre reçoit `Busy` avant l'API native;
- récupération après erreur de modèle et après fallback CPU.

Oracles: mémoire bornée, refus immédiat et déterministe tant que le moteur est occupé, aucune duplication, aucun deadlock, aucun succès après cancel ou changement d'epoch, contexte sain pour le job suivant.

## 10. Fault injection et zéro egress

### 10.1 Modèles et fichiers

Produire uniquement dans un répertoire temporaire borné des copies de test:

- fichier absent;
- digest faux par flip d'un octet;
- troncature à 0 %, 1 %, 50 % et taille-1;
- append jusqu'à dépasser la taille allowlist;
- magic/version incompatibles;
- fichier illisible;
- `.part` interrompu puis reprise;
- espace libre insuffisant simulé par le gestionnaire;
- renommage atomique échoué;
- modèle révoqué dans un manifeste local.

Aucune copie corrompue n'est transmise au parseur avant validation de taille/digest. Pour les formats malformes au bon digest, utiliser uniquement un artefact synthétique allowlisté et exécuter le parseur dans le périmètre d'isolation décidé avec Security.

### 10.2 Audio et runtime

- zéro échantillon, silence, NaN/Inf, amplitude hors plage, durée limite et dépassement;
- allocation refusée/pression mémoire;
- accélérateur absent, device perdu et init échouée;
- fermeture du worker et relance;
- callback d'annulation très fréquent;
- log upstream contenant un canari synthétique, qui doit être supprimé avant le sink.

### 10.3 Preuve zéro egress

La preuve combine:

1. build avec `WHISPER_CURL=OFF`, `GGML_RPC=OFF`, serveur et backend dynamique désactivés;
2. source et dépendances acquises avant le test;
3. réseau OS désactivé ou namespace/firewall bloquant documenté;
4. capture réseau par processus/interface pendant préflight, chargement, 30 transcriptions, erreurs et retry;
5. test canari vérifiant l'absence d'audio, texte et modèle dans les logs;
6. succès complet sans compte, token, DNS ni endpoint accessible.

Verdict attendu: zéro connexion initiée par le harnais/adaptateur et zéro octet applicatif C2-C4 sortant. Une tentative bloquée est déjà un échec du contrôle, pas un PASS parce que le firewall l'a empêchée. Les checks de modèle/updater ne sont pas lancés dans `RUN-OFFLINE`.

## 11. Analyse et décision

### 11.1 Cibles à comparer, sans les approuver

Le rapport affiche l'écart aux cibles candidates actuelles:

- fin de parole -> texte brut sur 10 s: p50 `<= 1,0 s`, p95 `<= 2,5 s`;
- RTF ASR local p95 `<= 1,00`;
- WER propre `<= 12 %`, bruit contrôlé `<= 20 %`;
- CER propre `<= 5 %`, bruit contrôlé `<= 10 %`;
- CPU ASR p95 `<= 1,50` cœur logique équivalent;
- RAM ASR p95 `<= 1,5 GiB`;
- modèle par défaut `<= 600 MiB`.

Ces nombres restent étiquetés `candidate_target`; le rapport ne produit pas `PASS_GATE` tant que la baseline, le matériel et les seuils ne sont pas approuvés.

### 11.2 Conditions de promotion d'un profil

Un profil peut être recommandé au manager seulement si:

- moteur, wrapper, modèle, corpus et accélérateur ont licence/provenance/SBOM sans inconnu bloquant;
- toutes les tailles/digests correspondent et l'acquisition/reprise/atomicité sont prouvées;
- CPU fonctionne sur la référence et sur le plancher réel identifié; l'accélération reste facultative;
- zéro egress, aucune persistance audio utilisateur et logs minimisés sont prouvés;
- raw text, normalisation et réécriture sont séparés; le fallback brut exact passe;
- déterminisme intra-profil, annulation, backpressure et récupération passent sans race, deadlock ou succès tardif;
- campagnes dev complètes et test final aveugle sont recalculables;
- RTF/WER/CER/latence/RSS/CPU/démarrage sont publiés avec percentiles et IC applicables;
- l'écart aux cibles candidates est soumis explicitement à validation, pas masqué.

Si plusieurs profils remplissent ces invariants, retenir le front de Pareto exactitude/latence/RAM/disque. À exactitude admissible comparable, préférer le profil le plus petit et le CPU le plus prévisible. Une accélération ne change pas le modèle par défaut sans mesure du fallback CPU.

### 11.3 Rejet immédiat

Rejeter le profil, sans l'optimiser silencieusement, si:

- licence ou droit de redistribution reste inconnu/incompatible;
- source/révision/digest n'est pas vérifiable;
- moteur ou build exige le réseau à runtime;
- un modèle corrompu est chargé, un egress est tenté ou du contenu apparaît dans les logs;
- le chemin CPU n'existe pas sur le matériel minimal;
- annulation/backpressure produit fuite, deadlock, usage non borné ou succès tardif;
- texte brut disponible est perdu, modifié par normalisation/réécriture ou remplacé lors d'un fallback;
- les artefacts ne permettent pas de recalculer les résultats;
- le binding exige une exception `unsafe` non approuvée ou expose l'ABI upstream au domaine.

Un dépassement d'une cible numérique candidate donne `NEEDS_DECISION`, pas un verdict falsifié. Il devient rejet automatique uniquement après approbation du seuil correspondant ou si la machine ne peut physiquement exécuter le profil sans crash/épuisement.

### 11.4 Condition pour examiner un autre moteur

Un second moteur, y compris Parakeet, ne peut être proposé qu'avec:

1. une lacune whisper.cpp mesurée et reproductible;
2. le même corpus, normaliseur, matériel et artefacts;
3. licence du code, des poids et des données d'entraînement/distribution;
4. provenance, digests, SBOM et stratégie de mise à jour/retrait;
5. matrice CPU/accélérateurs et fallback sur D-06;
6. implémentation derrière `TranscriptionEngine`, sans modification frontend;
7. ADR si le packaging, l'ABI ou la frontière de confiance change.

## 12. Livrables du prochain spike et gate

Livrables attendus, sous ownership attribué au prochain cycle:

- adaptateur expérimental `crates/asr` et tests de contrat;
- harnais `fluent-asr-bench`;
- manifestes sources/modèles/corpus et notices;
- fixture CC0 dérivée avec SHA-256 réel;
- corpus FLEURS dev/test préparé et attribué;
- profils CPU et accélérés;
- campagnes complètes sous `artifacts/quality/<run-id>/`;
- rapport de baseline faits/inférences/décisions;
- revue sécurité/licence indépendante;
- décision `PROMOTE`, `REJECT` ou `EXTEND`, avec rollback.

Le spike est incomplet si un seul chiffre est publié sans commande, environnement, sortie brute et checksums. Il ne ferme ni Gate 02 ni Gate 05 à lui seul.

## 13. Décisions ouvertes à l'issue de ce plan

| ID | Décision | Donnée requise | Autorité |
|---|---|---|---|
| ASR-O1 | disponibilité réelle de `HW-MAC` et d'une machine D-06 8 Gio | inventaire matériel daté | project-manager |
| ASR-O2 | binding Rust et éventuelle exception `unsafe` | audit wrapper/sys, version whisper.cpp, SBOM, benchmark niveau A/B | product-architect + security + ai-asr |
| ASR-O3 | modèle/quantification par défaut | dev/test WER/CER, RTF, RSS, disque et latence | project-manager après QA |
| ASR-O4 | accélération par OS | gain, démarrage, stabilité, licence/runtime et fallback CPU | platform + ai-asr + security |
| ASR-O5 | approbation des seuils candidats | baseline sur matériel déclaré et impact produit | project-manager + utilisateur si D-06 change |
| ASR-O6 | corpus MVP spontané/métier/code-switching | licence, consentement, représentativité et splits | product + ai-asr + security |
| ASR-O7 | signature/catalogue/révocation des modèles | design gestionnaire et clés, hors spike minimal | product-architect + security |

## 14. Sources primaires consultées

- [Release whisper.cpp v1.9.2](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.2)
- [Licence whisper.cpp v1.9.2](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/LICENSE)
- [README et backends whisper.cpp](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/README.md)
- [API C whisper.cpp v1.9.2](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/include/whisper.h)
- [Options CMake v1.9.2](https://github.com/ggml-org/whisper.cpp/blob/v1.9.2/CMakeLists.txt)
- [Dépôt de modèles GGML épinglé](https://huggingface.co/ggerganov/whisper.cpp/tree/5359861c739e955e79d9a303bcbc70fb988958b1)
- [Licence du code et des poids OpenAI Whisper](https://github.com/openai/whisper#license)
- [Fixture audio Wikimedia CC0](https://commons.wikimedia.org/wiki/File:Fr-quand_le_chat_n%27est_pas_l%C3%A0,_les_souris_dansent.ogg)
- [FLEURS officiel, licence et limites](https://huggingface.co/datasets/google/fleurs)
- [FLEURS `fr_fr` épinglé](https://huggingface.co/datasets/google/fleurs/tree/70bb2e84b976b7e960aa89f1c648e09c59f894dd/data/fr_fr)
