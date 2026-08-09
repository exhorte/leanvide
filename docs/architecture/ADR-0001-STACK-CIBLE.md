# ADR-0001 — Stack cible desktop local-first

- Statut: **Accepté sous conditions de spikes**
- Date: 2026-08-09
- Décideurs: project-manager + product-architect; validation des gates par les leads concernés
- Portée: fondation technique desktop et conséquences architecturales des décisions produit confirmées
- Décisions liées: D-01 à D-14 confirmées le 2026-08-09; performances et capacités restent soumises aux spikes
- Retour arrière: possible jusqu'au Gate de Phase 02 selon la section 11

## 1. Contexte

Fluent vise une application de dictée vocale desktop pour macOS, Linux et Windows. Le chemin critique combine capture audio temps réel, ASR local, hotkeys, permissions, focus, remise du texte, stockage local, widget et dashboard.

Le dépôt fixe déjà une architecture cible dans `AGENTS.md`, `CLAUDE.md` et la roadmap:

- Tauri 2 pour le shell desktop;
- React, TypeScript et Vite pour l'interface;
- Rust pour audio, orchestration, hotkeys, intégration OS et stockage;
- whisper.cpp comme premier moteur local derrière une interface stable;
- SQLite pour les données locales;
- Python/FastAPI/PostgreSQL uniquement pour un Cloud facultatif.

Cet ADR transforme cette cible en décision traçable, compare les solutions de repli et définit les conditions qui peuvent encore l'invalider. Les décisions produit confirmées dans [VISION.md](../product/VISION.md) fixent désormais le périmètre auquel la stack doit répondre; elles ne constituent pas une preuve de performance ou de compatibilité OS.

## 2. Forces et contraintes de décision

1. Le callback audio ne doit effectuer aucune I/O, aucun log synchrone, aucune allocation évitable et ne doit prendre aucun verrou bloquant.
2. Les capacités et permissions divergent entre Windows, macOS, Linux X11 et Linux Wayland.
3. Wayland ne permet pas de promettre une injection universelle; un fallback explicite est nécessaire.
4. Le produit doit pouvoir fonctionner sans envoyer d'audio sans consentement explicite.
5. Une réécriture générative future doit conserver un retour déterministe au texte brut.
6. Le widget doit rester minimal; le dashboard peut utiliser un système de composants plus riche.
7. Les moteurs ASR et adaptateurs OS doivent être remplaçables sans réécrire le domaine.
8. Le Cloud est absent du MVP: seuls des ports sans implémentation distante sont permis. Des services Cloud/synchronisation futurs resteraient facultatifs et payants; le chemin local demeure gratuit et sans compte.
9. Fluent est greenfield. Aucune migration WPF n'est autorisée sans dépôt ou inventaire externe fourni et nouvel ADR.
10. Le dépôt reste public et le code adopte Apache-2.0; les dépendances, modèles, données et marques conservent leurs licences propres et doivent être vérifiés séparément.
11. La référence est macOS Apple Silicon si une machine de test est disponible; à défaut, Windows devient la référence pratique. L'ordre produit reste macOS -> Linux -> Windows.
12. Le MVP est français, en push-to-talk par défaut avec toggle accessible, sans écoute continue.
13. Le minimum provisoire est 4 cœurs modernes, 8 Gio de RAM et 2 Gio libres, sans GPU dédié requis; la référence vise 16 Gio et reste à qualifier en Phase 02.

## 3. Décision

### 3.1 Desktop

Adopter **Tauri 2 + Rust + React/TypeScript/Vite** comme cible de fondation, sous réserve des spikes de Phase 02.

