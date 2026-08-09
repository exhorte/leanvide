# Baseline securite et confidentialite

Statut: exigences normatives initiales de Fluent. Les termes **DOIT**, **NE DOIT PAS**, **DEVRAIT** et **PEUT** expriment respectivement une obligation, une interdiction, une recommandation forte et une option.

Cette baseline complete le [threat model](THREAT-MODEL-V0.md), les [flux](DATA-FLOWS.md) et la [classification](DATA-CLASSIFICATION.md). Elle ne remplace pas une notice juridique adaptee aux pays de distribution.

## Invariants produit

1. Fluent DOIT fonctionner localement sans compte ni reseau, apres acquisition volontaire du modele local requis.
2. Aucune donnee audio ou contextuelle NE DOIT quitter la machine sans consentement explicite, specifique, comprehensible et obtenu avant l'envoi.
3. Un refus ou une revocation Cloud NE DOIT PAS degrader artificiellement le chemin local.
4. Aucun failover vers le Cloud, un nouveau fournisseur ou une capture plus large NE DOIT etre silencieux.
5. Audio, transcription, contexte, OCR, clipboard et credentials NE DOIVENT jamais apparaitre dans logs, telemetrie ou crash reports.
6. Une reecriture echouee DOIT restituer exactement le texte brut disponible.
7. L'injection DOIT revalider la cible; en cas de doute, Fluent DOIT s'abstenir et proposer une copie explicite.
8. Les mises a jour et modeles DOIVENT etre verifies cryptographiquement avant installation ou chargement.

## Consentement et controle

### Consentements separes

Les activations suivantes NE DOIVENT PAS etre groupees:

- ASR Cloud et audio transmis;
- reecriture Cloud et texte transmis;
- contexte d'accessibilite transmis au Cloud;
- OCR local;
- OCR ou resultat OCR transmis au Cloud;
- synchronisation, par categorie de donnee;
- telemetrie produit;
- crash reports/diagnostics;
- usage futur des donnees pour amelioration ou entrainement.

Chaque ecran de consentement DOIT indiquer en langage simple: finalite, categories exactes, destination/fournisseur, traitement en clair eventuel, region si connue, retention, cout eventuel, consequences du refus et methode de revocation. Une case pre-cochee, un consentement implicite par usage ou une formulation "necessaire" pour une fonction locale sont interdits.

### Revocation

La revocation DOIT:

1. stopper les nouvelles captures/transmissions concernees immediatement;
2. annuler retries et files non envoyees;
3. supprimer les caches temporaires associes;
4. conserver les fonctions locales independantes;
5. proposer la suppression des donnees distantes deja conservees;
6. etre accessible sans compte actif lorsque techniquement possible.

Un changement de fournisseur, de finalite, de categorie, de region ou de retention substantielle exige une nouvelle information et, pour C3/C4, un nouveau consentement.

## Microphone et audio

- La permission microphone DOIT etre demandee au moment utile avec une explication du parcours local/Cloud.
- Un indicateur visible et accessible DOIT rester actif pendant toute capture, independamment du focus de la fenetre.
- L'arret, l'annulation, la revocation, le verrouillage de session et une erreur du pipeline DOIVENT fermer le flux et purger les buffers.
- Le coeur natif, non la WebView, DOIT etre l'autorite de l'etat d'enregistrement.
- L'audio DOIT rester en memoire et etre supprime apres traitement par defaut. Toute option d'enregistrement persistant est hors baseline et demanderait une decision/UX dediees.
- Les donnees Cloud NE DOIVENT PAS etre mises en file pour envoi ulterieur apres revocation ou hors ligne.
- Les fixtures et benchmarks audio DOIVENT employer des donnees synthetiques, consenties ou correctement licenciees, jamais des captures utilisateur incidentelles.

## Accessibilite, contexte de fenetre et OCR

- Les permissions d'accessibilite DOIVENT etre progressives et leur refus recuperable.
- Fluent DOIT lire uniquement l'element cible et les hints necessaires; aucun parcours global de l'arbre UI par defaut.
- Les champs proteges/mots de passe DOIVENT etre exclus. Les titres de fenetre, URL et noms de documents NE DOIVENT PAS etre collectes par defaut.
- Le contexte DOIT rester ephemere et NE DOIT PAS rejoindre l'historique, les logs ou la telemetrie.
- L'opt-in d'une fonction Cloud ne permet pas d'y joindre du contexte sans opt-in contexte distinct.
- L'OCR plein ecran reste desactive et reporte jusqu'a un threat model/consentement dedies. Un OCR futur DEVRAIT etre local, borne a une region previsualisee et accompagne d'un indicateur visible.
- Les screenshots et images OCR NE DOIVENT PAS etre ecrits sur disque par defaut.

