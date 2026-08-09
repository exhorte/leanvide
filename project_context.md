fais une recherche sur wisprflow, quel est ca stack

## Stack technique de Wispr Flow — état public au 2 août 2026

Wispr ne publie pas son dépôt ni un diagramme complet d’architecture. Sa stack peut toutefois être reconstruite avec une assez bonne précision à partir de ses offres d’emploi, de sa documentation de sécurité et de l’analyse technique de ses applications.

### Vue d’ensemble

```text
Applications desktop et mobiles
        ↓
Capture audio + contexte de l’application active
        ↓
Streaming sécurisé vers le Cloud
        ↓
ASR personnalisé
        ↓
Post-traitement par LLM
        ↓
Texte structuré
        ↓
Injection dans l’application active
```

Wispr Flow est donc principalement un produit **cloud-first**, contrairement à Fluent qui est actuellement **local-first**.

---

## 1. Applications desktop

### Interface principale

La stack publique de l’interface produit comprend :

- React
- TypeScript
- SCSS Modules
- Storybook
- Motion
- Lottie
- Lucide
- Figma pour le design

Cette liste est explicitement fournie dans une offre actuelle de Design Engineer chez Wispr. ([Ashby Jobs][1])

### Windows et macOS

La documentation officielle parle d’applications « natives » pour Windows et macOS, sans préciser leur framework exact. ([Wispr Flow Help Center][2])

Une analyse indépendante du bundle distribué fournit cependant une architecture beaucoup plus précise :

```text
Application Electron
        │
        ├── interface React / TypeScript
        │
        └── processus auxiliaire natif
              ├── C# sur Windows
              └── Swift sur macOS
```

Un projet de rétro-ingénierie clean-room indique avoir récupéré le contrat IPC directement depuis le bundle Electron livré et décrit les helpers C# Windows et Swift macOS. Il documente également les commandes de collage, détection de fenêtre active, simulation clavier et lecture du texte sélectionné. Cette information est techniquement solide, mais elle n’est pas une déclaration officielle de Wispr. ([GitHub][3])

### Architecture probable du client Windows

```text
Electron main process
        ↓ IPC
Helper Windows en C#
        ├── détection de l’application active
        ├── surveillance du focus
        ├── raccourcis clavier
        ├── presse-papiers
        ├── simulation Ctrl+V
        ├── récupération du texte sélectionné
        └── intégration d’accessibilité Windows
```

Le programme est actuellement distribué sous forme d’installateur Windows x64, avec prise en charge de Windows 10 et Windows 11. ([Wispr Flow Help Center][4])

---

## 2. Backend principal

La stack backend la plus clairement documentée est :

| Couche                     | Technologies              |
| -------------------------- | ------------------------- |
| Langage                    | Python                    |
| API                        | FastAPI                   |
| Base transactionnelle      | PostgreSQL                |
| Cache et état rapide       | Redis                     |
| Analytics à grande échelle | ClickHouse                |
| Workflows asynchrones      | Temporal et Amazon SQS    |
| Communication interne      | gRPC                      |
| Cloud                      | AWS                       |
| Exécution des services     | AWS Fargate               |
| Load balancing             | Application Load Balancer |
| Infrastructure as Code     | Terraform                 |

Cette stack apparaît explicitement dans l’offre Staff Platform Engineer de Wispr Flow. ([Ashby Jobs][5])

### Architecture backend probable

```text
Client Flow
    ↓ TLS
AWS Application Load Balancer
    ↓
Services Python / FastAPI sur Fargate
    ├── Authentification
    ├── API utilisateur
    ├── Streaming audio
    ├── Orchestration ASR
    ├── Orchestration LLM
    ├── Dictionnaires
    ├── Snippets
    └── Synchronisation
          │
          ├── PostgreSQL
          ├── Redis
          ├── ClickHouse
          ├── Temporal
          └── SQS
```

Temporal et SQS servent vraisemblablement aux traitements qui ne doivent pas bloquer le chemin critique de transcription : synchronisation, analytics, facturation, tâches de fond, réessais ou pipelines de données. Il s’agit ici d’une inférence fondée sur leur stack publiée.

---

## 3. Intelligence artificielle

Wispr dit développer :

- ses propres modèles ASR ;
- des modèles sensibles au contexte ;
- de la personnalisation par utilisateur ;
- du code-switching multilingue ;
- des LLM de formatage personnalisé ;
- un contrôle du formatage au niveau des tokens ;
- un apprentissage à partir des corrections de l’utilisateur. ([Wispr Flow][6])

### Pipeline IA

```text
Audio
  ↓
ASR contextuel
  ↓
Transcription brute
  ↓
LLM de compréhension et de formatage
  ├── suppression des hésitations
  ├── corrections orales
  ├── ponctuation
  ├── mise en paragraphes
  ├── adaptation au style
  └── prise en compte du contexte
  ↓
Texte final
```

Wispr explique viser approximativement :

```text
ASR                  < 200 ms
LLM                  < 200 ms
Réseau               < 200 ms
Réponse après parole < 700 ms
```

Ce sont leurs objectifs techniques, pas des performances garanties dans toutes les conditions. ([Wispr Flow][6])

### Modèles exacts

Les informations publiques ne permettent pas d’affirmer qu’ils utilisent :

