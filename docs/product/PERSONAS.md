# Personas de cadrage

Statut: **hypothèses à valider**

Décision liée: `D-02 — utilisateur cible principal`

Référence: [VISION.md](VISION.md)

## 1. Règle d'usage

Ces personas structurent la recherche et les scénarios de test. Ils ne sont pas des segments confirmés: aucun entretien, volume de marché, usage observé ou volonté de payer n'est encore versionné dans le dépôt.

La Phase 00 doit sélectionner un persona principal et documenter les preuves. Tant que D-02 reste ouverte, le backlog ne doit pas transformer l'un de ces profils en vérité produit.

## 2. Persona candidat A — professionnel desktop à forte production écrite

**Rôle hypothétique:** développeur, consultant, chef de projet, créateur ou opérateur qui rédige plusieurs fois par jour dans plusieurs applications.

### Situation

- alterne IDE, navigateur, messagerie, documents et outils de suivi;
- veut accélérer brouillons, réponses, notes et prompts;
- peut travailler avec une connexion instable;
- refuse qu'un échec d'insertion fasse perdre ce qui vient d'être dicté.

### Besoins supposés

- déclenchement rapide sans changer de fenêtre;
- texte récupérable après un échec de focus ou d'injection;
- raccourci configurable et non conflictuel;
- latence prévisible sur son matériel réel;
- dictionnaire de noms propres et termes métier;
- transparence sur le traitement local ou distant.

### Frictions à tester

- fatigue ou inconfort du push-to-talk;
- erreurs dans les champs riches, terminaux, IDE et applications virtualisées;
- charge CPU, mémoire et batterie du modèle local;
- acceptabilité d'un modèle à télécharger;
- gain réel face au clavier et aux outils déjà disponibles.

### Scénarios de validation

1. Dicter une réponse courte dans un navigateur.
2. Dicter un paragraphe dans un document riche.
3. Dicter un prompt ou commentaire de code contenant noms propres et termes anglais/français.
4. Perdre le focus avant la remise et récupérer le texte sans redicter.
5. Utiliser le produit hors ligne, si D-09/D-10 le confirment.

### Signal de confirmation proposé

- usage récurrent observé sur au moins trois types d'applications;
- gain perçu malgré le temps de correction;
- importance déclarée et démontrée du local ou du fallback;
- matériel représentatif disponible pour les benchmarks.

## 3. Persona candidat B — utilisateur sensible à la confidentialité

**Rôle hypothétique:** professionnel manipulant des données confidentielles, personnelles ou contractuelles, sans supposer une conformité réglementaire non démontrée.

### Situation

- travaille sur des textes qui ne doivent pas être envoyés par défaut à un tiers;
- doit comprendre quelles données sont capturées et conservées;
- peut être soumis à une politique d'entreprise restrictive;
- privilégie une fonction moins riche si son flux de données est clair.

### Besoins supposés

- chemin local vérifiable;
- consentement avant toute sortie audio;
- indicateur de capture impossible à confondre;
- politique de rétention lisible et suppression contrôlable;
- diagnostics sans contenu dicté;
- fonctionnement utile sans compte, si D-09 le confirme.

### Frictions à tester

- confusion entre « local-first », « mode local » et « aucune donnée ne sort »;
- permissions d'accessibilité trop larges par rapport au besoin;
- exposition par presse-papiers, fichiers temporaires, logs ou historique;
- impossibilité de faire approuver une application non signée ou un dépôt public sans licence claire.

### Scénarios de validation

1. Identifier avant la première dictée ce qui est local, stocké ou transmis.
2. Refuser une permission et comprendre la capacité perdue.
3. Effacer les données locales et vérifier le résultat.
4. Activer volontairement une option distante, puis revenir au chemin local.

### Limite

Ce persona ne permet pas de revendiquer une conformité médicale, juridique, financière ou sectorielle. Une telle cible exigerait des exigences et preuves dédiées.

## 4. Persona candidat C — utilisateur de Linux sous environnements variés

**Rôle hypothétique:** utilisateur technique sur Linux X11 ou Wayland, disposé à accepter une dégradation documentée mais pas une promesse fausse.

### Situation

- utilise un compositor, une distribution et un environnement de bureau qui peuvent modifier hotkeys, focus et injection;
- connaît le presse-papiers mais attend un comportement explicite;
- peut installer des dépendances système, à condition qu'elles soient nommées;
- valorise le contrôle local et la sobriété.

### Besoins supposés

- matrice de compatibilité par session et compositor;
- détection de capacités plutôt qu'une simple détection « Linux »;
- fallback copie + collage utilisateur sous Wayland si nécessaire;
- diagnostics des portals, permissions et dépendances;
- packages et mises à jour adaptés à une cible réellement supportée.

### Frictions à tester

- hotkey réservée par le compositor;
- absence d'API universelle de focus/injection;
- permissions PipeWire/portal et sélection du microphone;
- dépendances WebKitGTK et variations de packaging;
- confusion entre support officiel, expérimental et communautaire.

### Scénarios de validation

1. Parcours complet sous X11 sur la distribution de référence.
2. Parcours sous Wayland avec méthode autorisée lorsqu'elle existe.
3. Fallback presse-papiers sans perte lorsque l'injection est indisponible.
4. Changement de session/compositor et diagnostic des capacités.

## 5. Persona ultérieur — administrateur d'organisation

**Hors MVP candidat.** Un responsable IT voudrait déployer, configurer et auditer Fluent sur un parc. Ses besoins potentiels sont signature, mises à jour contrôlées, politiques de réseau/rétention, inventaire de versions, SSO et support.

Ce persona n'est activé que si D-02 et D-13 établissent un segment entreprise. Il ne justifie pas un backend, SSO ou une télémétrie dans le MVP.

## 6. Anti-personas et non-objectifs

- utilisateur attendant une écoute ambiante permanente avant décision D-07;
- organisation exigeant une certification ou un déploiement on-premise non cadré;
- utilisateur mobile comme cible MVP;
- utilisateur exigeant l'injection universelle sous tout compositor;
- personne dépendant du produit comme dispositif médical ou d'accessibilité critique;
- équipe ayant besoin d'une collaboration temps réel ou d'un historique audio partagé.

## 7. Plan de recherche pour décider D-02

| Étape | Preuve attendue | Évite de conclure à partir de |
|---|---|---|
| 1. recruter des profils distincts | critères et source de recrutement documentés | proches de l'équipe uniquement |
| 2. observer les tâches actuelles | applications, fréquence, durée, corrections et échecs | préférence déclarée pour « l'IA » |
| 3. tester la proposition | arbitrage vitesse/précision/local/ressources | intention d'essai sans usage réel |
| 4. tester les risques | réaction aux permissions, au fallback et à la rétention | compréhension supposée des termes techniques |
| 5. sélectionner le persona principal | décision D-02 datée avec critères | taille de marché non sourcée |

Questions minimales:

- quelles tâches sont dictées aujourd'hui, à quelle fréquence et dans quelles applications?
- quels types d'erreurs coûtent le plus: reconnaissance, formatage, focus, perte du texte ou confidentialité?
- quel délai après la parole reste acceptable?
- quelle machine et quel système sont réellement utilisés?
- qu'est-ce qui interdirait le Cloud, un compte, une permission d'accessibilité ou un historique?
- le fallback « copier puis coller soi-même » reste-t-il utile et compréhensible?

## 8. Décision attendue

D-02 doit nommer:

- un persona principal;
- un problème prioritaire observable;
- les applications et environnements les plus fréquents;
- le compromis accepté entre latence, précision et ressources;
- les contraintes de confidentialité;
- un critère qui invaliderait le segment.
