# Vision produit de Fluent

Statut: **cadrage proposé — décisions utilisateur requises**

Cycle: `CYCLE-20260809-01`

Phase: `PHASE-00`

Dernière mise à jour: 2026-08-09

## 1. Intention

Fluent est le nom de travail d'une application desktop de dictée vocale multiplateforme. Elle vise à transformer une parole courte en texte utilisable dans l'application active, avec un chemin local maîtrisable et des intégrations Cloud qui ne deviennent jamais implicites.

La promesse candidate est:

> Dicter dans ses outils quotidiens avec une latence prévisible, un résultat récupérable et un contrôle explicite des données.

Cette formulation décrit une direction, pas encore un engagement commercial. Le nom définitif, le segment principal, la plateforme de référence, les langues, le matériel minimal et le modèle économique restent à décider.

## 2. Problème à résoudre

Les solutions de dictée généralistes imposent souvent au moins un des compromis suivants:

- dépendance réseau sur le chemin critique;
- comportement d'insertion différent selon le système, l'application ou le compositor;
- résultat réécrit sans moyen évident de retrouver le texte brut;
- permissions et flux de données peu visibles;
- consommation de ressources inadaptée aux machines modestes;
- compte ou service distant requis avant de pouvoir essayer le produit.

Fluent doit démontrer, par des mesures et non par une promesse générale, quels compromis il élimine réellement sur chaque plateforme supportée.

## 3. Principes candidats et contraintes actuelles

| Élément | Nature actuelle | Conséquence de cadrage |
|---|---|---|
| Aucune donnée audio ne quitte la machine sans consentement explicite | contrainte normative du dépôt | tout flux distant doit être opt-in, visible et testable |
| Approche local-first | direction inscrite dans la mission, confirmation produit encore requise | le MVP candidat garde un chemin de dictée local indépendant d'un service distant |
| Texte brut récupérable | proposition produit | toute réécriture doit conserver un retour déterministe au brut si cette proposition est confirmée |
| Push-to-talk | proposition produit | ne pas exclure le mode toggle ou l'écoute continue avant arbitrage |
| Injection puis fallback presse-papiers | proposition produit | ne pas promettre l'injection universelle, en particulier sous Wayland |
| Indicateur visible pendant la capture et le traitement | proposition produit | à confirmer avec les exigences UX et d'accessibilité |
| Aucun compte ou Cloud obligatoire | proposition produit | l'architecture doit permettre cette option sans en faire encore une décision MVP |
| Aucune rétention audio | proposition produit | la politique de rétention complète reste ouverte |

## 4. Valeur différenciante candidate

1. **Contrôle**: l'utilisateur sait quand le microphone est actif, quel traitement est choisi et si une donnée quitte l'appareil.
2. **Résilience**: un échec d'injection ou de réécriture ne doit pas faire perdre une transcription déjà obtenue.
3. **Compatibilité honnête**: chaque capacité est annoncée par environnement; Wayland dispose d'un fallback explicite plutôt que d'une garantie universelle.
4. **Performance mesurée**: armement, fin-de-parole, temps réel, mémoire, CPU et taux d'insertion sont mesurés sur un matériel nommé.
5. **Architecture progressive**: le Cloud, la synchronisation, les moteurs additionnels et l'infrastructure distribuée ne sont ajoutés qu'après un besoin validé.

Ces cinq points sont des axes de conception proposés. Ils ne remplacent pas la confirmation du segment et de la proposition de valeur.

## 5. Horizons de produit

### MVP proposé

- un parcours de dictée desktop de bout en bout sur la plateforme de référence à choisir;
- capture contrôlée par l'utilisateur;
- transcription avec un moteur local derrière une interface stable;
- remise du texte à l'application cible ou fallback explicite et récupérable;
- widget minimal indiquant les états essentiels;
- configuration locale du microphone, du raccourci et du modèle;
- diagnostics locaux expurgés de contenu dicté;
- aucune dépendance à une infrastructure distribuée.

Ce périmètre ne devient contractuel qu'après les arbitrages D-01 à D-14 et la validation des métriques proposées dans le [PRD MVP](PRD-MVP.md).

### V1 proposée

- couverture stable des trois familles de systèmes dans l'ordre qui sera décidé;
- dictionnaire personnel et profils contextuels;
- gestion robuste des modèles et mises à jour;
- historique textuel local si la politique de rétention l'autorise;
- réécriture optionnelle avec retour déterministe au texte brut;
- accélérations matérielles validées par plateforme;
- Cloud, compte ou synchronisation uniquement si D-09 et D-10 les autorisent.

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
- migrer une éventuelle application WPF externe avant d'en avoir établi l'existence et le périmètre.

## 6. Registre des 14 décisions produit

Le statut **ouvert** signifie qu'une décision explicite de l'utilisateur ou du sponsor manque. Un fait observé ou une recommandation ne ferme jamais la décision à lui seul.