- Whisper ;
- Deepgram ;
- AssemblyAI ;
- OpenAI ;
- Anthropic ;
- Gemini ;
- un modèle précis publié sur Hugging Face.

Wispr parle de ses propres modèles ASR et de LLM personnalisés, mais ne publie pas les noms, poids, architectures ou fournisseurs utilisés en production. Toute attribution plus précise serait spéculative.

---

## 4. Traitement local contre traitement Cloud

Flow n’effectue pas sa transcription principale entièrement sur l’appareil.

La documentation précise que :

- l’audio est streamé vers le backend ;
- l’audio n’est normalement pas persisté localement ;
- le backend doit déchiffrer l’audio pour réaliser la transcription ;
- le système n’est pas chiffré de bout en bout au sens où Wispr ne pourrait jamais accéder au contenu ;
- avec Privacy Mode et Cloud Sync désactivé, les artefacts du pipeline ne sont pas conservés côté serveur après traitement. ([Wispr Flow Help Center][2])

```text
Microphone local
      ↓
Audio envoyé au Cloud
      ↓
Transcription serveur
      ↓
Formatage serveur
      ↓
Résultat retourné au client
```

Cela permet à Wispr d’utiliser des modèles lourds et de les améliorer sans mettre à jour tous les clients, mais crée une dépendance :

- à Internet ;
- à la latence réseau ;
- aux serveurs ;
- au coût d’inférence ;
- aux politiques de confidentialité du service.

---

## 5. Contexte de l’application active

Wispr Flow utilise deux mécanismes de contexte :

1. **Arbre d’accessibilité**, activé par défaut, pour lire le texte de l’application active.
2. **OCR de l’écran**, optionnel, qui peut capturer l’écran contenant le curseur afin d’extraire des noms propres et du contexte supplémentaire. ([Wispr Flow Help Center][2])

Architecture probable :

```text
Application active
    ├── texte accessible via UI Accessibility
    ├── nom de l’application
    ├── texte sélectionné
    └── capture OCR optionnelle
              ↓
        Contexte envoyé au pipeline
              ↓
        ASR et formatage améliorés
```

C’est une différence majeure avec une simple transcription audio : Wispr tente de comprendre **où** l’utilisateur écrit pour adapter le résultat.

---

## 6. Données et stockage

### PostgreSQL

Probablement utilisé pour :

- comptes ;
- organisations ;
- abonnements ;
- paramètres ;
- dictionnaires ;
- snippets ;
- configurations ;
- métadonnées de dictée ;
- relations utilisateurs et équipes.

### Redis

Probablement utilisé pour :

- cache ;
- sessions temporaires ;
- rate limiting ;
- verrous distribués ;
- état de traitements en temps réel ;
- résultats intermédiaires.

### ClickHouse

Probablement utilisé pour :

- analytics produit ;
- volumes de dictée ;
- performances ;
- métriques de latence ;
- télémétrie ;
- agrégations à très grande échelle.

Wispr indiquait déjà traiter environ un milliard de mots dictés par mois en septembre 2025, ce qui explique l’utilisation d’un entrepôt analytique comme ClickHouse. ([Wispr Flow][6])

Les dictionnaires personnels et snippets sont enregistrés sur le backend et synchronisés entre les appareils, indépendamment de certaines options de conservation des dictées. ([Wispr Flow Help Center][2])

---

## 7. Authentification et entreprise

La stack d’identité comprend :

- Supabase Auth ;
- WorkOS ;
- SAML 2.0 ;
- OpenID Connect ;
- SSO d’entreprise ;
- SCIM pour le provisionnement des utilisateurs. ([Ashby Jobs][7])

```text
Utilisateurs individuels
        ↓
Supabase Auth

Entreprises
        ↓
WorkOS
    ├── SAML
    ├── OIDC
    ├── SSO
    └── SCIM
```

La documentation mentionne notamment la compatibilité avec Microsoft Entra ID, Okta, Google Workspace, JumpCloud, OneLogin et d’autres fournisseurs SAML/OIDC. ([Wispr Flow Help Center][2])

---

## 8. Facturation

La stack de paiement publique comprend :

- Stripe ;
- Sequence ;
- RevenueCat ;
- achats intégrés Apple et Google ;
- PostgreSQL ;
- WorkOS ;
- un peu de React et TypeScript pour les interfaces associées. ([Ashby Jobs][8])

```text
Web/Desktop        → Stripe
iOS/Android        → IAP + RevenueCat
Entreprise         → WorkOS + systèmes internes
Orchestration      → Sequence
```

---

## 9. Sécurité et infrastructure

La stack de sécurité publiquement mentionnée comprend :

- AWS ;
- Terraform ;
- Gitleaks ;
- gestion centralisée des secrets ;
- chiffrement TLS 1.2 ou supérieur ;
- chiffrement AES-256 au repos ;
- KMS et HSM gérés par le fournisseur Cloud ;
- logs et analytics avec suppression automatique d’informations personnelles. ([Ashby Jobs][7])

Toutes les données Cloud sont actuellement traitées et stockées aux États-Unis. Wispr ne propose pas de déploiement on-premise ni, selon sa documentation actuelle, de région européenne dédiée. ([Wispr Flow Help Center][2])

---

## 10. Mobile

Wispr propose :

- une application iOS fonctionnant notamment comme clavier tiers ;
- une application Android intégrée aux zones de texte des autres applications. ([Google Play][9])