## Presse-papiers et injection

- Fluent DOIT capturer un identifiant minimal de cible puis le revalider avant injection.
- Fluent NE DOIT PAS injecter dans un champ protege, une cible differente ou un processus d'integrite incompatible.
- Sous Wayland ou lorsqu'une injection sure est impossible, Fluent DOIT proposer un fallback copie seule et expliquer l'action attendue.
- Le texte place dans le presse-papiers DOIT etre considere expose aux autres applications.
- Fluent NE DOIT PAS conserver l'ancien presse-papiers dans son historique, ses logs ou sa base.
- Une restauration/expiration automatique NE DOIT ecraser aucune valeur modifiee apres l'operation. La politique temporelle et UX exacte reste a arbitrer et tester sur chaque OS.

## Stockage, historique et dictionnaire

- Preferences, historique, dictionnaire, statistiques, manifestes et credentials DOIVENT etre stores separes logiquement.
- Un mode zero-history DOIT garantir qu'aucun texte dicte n'est persiste, y compris dans journaux DB, index et caches.
- Tant que le choix de produit sur l'historique par defaut n'est pas documente, l'implementation DEVRAIT adopter le defaut conservateur sans persistance C3.
- La retention DOIT etre configurable ou clairement affichee; les durees exactes restent une decision produit ouverte.
- Export, suppression par categorie et suppression complete DOIVENT etre testables. Les sauvegardes/replicas suivent un delai publie.
- Dictionnaire et snippets NE DOIVENT PAS etre utilises pour entrainement, telemetrie ou sync sans opt-in correspondant.
- Les permissions fichiers DOIVENT etre restrictives. Le choix du chiffrement de base et de la gestion de cle exige une decision explicite fondee sur le modele de menace.

## Credentials et authentification

- Les secrets locaux DOIVENT utiliser Keychain sur macOS, Secret Service/KWallet selon environnement Linux et Credential Manager sur Windows, avec fallback refuse ou explicitement degrade — jamais un fichier en clair.
- Access et refresh tokens NE DOIVENT PAS etre exposes a la WebView, aux logs, URLs, analytics ou messages d'erreur.
- Les tokens DEVRAIENT etre courts, scopes minimalement et revocables; le refresh token reste dans le coffre natif.
- Deconnexion locale DOIT purger les credentials locaux. Le Cloud DOIT proposer revocation/deconnexion globale avant son gate.
- Les cles API de service et cles privees de signature NE DOIVENT jamais etre embarquees dans le client.
- Les tests utilisent uniquement des credentials factices. Les revues verifient la forme des flux sans lire de valeur reelle.

## Cloud facultatif et retention

- Aucun compte NE DOIT etre requis pour le mode local.
- Chaque requete DOIT minimiser ses champs et etre liee a un consentement encore valide.
- TLS est obligatoire; l'interface NE DOIT PAS annoncer E2EE si le serveur ou un fournisseur voit le contenu en clair.
- L'audio et le contexte Cloud ont une retention nulle apres traitement par defaut. Tout TTL technique non nul DOIT etre chiffre, justifie et affiche avant envoi.
- Fournisseurs, sous-traitants, regions, sauvegardes, suppression et contacts incident DOIVENT etre documentes avant activation production.
- Retries, timeouts et files DOIVENT etre bornes et annulables. Aucun fournisseur de secours sans nouveau consentement.
- La synchronisation DOIT etre opt-in par categorie, idempotente et resistante a la resurrection de donnees supprimees.
- Une panne Cloud DOIT laisser le chemin local utilisable.

## Logs, telemetrie et support

