# Definition of Done — qualite et release

## Regle

Un increment n'est termine que si les elements applicables ci-dessous sont
prouves. « Fonctionne sur mon poste », une capture non datee ou un commentaire
de revue ne sont pas des preuves suffisantes. Les cibles de
[PERFORMANCE-BUDGETS.md](PERFORMANCE-BUDGETS.md) restent proposees jusqu'a la
validation prototype; leur existence n'autorise pas a declarer une performance
confirmee.

## DoD commune a tout increment

- Le perimetre, proprietaire de fichier, commit et rollback sont connus; les
  contrats modifies sont documentes avant les implementations dependantes.
- Les tests unitaires, integration et manuels applicables passent; les tests
  non applicables sont justifies et traces.
- Les commandes de validation, l'environnement, la sortie et l'artefact sont
  conserves selon [MEASUREMENT-PLAN.md](MEASUREMENT-PLAN.md).
- Aucun secret, audio, texte dicte, presse-papiers ni autre donnee sensible
  n'apparait dans code, fixtures, logs, captures ou artefacts.
- Les erreurs sont actionnables : message utilisateur, fallback documente et
  diagnostic minimise. Aucune reussite d'injection ou de transcription n'est
  revendiquee sans oracle.
- Le diff est inspecte et `git diff --check` est propre. Les dependances,
  licences et changements de paquet sont revus lorsqu'ils sont dans le scope.

## DoD pour le pipeline local

- Capture, hotkey et VAD sont couverts par fixtures deterministes et par une
  campagne microphone; le callback ne fait ni I/O synchrone ni allocation ou
  verrou bloquant evitable.
- La perte d'echantillons est mesuree par sequences de trames, pas deduite de
  l'absence de plainte. Les trous et conditions de charge sont publies.
- ASR local est execute hors ligne avec le moteur, modele, quantification,
  corpus et normaliseur identifies. WER/CER et RTF separent decode, VAD et
  post-traitement/re-ecriture.
- La mesure utilisateur `fin de parole -> texte brut disponible` est publiee
  separement du flush PTT/VAD, de l'injection et de toute reecriture, avec le
  scenario de 10 s, p50/p95, corpus, langue, modele et materiel declares.
- En cas d'erreur de modele, de permission ou de micro, l'etat final est sur
  et comprehensible; aucune fuite audio vers le Cloud n'est possible par defaut.

## DoD plateforme et injection

| Plateforme | Preuve minimale | Fallback obligatoire |
|---|---|---|
| Windows | permission, hotkey, cible capturee/revalidee, insertion verifiee dans les cibles testees | clipboard et message lorsque focus/injection echoue |
| macOS | permissions Microphone/Accessibilite expliquees, event path et insertion verifies | guidance de permission puis clipboard si necessaire |
| Linux X11 | hotkey, cible et clipboard/injection verifies pour le serveur X cible | clipboard explicite quand la cible refuse l'insertion |
| Linux Wayland | compositor et portals/capabilities declares; aucun support universel presume | clipboard prepare et instruction visible si aucune API autorisee |

La cible est consideree reussie seulement si le texte attendu est dans la bonne
fenetre, une seule fois. Les applications securisees ou non cooperatives restent
dans la matrice comme exclusions testees, avec fallback, pas comme lignes
supprimees.

## DoD performance et fiabilite

- Les campagnes de latence, RTF, CPU, RSS, demarrage, disque et pertes audio
  referencent le materiel de [PERFORMANCE-BUDGETS.md](PERFORMANCE-BUDGETS.md)
  et publient percentiles, unites, repetitions et artefacts bruts.
- Les seuils ne sont qualifiants qu'apres prototype. Avant cela, le livrable est
  la baseline reproductible et l'ecart a la cible proposee, jamais un « PASS »
  produit sans decision.
- Une regression >= 10 % contre baseline equivalente est ouverte/qualifiee
  avant merge. Une regression qui fait franchir un budget de release est un
  `FAIL` sauf waiver avec responsable, date d'expiration et plan de retour.
- Les sessions crash-free indiquent definition de session, taille d'echantillon,
  borne inferieure unilaterale a 95 % et collecte consentie. L'absence de crash sur une
  petite campagne ne prouve pas un taux de fiabilite.

## DoD CI, packaging et release

- CI reproductible depuis un clone propre, lockfiles et checksums verifies.
  La matrice OS qui a execute le test est jointe au resultat.
- Les packages de test sont identifies par version, commit et hash. Les modeles
  ont manifeste, taille, checksum, espace libre preflight et reprise/erreur
  testees.
- Les permissions, signatures/notarisation et updater sont verifies avant une
  release pour chaque plateforme concernee; les limites Wayland sont publiees.
- Les crashs, echecs d'injection, latence et telemetrie eventuelle respectent le
  consentement et la minimisation. Un mode local complet reste utilisable sans
  compte ni reseau.

## Stop conditions QA

QA ne demande pas un correctif sur un echec seulement descriptif. Il doit
d'abord fournir un cas stable : commande, environnement, sortie, `run-id` et
artefact. Apres trois tentatives sur le meme blocage, ou pour une flakiness
systemique/rollback complexe, le sujet est escalade au manager avec preuves et
prochaine decision requise.

Un item est `BLOCKED` lorsque la permission utilisateur, decision produit,
capability Wayland ou baseline prototype manque. Il n'est pas artificiellement
marque termine par une exclusion silencieuse.