```text
┌────────────────────────────────────────────────────────────┐
│ Interfaces WebView                                        │
│  ├─ widget: bundle/état minimal, aucune logique temps réel │
│  └─ dashboard: React + TypeScript + composants accessibles │
└───────────────────────┬────────────────────────────────────┘
                        │ IPC Tauri versionné
┌───────────────────────▼────────────────────────────────────┐
│ Cœur Rust                                                 │
│  états de session │ orchestration │ stockage │ diagnostics │
├───────────────────┼───────────────┼───────────┼─────────────┤
│ audio temps réel  │ ASR trait     │ SQLite   │ capability  │
├───────────────────┴───────────────┴───────────┴─────────────┤
│ Adaptateurs OS: Windows │ macOS │ Linux X11 │ Linux Wayland│
└────────────────────────────────────────────────────────────┘
```

Décisions associées:

- séparer les bundles et responsabilités du widget et du dashboard;
- maintenir les états et décisions métier dans le cœur Rust, pas dans la WebView;
- exposer un IPC étroit, typé, versionné et sans buffers audio bruts sur le bus UI;
- placer chaque intégration OS derrière un contrat de capacités et d'erreurs explicites;
- placer chaque moteur ASR derrière un trait stable;
- isoler le chemin temps réel du stockage, du réseau, de la UI et des logs;
- utiliser SQLite pour les données locales structurées, avec migrations et rollback testés;
- ne pas ajouter de dépendance Cloud au chemin de dictée local.

### 3.2 ASR

Utiliser **whisper.cpp comme premier candidat**, pas comme dépendance irréversible:

- backend encapsulé derrière un trait;
- modèle, quantification et accélération choisis par benchmark;
- provenance, licence, checksum, reprise de téléchargement et suppression obligatoires;
- le français est la langue du MVP; aucune promesse de précision ou de support matériel définitif avant les benchmarks et la baseline;
- moteur additionnel seulement si une lacune mesurée le justifie.

### 3.3 Données locales

Utiliser **SQLite** pour configuration structurée, métadonnées et historique textuel lorsqu'il est explicitement activé. Le défaut reste zero-history, avec rétention configurable si opt-in. Les gros fichiers de modèles restent hors base avec manifeste et intégrité.

Aucun audio n'est persisté par défaut. Toute option future de persistance audio exige une décision et une conception sécurité distinctes; elle n'est pas autorisée implicitement par SQLite.

### 3.4 Ports Cloud sans implémentation au MVP

Le MVP ne contient aucune implémentation Cloud. Les contrats/ports peuvent préserver la réversibilité architecturale. Si un cadrage ultérieur autorise des services Cloud ou de synchronisation facultatifs et payants:

- commencer par un monolithe modulaire Python/FastAPI;
- PostgreSQL devient la source transactionnelle serveur;
- l'authentification, la synchronisation et les passerelles IA restent des modules séparés par contrats;
- Redis, ClickHouse, Temporal, SQS, microservices ou orchestration complexe exigent des métriques et un ADR supplémentaire;
- la défaillance Cloud ne doit pas invalider le chemin local ni faire perdre le texte brut.

Cet ADR n'autorise ni compte pour le chemin local, ni audio Cloud dans le MVP, ni fournisseur IA particulier.

## 4. Options comparées

| Option | Description | Compatibilité OS | Coût initial | Coût durable | Risques dominants | Réversibilité |
|---|---|---|---|---|---|---|
| A — Tauri 2 + Rust + React/TS/Vite | WebViews système, cœur et adaptateurs Rust | cible les 3 OS; comportement WebView et natif à prouver | moyen/élevé: Rust + quatre environnements Linux séparés | mutualisation élevée du core/UI, adaptateurs spécialisés | WebViewGTK, plugins, permissions, FFI, compétences Rust | bonne si contrats core/adaptateurs restent indépendants |
| B — Electron + React/TS + helpers natifs | runtime Chromium/Node embarqué, helpers par OS | large et plus homogène côté UI | moyen; écosystème riche | mémoire, taille, surface supply-chain et doubles stacks natives | poids, mises à jour runtime, IPC et helpers multiples | moyenne; UI réutilisable, core temps réel à reconstruire/intégrer |
| C — clients natifs distincts | AppKit/Swift, WinUI/WPF/C#, Linux toolkit dédié | meilleure expressivité native par OS | très élevé | trois UI, trois intégrations et divergence comportementale | parité, coordination, tests et vitesse de livraison | faible une fois trois produits développés |
| D — WPF d'abord puis ports | partir d'une application Windows existante | Windows d'abord, macOS/Linux réécrits | inconnu: source WPF non fournie | migrations et divergence probables | contredit le cadrage greenfield; contrats hérités et double investissement | faible sans inventaire et nouvel ADR |

