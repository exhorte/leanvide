# Flux de donnees local et Cloud

Statut: cartographie logique Phase 00. Les composants et fournisseurs exacts seront confirmes par ADR et par les implementations.

Regle normative: **aucune donnee audio ou contextuelle ne quitte la machine sans consentement explicite et comprehensible avant le transfert**.

Voir aussi [Threat model v0](THREAT-MODEL-V0.md), [Classification](DATA-CLASSIFICATION.md) et [Baseline de confidentialite](PRIVACY-BASELINE.md).

## Zones et conventions

| Zone | Description | Niveau de confiance |
|---|---|---|
| Z0 | Microphone, application cible, API d'accessibilite, capture ecran, presse-papiers | Externe au processus Fluent; contenu potentiellement C3. |
| Z1 | Coeur Rust et adaptateurs OS | Autorite locale pour capture, traitement, permissions et effacement. |
| Z2 | WebView/UI et IPC Tauri | Moins privilegiee; aucune lecture directe de secret ou buffer audio brut. |
| Z3 | Stockage local, coffre OS, repertoire des modeles | Persistant; acces et integrite a proteger. |
| Z4 | API Fluent Cloud facultative | Distante; acces seulement apres consent gate et authentification si necessaire. |
| Z5 | Fournisseur ASR/LLM, telemetrie ou autre sous-traitant | Frontiere tierce distincte, affichee avant activation. |
| Z6 | CI, depot d'artefacts, CDN updater/modeles | Canal de distribution non autorise a recevoir du contenu utilisateur. |

Classes: C0 publique, C1 technique interne, C2 personnelle, C3 contenu sensible, C4 secret. Une donnee derivee herite de la classe la plus restrictive de ses sources.

## Vue d'ensemble

```text
                         (opt-in specifique)
Microphone --C3--> coeur local -----------+------> Cloud ASR/LLM --> resultat
                      |                    |
Accessibilite/OCR ----+                    +------> sync optionnelle
                      |
                      +--> ASR local --> texte brut --> transformation locale
                                              |
Application cible <-- injection/clipboard <--+
                                              |
                                      historique local optionnel

CI/CD -- artefact + signature --> updater/model manager --> binaire/modele local
                           aucun contenu utilisateur sur ce chemin
```

## DF-01 — Dictee et transcription locales

```text
Z0 microphone -> permission OS -> Z1 buffer borne -> VAD/ASR local
              -> transcription brute -> transformation locale -> injection ou affichage
```

| Element | Exigence |
|---|---|
| Entrees | Audio C3; eventuellement langue et hints C2-C3. |
| Persistance | Audio en memoire seulement par defaut; aucun fichier temporaire implicite. Texte persiste uniquement selon le choix d'historique. |
| Reseau | Zero egress. Le comportement doit etre verifie avec un test reseau automatisable. |
| Logs | Etats, durees et codes d'erreur bornes; jamais audio, transcription, hint ou nom de document. |
| Fin de vie | Arret/revocation/annulation vide les buffers et empeche toute reprise automatique. |
| Fallback | Modele absent: expliquer le telechargement; ne jamais basculer silencieusement vers le Cloud. |

## DF-02 — Cible, injection et presse-papiers

```text
Z0 cible -> Z1 identifiant opaque de cible
texte C3 -> validation cible -> injection directe
                         \-> clipboard temporaire -> collage ou copie seule
```

Le coeur capture le minimum necessaire pour identifier la cible et la revalide juste avant l'injection. Si la cible est ambigue, differente, protegee ou inaccessible, Fluent ne colle pas et propose une copie seule explicite. Sous Wayland, le fallback clipboard est une capacite normale et visible.

Le clipboard n'est pas un stockage confidentiel. Fluent ne lit ni ne conserve son contenu preexistant sauf si une future strategie de restauration, explicitement documentee et testee, le requiert. Une restauration ou un effacement automatique ne s'effectue que si la valeur placee par Fluent n'a pas change; la politique exacte reste ouverte.

## DF-03 — Contexte d'accessibilite