En revanche, je n’ai pas trouvé de source suffisamment fiable permettant d’affirmer leur stack exacte :

```text
iOS     : SwiftUI, UIKit ou combinaison inconnue
Android : Kotlin, Java, Compose ou combinaison inconnue
```

Il serait imprudent de présenter SwiftUI ou Jetpack Compose comme confirmés.

---

# Stack résumée

```text
CLIENT
├── Electron
├── React
├── TypeScript
├── SCSS Modules
├── Storybook
├── Motion
├── Lottie
├── Lucide
├── Helper C# Windows
└── Helper Swift macOS

BACKEND
├── Python
├── FastAPI
├── gRPC
├── PostgreSQL
├── Redis
├── ClickHouse
├── Temporal
└── Amazon SQS

INFRASTRUCTURE
├── AWS
├── Fargate
├── Application Load Balancer
└── Terraform

IDENTITÉ
├── Supabase Auth
└── WorkOS SSO/SCIM

PAIEMENT
├── Stripe
├── RevenueCat
├── Sequence
└── Apple/Google IAP

IA
├── ASR Cloud personnalisé
├── modèles sensibles au contexte
├── code-switching
├── LLM de formatage
└── personnalisation utilisateur
```

---

# Comparaison avec ton application Fluent

| Dimension           | Wispr Flow                       | Fluent actuel                       |
| ------------------- | -------------------------------- | ----------------------------------- |
| Interface Windows   | Electron + helper C# probable    | WPF natif en C#                     |
| Transcription       | Cloud                            | Whisper local                       |
| Réécriture          | LLM Cloud                        | local + Cloud optionnel             |
| Internet            | Nécessaire au pipeline principal | non nécessaire pour le mode local   |
| Consommation client | potentiellement plus élevée      | potentiellement plus légère         |
| Modèles             | centralisés sur serveur          | modèle distribué sur le poste       |
| Mise à jour IA      | immédiate côté serveur           | nécessite modèle ou version locale  |
| Multi-plateforme    | Mac, Windows, iOS, Android       | Windows                             |
| Synchronisation     | Cloud multi-appareils            | principalement locale               |
| Coût d’inférence    | payé par Wispr                   | supporté par la machine utilisateur |
| Confidentialité     | audio traité sur serveur         | audio local par défaut              |

## Ce que Fluent devrait reprendre

Pour Fluent, je reprendrais de Wispr :

- la séparation entre UI et helper d’intégration OS ;
- le contexte issu de l’arbre UI Automation ;
- le dictionnaire personnalisé ;
- le formatage dépendant de l’application cible ;
- les métriques de latence par étape ;
- la synchronisation facultative ;
- une architecture Cloud optionnelle en Python/FastAPI ;
- PostgreSQL pour les comptes et configurations ;
- Redis seulement lorsque la charge le justifiera.

Je ne recopierais pas immédiatement :

- Electron sur Windows ;
- ClickHouse ;
- Temporal ;
- une infrastructure Fargate complexe ;
- le traitement Cloud obligatoire ;
- l’OCR plein écran activé largement.

L’avantage différenciant de Fluent peut justement être :

```text
WPF natif
+ transcription locale
+ faible consommation
+ fonctionnement hors ligne
+ Cloud facultatif
+ confidentialité explicite
```

Wispr Flow possède une infrastructure beaucoup plus large et coûteuse, tandis que Fluent peut gagner sur la **légèreté, la confidentialité, l’intégration native Windows et la maîtrise des coûts**.

[1]: https://jobs.ashbyhq.com/wispr-flow/921f1bda-6472-463b-8eb4-b840f69a30a5?utm_source=chatgpt.com "Design Engineer @ Wispr Flow"
[2]: https://docs.wisprflow.ai/articles/3467817258-security-and-compliance-faq "Security and compliance FAQ | Wispr Flow Help Center"
[3]: https://github.com/wispr-flow-linux/helper "GitHub - wispr-flow-linux/helper: Clean-room Linux helper for Wispr Flow (text injection, active-window, key monitoring). Public domain. · GitHub"
[4]: https://docs.wisprflow.ai/articles/1036674442-supported-devices-and-system-requirements?utm_source=chatgpt.com "Supported devices and system requirements"
[5]: https://jobs.ashbyhq.com/wispr-flow/935df07f-6718-4c23-988e-f388fdb79760?utm_source=chatgpt.com "Staff Platform Engineer, Infrastructure @ Wispr Flow"
[6]: https://wisprflow.ai/post/technical-challenges "Technical challenges and breakthroughs behind Flow"
[7]: https://jobs.ashbyhq.com/wispr-flow/8c6a3c2a-c893-4c48-bf54-8d290f04e9e0?utm_source=chatgpt.com "Wispr Flow - Platform Engineer, Product Security"
[8]: https://jobs.ashbyhq.com/wispr-flow/4dfdbbe6-09de-470a-ae7a-ffe2072e93c5?utm_source=chatgpt.com "Wispr Flow - Platform Engineer, Billing Systems"
[9]: https://play.google.com/store/apps/details?hl=en_GB&id=com.wispr.flowapp&utm_source=chatgpt.com "Wispr Flow: AI Voice-to-Text"

