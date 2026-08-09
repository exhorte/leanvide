# Versionnement et frontière IPC

- Statut: **Proposé — protocole candidat, non enregistré**
- Portée: WebView locale Tauri vers cœur Rust
- Baseline exécutable: health_check uniquement
- Finding lié: F-05 de
  [PHASE-01-SUPPLY-CHAIN-REVIEW.md](../security/PHASE-01-SUPPLY-CHAIN-REVIEW.md)

Ce document spécifie les règles à satisfaire avant toute extension de l'IPC.
Il NE crée ni seconde commande, ni permission, ni capability Tauri, ni seconde
WebView. Le protocole v1 décrit ci-dessous est un contrat de conception.

## 1. État observé et gel du registre

La fondation PHASE-01 contient exactement:

| Commande Tauri | Requête | Réponse | Données | Effet |
|---|---|---|---|---|
| health_check | aucune | objet exact status = ok et version string | C0 | lecture seule |

Le registre Rust contient seulement health_check. La configuration contient une
seule WebView locale main et aucune origine distante. Aucune capability Tauri
explicite ne borne encore une future commande applicative par fenêtre: les
commandes enregistrées sont accessibles par défaut aux WebViews locales. Cette
limite est actuellement compensée par l'unique commande publique et sans entrée;
elle devient bloquante avant une deuxième commande ou WebView.

Le contrat v0 health_check reste inchangé dans ce cycle. Il n'est pas enveloppé,
n'accepte aucun argument et ne doit recevoir ni hostname, chemin, détail natif,
identifiant utilisateur ou état de session.

## 2. Gate F-05 avant extension

Avant d'enregistrer une deuxième commande, un lot distinct DOIT:

1. déclarer le registre exhaustif commandes/événements, propriétaire et état
   métier autorisé;
2. créer une capability minimale par label de fenêtre et origine; aucune
   wildcard ni origine distante;
3. borner la taille, la profondeur, les collections et chaînes de chaque
   schéma avant désérialisation ou au point d'entrée le plus externe possible;
4. appliquer la CSP de production locale et prouver que devCsp ne fuit pas dans
   le build;
5. valider fenêtre, origine, version, type, taille, état et autorisation avant
   tout effet;
6. tester le refus depuis une fenêtre/origine non autorisée, les messages
   malformés, dupliqués, rejoués et hors état;
7. faire revoir par sécurité toute commande touchant capture, permission,
   cible, clipboard, fichier, modèle, credential ou C3;
8. maintenir le registre généré/contrôlé en CI afin qu'une commande Rust
   ajoutée sans capability et contrat échoue le build.

AppManifest::commands ou le mécanisme Tauri équivalent retenu doit refléter ce
registre. Ce document ne choisit pas son code d'intégration.

## 3. Principes du protocole v1 candidat

1. Le transport Tauri n'est pas l'autorité d'état; il transporte une intention
   vers SessionOrchestrator.
2. Toute requête, réponse ou événement v1 porte une enveloppe explicite.
3. Le protocole est local, authentifié par fenêtre/origine et sans endpoint
   réseau.
4. Aucun buffer audio, C4, handle natif brut ou cause d'erreur libre ne traverse
   l'IPC.
5. Le texte C3 ne traverse que pour un affichage/récupération explicitement
   autorisé; jamais dans un événement de progrès, une erreur ou un log.
6. Toute opération mutante a une politique de répétition déclarée. Une remise
   de texte n'est jamais retry automatique.
7. La validation est fail-closed: version, enum ou capability inconnue ne
   devient jamais un succès ou une permission.

## 4. Enveloppes logiques

La représentation JSON ci-dessous est illustrative et normative sur les champs,
pas sur le nom de la future commande de transport.

### 4.1 Requête

~~~json
{
  "protocol": { "major": 1, "minor": 0 },
  "kind": "request",
  "schema": { "name": "operation.name", "version": 1 },
  "requestId": "opaque-bounded-ascii",
  "payload": {}
}
~~~

