# Threat model v0

Statut: **proposition de baseline Phase 00 soumise a validation produit**, a revalider aux phases 02, 10, 11, 12 et 13. Elle ne ferme pas D-09 (compte obligatoire ou non) ni D-10 (Cloud present ou absent du MVP).

Documents lies:

- [Flux de donnees](DATA-FLOWS.md)
- [Classification des donnees](DATA-CLASSIFICATION.md)
- [Baseline de confidentialite](PRIVACY-BASELINE.md)
- [Registre des risques](../roadmap/RISKS.md)

## Regle centrale

**Aucune donnee audio ou contextuelle ne quitte la machine sans un consentement explicite, specifique et comprehensible donne avant le transfert.**

Si D-09 et D-10 confirment un chemin local sans authentification ni reseau, ce chemin devra rester utilisable apres installation des modeles requis. Independamment de cet arbitrage, l'activation d'un service Cloud, de la synchronisation ou de la telemetrie ne vaut jamais consentement pour une autre finalite.

## Portee et limites

La portee couvre l'application desktop Tauri, le coeur Rust, les adaptateurs macOS/Linux/Windows, les modeles locaux, le stockage local, l'updater et le Cloud s'il est retenu par D-10. Elle couvre le microphone, les transcriptions, l'historique, le dictionnaire, le contexte obtenu par accessibilite, l'OCR, le presse-papiers, les identifiants de fenetre/application, les diagnostics, les credentials et la supply chain.

Cette version est un modele de conception, pas une preuve d'implementation, un audit de code, un test d'intrusion ou un avis juridique. Les fournisseurs Cloud, regions, durees chiffrees de retention, formats de paquets et mecanismes exacts de chiffrement restent a decider. Toute decision difficilement reversible exige un ADR.

## Actifs a proteger

1. Audio brut, buffers et extraits temporaires.
2. Transcription brute, texte transforme, historique et corrections.
3. Dictionnaire personnel, snippets et profils contextuels.
4. Contenu et metadonnees issus de l'accessibilite, de l'OCR, du presse-papiers et de la fenetre active.
5. Credentials, tokens, cles de signature et secrets de service.
6. Base locale, sauvegardes, exports et donnees synchronisees.
7. Integrite des binaires, mises a jour, manifestes, modeles et dependances.
8. Preferences de consentement, indicateurs d'enregistrement et choix local/Cloud.
9. Disponibilite du chemin local candidat, s'il est confirme, et exactitude du texte injecte dans la cible.

## Acteurs et hypotheses

| Acteur | Capacites considerees |
|---|---|
| Utilisateur legitime | Configure, dicte, accorde ou revoque des permissions et consentements. |
| Autre utilisateur local | Peut acceder au meme poste, aux notifications, au presse-papiers ou a des fichiers mal proteges. |
| Processus local malveillant | Peut observer le presse-papiers, simuler du focus, sonder IPC/fichiers et tenter de lire la memoire. |
| Attaquant reseau | Peut intercepter, rejouer, bloquer ou rediriger des telechargements et appels Cloud. |
| Compte distant compromis | Peut tenter d'acceder aux donnees synchronisees, tokens et exports. |
| Operateur ou sous-traitant Cloud | Peut techniquement acceder aux donnees traitees en clair lorsque le service l'exige. |
| Attaquant supply chain | Peut compromettre une dependance, un runner, un manifeste, un miroir, un modele ou une cle de signature. |
| Systeme d'exploitation et stores | Imposent permissions et frontieres variables; ils ne garantissent ni confidentialite du presse-papiers ni injection universelle. |

Hypotheses: le poste et l'OS ne sont pas totalement compromis au niveau administrateur; les primitives cryptographiques et coffres natifs correctement utilises sont fiables; le serveur Cloud, s'il traite l'audio ou le texte en clair, appartient a une frontiere de confiance distincte et ne constitue pas un chiffrement de bout en bout.

## Frontieres de confiance