https://www.bridgemind.ai/products/bridgevoice fais une recherche aprofondit sur cet application bridgevoice trouve quel stack il utilise

## Conclusion

**BridgeVoice est une application desktop multiplateforme construite avec Tauri 2 et Rust**, et non avec Electron. Son moteur natif Rust gère la capture audio temps réel, les raccourcis globaux, l’intégration système, le presse-papiers, l’injection du texte, les modèles locaux et les fenêtres flottantes. Son interface est rendue dans plusieurs WebViews avec une stack JavaScript moderne, mais BridgeMind ne publie pas le framework exact ; **React/TypeScript est probable, mais non confirmé publiquement**. ([BridgeMind][1])

La version publique la plus récente trouvée est **BridgeVoice 2.8.4, publiée le 4 août 2026**. ([BridgeMind][2])

# Stack synthétique

| Couche               | Technologie                                                                             |                  Niveau de certitude |
| -------------------- | --------------------------------------------------------------------------------------- | -----------------------------------: |
| Shell desktop        | Tauri 2                                                                                 |                             Confirmé |
| Backend natif client | Rust                                                                                    |                             Confirmé |
| Rendu UI             | WebViews Tauri                                                                          |                             Confirmé |
| Frontend UI          | JavaScript/TypeScript moderne ; React probable                                          |                              Partiel |
| Audio                | Pipeline Rust temps réel + ring buffer wait-free                                        |                             Confirmé |
| ASR local            | whisper.cpp                                                                             |                             Confirmé |
| Second moteur local  | NVIDIA Parakeet V3                                                                      |                             Confirmé |
| ASR Cloud            | Groq Whisper Large-v3-Turbo                                                             |                             Confirmé |
| Authentification     | AWS Cognito / tokens OAuth                                                              | Très probable et fortement documenté |
| Injection de texte   | Presse-papiers + simulation Cmd/Ctrl+V                                                  |                             Confirmé |
| Raccourcis globaux   | Hooks natifs par plateforme                                                             |                             Confirmé |
| Stockage local       | Paramètres, historique, dictionnaire, modèles, base locale                              |                             Confirmé |
| Base locale exacte   | SQLite possible, mais non confirmée pour BridgeVoice                                    |                              Inconnu |
| Monitoring           | Sentry                                                                                  |                             Confirmé |
| Analytics            | Infrastructure BridgeMind avec PostHog, mais usage précis dans BridgeVoice non confirmé |                              Partiel |
| Mise à jour          | Auto-update signé Tauri / distribution BridgeMind                                       |                             Confirmé |
| Plateformes          | Windows, macOS, Linux                                                                   |                             Confirmé |

---

# 1. Architecture générale

```text
┌───────────────────────────────────────────────────┐
│                Interface WebView                  │
│                                                   │
│  Dashboard          Widget flottant               │
│  ├─ Paramètres      ├─ Idle                       │
│  ├─ Historique      ├─ Listening                  │
│  ├─ Dictionnaire    ├─ Processing                 │
│  ├─ Statistiques    └─ Actions rapides            │
│  └─ Abonnement                                    │
└─────────────────────────┬─────────────────────────┘
                          │ Tauri IPC
┌─────────────────────────▼─────────────────────────┐
│                   Backend Rust                    │
│                                                   │
│  Capture audio       Modèles ASR locaux           │
│  Hotkeys globaux     Cible/focus                  │
│  Presse-papiers      Injection clavier            │
│  Téléchargements     Authentification              │
│  Auto-update         Stockage local               │
│  Tray                Diagnostics                  │
└───────────────┬─────────────────┬─────────────────┘
                │                 │
       Mode local           Mode Cloud
                │                 │
      whisper.cpp          BridgeMind API
      Parakeet V3                 │
                                  ▼
                    Groq Whisper Large-v3-Turbo
```

BridgeMind décrit explicitement BridgeVoice comme une application **Tauri 2 + Rust**, avec un pipeline audio temps réel sans verrou. Elle fonctionne sur macOS, Windows et Linux. ([BridgeMind][1])

---

# 2. Shell desktop : Tauri 2 + Rust

La décision technique centrale est :

```text
Tauri 2
+
Rust
+
WebViews système
```

Ce choix leur donne :

- un binaire plus léger qu’une architecture Electron classique ;
- un backend natif compilé ;
- un accès direct aux API Windows, macOS et Linux ;
- plusieurs fenêtres, dont le dashboard et la capsule flottante ;
- des commandes Rust exposées au renderer par IPC ;
- une meilleure maîtrise du pipeline audio temps réel.

BridgeMind insiste publiquement sur le fait que BridgeVoice est « native, not Electron ». Le produit utilise aussi au moins deux WebViews distinctes : une pour le widget et une pour le dashboard. Les versions récentes chargent des bundles séparés afin que la capsule ne charge pas tout le graphe du dashboard au démarrage. ([BridgeMind][1])

### Structure probable

```text
bridgevoice/
├─ src/                         # frontend WebView
│  ├─ dashboard/
│  ├─ widget/
│  ├─ components/
│  ├─ stores/
│  └─ styles/
│
├─ src-tauri/
│  ├─ audio/
│  ├─ transcription/
│  ├─ hotkeys/
│  ├─ injection/
│  ├─ auth/
│  ├─ models/
│  ├─ updater/
│  ├─ storage/
│  └─ platform/
│     ├─ windows/
│     ├─ macos/
│     └─ linux/
│
├─ package.json
├─ Cargo.toml
└─ tauri.conf.json
```

