# Classification des donnees

Cette classification s'applique aux donnees en memoire, fichiers, base locale, IPC, logs, crash reports, exports, sauvegardes, requetes reseau, files Cloud et outils de support. Elle est agnostique aux decisions D-09/D-10: decrire un lieu local ou Cloud ne confirme ni l'absence de compte ni la presence du Cloud dans le MVP.

Principe: une donnee derivee, agregee ou jointe herite de la classe la plus restrictive de ses sources. En cas de doute, choisir la classe superieure jusqu'a revue.

## Niveaux

| Classe | Description | Exemples | Regles minimales |
|---|---|---|---|
| C0 — Publique | Publiee intentionnellement, sans donnee utilisateur. | Documentation, changelog public, licences, catalogue public de modeles. | Integrite et provenance; aucune restriction de confidentialite. |
| C1 — Technique interne | Donnee operationnelle non directement personnelle. | Version, OS generalise, code d'erreur allowliste, performance agregee, manifeste local. | Minimisation, retention bornee, pas de chemin personnel ni contenu libre. |
| C2 — Personnelle | Liee ou raisonnablement reliable a un utilisateur/appareil, sans etre necessairement du contenu dicte. | ID de compte pseudonyme, preferences, langue, dictionnaire non sensible, nom d'application generalise, appareils synchronises. | Acces minimal, export/suppression, chiffrement transport si reseau, pas de logs par defaut. |
| C3 — Contenu sensible | Contenu de communication, contexte ou donnees pouvant inclure des categories sensibles ou des donnees de tiers. | Audio, transcript, historique, texte selectionne, OCR/screenshot, clipboard, titre/document, snippets, dictionnaire contenant noms ou termes confidentiels. | Local par defaut, consentement avant egress, chiffrement transport/stockage adapte, zero log, retention minimale et suppression verifiee. |
| C4 — Secret / credential | Donnee permettant authentification, signature, dechiffrement ou acces privilegie. | Refresh/access token, cle API, secret OAuth, cle de signature, recovery code. | Coffre/secret manager, jamais WebView/log/telemetrie/export standard, rotation/revocation, acces audite sans valeur. |

Les identifiants directs, donnees medicales, juridiques, financieres, biometrie vocale ou secrets prononces restent C3; un token prononce ou capture est traite comme C4 des qu'il est detecte, sans pretendre qu'une detection exhaustive est possible.

## Inventaire de donnees

| Donnee / actif | Classe | Lieu normal | Egress autorise | Retention de base | Logs |
|---|---:|---|---|---|---|
| Echantillons et audio brut | C3 | Buffer borne en memoire locale | ASR Cloud uniquement apres opt-in specifique | Jusqu'a fin/annulation du traitement; aucune persistance implicite | Interdit |
| Empreinte ou embedding vocal | C3, voire donnee reglementee selon usage | Non prevu en v0 | Interdit sans nouvelle decision et analyse dediee | Non collecte | Interdit |
| Transcription brute | C3 | Memoire; historique local si choisi | Service Cloud choisi apres opt-in | Zero-history possible; duree historique ouverte | Interdit |
| Texte normalise/reecrit | C3 | Memoire; historique si choisi | Reecriture/sync apres opt-in adapte | Comme transcription | Interdit |
| Historique de dictee | C3 | Store local separe | Sync seulement par choix explicite | Politique chiffree ouverte; suppression/export requis | Interdit |
| Dictionnaire personnel et snippets | C2-C3 | Store local separe | Sync choisie explicitement | Jusqu'a suppression; export controle | Valeurs interdites |
| Corrections utilisateur | C3 si liees au texte; C2 si compteurs agreges | Local par defaut | Aucun entrainement/Cloud sans opt-in distinct futur | Minimale selon finalite | Texte interdit |
| Profils de formatage | C2, C3 si contenu libre | Local | Sync optionnelle | Jusqu'a suppression | Valeurs libres interdites |
| Nom d'application generalise | C2 | Memoire ou profil local | Contexte Cloud seulement apres opt-in | Session ou profil choisi | Interdit par defaut |
| PID/handle/identifiant de fenetre | C1-C2 | Memoire | Aucun | Duree de l'operation | Interdit |
| Titre de fenetre, URL, nom de document | C3 | Ne pas collecter par defaut | Aucun sans analyse/opt-in dedies | Session uniquement si strictement necessaire | Interdit |
| Texte d'accessibilite/selection | C3 | Memoire | Contexte Cloud opt-in distinct | Duree de la dictee | Interdit |
| Screenshot/OCR brut | C3 | Memoire seulement si fonction active | Interdit par defaut; opt-in dedie si futur | Fin OCR/annulation | Interdit |
| Presse-papiers lu ou ecrit | C3/C4 possible | OS; jamais historique Fluent | Aucun | Le minimum necessaire; politique de restauration ouverte | Interdit |
| Preferences non sensibles | C1-C2 | Store local | Sync optionnelle | Jusqu'a reset/suppression | Clés allowlist seulement |
| Statistiques locales sans contenu | C1-C2 | Store local separe | Telemetrie opt-in seulement | Configurable/bornee | Agregats allowlist |
| Evenements de telemetrie | C1, exceptionnellement C2 minimal | File locale si opt-in | Endpoint declare | Duree chiffree ouverte et bornee | Constituent les logs; aucun contenu libre |
| Crash report/minidump | C2-C3 par prudence | Local avant consentement | Upload explicite/opt-in apres redaction | Borne; suppression possible | Aucun buffer/secret inclus |
| Diagnostic utilisateur | C2-C3 | Archive locale previsualisee | Envoi manuel explicite | Supprime apres envoi/expiration | Redige localement |
| ID de compte/appareil/session | C2 | Local et Cloud auth | Auth/sync | Jusqu'a suppression/expiration | Pseudonyme seulement si necessaire |
| Access token / refresh token | C4 | Memoire/coffre OS | Auth uniquement | Court / jusqu'a logout ou revocation | Interdit |
| Cle API utilisateur eventuelle | C4 | Coffre OS | Fournisseur choisi uniquement | Jusqu'a suppression/rotation | Interdit |
| Cles de signature updater/modeles | C4 privee, C0 publique | HSM/secret CI; cle publique client | Signature/verif uniquement | Rotation planifiee | Empreinte publique admise; privee interdite |
| Binaire, manifeste, modele | C0-C1 avec exigence forte d'integrite | Depot/installation locale | CDN distribution | Versions supportees | Version/digest admis |
| Chemin de fichier personnel | C2-C3 | Eviter; local si necessaire | Interdit | Duree operation | Interdit |
| Adresse IP et metadonnees reseau | C2 | Infra Cloud si utilisee | Operateurs necessaires | Duree minimale publiee | Acces restreint |
| Facturation/abonnement futur | C2-C3 selon champ | Cloud specialise | Prestataire declare | Obligations a documenter | Pas de donnees de carte dans Fluent |

