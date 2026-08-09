# Plan de mesure reproductible

## Objet

Ce plan transforme les budgets proposes de
[PERFORMANCE-BUDGETS.md](PERFORMANCE-BUDGETS.md) en preuves reproductibles. Il
ne prescrit pas encore un outil unique : les harnesses, le moteur ASR et les
adaptateurs OS n'existent pas a la phase 00. Chaque campagne doit donc publier
la commande exacte, l'environnement, la sortie machine et l'artefact brut.

Les mesures sont local-first. Les corpus et enregistrements restent locaux sauf
consentement explicite documente; aucun audio, texte dicte, token ou contenu de
presse-papiers ne va dans les logs de CI.

Le francais, les candidats `HW-WIN`/`HW-MAC`/`HW-LNX` et le test local sans
compte ni reseau sont des scenarios de cadrage, non une promesse de support.
Leur choix depend de D-03 a D-06 et, pour le perimetre sans compte/reseau du
MVP, de D-09/D-10. Une fois le modele local acquis volontairement, le test
reseau coupe verifie l'invariant de securite du chemin local confirme; il ne
decide pas a lui seul le perimetre produit.

## Contrat d'une campagne

Chaque campagne cree un dossier immuable :

```text
artifacts/quality/<run-id>/
  manifest.json
  command.txt
  environment.json
  raw.ndjson
  summary.json
  stdout.txt
  stderr.txt
  checksums.sha256
```

`<run-id>` est `YYYYMMDD-HHMMSS-<commit-court>-<scenario>`. `manifest.json`
porte au minimum : commit, version, OS/build, CPU, RAM, architecture, pilote et
peripherique audio, alimentation, moteur/modèle/quantification, langue, corpus
ou fixture par hash, repetitions demandees/valides et verdict. Les fichiers
`stdout.txt` et `stderr.txt` sont filtres de tout contenu utilisateur avant
archivage; les valeurs brutes sont des durées, compteurs et identifiants
anonymes de fixture.

La sortie `summary.json` indique l'algorithme de percentile, les exclusions et
leur justification. Un essai interrompu n'est pas silencieusement retire : il
est marque invalide avec la cause.

## Environnement controle

Avant chaque comparaison :

1. Consigner la configuration materielle candidate `HW-WIN`, `HW-MAC` ou
   `HW-LNX` de [PERFORMANCE-BUDGETS.md](PERFORMANCE-BUDGETS.md), plus les
   versions OS, noyau/compositor et pilotes.
2. Fermer les processus non indispensables, desactiver les synchronisations et
   indiquer secteur/batterie, profil CPU et etat thermique.
3. Verifier l'horloge monotone, la frequence de capture et le peripherique.
   Le micro integre est la baseline; tout micro USB/Bluetooth est un scenario
   distinct.
4. Utiliser le meme commit, modele et fixture hashes pour une comparaison. Un
   changement de l'un de ces facteurs cree une nouvelle baseline.
5. Executer 3 chauffes non comptabilisees puis 30 repetitions independantes,
   sauf campagne longue ou taux binomial qui declare son echantillon.

Les documents de phase ne sont pas des preuves. Une preuve est une campagne
dont les artefacts ci-dessus permettent de recalculer le resultat.

## Scenarios et instruments

| Scenario | Signal et points d'horodatage | Calcul | Artefact minimal |
|---|---|---|---|
| Armement PTT | generer/observer le front `key_down`; journal monotone au premier bloc audio accepte | `t_audio_accepte - t_key_down` | trace des deux evenements, 30 essais |
| Fin PTT | `key_up`, fermeture capture, dernier bloc remis ASR | `t_remise_asr - t_key_up` | trace de transition et configuration hotkey |
| Fin VAD | fin de silence configuree, emission de fin de segment, remise ASR | surcout apres la fenetre de silence; rapporter le silence configure | fixture parole/silence + trace VAD |
| Fin -> texte brut disponible | fin de capture PTT (ou point final VAD), puis texte ASR brut conserve et affichable/copiable; ne pas attendre injection ni reecriture | `t_texte_brut_disponible - t_fin_capture`; 10 s de parole par essai, p50/p95 | fixture 10 s, trace etat `PROCESSING -> texte_brut_disponible`, corpus/modele/langue/HW hashes |
| RTF | decoder le corpus WAV 16 kHz mono avec modele precharge puis froid declare | `temps_decode / secondes_audio` par fichier | resultats par fichier, hash corpus et modele |
| WER/CER | reference textuelle et sortie ASR normalisees par la meme version de normaliseur | Levenshtein mot/caractere; bootstrap IC 95 % | hypotheses, sorties normalisees, script/version |
| Injection | cible connue, capture du texte final et verification egalite exacte | succes/nombre; IC binomial 95 % | log cible sans contenu sensible, capture/test oracle |
| Fallback Wayland | API indisponible simulee ou detectee; verifier clipboard et notification | succes preparation + absence de faux succes | compositor, capability probe, oracle clipboard |
| Perte d'echantillons | generer impulsions/sequence dans flux, tracer sequence des trames 10 ms | trous / trames; maximum de trou | fichier compteurs et duree >= 10 min |
| CPU/memoire | echantillonner processus et enfants pendant arme, capture, ASR | p95 coeurs equival./RSS | serie temporelle >= 5 min par mode |
| Demarrage | processus nouveau; `ready` seulement apres tray/widget et hotkey effectivement prets | lancement -> `ready`, chaud/froid distincts | 30 traces de demarrage et protocole froid |
| Crash-free | injecter fautes puis telemetrie locale consentie, sans contenu de dictee | sessions sans crash + borne IC | definition session, total, crashes, methode IC |
| Disque modeles | download/manifeste signe et espace libre avant/apres | bytes artefact/temporaire/app | manifeste, `sha256`, mesure disque |