Cette arborescence est une reconstruction probable, pas le dépôt réel, qui n’est pas public.

---

# 3. Frontend : WebView moderne, probablement React/TypeScript

BridgeMind ne déclare pas publiquement :

```text
React
Vue
Svelte
Solid
```

comme framework de BridgeVoice.

Les indices techniques montrent néanmoins :

- plusieurs WebViews ;
- des modules JavaScript ;
- du lazy loading ;
- du code splitting par fenêtre ;
- un « composant mémoïsé » pour l’onde ;
- des mises à jour regroupées par frame ;
- des polices installées avec `@fontsource` ;
- une séparation entre renderer et backend Rust. ([BridgeMind][2])

La terminologie « memoized component » est très associée à React, mais elle ne constitue pas une preuve absolue.

Mon estimation :

```text
React + TypeScript       Probabilité élevée
Vite ou bundler proche  Probabilité élevée
CSS moderne             Confirmé fonctionnellement, outil inconnu
État global             Inconnu
```

Je ne présenterais donc pas React, Vite, Tailwind ou Zustand comme confirmés sans accès au bundle ou au dépôt.

---

# 4. Pipeline audio natif

BridgeVoice annonce un démarrage d’enregistrement inférieur à 10 ms et utilise un pipeline audio temps réel côté Rust. Une version récente a remplacé une section protégée par mutex par un **ring buffer wait-free**, afin d’éviter la perte d’échantillons lorsque plusieurs threads se disputent le verrou. ([BridgeMind][1])

```text
Microphone
    ↓
Callback audio natif
    ↓
Ring buffer wait-free
    ↓
Buffer de dictée
    ↓
Normalisation / validation
    ↓
Moteur ASR sélectionné
```

Le changelog indique aussi :

- détection des flux microphone silencieux ;
- reconstruction automatique du flux ;
- basculement vers un autre microphone ;
- exclusion automatique de Stereo Mix, Line In et câbles virtuels ;
- sondes de permissions Windows ;
- traitement hors du thread UI ;
- watchdogs bornés. ([BridgeMind][3])

### Bibliothèque audio probable

Dans l’écosystème Rust/Tauri, `cpal` serait un candidat logique, mais je n’ai trouvé aucune source officielle confirmant son usage. Il ne faut donc pas l’ajouter à la stack certaine.

---

# 5. Intelligence artificielle locale

## Whisper

BridgeVoice utilise **whisper.cpp** sur l’appareil. Les modèles proposés vont de Tiny à Large, avec une variante Distil-Large. Le téléchargement se fait depuis l’application et les fichiers restent localement. ([BridgeMind][1])

Les tailles documentées comprennent notamment :

| Modèle       | Taille approximative |
| ------------ | -------------------: |
| Tiny         |                75 Mo |
| Base         |               142 Mo |
| Small        |               466 Mo |
| Medium       |               1,5 Go |
| Large        |               3,1 Go |
| Distil-Large |       environ 1,5 Go |

Sur Apple Silicon, BridgeMind annonce une accélération Metal pour les modèles locaux. ([docs.bridgemind.ai][4])

## NVIDIA Parakeet V3

BridgeVoice intègre également **NVIDIA Parakeet V3** comme moteur local multilingue, avec détection automatique et prise en charge annoncée de 25 langues. ([BridgeMind][2])

L’outil d’exécution exact n’est pas publié. Il pourrait reposer sur ONNX Runtime ou une intégration Rust dédiée, mais ce point reste inconnu.

```text
Local engine
├─ whisper.cpp
└─ NVIDIA Parakeet V3
```

---

# 6. Transcription Cloud

Le mode Cloud suit ce chemin :

```text
Audio
    ↓ HTTPS
BridgeMind API
    ↓
Groq
    ↓
Whisper Large-v3-Turbo
    ↓
Texte
```

Le produit indique que le mode Cloud utilise **Groq Whisper Large-v3-Turbo**, avec détection automatique et plus de 99 langues. L’audio local ne quitte pas la machine en mode local ; en mode Cloud, il est envoyé à l’API BridgeMind puis au fournisseur de transcription. ([BridgeMind][1])

BridgeVoice possède aussi des fonctions de réécriture Cloud :

- Polish ;
- Enhance Prompt ;
- Auto Enhance Prompt ;
- facturation par crédits ;
- retour au texte exact en cas d’échec de l’amélioration. ([BridgeMind][2])

Le fournisseur exact utilisé pour chaque réécriture n’est pas annoncé. La politique de confidentialité cite Groq, OpenRouter et OpenAI parmi les fournisseurs de l’écosystème, mais elle ne permet pas d’attribuer avec certitude chaque requête de réécriture à un modèle précis. ([BridgeMind][5])

---

# 7. Push-to-Talk et hooks clavier

BridgeVoice utilise des raccourcis natifs différents selon la plateforme :

```text
macOS     Fn / Globe
Windows   Ctrl + Win
Linux     Ctrl + Alt
```

Le mode Push-to-Talk enregistre pendant le maintien et s’arrête au relâchement. Un mode Toggle est également disponible. ([docs.bridgemind.ai][4])

### Windows