### 4.2 Réponse réussie

~~~json
{
  "protocol": { "major": 1, "minor": 0 },
  "kind": "response",
  "schema": { "name": "operation.name.result", "version": 1 },
  "requestId": "opaque-bounded-ascii",
  "outcome": { "type": "ok", "payload": {} }
}
~~~

### 4.3 Réponse d'erreur

~~~json
{
  "protocol": { "major": 1, "minor": 0 },
  "kind": "response",
  "schema": { "name": "operation.name.result", "version": 1 },
  "requestId": "opaque-bounded-ascii",
  "outcome": {
    "type": "error",
    "error": {
      "domain": "Contract",
      "code": "CONTRACT_UNSUPPORTED",
      "retryable": false,
      "recoverability": "None",
      "messageKey": "error.contract.unsupported_schema",
      "safeDetails": {}
    }
  }
}
~~~

### 4.4 Événement

~~~json
{
  "protocol": { "major": 1, "minor": 0 },
  "kind": "event",
  "schema": { "name": "event.name", "version": 1 },
  "streamId": "opaque-bounded-ascii",
  "sequence": 42,
  "stateRevision": 17,
  "payload": {}
}
~~~

Un message contient exactement un outcome ok ou error. Les unions ambiguës,
champs doublons et valeurs non finies sont rejetés.

## 5. Sémantique des champs

| Champ | Règle |
|---|---|
| protocol.major | entier positif; toute rupture de lecture/sémantique l'incrémente |
| protocol.minor | ajout compatible de réponse/événement; ne rend jamais un champ de requête requis |
| kind | enum fermée request/response/event |
| schema.name | identifiant ASCII allowlist, jamais fourni librement à un dispatch dynamique |
| schema.version | version entière du payload; changement incompatible crée une nouvelle version |
| requestId | unique dans une fenêtre de déduplication du processus; non dérivé de C2-C4 |
| streamId | identifie un flux logique sans encoder SessionId brut ou contenu |
| sequence | strictement croissante par stream; un gap impose resynchronisation |
| stateRevision | révision monotone de l'état core; les anciennes révisions ne remplacent jamais une récente |
| payload | structure typée, bornée et spécifique au schéma |
| safeDetails | clés/valeurs allowlist C0-C1; pas de cause native ou texte utilisateur |

Les horodatages métier ne traversent pas comme horloge murale si une durée ou
une révision suffit. Les mesures monotones restent dans leur domaine d'horloge;
une UI ne calcule pas de benchmark en mélangeant des horloges.

## 6. Catalogue de schémas

Avant implémentation, chaque ligne future du catalogue doit fixer:

| Propriété obligatoire | Question à trancher |
|---|---|
| direction et nom | requête, réponse ou événement explicitement allowlisté |
| versions | versions de schéma acceptées/émises |
| fenêtre/origine | labels exacts autorisés |
| état | états de [STATE-MACHINE.md](STATE-MACHINE.md) dans lesquels le message est légal |
| classification | C0-C4 maximale par champ |
| limites | bytes sérialisés, profondeur, longueur chaînes, cardinalité tableaux/maps |
| mutation | read-only, idempotente, at-most-once ou non répétable |
| délai | timeout et comportement après expiration |
| erreurs | codes fermés et Recoverability |
| redaction | champs admissibles en diagnostic; valeur sensible interdite |

Tant que cette ligne n'existe pas et n'est pas revue, le message est
UnauthorizedSchema. Les valeurs exactes de taille/timeout du futur protocole
restent des paramètres de spike; l'absence d'une borne bloque l'enregistrement.

## 7. Compatibilité

### 7.1 Règles dans un major

- Ajouter un champ optionnel à une réponse ou un événement est compatible si
  une valeur absente conserve la sémantique antérieure.