```text
Z0 element cible -> API accessibilite -> filtre/minimisation Z1
                  -> hints locaux C2-C3 -> ASR/formatage local
                  -> Cloud uniquement apres opt-in contexte distinct
```

Le nom d'application, le type de champ et une selection bornee peuvent servir de hints. Le texte alentour n'est pas un historique implicite. Les champs de mot de passe/proteges et les applications exclues ne sont jamais lus. Le refus de permission n'empeche pas la transcription locale.

## DF-04 — OCR facultatif

```text
Z0 region d'ecran explicitement bornee -> capture C3 -> OCR local -> hints minimises
```

L'OCR plein ecran reste reporte jusqu'a un threat model et un consentement dedies. Par defaut, aucun screenshot n'est cree ni conserve. Un futur envoi d'image ou de texte OCR au Cloud demanderait un opt-in separe indiquant region, contenu, destination et retention; l'opt-in Cloud ASR ne suffit pas.

## DF-05 — Dictionnaire, profils et historique locaux

```text
UI Z2 -> validation IPC Z1 -> stores separes Z3
historique C3 | dictionnaire C2-C3 | profils C2 | preferences C1-C2
```

Les stores sont separables pour permettre zero-history, export et suppression granulaires. Des migrations interrompues ne doivent ni perdre ni republier des donnees supprimees. Les sauvegardes et caches font partie du perimetre de suppression. Aucun dictionnaire ou historique n'est synchronise sans opt-in de sync distinct.

## DF-06 — Modeles locaux

```text
catalogue Z6 -> manifeste signe/digest -> telechargement partiel Z3
             -> verification -> renommage atomique -> chargement local Z1
```

Les requetes peuvent contenir version d'application, plateforme et modele demande (C1); jamais audio, transcription, dictionnaire, titre de fenetre ou identifiant de compte inutile. Un modele dont signature, digest, taille, format ou licence ne correspond pas est rejete. L'ancien modele sain reste disponible lorsque compatible.

## DF-07 — ASR ou reecriture Cloud facultative

```text
audio/texte/contexte selectionne C3
 -> ecran de consentement (finalite, donnees, destination, retention, cout)
 -> TLS -> Z4 passerelle -> Z5 fournisseur declare -> resultat C3 -> local
```

Les opt-in ASR Cloud, reecriture Cloud et contexte Cloud sont separes. La requete contient seulement les champs necessaires. Les retries sont bornes et ne survivent pas a une revocation. Audio et contexte ne sont pas conserves par defaut apres le traitement; tout TTL technique non nul doit etre chiffre, affiche et approuve. Une erreur rend le texte brut deterministe et ne declenche aucun autre fournisseur silencieusement.

## DF-08 — Synchronisation Cloud facultative

```text
stores locaux selectionnes Z3 -> opt-in sync -> chiffrement transport
 -> Z4 compte/store Cloud -> autres appareils autorises
```

L'utilisateur choisit les categories synchronisees. Audio brut et buffers OCR ne sont jamais synchronises par defaut. Les conflits sont explicites ou resolus par une regle documentee; les suppressions utilisent des tombstones afin d'eviter la resurrection. Deconnexion/revocation stoppe les nouveaux transferts et permet de supprimer les donnees distantes selon la politique publiee.

Le choix entre chiffrement au repos gere serveur et chiffrement applicatif de bout en bout reste ouvert. L'interface ne doit pas employer le terme "chiffre de bout en bout" si un service peut acceder au contenu en clair.

## DF-09 — Telemetrie, crashs et diagnostics

```text
evenements allowlist C1-(C2 minimal) -> redaction locale -> opt-in
 -> Z4/Z5 observabilite -> retention bornee
```

Audio, transcription, dictionnaire, contenu OCR/accessibilite/clipboard, titre de fenetre, chemin personnel, credential et payload IPC sont interdits. Le mode zero-telemetry n'emet rien, y compris au crash. Un diagnostic joint manuellement est previsualise et expurge localement. Les decisions sur fournisseur, schema, retention et opt-in restent ouvertes; en leur absence, aucun endpoint de telemetrie n'est active.