L’implémentation Windows utilise un hook clavier bas niveau. Leur première stratégie consommait les événements `Ctrl + Win` pour empêcher l’ouverture du menu Démarrer, ce qui empêchait leur watchdog de voir le relâchement. Ils ont ensuite rendu le hook « listen-only » et utilisent une frappe de masquage bénigne pour neutraliser le menu Démarrer. ([BridgeMind][2])

```text
WH_KEYBOARD_LL ou mécanisme équivalent
          ↓
Observation Ctrl + Win
          ↓
Début d’enregistrement
          ↓
Surveillance physique du relâchement
          ↓
Arrêt
```

Le nom exact de l’API Windows n’est pas publié, mais le comportement décrit correspond clairement à une intégration clavier native Rust/Win32.

### macOS

Le produit utilise un **event tap** natif. Les diagnostics ont été déplacés hors du callback système, car les écritures disque pouvaient ralentir l’event tap et provoquer la perte d’un KeyUp. ([BridgeMind][2])

---

# 8. Injection du texte

BridgeVoice utilise principalement :

```text
Transcription
    ↓
Presse-papiers
    ↓
Restauration de la fenêtre cible
    ↓
Simulation Cmd+V ou Ctrl+V
```

Cette méthode est documentée officiellement. Le produit capture aussi la fenêtre cible au début de la dictée et tente de la restaurer avant l’insertion. ([docs.bridgemind.ai][4])

Les protections récentes comprennent :

- exclusion des propres fenêtres BridgeVoice comme cible ;
- confirmation que la bonne fenêtre est redevenue active ;
- nouvelle tentative de focus sous Windows ;
- petit tap Alt pour lever le verrou de foreground ;
- fallback vers le presse-papiers si la restauration échoue ;
- nouvelle résolution de la cible si l’ancienne fenêtre a été détruite ;
- attente de la capture de cible avant l’injection lors d’une dictée très courte. ([BridgeMind][2])

Un choix de sécurité intéressant a aussi été fait sous Windows : BridgeVoice ne restaure plus automatiquement l’ancien contenu du presse-papiers après le collage, car cette restauration pouvait remettre un mot de passe ou un code 2FA sur le presse-papiers, accessible à d’autres processus. ([BridgeMind][2])

---

# 9. Widget flottant

BridgeVoice possède une capsule flottante toujours au-dessus des autres fenêtres :

| État       | Affichage                        |
| ---------- | -------------------------------- |
| Idle       | petite pilule                    |
| Listening  | capsule agrandie avec onde audio |
| Processing | indicateur de traitement         |
| Error      | toast compact                    |
| Hidden     | masquage automatique optionnel   |

La documentation parle d’une visualisation à sept bandes, tandis que le changelog décrit une onde alimentée à environ 33 mises à jour par seconde, isolée du reste du renderer pour éviter de rerendre toute la capsule. ([docs.bridgemind.ai][4])

Le redimensionnement et le repositionnement de la fenêtre sont gérés côté Rust, avec croissance ancrée vers le bas et limites imposées par la zone utile du moniteur. ([BridgeMind][2])

Cela donne probablement :

```text
Niveau audio Rust
       ↓ événement Tauri
Buffer / frame coalescing
       ↓
Composant Waveform isolé
       ↓
Widget WebView
```

---

# 10. Authentification et abonnement

Le changelog fait explicitement référence à :

- access tokens ;
- refresh tokens ;
- `invalid_grant` ;
- `NotAuthorizedException` ;
- client Cognito ;
- login navigateur ;
- sessions desktop ;
- subscription verification. ([BridgeMind][2])

La stack d’identité est donc très probablement :

```text
AWS Cognito
    ├─ OAuth navigateur
    ├─ access token
    ├─ refresh token
    ├─ sessions desktop
    └─ validation d’abonnement
```

Les identifiants de connexion sont stockés localement sous forme chiffrée. La politique de confidentialité confirme l’usage de stockage local chiffré pour les credentials et l’état de l’application. ([BridgeMind][5])

BridgeMind utilise Stripe pour la facturation à l’échelle de la plateforme, mais je n’ai pas trouvé de preuve indiquant que l’application BridgeVoice embarque directement le SDK Stripe ; le paiement semble plutôt passer par les services web de BridgeMind. ([BridgeMind][5])

---

# 11. Stockage local

Les données locales confirmées comprennent :

- paramètres ;
- microphone sélectionné ;
- dictionnaire ;
- historique des transcriptions ;
- statistiques ;
- fichiers de modèles ;
- credentials chiffrés ;
- fichiers de base de données locaux. ([docs.bridgemind.ai][4])

```text
AppData / Application Support
├─ configuration
├─ credentials chiffrés
├─ modèles Whisper / Parakeet
├─ dictionnaire
├─ historique
├─ statistiques
└─ base locale
```

**SQLite est plausible**, mais je n’ai pas trouvé de confirmation explicite pour BridgeVoice. Le changelog confirme SQLite pour BridgeAgent, pas nécessairement pour BridgeVoice. Je ne classerais donc pas SQLite comme élément certain de sa stack.

---

# 12. Monitoring et observabilité

BridgeVoice utilise **Sentry** pour les crashs et erreurs. Le changelog parle directement de « Sentry-driven hardening », de classification d’erreurs, de filtrage des messages connus, d’agrégation des diagnostics et de réduction du bruit. ([BridgeMind][2])