```text
Microphone / applications cibles
          |
          | permissions OS, donnees C2-C3
          v
+---------------- machine locale ----------------+
| adaptateurs OS <-> coeur Rust <-> WebView/UI    |
|        |               |            |            |
| presse-papiers     stockage      IPC Tauri       |
+--------------------+-----------------------------+
                     | consent gate + TLS
                     v
        +------------ Cloud si retenu ------------+
        | API, auth, sync, ASR/LLM, telemetrie     |
        | fournisseurs et sous-traitants distincts |
        +-------------------------------------------+

Canal de distribution distinct:
CI/release -> manifeste signe -> updater/model manager -> installation locale
```

Les passages WebView/IPC, processus/OS, local/reseau, API/sous-traitant, CI/distribution et stockage/export sont des frontieres a valider et tester.

## Echelle de severite

| Severite | Critere |
|---|---|
| Critique | Exfiltration large ou silencieuse d'audio/contexte/credentials, execution de code via supply chain, ou contournement systemique du consentement. |
| Haute | Exposition significative mais bornee, injection dans une mauvaise cible, acces distant non autorise, ou perte durable de controle utilisateur. |
| Moyenne | Fuite locale limitee, metadonnees excessives, retention non conforme ou degradation recuperable des protections. |
| Faible | Divulgation peu sensible ou defense en profondeur manquante sans chemin d'exploitation direct. |

Une menace critique constatee dans l'implementation ou l'exploitation bloque le gate concerne et est escaladee immediatement au `project-manager`. Les lignes ci-dessous sont des scenarios de conception, pas des vulnerabilites constatees.

## Menaces, preuves et remediations