## DF-10 — Authentification et credentials

```text
login systeme/navigateur -> Z4 auth -> token court C4
refresh token C4 -> coffre natif Z3 -> Z1 uniquement
```

Les tokens ne transitent pas vers la WebView au-dela d'un handle ou etat minimal, ne sont jamais journalises et sont scopes au service. Deconnexion locale efface les tokens; deconnexion globale et revocation serveur sont requises avant le gate Cloud. Les cles de service et de signature ne sont jamais distribuees au client.

## DF-11 — Updater et supply chain

```text
source/lockfiles -> CI isolee -> artefact + provenance/signature Z6
 -> client -> verification signature/version/digest -> installation atomique
```

Ce flux ne partage aucun endpoint ou stockage avec le contenu utilisateur. TLS ne remplace pas la signature. Le client refuse manifeste non signe, downgrade non autorise, artefact inattendu ou cle revoquee. Un staged rollout et un retrait de version doivent etre possibles sans desactiver la verification.

## Matrice egress et consentement

| Flux sortant | Etat par defaut | Consentement requis | Revocation |
|---|---|---|---|
| Telechargement updater/modeles | Autorise pour donnees C0-C1 minimales; choix d'auto-download a decider | Information claire; aucun contenu utilisateur | Desactive les controles automatiques selon politique sans casser l'usage local existant. |
| ASR Cloud | Desactive | Opt-in ASR, donnees audio, destination et retention | Stop immediat, annule retries et purge files locales. |
| Reecriture Cloud | Desactive | Opt-in reecriture; texte transmis et fournisseur | Retour au texte brut local; aucun failover tiers. |
| Contexte vers Cloud | Desactive meme si ASR/reecriture active | Opt-in distinct accessibilite/OCR | Stop immediat, traitement sans contexte. |
| Synchronisation | Desactive | Opt-in par categorie | Stop nouveaux transferts; offre suppression distante. |
| Telemetrie/crash | Desactive tant que politique non arbitree | Opt-in distinct et revocable | Endpoint coupe et file locale supprimee. |

## Retention par etape

| Donnee | Local par defaut | Cloud par defaut | Exigence de purge |
|---|---|---|---|
| Audio brut | Memoire le temps de la dictee/ASR | Aucun transfert en mode local; zero retention apres ASR Cloud | Annulation, fin de traitement, revocation et cleanup apres crash. |
| Contexte accessibilite/OCR | Memoire de la dictee uniquement | Aucun transfert sans opt-in distinct; zero retention apres traitement | Fin/annulation et suppression des caches. |
| Transcription | Affichage/injection; historique selon decision utilisateur | Seulement service choisi; pas de stockage implicite | Zero-history immediat; suppression inclut index, caches et sauvegardes selon delai publie. |
| Dictionnaire/profils | Persistant local jusqu'a suppression | Aucun sans sync opt-in | Suppression locale et distante convergente. |
| Logs | Rotation bornee, contenu sensible interdit | Aucun si zero-telemetry | Effacement avec diagnostics; duree chiffree a decider. |
| Tokens | Coffre OS jusqu'a logout/revocation | Hash/session selon auth | Revocation et expiration bornees. |

Les durees chiffrees non encore decidees ne sont pas inventees dans cette baseline. Jusqu'a decision, aucun stockage Cloud de contenu C3 n'est autorise au-dela du traitement en cours et aucun historique local implicite n'est suppose.

## Preuves attendues

- Capture reseau avec tous les opt-in desactives: aucun contenu C2-C4 sortant.
- Tests par paire d'opt-in montrant qu'aucun consentement n'en active un autre.
- Canaris synthetiques absents des logs, telemetry payloads, crash reports et noms de fichiers.
- Tests annulation/revocation pendant capture, retry Cloud, sync et upload diagnostic.
- Tests target-switch, champs proteges et fallback Wayland/clipboard.
- Verification negative des signatures/digests updater et modeles.
- Inventaire reproductible de toutes les copies apres suppression.