## 5. Pourquoi l'option A

- le cœur Rust peut porter les invariants temps réel, les états, le stockage et les contrats communs;
- Tauri permet une UI multiplateforme sans imposer la logique critique au renderer;
- React/TypeScript/Vite fournit une base cohérente pour dashboard et widget, avec bundles séparés;
- les adaptateurs OS reconnaissent explicitement les divergences de permissions et de remise;
- le moteur ASR et le Cloud restent remplaçables;
- la stack évite trois produits UI totalement distincts sans prétendre que les intégrations natives sont identiques;
- le rollback est encore peu coûteux avant l'implémentation structurante de Phase 01/02.

Ce choix n'est pas motivé par la seule stack d'un concurrent. `project_context.md` contient une recherche comparative Wispr Flow/BridgeVoice avec des niveaux de certitude variables; elle sert de signal, pas de preuve primaire. Les capacités annoncées pour Fluent doivent être démontrées dans ce dépôt.

## 6. Coûts acceptés

- montée en compétence et temps de compilation Rust;
- FFI et bibliothèques natives différentes par OS;
- quatre surfaces de compatibilité pratiques: Windows, macOS, X11, Wayland;
- validation WebView/DPI/accessibilité/focus sur chaque environnement;
- bindings de whisper.cpp et gestion de modèles lourds;
- discipline stricte sur threads temps réel et canaux bornés;
- contrats IPC et erreurs versionnés avant parallélisation;
- packaging, signature et updater spécifiques à chaque OS;
- CI et parc matériel multiplateformes.

## 7. Risques et mesures

| Risque | Impact | Mesure préventive | Déclencheur de reconsidération |
|---|---|---|---|
| callback audio perturbé par le reste de l'application | pertes et transcription fausse | ring buffer SPSC/wait-free évalué, travail hors callback, stress tests | pertes/jitter inexpliqués après deux implémentations conformes |
| WebView/widget trop lent ou perturbant le focus | parcours inutilisable | bundle minimal séparé, mises à jour coalescées, spike multi-écrans | budget d'armement ou focus non atteint sur référence |
| injection impossible/non fiable | perte de confiance | niveaux L0-L3, revalidation cible, fallback copiable | taux inférieur au seuil approuvé sans fallback acceptable |
| Wayland fragmenté | promesse de support fausse | matrice par compositor, portals, fallback de premier rang | absence de contrôle/capture utilisable sur cible prioritaire |
| whisper.cpp insuffisant | latence, WER ou mémoire excessifs | trait ASR, modèles profilés, benchmark corpus/matériel | budget approuvé impossible sur matériel minimal |
| Tauri/plugin bloque une permission ou le packaging | plateforme non livrable | spikes natifs, possibilité d'adaptateur ou sidecar ciblé | workaround fragile/non maintenu sur plateforme de référence |
| SQLite/rétention expose des données | confidentialité/perte de données | schéma minimal, migrations, permissions, suppression, threat model | exigence de chiffrement/sync non compatible avec le modèle |
| Cloud contamine le chemin local | panne réseau ou collecte implicite | frontière de ports, feature flag, tests réseau bloqué | dictée locale requiert auth ou service distant |
| supply-chain/modèles incompatibles | distribution interdite ou compromise | lockfiles, SBOM/provenance/checksums, décision de licence | licence incompatible ou artefact invérifiable |
| application WPF externe découverte tardivement | duplication/migration coûteuse | rester greenfield; n'évaluer une source externe que par inventaire borné | inventaire révèle un core réutilisable ou des données à migrer et déclenche un nouvel ADR |