Le produit collecte notamment des diagnostics autour de :

- interruptions de raccourcis ;
- erreurs de microphone ;
- échecs de focus ;
- erreurs d’authentification ;
- erreurs de téléchargement de modèles ;
- crashes des commandes Rust ;
- erreurs de mise à jour.

La politique générale cite également PostHog, Google Analytics et Sentry. Toutefois, elle ne précise pas exactement quels événements PostHog sont activés dans l’application desktop, donc il ne faut pas conclure que toutes les dictées génèrent des événements PostHog. ([BridgeMind][5])

---

# 13. Auto-update et distribution

BridgeVoice :

- vit dans la barre de menu ou le system tray ;
- peut se lancer avec le système ;
- se met à jour automatiquement ;
- utilise des builds macOS signés et notariés ;
- distribue des variantes Windows, macOS et Linux ;
- conserve des anciennes versions téléchargeables ;
- publie un changelog JSON commun au site et à l’application. ([BridgeMind][1])

Le mécanisme exact est très probablement le système d’updater signé de Tauri 2, mais l’usage du plugin précis n’est pas déclaré. Le produit vérifie aussi les versions minimales côté serveur avec des en-têtes tels que :

```text
X-App-Min-Version
X-App-Update-Required
```

afin de forcer les clients devenus incompatibles à se mettre à jour. ([BridgeMind][2])

---

# 14. Stack finale reconstruite

```text
BRIDGEVOICE DESKTOP
├── Tauri 2
├── Rust
├── WebView2 sur Windows
├── WKWebView sur macOS
├── WebKitGTK sur Linux
├── Frontend JS/TS moderne
│   ├── dashboard
│   ├── widget flottant
│   ├── lazy chunks séparés
│   ├── composants mémoïsés
│   └── @fontsource
│
├── Audio natif Rust
│   ├── callback temps réel
│   ├── ring buffer wait-free
│   ├── watchdog microphone
│   ├── fallback périphérique
│   └── waveform temps réel
│
├── Reconnaissance locale
│   ├── whisper.cpp
│   └── NVIDIA Parakeet V3
│
├── Reconnaissance Cloud
│   ├── BridgeMind API
│   └── Groq Whisper Large-v3-Turbo
│
├── Intégration OS
│   ├── hooks clavier globaux
│   ├── event tap macOS
│   ├── focus et fenêtre cible
│   ├── presse-papiers
│   ├── simulation Ctrl/Cmd+V
│   ├── tray
│   └── auto-start
│
├── Identité
│   ├── AWS Cognito
│   ├── OAuth navigateur
│   ├── access tokens
│   └── refresh tokens
│
├── Données locales
│   ├── historique
│   ├── statistiques
│   ├── dictionnaire
│   ├── paramètres
│   ├── credentials chiffrés
│   └── modèles
│
├── Observabilité
│   └── Sentry
│
└── Distribution
    ├── auto-update signé
    ├── Windows installer
    ├── macOS DMG signé/notarié
    ├── Linux AppImage
    └── Linux DEB
```

# 15. Comparaison avec ton application actuelle

| Dimension         | BridgeVoice                       | Ton application           |
| ----------------- | --------------------------------- | ------------------------- |
| Framework desktop | Tauri 2                           | WPF                       |
| Langage natif     | Rust                              | C#                        |
| Plateformes       | Windows, macOS, Linux             | Windows                   |
| Interface         | WebView JS/TS                     | XAML natif                |
| ASR local         | whisper.cpp + Parakeet            | Whisper.net               |
| Cloud ASR         | Groq Whisper Large-v3-Turbo       | pas central               |
| Audio             | pipeline Rust wait-free           | capture .NET              |
| Push-to-Talk      | hooks natifs par OS               | hook Windows en cours     |
| Injection         | clipboard + focus restore         | clipboard + SendInput     |
| Widget            | WebView séparée                   | fenêtre WPF               |
| Auth              | Cognito                           | Supabase Auth             |
| Monitoring        | Sentry                            | à vérifier                |
| Stockage          | base locale non identifiée        | SQLite                    |
| Réécriture        | Cloud par crédits + fallback brut | locale + Gemini optionnel |

## Ce qui vaut vraiment la peine d’être repris

Pour ton application, les meilleures idées de BridgeVoice sont :

1. **Le ring buffer audio sans attente** pour empêcher le callback microphone d’être ralenti par des verrous.
2. **La capture de la fenêtre cible avant l’enregistrement**, puis sa revalidation avant collage.
3. **Le fallback presse-papiers** si Windows refuse de restaurer la cible.
4. **Le hook Ctrl+Win non consommant**, avec une stratégie séparée pour neutraliser le menu Démarrer.
5. **Le watchdog de relâchement physique** pour éviter les enregistrements bloqués.
6. **La reconstruction automatique du flux microphone** lorsqu’il devient silencieux.
7. **La capsule isolée du dashboard**, pour ne jamais charger toute l’interface au démarrage.
8. **L’onde mise à jour par frame coalescing**, sans rerendre toute la capsule.
9. **Le choix local/Cloud explicite**, sans rendre le Cloud obligatoire.
10. **Le fallback vers les mots exacts** quand une réécriture Cloud échoue.