- Les récepteurs peuvent ignorer ces seuls champs additifs documentés.
- Les requêtes de contrôle rejettent par défaut les champs inconnus afin
  d'éviter une interprétation d'autorisation divergente. Une extension de
  requête utilise une nouvelle schema.version.
- Ajouter une valeur d'enum est compatible seulement si le récepteur possède
  un cas Unknown fail-closed. Unknown ne vaut jamais Granted, Supported,
  Confirmed ou Retryable.
- Renommer/supprimer un champ, changer type/unité, rendre un champ requis,
  modifier un défaut ou réinterpréter un résultat est incompatible et exige une
  nouvelle schema.version; si plusieurs schémas ne peuvent coexister, un nouveau
  protocol.major.

Un minor plus récent est accepté uniquement si le schema.name/version est
connu et si tous les champs requis le sont. Sinon UnsupportedSchema est rendu
sans effet. Un minor plus ancien reste accepté tant que sa version figure
explicitement au catalogue; il n'existe pas de règle implicite « N-1 ».

### 7.2 Packaging, mise à jour et rollback

Le MVP bundle UI et core ensemble. La politique normale est donc une matrice
exacte UI/core testée par build, pas une compatibilité illimitée entre versions.
Un mismatch échoue explicitement et health_check v0 reste disponible au
diagnostic.

Le rollback IPC consiste à revenir au package complet précédent. Aucun message
IPC ou résultat terminal n'est persisté comme journal de migration. Si une
future mise à jour dissocie UI et core, elle exigera un nouvel ADR et au moins
une fenêtre de double lecture prouvée.

Le passage à un nouveau major doit:

1. documenter la matrice producteurs/consommateurs;
2. ajouter les golden fixtures positives/négatives;
3. prouver l'erreur de mismatch;
4. conserver l'ancien major uniquement pour une durée/version explicitement
   annoncée;
5. supprimer l'ancien chemin après preuve d'absence de clients, sans parsers
   permissifs permanents.

## 8. Validation et limites

L'ordre de validation est:

1. fenêtre, origine et capability Tauri;
2. taille brute et profondeur globale;
3. enveloppe stricte, version et kind;
4. schema.name/version allowlist;
5. limites structurelles du payload;
6. droits liés à l'état et à la session/epoch;
7. invariants métier;
8. effet.

Une erreur à une étape arrête les suivantes. La désérialisation ne doit pas
allouer proportionnellement à une longueur non bornée annoncée par le message.

Règles de chaînes:

- identifiants, codes et clés: ASCII allowlist et longueur fixe par schéma;
- texte utilisateur: UTF-8 conservé exactement, pas de normalisation silencieuse;
- aucun champ libre pour nom de commande, chemin, URL, origine, permission ou
  capability;
- les détails natifs sont traduits vers des codes stables avant IPC.

## 9. Ordre, déduplication et reconnexion

- requestId dupliqué est rejeté DuplicateRequest; le bridge ne mémorise pas une
  copie C3 de la requête pour la rejouer.
- Une opération read-only peut être renvoyée avec un nouveau requestId.
- Une opération mutante expirée ou dont la réponse est perdue n'est pas rejouée
  automatiquement; le client demande d'abord un snapshot autoritaire.
- DeliveryAttemptId du domaine fournit la défense at-most-once de remise en
  plus de requestId.
- Les progrès peuvent être coalescés. Les résultats terminaux restent dans le
  core jusqu'à acquittement/purge selon zero-history.
- Si sequence présente un gap ou si la WebView se reconnecte, elle cesse
  d'appliquer les deltas et obtient un snapshot avant une nouvelle mutation.
- Un événement d'un stateRevision inférieur ou égal à celui déjà appliqué est
  ignoré idempotemment.

La future opération de snapshot doit être inscrite et bornée comme toute autre;
elle n'est pas enregistrée par ce document.

## 10. Données sensibles