## 8. Compatibilité OS attendue

| Environnement | Engagement de l'ADR | Pas d'engagement |
|---|---|---|
| macOS Apple Silicon — référence si machine disponible | adaptateur Rust natif prioritaire, permissions explicites, signature/notarisation avant bêta | toutes versions/architectures, contournement de Secure Input |
| Linux X11 — deuxième cible | adaptateur et dépendances bornés à une distribution/DE de référence | toutes distributions ou WM |
| Linux Wayland — deuxième cible, environnement distinct | détection par capacités, portals/voies autorisées, L1/L0 toujours conçus | hotkey, focus ou injection universels |
| Windows — troisième cible produit; référence pratique si Apple Silicon indisponible | adaptateur Rust natif, capture/hotkey/remise évaluées, WebView Tauri | toutes versions, applications élevées ou injection universelle |

Les versions supportées et la qualification du plancher matériel restent à déterminer par les spikes. La matrice détaillée vit dans [PLATFORM-CAPABILITIES.md](../product/PLATFORM-CAPABILITIES.md).

## 9. Contrats à figer avant implémentations parallèles

1. **Session de dictée**: identifiant, états, transitions, annulation et timeouts.
2. **AudioSource**: formats, timestamps, erreurs de périphérique, aucun ownership UI.
3. **AudioQueue**: capacité bornée, politique d'overflow et métriques hors callback.
4. **AsrEngine**: modèle, langue, entrée, résultat brut, annulation, erreurs et mesures.
5. **TargetContext**: identifiant opaque minimal, durée de validité et consentement.
6. **TextDelivery**: niveaux L0-L3, résultat confirmable, fallback et erreurs.
7. **PlatformCapabilities**: capacités détectées, permissions, raisons de dégradation.
8. **Persistence**: catégories, transactions, migration, purge, zero-history par défaut et historique texte opt-in configurable.
9. **IPC UI**: commandes/événements versionnés, payloads bornés, aucune donnée sensible par défaut.
10. **Cloud ports**: sans implémentation distante au MVP et absents du chemin critique; activables seulement après un nouveau cadrage.

Les signatures concrètes seront un ADR ou contrat de Phase 02. Cet ADR n'autorise pas plusieurs agents à inventer des versions concurrentes.

## 10. Preuves requises avant validation définitive

- build minimal Tauri sur chaque environnement réellement retenu;
- profil de démarrage et mémoire widget/dashboard séparés;
- stress test audio avec pertes, jitter et CPU;
- benchmark ASR avec corpus, langue, modèle et matériel nommés;
- 1 000 cycles de hotkey incluant perte de focus, veille et verrouillage;
- matrice de remise sur applications représentatives avec L1/L0 exercés;
- test de permissions refusées et révoquées;
- migration/rollback SQLite et suppression des données;
- audit initial dépendances, modèles et licences;
- packaging minimal sur la plateforme de référence;
- threat model validé.

## 11. Stratégie de retour arrière

### Fenêtre de rollback

L'option A est réversible à faible coût jusqu'au Gate de Phase 02, avant que schémas IPC, données de production, plugins spécifiques et packaging public deviennent difficiles à remplacer.

### Mécanismes

- conserver le domaine et les contrats Rust indépendants de Tauri;
- garder le renderer sans accès direct à l'audio, au stockage ou aux API OS;
- isoler Tauri dans le shell et l'adaptateur IPC;
- isoler whisper.cpp derrière `AsrEngine`;
- isoler chaque OS derrière capacités/adaptateurs;
- versionner les migrations SQLite et fournir un export logique avant tout schéma incompatible;
- garder le Cloud derrière des ports et feature flags;
- ne stocker aucune donnée utilisateur irremplaçable pendant les spikes.

### Scénarios

