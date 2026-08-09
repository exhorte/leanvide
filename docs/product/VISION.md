# Vision produit de Fluent

Statut: **cadrage produit confirmé — validations d'usage et prototypes requis**

Cycle: `CYCLE-20260809-02`

Phase: `PHASE-00`

Dernière mise à jour: 2026-08-09

## 1. Intention

Fluent est le nom confirmé d'une application desktop de dictée vocale multiplateforme. Elle vise en priorité les professionnels à forte production écrite sensibles à la confidentialité et transforme une parole courte en texte utilisable dans l'application active, avec un chemin local maîtrisable.

La promesse de cadrage est:

> Dicter dans ses outils quotidiens avec une latence prévisible, un résultat récupérable et un contrôle explicite des données.

Cette formulation décrit la direction produit, pas une garantie de performance avant les prototypes. Le MVP est français, sans compte ni Cloud, avec macOS Apple Silicon comme référence si une machine de test est disponible; à défaut, Windows devient la référence pratique. Le plancher provisoire est une machine moderne à 4 cœurs, 8 Gio de RAM et 2 Gio libres, sans GPU dédié requis; la référence vise 16 Gio. Le cœur local est gratuit; d'éventuels services Cloud ou de synchronisation futurs seront facultatifs et payants.

## 2. Problème à résoudre

Les solutions de dictée généralistes imposent souvent au moins un des compromis suivants:

- dépendance réseau sur le chemin critique;
- comportement d'insertion différent selon le système, l'application ou le compositor;
- résultat réécrit sans moyen évident de retrouver le texte brut;
- permissions et flux de données peu visibles;
- consommation de ressources inadaptée aux machines modestes;
- compte ou service distant requis avant de pouvoir essayer le produit.

Fluent doit démontrer, par des mesures et non par une promesse générale, quels compromis il élimine réellement sur chaque plateforme supportée.

## 3. Principes confirmés et contraintes actuelles

| Élément | Nature actuelle | Conséquence de cadrage |
|---|---|---|
| Aucune donnée audio ne quitte la machine sans consentement explicite | contrainte normative du dépôt | tout flux distant doit être opt-in, visible et testable |
| Approche local-first | décision produit confirmée | le MVP garde un chemin de dictée local indépendant d'un service distant et utilisable sans compte |
| Texte brut récupérable | proposition produit | toute réécriture doit conserver un retour déterministe au brut si cette proposition est confirmée |
| Push-to-talk | décision produit confirmée | push-to-talk par défaut, toggle accessible; aucune écoute continue au MVP |
| Injection puis fallback presse-papiers | proposition produit | ne pas promettre l'injection universelle, en particulier sous Wayland |
| Indicateur visible pendant la capture et le traitement | proposition produit | à confirmer avec les exigences UX et d'accessibilité |
| Aucun compte requis sur le chemin local; Cloud absent du MVP | décision produit confirmée | seuls les ports Cloud sont conservés, sans implémentation distante au MVP |
| Zero-history par défaut; aucun audio persisté par défaut | décision produit confirmée | un historique texte local reste opt-in, avec rétention configurable; aucune persistance audio implicite |

## 4. Valeur différenciante à valider par l'usage

1. **Contrôle**: l'utilisateur sait quand le microphone est actif, quel traitement est choisi et si une donnée quitte l'appareil.
2. **Résilience**: un échec d'injection ou de réécriture ne doit pas faire perdre une transcription déjà obtenue.
3. **Compatibilité honnête**: chaque capacité est annoncée par environnement; Wayland dispose d'un fallback explicite plutôt que d'une garantie universelle.
4. **Performance mesurée**: armement, fin-de-parole, temps réel, mémoire, CPU et taux d'insertion sont mesurés sur un matériel nommé.
5. **Architecture progressive**: le Cloud, la synchronisation, les moteurs additionnels et l'infrastructure distribuée ne sont ajoutés qu'après un besoin validé.

Ces cinq points sont des axes de conception. Le segment est confirmé par D-02, mais leur valeur réelle reste à valider par recherche utilisateur et tests.

## 5. Horizons de produit

### MVP confirmé

- un parcours de dictée desktop de bout en bout sur macOS Apple Silicon si la machine de test requise est disponible, sinon sur Windows comme référence pratique;
- capture en push-to-talk par défaut, avec toggle accessible et sans écoute continue;
- transcription avec un moteur local derrière une interface stable;
- remise du texte à l'application cible ou fallback explicite et récupérable;
- widget minimal indiquant les états essentiels;
- configuration locale du microphone, du raccourci et du modèle;
- diagnostics locaux expurgés de contenu dicté;
- fonctionnement local sans compte, authentification ni réseau;
- aucune implémentation Cloud ou dépendance à une infrastructure distribuée.

Ce périmètre traduit les décisions D-01 à D-14 confirmées le 2026-08-09. Ses niveaux de performance et ses capacités OS restent conditionnés aux mesures et spikes décrits dans le [PRD MVP](PRD-MVP.md).

### V1 proposée

- couverture stable des trois familles de systèmes dans l'ordre macOS, Linux, Windows;
- dictionnaire personnel et profils contextuels;
- gestion robuste des modèles et mises à jour;
- historique textuel local opt-in, avec rétention configurable et suppression contrôlée;
- réécriture optionnelle avec retour déterministe au texte brut;
- accélérations matérielles validées par plateforme;
- Cloud ou synchronisation facultatifs et payants seulement après un nouveau cadrage; aucun compte ne devient requis pour le chemin local.