| Donnée | IPC |
|---|---|
| audio brut/blocs/segment | toujours interdit |
| RawTranscript/CandidateText | absent des progrès/erreurs; permis seulement dans une réponse de récupération L0 explicite et bornée |
| cible | statut/capability minimisés; aucun handle natif, titre, URL ou document |
| clipboard | jamais lu/retourné; seul un statut Prepared peut être publié |
| réglages | clés typées C1-C2; aucune map arbitraire |
| credentials C4 | toujours interdit; handle/statut minimal uniquement dans un futur port dédié |
| diagnostics | codes, versions, compteurs, durées C1 allowlist |

Le texte C3 autorisé reste en mémoire UI le minimum nécessaire, n'est pas mis
en cache persistant, state manager, URL, log ou crash report. Sa taille future
doit être bornée sans tronquer silencieusement le RawTranscript: si le transfert
direct dépasse la limite, le produit exige un mécanisme local explicite revu,
pas un chemin temporaire inventé.

## 11. Mapping des erreurs de protocole

L'IPC ne crée aucune deuxième taxonomie. Toute erreur d'enveloppe est sérialisée
avec un code Contract et son quadruplet exact de
[CORE-CONTRACTS.md](CORE-CONTRACTS.md):

| Condition IPC | code exact | retryable | recoverability |
|---|---|---:|---|
| enveloppe/payload invalide, trop grand, clé dupliquée ou requestId dupliqué | CONTRACT_INVALID_INPUT | false | None |
| protocole, schéma, fenêtre ou origine non autorisés | CONTRACT_UNSUPPORTED | false | None |
| commande hors état, request expirée ou Epoch invalide | CONTRACT_INVALID_STATE | false | None |
| core occupé avant effet | CONTRACT_BUSY | true | RetryOperation |
| admission refusée faute de ressource avant effet | CONTRACT_RESOURCE_EXHAUSTED | true | RetryOperation |
| invariant interne | CONTRACT_INTERNAL | false | None |

Les raisons fines restent des safeDetails allowlist pour une origine autorisée;
elles ne deviennent pas des codes. Une origine non autorisée ne reçoit ni la
liste complète des commandes, ni la raison de capability, ni une cause
Rust/Tauri libre.

## 12. Tests obligatoires avant v1

- golden fixtures de chaque schéma/version dans les deux sens;
- major/minor/schema trop ancien, trop récent et inconnu;
- champ requis absent, type faux, enum inconnue, clé dupliquée, profondeur,
  taille, cardinalité et UTF-8 invalides;
- fenêtre/origine non autorisée et CSP de production;
- commande valide dans mauvais état/Epoch;
- requestId et DeliveryAttemptId dupliqués;
- événement réordonné, dupliqué, gap et reconnexion;
- saturation du bus événements sans perte du terminal core;
- canaris synthétiques absents des logs, erreurs et crash reports;
- preuve qu'aucun schéma n'accepte audio ou C4;
- test exact du contrat health_check v0 inchangé.

## 13. Retour arrière

Comme v1 n'est pas implémenté dans ce cycle, le rollback est la suppression de
ce contrat proposé sans migration. Après promotion:

- désactiver une opération par capability/registre sans changer le domaine;
- revenir au bundle UI/core compatible précédent;
- conserver le texte brut dans le core si un renderer incompatible échoue;
- ne jamais élargir une capability pour contourner un mismatch;
- ouvrir un ADR avant transport distant, WebView distante, processus séparé ou
  seconde fenêtre privilégiée.

## 14. Références

- [Contrats du cœur](CORE-CONTRACTS.md)
- [Machine à états](STATE-MACHINE.md)
- [Modèle de composants](COMPONENT-MODEL.md)
- [Threat model v0](../security/THREAT-MODEL-V0.md)
- [Revue supply chain PHASE-01](../security/PHASE-01-SUPPLY-CHAIN-REVIEW.md)