| ID | Severite | Scenario | Preuve / surface a verifier | Impact | Remediation exigee |
|---|---|---|---|---|---|
| TM-01 | Critique | Un mode ASR ou de reecriture Cloud envoie audio, texte ou contexte apres une activation ambigue, globale ou heritee. | L'architecture prevoit le Cloud comme option future mais D-10 laisse sa presence au MVP ouverte; `R-006` identifie la fuite audio/contexte. Test reseau avec tous les opt-in desactives. | Conversation ou contenu d'application transmis a l'insu de l'utilisateur. | Consentement avant transfert, distinct par finalite et type de donnee; recapitulatif destination/retention; refus sans degradation des fonctions independantes du service; revocation immediate et test d'absence d'egress. |
| TM-02 | Critique | La capture microphone continue apres relachement, annulation, verrouillage de session, crash UI ou perte de focus. | Machine d'etats Phase 02, watchdogs et sleep/wake des phases 06-08; observer indicateur et trafic audio. | Enregistrement clandestin et exposition de conversations. | Etat de capture autoritaire dans le coeur, indicateur OS/UI persistant, limite de duree configurable, watchdog, arret sur verrouillage/revocation/erreur et tests fault-injection. |
| TM-03 | Critique | Accessibilite ou OCR capture une fenetre, un ecran, un gestionnaire de mots de passe ou un champ sensible au-dela du besoin. | Phase 09 limite le contexte et reporte l'OCR plein ecran; tests sur champs proteges et multi-ecrans. | Secrets, donnees de tiers ou documents entiers divulgues/localement conserves. | Accessibilite minimisee a l'element cible; denylist des champs proteges; OCR desactive par defaut avec consentement dedie, region bornee et apercu; buffers ephemeres; aucune journalisation. |
| TM-04 | Haute | Une application locale lit le texte temporairement place dans le presse-papiers ou Fluent ecrase un contenu preexistant. | Fallback clipboard exige sous Wayland et integrations OS; tests avec observateur concurrent et changement de clipboard. | Fuite du texte dicte ou perte de donnees utilisateur. | Preferer l'injection directe quand sure; notifier le fallback; ne jamais lire/conserver l'ancien contenu sans besoin explicite; restauration/effacement uniquement si la valeur et le proprietaire n'ont pas change; politique finale a arbitrer. |
| TM-05 | Haute | La cible change entre le debut de la dictee et l'injection, provoquant un collage dans un chat, terminal ou champ secret. | Phases 06-08 imposent capture et revalidation de cible. Tests de changement rapide de focus et elevation. | Divulgation ou execution accidentelle de texte/commande. | Revalider identite de processus, fenetre et element; ne pas forcer le focus de maniere aveugle; demander confirmation ou basculer en copie seule si ambigu; bloquer champs proteges et frontieres d'elevation. |
| TM-06 | Haute | Historique, dictionnaire, sauvegarde ou export est lisible par un autre compte/processus ou persiste apres suppression. | Gate Phase 10: separation, export/suppression, corruption et permissions. | Profil linguistique et contenu sensible recuperables. | Permissions minimales, separation logique, chiffrement adapte au modele de menace, zero-history, suppression verifiee incluant caches/sauvegardes, export explicite et tests multi-compte. |
| TM-07 | Critique | Tokens, cles API ou secrets sont stockes en clair, inclus dans logs/crash reports ou exposes a la WebView. | Gate Phase 10 et regles depot interdisent secrets en clair; inspection schema/IPC/logs sans lire de valeur reelle. | Compromission de compte, cout frauduleux, acces Cloud ou signature abusive. | Coffres natifs (Keychain, Secret Service/KWallet, Credential Manager), tokens courts et scopes minimaux, aucun secret frontend/log, rotation/revocation, redaction structurelle et scans CI sur valeurs factices. |
| TM-08 | Critique | Un updater accepte un binaire/manifeste non signe, ancien ou signe par une cle compromise. | `R-011`, phases 10, 12 et 13 exigent signature, tests updater et rollback. | Execution de code arbitraire sur tous les postes. | Signature hors ligne/protegee, verification avant installation, anti-rollback/version minimale, TLS en defense additionnelle, separation release/publish, rotation/revocation de cle et exercice de retrait. |
| TM-09 | Critique | Un modele ASR ou son manifeste compromis exploite le parseur natif ou modifie silencieusement les sorties. | Phase 05 exige checksum/licence; `R-007` et `R-011`; tests de fichier tronque/malveillant. | Execution de code, corruption, exfiltration ou transcription manipulee. | Catalogue allowliste et signe, digest cryptographique epingle, provenance/licence, telechargement atomique, parser sandboxe si possible, limites taille/format et suppression d'un modele revoque. |
| TM-10 | Critique | Une dependance npm/cargo/python, action CI ou runner compromet les artefacts. | `R-011`, phases 01 et 12 demandent lockfiles et audits. Verifier SBOM/provenance et reproductibilite. | Compromission globale des clients et du Cloud. | Lockfiles, versions d'actions par digest, moindre privilege CI, builds reproductibles, SBOM, scans licence/vulnerabilite, provenance signee, revue des nouveaux mainteneurs/dependances et secrets de release isoles. |
| TM-11 | Haute | Telemetrie ou crash report inclut audio, transcription, chemin personnel, titre de fenetre, dictionnaire ou payload IPC. | Phase 10 impose logs expurges et zero-telemetry; Phase 13 parle de telemetrie consentie. Tests avec canaris synthetiques. | Fuite durable vers un service tiers et correlation d'identite. | Telemetrie desactivee tant qu'un opt-in valide n'existe pas; schema allowlist; pas de contenu libre; redaction avant serialisation; apercu/export; retention bornee; endpoint coupe en zero-telemetry. |
| TM-12 | Haute | Donnees Cloud conservees implicitement dans files, retries, caches, sauvegardes ou chez un fournisseur IA apres traitement. | Gate Phase 11: aucune retention audio implicite, export/suppression et politique documentee. | Exposition lors d'incident, requete legale ou erreur operateur. | Zero retention audio par defaut, TTL techniques explicites, contrats sous-traitants, purge des files/caches, deletion propagee et verifiee, inventaire de copies et region affichee avant opt-in. |
| TM-13 | Haute | Un compte compromis synchronise ou supprime historique/dictionnaire sur tous les appareils; un conflit restaure des donnees supprimees. | Phase 11 exige auth, sync idempotente, conflits et deconnexion globale. | Divulgation, perte ou resurrection de donnees. | MFA/reauth pour actions sensibles selon produit, tokens courts, chiffrement transport/stockage, journal d'audit sans contenu, tombstones et suppression convergente, controle appareils/sessions et recovery teste. |
| TM-14 | Haute | Une commande IPC WebView appelle capture, lecture de contexte, fichiers ou auth sans autorisation/metier suffisante. | Phase 01/02 prevoit schemas IPC types; frontiere WebView/coeur Rust. | Elevation depuis XSS ou composant UI compromis. | Allowlist de commandes, validation type/taille/etat, capabilities Tauri minimales par fenetre, aucun secret retourne, CSP stricte et tests de messages malformes/rejoues. |
| TM-15 | Moyenne | Logs locaux, noms de fichiers, statistiques ou titres de fenetre permettent de reconstruire l'activite de l'utilisateur. | Phases 09-10 limitent contexte et logs; revue des schemas et fichiers. | Profilage local et fuite de metadonnees. | Identifiants pseudonymes ephemeres, chemins relatifs/non personnels, logs bornes et desactivables, titres/nom de document interdits, effacement avec donnees utilisateur. |
| TM-16 | Haute | Le service ou moteur choisi indisponible pousse silencieusement vers un autre fournisseur ou fait perdre le texte brut. | D-09/D-10 laissent le chemin local et la presence du Cloud au MVP ouverts; la Phase 09 exige un fallback brut exact. | Transfert non consenti, indisponibilite ou alteration du contenu. | Aucun failover vers le Cloud ou un autre fournisseur sans consentement correspondant; fallback deterministe au texte brut; file locale chiffree seulement si l'utilisateur choisit la reprise; erreurs explicites. Si un chemin local est confirme, une panne Cloud ne doit pas le rendre inutilisable. |
| TM-17 | Moyenne | Import dictionnaire, modele ou export malforme provoque traversal, overwrite, decompression bomb ou injection de contenu. | Surfaces d'import/export Phase 09-10 et modele Phase 05. | Corruption locale, denial of service, voire execution selon parseur. | Formats stricts, taille/ratio bornes, noms ignores au profit d'IDs, repertoire fixe, ecriture atomique, aucune execution/macros et fuzzing des parseurs. |
| TM-18 | Haute | Des donnees restent en memoire, fichiers temporaires ou swap apres annulation/crash. | Flux ephemeres audio/OCR/contexte; tests crash et inventaire de fichiers temporaires. | Recuperation ulterieure de contenu sensible. | Buffers bornes, pas de temp file par defaut, zeroisation best-effort des secrets et buffers sensibles, cleanup au demarrage, chiffrement si spool explicitement active et crash dumps sans contenu. |