### Ultérieur

- moteurs ASR additionnels;
- fonctions d'équipe et d'administration;
- synchronisation multi-appareils;
- services d'entreprise, SSO ou facturation avancée;
- traitement contextuel enrichi, après threat model et consentement dédiés;
- mobile, si un nouveau cadrage le justifie.

### Non-objectifs actuels

- promettre une injection universelle sous Wayland;
- transmettre silencieusement audio, écran, texte accessible ou presse-papiers;
- lancer Redis, ClickHouse, Temporal, une file distribuée ou des microservices avant un besoin mesuré;
- remplacer une solution d'accessibilité médicale certifiée;
- conserver ou utiliser des dictées pour entraîner un modèle sans décision et consentement séparés;
- garantir des performances sans plateforme, matériel, langue, corpus et protocole de mesure définis;
- intégrer ou migrer une éventuelle application WPF externe sans inventaire et nouvel ADR; le produit est greenfield dans le périmètre actuel.

## 6. Registre des 14 décisions produit

L'utilisateur a accepté D-01 à D-14 exactement comme recommandées le 2026-08-09. La preuve de décision est tenue par le manager dans `docs/project-management/PHASE-00-PRODUCT-DECISIONS.md` et `CYCLE-20260809-02`.

| ID | Décision confirmée | Statut |
|---|---|---|
| D-01 | le nom définitif est **Fluent**, sous réserve d'une vérification marque/domaine avant publication | **CONFIRMÉE — 2026-08-09** |
| D-02 | le persona principal est le professionnel desktop à forte production écrite, sensible à la confidentialité | **CONFIRMÉE — 2026-08-09** |
| D-03 | la référence est macOS Apple Silicon si une machine de test est disponible; à défaut, Windows devient la référence pratique | **CONFIRMÉE — 2026-08-09** |
| D-04 | l'ordre des plateformes est macOS, puis Linux, puis Windows | **CONFIRMÉE — 2026-08-09** |
| D-05 | la langue du MVP est le français; les termes anglais/code du corpus ne constituent pas une promesse bilingue | **CONFIRMÉE — 2026-08-09** |
| D-06 | le minimum provisoire est 4 cœurs modernes, 8 Gio de RAM et 2 Gio libres, sans GPU dédié requis; la référence vise 16 Gio | **CONFIRMÉE — 2026-08-09** |
| D-07 | push-to-talk par défaut avec toggle accessible; aucune écoute continue au MVP | **CONFIRMÉE — 2026-08-09** |
| D-08 | zero-history par défaut; historique texte local opt-in à rétention configurable; aucun audio persisté par défaut | **CONFIRMÉE — 2026-08-09** |
| D-09 | aucun compte n'est requis pour installer et utiliser le chemin local | **CONFIRMÉE — 2026-08-09** |
| D-10 | le Cloud est absent du MVP; seuls ses contrats/ports existent, sans implémentation distante | **CONFIRMÉE — 2026-08-09** |
| D-11 | le dépôt reste public | **CONFIRMÉE — 2026-08-09** |
| D-12 | le code est sous licence Apache-2.0; modèles, données et marques conservent leurs licences propres | **CONFIRMÉE — 2026-08-09** |
| D-13 | le cœur local est gratuit; les futurs services Cloud/synchronisation facultatifs seront payants | **CONFIRMÉE — 2026-08-09** |
| D-14 | Fluent est greenfield; aucune migration WPF sans dépôt ou inventaire fourni | **CONFIRMÉE — 2026-08-09** |

### Synthèse des statuts

- décisions utilisateur confirmées parmi les 14: **14**;
- décisions ouvertes parmi D-01 à D-14: **0**;
- validations encore nécessaires: disponibilité de la machine Apple Silicon et activation éventuelle du fallback Windows, recherche d'usage, vérification marque/domaine, corpus français, versions OS et performances mesurées;
- toute éventuelle base WPF externe est hors périmètre; sa découverte peut déclencher un nouvel ADR sans rouvrir silencieusement D-14.

## 7. Preuves et validations restantes

- acceptation explicite et datée de D-01 à D-14: acquise le 2026-08-09;
- entretiens ou tests de problème pour valider les hypothèses du persona principal sans remettre en cause sa priorisation;
- disponibilité d'une machine macOS Apple Silicon de référence pour les benchmarks, ou enregistrement du passage à Windows comme référence pratique;
- protocole et corpus nommés pour les métriques ASR;
- test de faisabilité des hotkeys, permissions, focus et insertion sur chaque environnement ciblé;
- threat model et contrôles de rétention validés avant toute collecte ou synchronisation;
- vérification de compatibilité entre Apache-2.0, dépendances, modèles et actifs distribués;
- inventaire de toute éventuelle base WPF externe avant qu'un nouvel ADR puisse envisager son intégration.

## 8. Documents liés

- [PRD MVP](PRD-MVP.md)
- [Personas](PERSONAS.md)
- [Matrice plateformes et capacités](PLATFORM-CAPABILITIES.md)
- [Backlog initial](BACKLOG.md)
- [ADR-0001 — Stack cible](../architecture/ADR-0001-STACK-CIBLE.md)