| ID | Sujet | Fait ou signal disponible | Recommandation candidate | Statut |
|---|---|---|---|---|
| D-01 | Nom définitif: Fluent, Leanvide ou autre | les documents emploient `Fluent`; le dépôt est nommé `leanvibeApp` | utiliser `Fluent` comme nom de travail jusqu'à arbitrage marque/domaine | **ouverte**; `Fluent` est inféré comme nom de travail, pas confirmé comme nom définitif |
| D-02 | Utilisateur cible principal | aucun entretien, segment ou preuve d'usage n'est versionné | commencer par le professionnel desktop qui rédige fréquemment et valorise la confidentialité | **ouverte**; persona principal seulement hypothétique |
| D-03 | Plateforme de référence | la mission cite macOS, Linux et Windows sans référence prioritaire | choisir une seule combinaison OS + matériel pour les budgets et le premier parcours E2E | **ouverte** |
| D-04 | Ordre Windows/macOS/Linux | la roadmap ordonne les phases macOS, Linux, puis Windows, sans décision produit documentée | décider selon utilisateurs cibles, machines de test et risques d'intégration | **ouverte**; l'ordre de roadmap est un plan, pas une confirmation utilisateur |
| D-05 | Langues du MVP | aucune liste validée | limiter le MVP aux langues disposant d'un corpus de test maintenable | **ouverte** |
| D-06 | Matériel minimal | aucun CPU, RAM, architecture ou accélérateur de référence n'est nommé | définir un plancher sans GPU et un matériel de référence avant de fixer la latence | **ouverte** |
| D-07 | Push-to-talk ou écoute continue | le push-to-talk est une préférence de cadrage | retenir provisoirement le push-to-talk pour minimiser capture et ambiguïté, tout en évaluant toggle | **ouverte** |
| D-08 | Politique d'historique | aucune durée, catégorie ou valeur par défaut n'est confirmée | ne pas retenir l'audio; rendre l'historique texte local, désactivable et effaçable si confirmé | **ouverte**; l'absence de rétention audio est une proposition |
| D-09 | Compte obligatoire ou non | l'architecture prévoit un Cloud facultatif | permettre l'essai et le chemin local sans compte | **ouverte** |
| D-10 | Cloud présent ou absent du MVP | le Cloud est prévu comme option architecturale future | garder le Cloud hors chemin critique; décider séparément s'il existe dans le MVP | **ouverte** |
| D-11 | Dépôt public ou privé | le dépôt GitHub actuel a été vérifié **public** par le manager | confirmer que cette exposition correspond à l'intention avant tout code ou actif sensible | **ouverte**; visibilité actuelle confirmée, politique future non confirmée |
| D-12 | Licence du code | aucune licence n'a été détectée dans le dépôt | choisir une licence avant d'accepter des contributions ou de présenter le code comme open source | **ouverte** |
| D-13 | Modèle économique | aucun modèle validé n'est versionné | différer la facturation jusqu'à validation du segment et des coûts locaux/Cloud | **ouverte** |
| D-14 | Existence d'une application WPF à migrer | aucun `.cs`, `.csproj`, `.sln` ou `.xaml` n'existe dans ce dépôt | traiter Fluent comme greenfield tant qu'un dépôt ou inventaire WPF externe n'est pas fourni, sans conclure qu'il n'existe pas | **ouverte**; absence locale confirmée, existence externe inconnue |

### Synthèse des statuts

- décisions utilisateur confirmées parmi les 14: **0**;
- décisions inférées mais non confirmées: D-01 (nom de travail) et D-02 (persona candidat), ainsi que des recommandations sur D-07 à D-10;
- décisions ouvertes: **D-01 à D-14**;
- faits confirmés indépendants d'une décision: dépôt actuel public, aucune licence détectée, aucun artefact WPF détecté dans ce dépôt.

## 7. Preuves attendues pour fermer le cadrage

- réponse explicite et datée pour chaque décision D-01 à D-14;
- entretiens ou tests de problème pour le persona principal;
- plateforme et matériel de référence disponibles pour les benchmarks;
- protocole et corpus nommés pour les métriques ASR;
- test de faisabilité des hotkeys, permissions, focus et insertion sur chaque environnement ciblé;
- threat model et politique de rétention validés avant toute collecte ou synchronisation;
- décision de licence cohérente avec le statut public du dépôt;
- inventaire de l'éventuelle base WPF externe avant toute stratégie de migration.

## 8. Documents liés

- [PRD MVP](PRD-MVP.md)
- [Personas](PERSONAS.md)
- [Matrice plateformes et capacités](PLATFORM-CAPABILITIES.md)
- [Backlog initial](BACKLOG.md)
- [ADR-0001 — Stack cible](../architecture/ADR-0001-STACK-CIBLE.md)