## Abus et fallbacks obligatoires

- Permission microphone refusee ou revoquee: aucune capture; diagnostic local et lien vers les reglages OS.
- Permission accessibilite refusee: aucune lecture contextuelle; conserver la transcription sans contexte et la copie explicite si ces capacites existent dans le perimetre confirme; aucune boucle de demande.
- Wayland sans injection: copie seule annoncee; aucune promesse d'injection universelle.
- OCR indisponible/refuse: continuer sans OCR; aucun remplacement silencieux par capture plus large.
- Cloud indisponible ou opt-in revoque: ne pas basculer vers un autre service et ne pas mettre en file audio/contexte pour envoi ulterieur; si le chemin local est confirme, le conserver utilisable.
- Reecriture echouee: retourner exactement le texte brut disponible.
- Verification updater/modele echouee: ne pas installer/charger; conserver la derniere version connue saine si elle reste compatible.

## Verification et suivi

Chaque menace doit obtenir, avant le gate correspondant, un proprietaire, un test ou une preuve reproductible et un risque residuel accepte. Les tests emploient uniquement des donnees synthetiques et des credentials factices.

Les menaces critiques TM-01, TM-02, TM-03, TM-07, TM-08, TM-09 et TM-10 sont a suivre explicitement par le `project-manager`. Aucun risque critique constate ne peut etre waive sans ADR, responsable, echeance et acceptation explicite.

## Arbitrages produit ouverts

- D-09: compte obligatoire ou non, notamment pour le chemin local candidat.
- D-10: Cloud present ou absent du MVP et dependances fonctionnelles associees.
- Historique local active ou non par defaut, durees proposees et granularite de purge.
- Politique de restauration/expiration du presse-papiers, differenciee par OS.
- Perimetre exact du contexte d'accessibilite et liste de champs/applications exclus.
- Autorisation future de l'OCR, region capturee et frequence de re-consentement.
- Services Cloud, fournisseurs, regions, sous-traitants et durees maximales de retention.
- Telemetrie admise, finalites, schema d'evenements et mode d'opt-in.
- Chiffrement applicatif ou seulement stockage/transport pour la synchronisation.
- Strategie de signature, rotation et revocation des cles updater/modeles.