- Les logs DOIVENT utiliser un schema allowlist sans champs de contenu libre provenant des surfaces sensibles.
- Sont interdits: audio, transcript, dictionnaire, OCR, accessibilite, clipboard, titre/URL/document, chemin personnel, payload IPC, header/cookie/token et secret.
- La redaction DEVRAIT preceder la serialisation; une regex apres coup ne constitue pas une protection suffisante.
- Le mode zero-telemetry DOIT couper tous les endpoints analytics/crash, sans exception pour les erreurs fatales.
- Tant que finalites, evenements, fournisseur, retention et UX d'opt-in ne sont pas arbitres, la telemetrie DOIT rester desactivee.
- Un bundle diagnostic DOIT etre construit et expurge localement, previsualisable, declenche manuellement et sans credential.
- Des canaris synthetiques DOIVENT prouver l'absence de contenu sensible dans chaque sink.

## Updater, modeles et supply chain

- Dependances et toolchains DOIVENT etre verrouillees; les actions CI DEVRAIENT etre epinglees par digest.
- Les releases DOIVENT produire SBOM, provenance et artefacts signes depuis un environnement isole au moindre privilege.
- Updater et gestionnaire de modeles DOIVENT verifier signature, digest, plateforme, version, taille et format avant installation/chargement.
- TLS NE DOIT PAS etre la seule preuve d'integrite.
- Ecritures et installations DOIVENT etre atomiques; un echec conserve la derniere version connue saine.
- Une protection anti-rollback, un plan de rotation/revocation de cle, un staged rollout et un exercice de retrait DOIVENT exister avant beta.
- Les modeles DOIVENT avoir provenance, licence et compatibilite documentees. Les fichiers tronques, surdimensionnes et malformes sont testes/fuzzes.
- L'ajout d'une dependance ou d'un fournisseur hautement privilegie exige une revue de mainteneur, permissions, historique et plan de sortie.

## Accessibilite de l'interface de confidentialite

- Les indicateurs de capture, choix local/Cloud, erreurs et confirmations DOIVENT etre perceptibles visuellement et par technologie d'assistance.
- Aucun consentement ne depend uniquement d'une couleur, d'un survol ou d'un timeout court.
- Les dialogues sont navigables au clavier, correctement nommes et restaurent le focus.
- Le bouton d'arret/annulation reste accessible au clavier et son etat est annonce.
- Le langage evite les doubles negations et distingue clairement permission OS, consentement Fluent et compte Cloud.

## Verification minimale par gate

| Gate | Preuves minimales |
|---|---|
| Phase 02 | Frontieres IPC/capabilities, coffre natif, flux threads/donnees et prototypes sans egress local. |
| Phase 05 | Signatures/digests modeles, fichiers malformes, aucun audio de benchmark sensible. |
| Phases 06-08 | Permissions, indicateurs, revocation, champs proteges, target-switch, clipboard et fallbacks Wayland. |
| Phase 09 | Minimisation contexte, OCR reste desactive, fallback texte brut exact et transformations tracables. |
| Phase 10 | Zero-history/zero-telemetry, export/suppression, redaction, corruption/migrations et permissions fichiers. |
| Phase 11 | Matrice consentements, capture reseau, retention Cloud, auth/revocation, sync/delete et panne totale. |
| Phase 12 | Revue threat model, fuzz frontieres, audit dependances/licences et zero critique/haute non acceptee. |
| Phase 13 | Signature/notarisation, updater/rollback/retrait, notice exacte et incident response. |

## Gestion des incidents

Une suspicion d'enregistrement non arrete, d'egress non consenti, de credential expose, de signature contournee ou de supply chain compromise est **critique**: stopper le rollout ou le service concerne, conserver uniquement les preuves non sensibles, revoquer les credentials/artefacts si necessaire et escalader immediatement au `project-manager` et aux proprietaires. Ne jamais copier le contenu utilisateur ou un secret dans le ticket d'incident.

## Decisions encore ouvertes

Les points suivants ne sont pas fixes par cette baseline et necessitent produit/ADR avant implementation definitive:

- historique active ou non par defaut et durees de retention locales;
- restauration/expiration du clipboard par OS;
- perimetre contextuel exact et eventuelles listes d'exclusion utilisateur;
- activation future de l'OCR;
- fournisseur, region, prix et retention de chaque service Cloud;
- schema/fournisseur/retention de telemetrie;
- chiffrement local et synchronisation E2EE;
- autorite de signature, stockage de cles et politique de rotation;
- exigences legales, age minimal, DPA et transferts internationaux selon marches retenus.