| Échec | Retour arrière |
|---|---|
| WebView/widget invalide la latence ou l'accessibilité | remplacer uniquement le widget par une vue native minimale, ou supprimer le widget du premier parcours; conserver core et dashboard |
| Tauri empêche une intégration critique | écrire un adaptateur/sidecar natif borné; si le coût reste excessif, remplacer le shell sans changer core/traits |
| whisper.cpp échoue aux budgets | substituer un moteur derrière `AsrEngine`; ne pas migrer l'UI ni la remise |
| SQLite ne répond plus aux contraintes locales | exporter via le port de persistance puis migrer avec double lecture bornée; aucune synchro implicite |
| Cloud absent selon D-10 | ne pas créer `services/api`; les ports restent sans implémentation distante |
| WPF externe réutilisable découvert | maintenir le greenfield par défaut; inventorier contrats/données puis décider par nouvel ADR entre exclusion, extraction, migration ou coexistence |

### Autorité de rollback

Le project-manager arrête les implémentations dépendantes et ouvre un nouvel ADR si un déclencheur est atteint. Un changement de stack, de moteur primaire, de stockage ou de frontière local/Cloud ne se fait pas par correctif silencieux.

## 12. Conséquences

### Positives

- architecture commune sans nier les différences OS;
- chemin temps réel et logique métier hors WebView;
- moteurs, plateformes et Cloud remplaçables;
- poids et ressources potentiellement plus faibles qu'un runtime Chromium embarqué, à mesurer;
- rollback explicite avant verrouillage.

### Négatives

- complexité Rust/natif et besoin de profils spécialisés;
- dépendance aux WebViews installées et à WebKitGTK sous Linux;
- parité OS coûteuse malgré la UI partagée;
- tests matériels et packaging incontournables;
- bénéfices de poids/performance non garantis avant benchmarks.

### Décisions produit appliquées; validations non acquises

- Fluent est le nom confirmé; la vérification marque/domaine reste à faire avant publication;
- macOS Apple Silicon est la référence si la machine est disponible; à défaut, Windows devient la référence pratique sans changer silencieusement l'ordre produit macOS/Linux/Windows; versions et capacités restent à prouver;
- le MVP français et le plancher matériel provisoire sont confirmés, mais corpus, seuils et performances finales restent à qualifier;
- push-to-talk par défaut, toggle accessible, zero-history, chemin local sans compte et absence de Cloud au MVP sont fixés; leur implémentation reste à tester;
- le dépôt public et Apache-2.0 sont décidés; compatibilité des dépendances, modèles, données et actifs reste à auditer;
- le cœur local est gratuit et les futurs services Cloud/synchronisation facultatifs payants; leur frontière commerciale n'est pas conçue par cet ADR;
- Fluent est greenfield; toute source WPF externe exige un inventaire et un nouvel ADR avant changement de stratégie.

## 13. Alternatives écartées ou différées

- **Electron**: solution de repli si Tauri/WebView échoue aux spikes, pas choix initial en raison du runtime embarqué, de la surface et du besoin persistant de helpers natifs.
- **trois clients natifs**: différés; coût et divergence trop élevés avant validation du produit.
- **WPF-first**: écarté par D-14; aucune source n'est dans le périmètre et un inventaire externe ne peut être considéré que par nouvel ADR.
- **backend distribué dès le MVP**: rejeté sans charge, compte, Cloud ni économie confirmés.
- **logique audio/ASR dans le frontend**: rejetée pour les contraintes temps réel, ressources et permissions.
- **injection unique sans fallback**: rejetée car incompatible avec les limites OS, notamment Wayland.

## 14. Réexamen

Réexaminer cet ADR:

- au Gate de Phase 02;
- si un inventaire externe révèle une base WPF substantielle et justifie de réexaminer le cadrage greenfield;
- si le spike Tauri échoue sur la plateforme de référence;
- si aucun moteur derrière le contrat proposé n'atteint les budgets acceptés;
- si une exigence de licence, sécurité ou distribution interdit une dépendance structurante;
- si les résultats sur la référence macOS ou l'ordre macOS/Linux/Windows conduisent à un nouveau cadrage mono-OS rendant une stack native objectivement moins coûteuse.