## Regles par traitement

### Collecte

- Collecter uniquement les champs requis pour la fonction immediate.
- Ne jamais utiliser titre de fenetre, URL, presse-papiers ou texte d'accessibilite comme telemetrie.
- Ne pas creer d'embedding vocal, corpus d'entrainement ou profil comportemental sans nouveau cadrage, consentement et threat model.
- Les jeux de test et corpus versionnes sont synthetiques, licences ou expurges; aucune donnee utilisateur de production.

### Memoire et IPC

- Les buffers C3 sont bornes, avec proprietaire et fin de vie explicites.
- Les payloads IPC sont valides en type, taille, origine et etat; l'UI ne recoit que le minimum d'affichage.
- Les C4 ne sont jamais renvoyees a la WebView; utiliser handles, statuts ou operations mediatrices.
- Les crash dumps n'incluent pas les buffers audio, texte, OCR ou credentials.

### Stockage local

- Separer preferences, historique, dictionnaire, statistiques, manifestes et credentials.
- Utiliser les permissions de fichier les plus restrictives et le coffre natif pour C4.
- Le chiffrement de la base C2-C3 doit etre decide selon le modele de menace et la gestion de cles; le chiffrement du disque seul ne protege pas d'un processus actif sous le meme compte.
- Toute sauvegarde, index, journal de transaction et cache appartient a la meme classe que la source et au meme processus de suppression.

### Reseau et Cloud

- C3: aucun egress sans opt-in specifique; TLS obligatoire mais ne rend pas le traitement E2EE.
- C4: uniquement vers l'autorite explicitement visee, jamais vers telemetrie/support.
- C1-C2: minimises, finalite et retention documentees; pas de correlation inter-service non annoncee.
- Les sous-traitants, regions et transferts ulterieurs doivent etre visibles avant l'activation.

### Journalisation

Les logs utilisent une allowlist de champs structures: horodatage borne, version, composant, code d'erreur, etapes et durees. Sont interdits: audio, texte libre, transcription, OCR, contexte d'accessibilite, clipboard, titre/URL/document, chemin personnel, payload IPC, header auth, token, cookie et secret.

La redaction par regex seule est insuffisante. Le schema doit empecher la serialisation du contenu sensible. Les tests utilisent des canaris factices et verifient leur absence de tous les sinks.

## Retention et suppression

| Regle | Baseline |
|---|---|
| Ephemere | Audio, OCR et contexte disparaissent a la fin, l'annulation ou la revocation de l'operation. |
| Zero-history | Aucun transcript/texte final n'est persiste; les journaux DB et caches ne doivent pas le conserver. |
| Historique choisi | Duree et categorie configurables; valeur par defaut a arbitrer. Sans decision, le defaut conservateur est aucune persistance C3. |
| Cloud processing | Zero retention de contenu C3 apres resultat par defaut. Tout TTL technique non nul est explicite et accepte avant envoi. |
| Sync | Persiste jusqu'a suppression/expiration publiee; suppression propagee aux replicas et sauvegardes selon delai affiche. |
| Telemetrie | Desactivee tant que schema, duree, fournisseur et opt-in ne sont pas approuves. |
| Credentials | Tokens courts; refresh jusqu'a logout/revocation; copies temporaires eliminees. |

Une suppression est complete seulement lorsque donnees primaires, indexes, caches, files, exports temporaires, replicas et sauvegardes ont suivi la politique publiee. L'interface distingue suppression locale, distante et fermeture de compte.

## Partage et export

- Un export est declenche par l'utilisateur, liste les categories incluses et evite C4.
- L'archive C3 est protegee pendant sa creation; son chiffrement/mot de passe est une decision UX/securite a trancher.
- Aucun upload automatique de diagnostic ou d'export.
- Un lien de partage futur exige expiration, revocation et nouvelle analyse; il n'est pas couvert par cette baseline.

## Decisions ouvertes

- Duree par defaut et plafond de l'historique local.
- Chiffrement applicatif de la base locale et source de la cle.
- Retention Cloud exacte par categorie, region et sauvegarde.
- Schema et retention de telemetrie, si elle est retenue.
- Format et protection des exports.
- Eventuelle synchronisation E2EE et mecanisme de recovery.
- Traitement reglementaire de la voix selon les fonctions futures; aucune identification vocale n'est actuellement prevue.