Les horodatages doivent etre produits dans le processus ou par un pont de trace
calibre. Les comparaisons entre horloges differentes exigent une incertitude
mesuree; sinon le resultat est indicatif, non qualifiant.

## Corpus, fixtures et verification d'exactitude

Le futur corpus de reference doit etre versionne par manifeste, sans voix ou
contenu prive. Le sous-corpus francais propre et bruit controle est un candidat
dependant de D-05/D-06, pas une langue supportee confirmee; il doit etre
remplace ou complete par les langues effectivement retenues. Il doit contenir
ponctuation et vocabulaire hors dictionnaire. Les splits de developpement et de
validation sont separes. Les corrections manuelles, dictionnaires ou
reecritures sont des scenarios distincts : WER/CER ASR ne les melangent pas.

Normalisation avant WER/CER : Unicode NFC, casse, espaces et ponctuation selon
une specification versionnee; nombres, acronymes et contractions sont declares
explicitement. Le score est publie par sous-corpus et agrégé avec sa ponderation.
Tant que ce normaliseur et ce corpus ne sont pas livres par le lot ASR, les
seuils d'exactitude restent proposes.

## Commandes attendues (contrat a implementer)

Les commandes suivantes sont des interfaces de benchmark a livrer, pas des
commandes actuellement disponibles. Elles rendent la preuve attendue non
ambiguë :

```powershell
# environnement: PowerShell 7+, build release du commit teste
fluent-bench latency --scenario ptt-arm --runs 30 --output artifacts/quality/<run-id>
fluent-bench asr --corpus tests/fixtures/asr/<manifest>.json --runs 30 --output artifacts/quality/<run-id>
fluent-bench system --modes armed,capture,asr --duration 300s --output artifacts/quality/<run-id>
fluent-eval injection --platform <windows|macos|x11|wayland> --matrix docs/quality/TEST-MATRIX.md --output artifacts/quality/<run-id>
```

Le lead responsable du prototype livre les binaires/harnesses et les fixtures;
QA execute les campagnes repetitives. Une commande qui reussit sans produire
`manifest.json`, `raw.ndjson` et `summary.json` est incomplete.

## Analyse et decision

- Un budget p95/p99 est respecte seulement si toutes les repetitions valides
  sont comptabilisees et si les preconditions correspondent a la ligne budget.
- Un taux de succes publie son intervalle de confiance binomial. Pour etablir
  99.5 % sans echec, il faut au moins 600 sessions eligibles et une borne
  inferieure de Clopper-Pearson **unilaterale a 95 %**; avec zero crash, elle
  vaut `0.05^(1/n)`. Des dizaines d'essais ne suffisent pas.
- Les regressions sont comparees a une baseline du meme scenario; une derive
  >= 10 % sur latence, CPU, RSS ou RTF est signee puis examinee, sans attendre
  le depassement final du budget.
- Un echec stable fournit son `run-id`, la commande, l'environnement et les
  artefacts avant demande de correctif au lead proprietaire. Une flakiness qui
  empeche cette reproduction est escaladee QA D3 avec sa distribution d'echecs.

## Couverture plateforme

Chaque scenario applicable est execute sur Windows, macOS et Linux X11. Linux
Wayland est une colonne distincte : le rapport declare le compositor et les
capabilities detectees. Ne pas transformer l'impossibilite d'injecter en echec
silencieux ni en support presume; executer et mesurer le fallback clipboard
avec instruction utilisateur explicite.