Je ne recommanderais pas de remplacer immédiatement WPF par Tauri. Pour une application uniquement Windows, ton architecture WPF/C# reste plus native et plus simple. En revanche, **si la priorité devient macOS + Linux**, Tauri 2 + Rust constitue la décision d’architecture la plus importante à étudier dans BridgeVoice.

[1]: https://www.bridgemind.ai/products/bridgevoice "BridgeVoice: Vibe Code With Your Voice | 99+ Languages | BridgeMind"
[2]: https://www.bridgemind.ai/changelog "Changelog: BridgeSpace, BridgeVoice & BridgeAgent Releases | BridgeMind"
[3]: https://www.bridgemind.ai/changelog?utm_source=chatgpt.com "Changelog: BridgeSpace, BridgeVoice & BridgeAgent ..."
[4]: https://docs.bridgemind.ai/docs/bridgevoice "BridgeVoice - BridgeMind Docs"
[5]: https://www.bridgemind.ai/privacy-policy "Privacy Policy | BridgeMind"

=============================================================
fais une analyse croiser entre wisprflow et bridgevoice recherche les point important, les point cles a copier, amelliorer, optimiser, implementer, la meilleur stack, architecture coter front end et backend, les meilleurs fonctionnalite a jouter , a amelliorer, les technique a implementer dans fluent pour le rendre plus leger, plus rapide, plus precis, plus fluide pour une architechture macOs et linux de fluent

Oui. La meilleure méthode n’est pas de copier toute la conversation brute dans Codex, mais de la **transformer en contexte de projet propre et durable**, puis d’ouvrir un nouveau dossier dans Codex Desktop.

Codex peut travailler directement dans un dossier ou dépôt Git local. En revanche, l’historique Codex reste séparé de l’historique ChatGPT ; je ne trouve pas de fonction officielle permettant d’importer directement une conversation ChatGPT complète dans un projet Codex en un clic. ([OpenAI][1])

### Ce que je te propose

Pour ton nouveau projet, on va générer un dossier du genre :

```powershell
C:\SECOND_BRAIN\PROJECTS\Fluent-Multiplatform
```

avec au départ :

```text
Fluent-Multiplatform/
│
├── AGENTS.md
├── PROJECT_CONTEXT.md
├── KICKOFF_PROMPT.md
├── ROADMAP.md
├── ARCHITECTURE.md
├── DECISIONS.md
│
├── docs/
│   ├── research/
│   ├── architecture/
│   ├── decisions/
│   └── evidence/
│
└── .git/
```

Le rôle de chaque fichier serait :

```text
PROJECT_CONTEXT.md
→ résumé complet de cette discussion à partir du point choisi

AGENTS.md
→ règles permanentes données à Codex pour travailler sur le projet

ARCHITECTURE.md
→ architecture Fluent cible :
   Tauri 2 / Rust / React / TypeScript / Vite
   whisper.cpp / Parakeet
   macOS / Linux / Windows
   local-first + Cloud optionnel

ROADMAP.md
→ phases d’implémentation

DECISIONS.md
→ décisions prises et éléments explicitement rejetés

KICKOFF_PROMPT.md
→ premier prompt à donner au nouveau thread Codex
```

C’est beaucoup plus fiable qu’un énorme copier-coller : Codex peut relire ces fichiers pendant tout le développement, et le contexte survit même si tu ouvres de nouveaux threads.

### Dans Codex Desktop

Une fois les fichiers créés :

1. crée le nouveau dossier ;
2. ouvre **Codex** dans l’application desktop ;
3. sélectionne **Add project / Open folder** ;
4. choisis `C:\SECOND_BRAIN\PROJECTS\Fluent-Multiplatform` ;
5. démarre un nouveau thread ;
6. donne le contenu de `KICKOFF_PROMPT.md`.

OpenAI recommande justement de connecter un projet Codex à un dossier local ; le dossier peut même être vide au départ et Codex peut y créer les fichiers nécessaires. ([OpenAI][2])

### Il me manque seulement le point exact « Sunday 3:30 AM »

Je ne vois pas dans mon interface les séparateurs horaires que **toi tu vois dans ton historique ChatGPT**, et ma recherche de contexte n’a pas retrouvé de manière fiable le message identifié comme `Sunday 3:30 AM`.

Je ne veux donc pas choisir arbitrairement le mauvais point de départ.

**Colle-moi simplement le prompt qui apparaît juste sous `Sunday 3:30 AM`**, ou envoie-moi une capture de cette partie de la conversation.

À partir de ce message précis, je pourrai te générer un **package d’import Codex complet** comprenant :

```text
AGENTS.md
PROJECT_CONTEXT.md
ARCHITECTURE.md
ROADMAP.md
DECISIONS.md
KICKOFF_PROMPT.md
```

et même un script PowerShell du type :

```powershell
.\bootstrap-fluent-multiplatform.ps1
```

qui créera automatiquement le nouveau dossier, toute l’arborescence, initialisera Git et déposera les fichiers de contexte prêts à être ouverts dans Codex Desktop.

[1]: https://openai.com/codex/get-started/?utm_source=chatgpt.com "Get started with Codex | OpenAI | OpenAI"
[2]: https://openai.com/fr-FR/academy/codex-how-to-start/?utm_source=chatgpt.com "Comment commencer à utiliser Codex | OpenAI"
