# Plan de faisabilite OS — hotkey, cible et remise du texte

- Phase: `PHASE-02`
- Cycle de conception: `CYCLE-20260809-04`
- Responsable: `platform-lead`
- Niveau: D3 (permissions, differences OS, injection et risque de remise dans une mauvaise cible)
- Statut: **plan reproductible; aucune capacite native prouvee par ce document**
- Derniere verification des sources officielles: 2026-08-09

## 1. Objet, resultat et limites

Ce plan definit le spike jetable qui devra prouver, environnement par environnement:

1. le declenchement global push-to-talk et toggle;
2. la capture minimale d'une cible au declenchement;
3. la revalidation de cette cible juste avant la remise;
4. une remise L2 par presse-papiers + collage simule, et seulement si elle est sure;
5. le fallback L1/L0 visible et recuperable;
6. le nettoyage des hotkeys, permissions transitoires, handles, sessions et contenus places par Fluent.

Ce cycle n'implemente aucun adaptateur natif, manifeste, entitlement, capability Tauri, permission, package, signature ou workflow CI. Les noms d'API ci-dessous sont des **candidats de spike**, pas des choix de production. Le spike suivant devra rester derriere les contrats `PlatformAdapter` et `TextInjector` figes par l'architecture.

Ne sont pas dans ce plan: capture audio, ASR, OCR, lecture du texte de la cible, contexte d'accessibilite, tray, autostart, updater, signature/notarisation et packaging. La permission microphone macOS est toutefois inventoriee pour distinguer clairement la capture audio future des permissions clavier/accessibilite du lot plateforme.

Documents normatifs: [Phase 02](../roadmap/phases/PHASE-02-ARCHITECTURE-PROTOTYPES.md), [ADR-0001](../architecture/ADR-0001-STACK-CIBLE.md), [PRD MVP](../product/PRD-MVP.md), [capacites plateformes](../product/PLATFORM-CAPABILITIES.md), [threat model](../security/THREAT-MODEL-V0.md), [flux DF-02](../security/DATA-FLOWS.md), [budgets](../quality/PERFORMANCE-BUDGETS.md), [plan de mesure](../quality/MEASUREMENT-PLAN.md) et [matrice QA](../quality/TEST-MATRIX.md).

## 2. Regles de preuve

### 2.1 Vocabulaire obligatoire

| Etat | Signification | Peut promouvoir une capacite? |
|---|---|---|
| `PROVEN` | Essai reel sur environnement nomme, commande et artefacts complets, oracle satisfait | oui, uniquement pour cet environnement/mecanisme |
| `FAILED` | Essai reel execute; oracle ou seuil non satisfait | non |
| `UNSUPPORTED` | Probe ou API officielle prouve l'absence/refus de la capacite sur l'environnement nomme | non; le fallback peut passer |
| `UNAVAILABLE_ENVIRONMENT` | Machine/session/compositor absent du parc accessible | non |
| `NOT_RUN` | Environnement disponible mais campagne non executee | non |
| `HYPOTHESIS` | Mecanisme propose a partir d'une source ou d'une inference, sans essai Fluent | non |

Une page de documentation, une compilation croisee, une VM sans session graphique reelle ou un succes sur XWayland ne prouve pas la meme capacite sur Wayland natif. Une absence de crash n'est pas une confirmation d'injection.

### 2.2 Registre initial des preuves

| Element | Etat au 2026-08-09 | Preuve ou limite |
|---|---|---|
| Contrats produit local-first, L0/L1, Wayland non universel | `PROVEN` documentaire | PRD, ADR-0001, threat model et flux DF-02 approuves dans le depot |
| API candidates Windows/macOS/X11/portals Wayland | `HYPOTHESIS` | sources officielles de la section 3; aucune execution Fluent |
| Hote Windows alternatif disponible | `PROVEN` materiel uniquement | `HW-WIN-ALT-01`: Windows 11 Pro build 26200, x64, Core i7-8650U, 15.8 Gio; different du `HW-WIN` i5-1240P propose; aucune capacite applicative testee |
| Machine Apple Silicon | `UNAVAILABLE_ENVIRONMENT` dans ce worktree | aucune machine macOS exposee; ne pas inferer l'absence dans le parc global |
| Session Linux X11/Wayland | `UNAVAILABLE_ENVIRONMENT` dans ce worktree | aucune session Linux exposee |
| Hotkey, cible, collage ou fallback | `NOT_RUN` | implementation interdite dans `CYCLE-20260809-04` |

Si `HW-MAC` devient accessible avant la campagne, elle reste la reference produit. Sinon `HW-WIN` devient la reference **pratique** et l'absence de baseline Apple Silicon est archivee; cela ne change pas l'ordre produit macOS -> Linux -> Windows. `HW-WIN-ALT-01` peut executer la faisabilite en attendant, mais ne remplace la baseline `HW-WIN` proposee qu'apres qualification explicite par QA.

## 3. Faits officiels et inferences de conception

### 3.1 Windows

- Fait: [`RegisterHotKey`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerhotkey) enregistre une combinaison systeme et produit `WM_HOTKEY`; un conflit peut faire echouer l'enregistrement et `UnregisterHotKey` est requis.
- Inference: `RegisterHotKey` suffit comme candidat toggle, mais pas seul pour la semantique PTT down/up. Le spike compare donc ce candidat a un hook `WH_KEYBOARD_LL`; le callback du hook reste minimal et est traite sur un thread a boucle de messages, conformement a [`LowLevelKeyboardProc`](https://learn.microsoft.com/en-us/windows/win32/winmsg/lowlevelkeyboardproc).
- Fait: [`GetForegroundWindow`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow) peut renvoyer `NULL`; [`GetWindowThreadProcessId`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid) relie un `HWND` a son processus.
- Inference: un `HWND` seul est un snapshot insuffisant. Le spike le couple a PID + identite de processus et le revalide sans titre de fenetre.
- Fait: [`SendInput`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput) est soumis a UIPI et ne peut injecter que vers un niveau d'integrite egal ou inferieur; son retour ne distingue pas toujours un blocage UIPI.
- Fait: les operations presse-papiers sont exclusives pendant `OpenClipboard`, detruisent l'ancien contenu avec `EmptyClipboard`, puis publient via `SetClipboardData`; voir [Clipboard Operations](https://learn.microsoft.com/en-us/windows/win32/dataxchg/clipboard-operations). Le [numero de sequence](https://learn.microsoft.com/en-us/windows/win32/dataxchg/about-the-clipboard#clipboard-sequence-number) change avec le contenu.
- Inference: aucun retour `SendInput` ne vaut confirmation de collage. Seul l'oracle de la fixture cible peut produire `delivered_confirmed`.

### 3.2 macOS

- Fait: [`CGEventTapCreate`](https://developer.apple.com/documentation/coregraphics/cgevent/tapcreate%28tap%3Aplace%3Aoptions%3Aeventsofinterest%3Acallback%3Auserinfo%3A%29) peut observer les evenements clavier selon les droits; [`CGPreflightListenEventAccess`](https://developer.apple.com/documentation/coregraphics/cgpreflightlisteneventaccess%28%29) et [`CGRequestListenEventAccess`](https://developer.apple.com/documentation/coregraphics/cgrequestlisteneventaccess%28%29) exposent le preflight et la demande d'ecoute.
- Fait: Apple expose separement l'autorisation [Input Monitoring](https://support.apple.com/guide/mac-help/control-access-to-input-monitoring-on-mac-mchl4cedafb6/mac) et l'autorisation [Accessibility](https://support.apple.com/guide/mac-help/allow-accessibility-apps-to-access-your-mac-mh43185/mac) permettant a une app de controler le Mac.
- Fait: [`AXIsProcessTrustedWithOptions`](https://developer.apple.com/documentation/applicationservices/1459186-axisprocesstrustedwithoptions) verifie la confiance du client Accessibility; la demande est asynchrone et ne change pas la valeur retour courante.
- Fait: [`NSWorkspace.frontmostApplication`](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication) retourne l'application recevant les evenements clavier; `kAXFocusedUIElementAttribute` represente l'element focalise de cette app.
- Fait: [`CGEventPost`](https://developer.apple.com/documentation/coregraphics/cgevent/post%28tap%3A%29) publie un evenement Quartz. [`NSPasteboard.changeCount`](https://developer.apple.com/documentation/appkit/nspasteboard/changecount) permet de verifier si l'ownership a change depuis l'ecriture.
- Fait: l'acces microphone est une permission distincte, visible dans [Privacy & Security > Microphone](https://support.apple.com/guide/mac-help/allow-use-of-the-microphone-and-audio-input-mchl7fa8e3cc/mac).
- Inference: Input Monitoring est candidat pour le PTT global; Accessibility/post-event est candidat pour cible et collage. Le spike demande chaque permission seulement au moment de la capacite concernee et mesure refus/revocation separement.

### 3.3 Linux X11

- Fait: [`XGrabKey`](https://www.x.org/releases/X11R7.6/doc/libX11/specs/libX11/libX11.html#Keyboard_Grabbing) etablit un grab passif; un conflit produit `BadAccess`.
- Fait: `_NET_ACTIVE_WINDOW` est une propriete du window manager et peut etre `None`; voir la specification officielle [EWMH](https://specifications.freedesktop.org/wm/latest-single/#idm46063598234992).
- Fait: [`XTestFakeKeyEvent`](https://www.x.org/releases/X11R7.5/doc/man/man3/XTestFakeKeyEvent.3.html) simule press/release seulement si l'extension XTEST est supportee; le serveur peut retirer cette facilite.
- Fait: le clipboard X11 est une selection dont le client doit devenir proprietaire et servir la donnee; voir l'[ICCCM, selection `CLIPBOARD`](https://www.x.org/releases/current/doc/xorg-docs/icccm/icccm.pdf).
- Inference: X11 permet un candidat L2, mais le window manager, XTEST, les grabs, le bureau distant et les cibles restent des dimensions de support explicites.

### 3.4 Linux Wayland

- Fait: le portail [Global Shortcuts](https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.GlobalShortcuts.html) cree une session consentie et fournit `Activated`/`Deactivated`; l'ensemble accepte peut etre vide.
- Fait: les requetes portal sont asynchrones et leur propriete `version` indique l'interface exposee; voir les [conventions Request](https://flatpak.github.io/xdg-desktop-portal/docs/requests.html). Le backend selectionne depend de la configuration desktop; voir [`portals.conf`](https://flatpak.github.io/xdg-desktop-portal/docs/portals.conf.html).
- Fait: le portail [Remote Desktop](https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.RemoteDesktop.html) peut fournir clavier et evenements synthetiques uniquement dans une session autorisee. Le portail [Clipboard](https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.Clipboard.html) ne cree pas sa propre session et depend notamment d'une session Remote Desktop ou Input Capture consentie.
- Fait: le protocole Wayland core lie `wl_data_device.set_selection` au serial de l'evenement declencheur et notifie la selection au client avec focus clavier; voir la [specification du protocole et des serials](https://wayland.freedesktop.org/docs/book/Protocol.html).
- Inference securite: ouvrir une session Remote Desktop uniquement pour coller peut etre une permission disproportionnee. Cette voie est un test negatif/UX distinct, jamais le fallback par defaut.
- Inference produit: sans portail/protocole autorise et sans identite de cible revalidable, L2 est `UNSUPPORTED`, non `FAILED`; Fluent affiche L0 puis permet une copie L1 declenchee depuis sa propre surface avant collage manuel. **Aucune injection Wayland universelle n'est promise.**

## 4. Contrat de capability du spike

Le harnais produit un `capability.json` sans titre de fenetre, texte dicte, contenu du clipboard, nom de compte ou chemin personnel.

```json
{
  "schema_version": 1,
  "run_id": "YYYYMMDD-HHMMSS-<commit>-platform",
  "machine_id": "HW-WIN|HW-MAC|HW-LNX",
  "platform_id": "windows|macos|x11|wayland",
  "environment": {
    "os_build": "<public-version>",
    "arch": "<arch>",
    "session": "<x11|wayland|null>",
    "desktop": "<name-version|null>",
    "compositor": "<name-version|null>",
    "portal_frontend": "<version|null>",
    "portal_backend": "<name-version|null>"
  },
  "capabilities": [{
    "name": "hotkey_down_up|target_snapshot|target_revalidate|clipboard_write|paste_simulation|delivery_confirm",
    "status": "PROVEN|FAILED|UNSUPPORTED|UNAVAILABLE_ENVIRONMENT|NOT_RUN",
    "mechanism": "<api-or-protocol>",
    "permission_state": "not_required|not_determined|granted|denied|revoked",
    "reason_code": "<stable-enum>",
    "fallback": "ui_toggle|copy_manual|show_raw_text|none",
    "evidence_run_id": "<run-id-or-null>"
  }]
}
```

Les probes precedant toute action sont sans prompt quand l'OS le permet. Un etat inconnu ne devient jamais `true` par defaut. Les reason codes minimaux sont: `api_absent`, `backend_absent`, `permission_denied`, `permission_revoked`, `shortcut_conflict`, `target_missing`, `target_changed`, `target_protected`, `integrity_boundary`, `focus_unverifiable`, `clipboard_busy`, `clipboard_changed`, `injection_rejected`, `oracle_mismatch`, `session_locked`, `timeout`.

## 5. Matrice des mecanismes a tester

| Environnement borne | Hotkey candidat | Snapshot/revalidation candidat | Remise candidate | Fallback obligatoire | Statut initial |
|---|---|---|---|---|---|
| Windows 11 x64, build archive | `RegisterHotKey` pour toggle; `WH_KEYBOARD_LL` pour down/up PTT | `HWND` + PID + identite de processus; `GetForegroundWindow` juste avant remise | `CF_UNICODETEXT` puis `SendInput` Ctrl+V | L1 copie, puis L0 | `HYPOTHESIS` |
| macOS Apple Silicon, version archivee | event tap `listenOnly`, down/up | frontmost PID + handle AX focalise minimal, relu avant remise | `NSPasteboard` puis Cmd+V via evenement Quartz | L1 copie, puis L0 | `UNAVAILABLE_ENVIRONMENT` ici |
| Ubuntu LTS GNOME X11 | `XGrabKey`, press/release | `_NET_ACTIVE_WINDOW` + XID + PID si disponible, puis requete juste avant remise | selection `CLIPBOARD` puis XTEST Ctrl+V | L1 selection, puis L0 | `UNAVAILABLE_ENVIRONMENT` ici |
| Ubuntu LTS GNOME Wayland/Mutter | portail GlobalShortcuts si interface/bind acceptes | voie desktop/portal seulement si identite prouvable | aucune par defaut; session portal separee a evaluer pour proportionnalite | controle UI + copie explicite + collage manuel | `UNAVAILABLE_ENVIRONMENT` ici |
| KDE Plasma Wayland/KWin | meme probe portal, sans reutiliser le verdict GNOME | idem, capability locale | idem | idem | `UNAVAILABLE_ENVIRONMENT` ici |
| Sway/wlroots Wayland | portal backend reellement publie; sinon controle UI | protocole compositor seulement s'il est officiel, disponible et borne | pas de voie privilegiee supposee | idem | `UNAVAILABLE_ENVIRONMENT` ici |
| Autre compositor Wayland | probes generiques seulement | aucune hypothese positive | aucune hypothese positive | idem | `UNAVAILABLE_ENVIRONMENT` |

XWayland est enregistre comme couche de cible distincte (`target_transport=xwayland`) et ne transforme jamais un succes XTEST en support Wayland natif.

## 6. Permissions macOS et minimisation

| Capacite | Permission candidate | Moment de demande | Refus/revocation | Donnee interdite |
|---|---|---|---|---|
| Capture audio future | Microphone | premier demarrage volontaire d'une capture, hors ce spike | aucune capture; diagnostic et lien reglages | aucun buffer dans ce spike |
| PTT global | Input Monitoring / droit d'ecoute determine par preflight | lorsque l'utilisateur active le raccourci global | toggle UI reste disponible; aucune boucle de prompt | aucune touche hors combinaison configuree dans les artefacts |
| Cible et controle | Accessibility | premiere tentative explicite de L2/L3, pas au lancement | L1/L0; aucune lecture de contexte | valeur, selection, titre et contenu de l'element |
| Publication d'evenements | droit de post-event determine par preflight | meme action explicite L2 | L1/L0 | aucune simulation hors Cmd+V borne |
| Ecran/OCR | aucune | jamais dans ce lot | non applicable | tout screenshot |
| Automation Apple Events | aucune par defaut | jamais sans nouveau threat model | non applicable | contenu d'app cible |

Chaque scenario execute `not_determined`, `granted`, `denied`, puis `revoked` apres relance de l'app signee de test. Une permission accordee au binaire de developpement ne prouve pas le package de release. Le rapport archive identifiant de bundle factice, hash du binaire, etat TCC observable et captures des dialogues expurgees; il n'archive aucune base TCC.

## 7. Garde TOCTOU de cible

### 7.1 Snapshot minimal a l'armement

Le snapshot est pris avant que Fluent n'affiche une surface susceptible de voler le focus. Il contient uniquement:

- `session_id` et timestamp monotone;
- famille d'OS et mecanisme;
- identifiant opaque de fenetre/surface quand l'OS l'autorise;
- identifiant de processus + marqueur de generation/creation quand disponible;
- classe de cible synthetique du harnais, jamais titre, document ou texte;
- etat `protected/unknown` sans lire la valeur du champ.

Il reste en memoire et expire a la fin, a l'annulation, au verrouillage, au changement de session ou apres le timeout du spike. Il n'est pas persiste dans les artefacts; seul un hash ephemere par essai peut etre journalise pour correler snapshot et revalidation.

### 7.2 Validation atomique avant remise

Ordre obligatoire:

1. verifier session non verrouillee et permission encore accordee;
2. relire la cible active/focalisee avec la meme API;
3. verifier identifiant fenetre/surface, processus et generation;
4. refuser si cible nulle, detruite, changee, protegee, elevee, ambigue ou non revalidable;
5. publier le clipboard Fluent;
6. verifier que la cible n'a pas change une seconde fois;
7. simuler uniquement la combinaison de collage;
8. attendre l'oracle borne de la fixture; sans oracle, produire `delivered_unconfirmed`, jamais `delivered_confirmed`;
9. en cas de doute, conserver le texte et afficher L1/L0.

Sous Wayland, l'absence d'identite de cible accessible et revalidable interdit L2. Un consentement portal generique n'est pas une preuve que la bonne application est focalisee.

### 7.3 Courses a injecter

- fermeture puis recreation d'une fenetre entre snapshot et remise;
- bascule rapide A -> B -> A;
- widget Fluent qui tente de prendre le focus;
- verrouillage, veille/reprise et changement de bureau/Space;
- cible normale vers cible elevee Windows;
- passage vers champ mot de passe synthetique;
- clipboard remplace par un processus sentinelle entre ecriture et nettoyage.

Tout texte present une fois dans une mauvaise cible est un echec critique de campagne, meme si les autres essais passent.

## 8. Securite du presse-papiers

1. La fixture utilise uniquement `FLUENT-SPIKE-<run-id>-<counter>`; jamais de contenu utilisateur.
2. Le spike n'appelle aucune API de lecture de l'ancien clipboard et ne tente pas de le sauvegarder/restaurer.
3. L'ecriture est une action explicite; l'UI indique `Copie`, puis distingue `Collage confirme`, `Collage non confirme` et `Copie seule`.
4. La valeur ecrite porte un digest en memoire et, lorsque l'OS l'offre, un numero de sequence/change count. Le digest du contenu n'est jamais journalise.
5. Le nettoyage automatique n'efface la valeur que si Fluent est encore proprietaire **et** si le numero de sequence/change count est inchange. Sinon il ne touche a rien et emet `clipboard_changed` sans contenu.
6. Le TTL de nettoyage est un parametre du spike, teste a `0 s`, `30 s` et `120 s`; ce plan ne choisit pas le TTL produit.
7. Arret normal, annulation, crash simule et redemarrage testent le cleanup best-effort. Aucun processus gardien permanent n'est introduit.
8. Sous X11/Wayland, la perte d'ownership est un resultat attendu; Fluent ne revendique pas `copied` si la fixture cible ne peut pas obtenir la selection.
9. Sous Wayland sans clipboard en arriere-plan autorise, l'utilisateur ouvre la surface Fluent, clique `Copier`, puis colle manuellement. Une session Remote Desktop/Input Capture ne peut etre promue que si security-reviewer et produit jugent son scope et son UX proportionnes.

Le presse-papiers reste observable par d'autres processus et, selon les fonctions OS, peut participer a un historique ou une synchronisation. L'indicateur utilisateur ne le presente jamais comme stockage confidentiel.

## 9. Harnais, commandes et fixtures

### 9.1 Commandes contractuelles a implementer au cycle suivant

Ces commandes n'existent pas dans le cycle actuel:

```powershell
# Build local release, aucun telechargement ni telemetrie.
fluent-platform-spike probe --output artifacts/quality/<run-id>
fluent-platform-spike hotkey --mode ptt --runs 1000 --output artifacts/quality/<run-id>
fluent-platform-spike target --scenario stable,target-switch,target-destroyed,protected --runs 100 --output artifacts/quality/<run-id>
fluent-platform-spike deliver --level l2 --fixture tests/fixtures/platform/targets.json --runs 100 --output artifacts/quality/<run-id>
fluent-platform-spike fallback --level l1-l0 --runs 100 --output artifacts/quality/<run-id>
fluent-platform-spike cleanup --scenario normal,cancel,crash,restart --output artifacts/quality/<run-id>
```

Sous Linux, le lanceur archive avant essai les sorties expurgees de:

```text
uname -srmo
loginctl show-session <id> -p Type -p Desktop
xdg-desktop-portal --version
gdbus introspect --session --dest org.freedesktop.portal.Desktop --object-path /org/freedesktop/portal/desktop
```

Les identifiants de session, noms d'utilisateur, variables d'environnement completes et chemins personnels sont filtres. Le harnais n'utilise ni shell privilege, ni `sudo`, ni outil d'automatisation non declare.

### 9.2 Fixtures non sensibles

Le futur `tests/fixtures/platform/targets.json` reference des applications locales et un helper `fluent-target-fixture` possede par QA, avec quatre champs controles:

- champ texte simple renvoyant exactitude et nombre d'insertions;
- champ riche avec evenement de focus asynchrone;
- champ protege qui refuse lecture/injection et ne conserve rien;
- cible destructible/recreable avec generation connue.

Applications de diversite, versions archivees: Notepad/TextEdit/GNOME Text Editor, Edge ou Safari ou Firefox/Chromium, VS Code, plus le helper deterministe. Les tests de terminal n'executent jamais le texte: la chaine commence par `# FLUENT-SPIKE` et le shell de fixture est remplace par un champ inerte.

### 9.3 Artefacts obligatoires

Chaque commande produit le contrat de `MEASUREMENT-PLAN.md`:

```text
artifacts/quality/<run-id>/
  manifest.json
  command.txt
  environment.json
  capability.json
  attempts.ndjson
  oracle.json
  permissions.json
  cleanup.json
  raw.ndjson
  summary.json
  stdout.txt
  stderr.txt
  checksums.sha256
```

`attempts.ndjson` contient des codes, timestamps monotones, latences et booleens, jamais les textes ou identifiants natifs bruts. `oracle.json` contient la chaine synthetique attendue par hash de fixture, le nombre attendu et le resultat exact/unique. Les captures visuelles eventuelles montrent uniquement les fixtures et sont listees par checksum.

## 10. Campagnes et criteres PASS/FAIL

### 10.1 Hotkey

Matrice minimale: 1 000 cycles down/up, auto-repeat, conflit, key-up perdu, app non focalisee, changement de layout, verrouillage, veille/reprise et arret brutal.

`PASS` pour un environnement/mecanisme si:

- enregistrement et desinscription sont confirmes;
- chaque cycle qualifiant produit exactement un down et un up dans l'ordre, sans double session;
- le conflit donne `shortcut_conflict` et conserve le toggle UI;
- perte de key-up/verrouillage/veille declenche annulation ou watchdog borne, jamais une capture persistante;
- aucun callback bloque, logue du contenu ou appelle le presse-papiers;
- les 1 000 essais et exclusions justifiees sont presents.

Un evenement manque, une session restee active ou un grab non libere vaut `FAIL`. L'absence du portail Wayland vaut `UNSUPPORTED` si le fallback UI passe, pas un succes hotkey.

### 10.2 Snapshot et revalidation

`PASS` si 100/100 essais par scenario stable remettent a la bonne fixture et si tous les scenarios change/destroyed/protected/elevation refusent L2 sans toucher une autre cible. Un seul faux succes ou texte dans une mauvaise cible vaut `FAIL` critique.

L'absence d'API de cible Wayland donne `UNSUPPORTED` avec L1/L0; elle ne peut pas etre classee `PROVEN` pour L2.

### 10.3 Injection/collage

Le budget candidat existant s'applique seulement apres preuve:

- Windows/macOS: >= 98 % de texte exact, unique, bonne cible;
- X11: >= 95 %;
- chaque taux publie son IC binomial 95 % et au moins 100 essais par cible/capability;
- un retour API sans egalite exacte de l'oracle est `unconfirmed`, donc echec du taux d'injection;
- cible non cooperative, champ protege et frontiere d'integrite doivent echouer explicitement ou passer en fallback, jamais annoncer un faux succes.

Les seuils restent des cibles proposees tant que la Phase 02 ne les a pas approuves avec artefacts.

### 10.4 Fallback

`PASS` si, sur 100 essais par environnement/capability:

- le texte brut reste visible L0 dans 100 % des cas;
- l'action L1 explicite publie la fixture, l'indicateur est visible et aucun faux `colle` n'est affiche;
- Wayland atteint la cible candidate >= 99 % de preparation clipboard lorsque la voie est disponible;
- si la voie clipboard ne l'est pas, L0 reste exploitable et le diagnostic nomme la limitation;
- le changement concurrent de clipboard empeche toute restauration/effacement;
- aucun contenu de fixture n'apparait dans logs, noms de fichiers ou artefacts techniques.

### 10.5 Permissions, cleanup et local-first

`PASS` si refus/revocation degradent uniquement la capability, si les prompts ne bouclent pas, si hotkeys/hooks/event taps/sessions portal/owners clipboard sont liberes sur tous les chemins, et si une capture avec reseau bloque ne montre aucun egress applicatif. Toute permission non necessaire, persistance de contenu, handler residuel ou egress vaut `FAIL`.

## 11. Matrice de machines et ordre d'execution

| Priorite d'execution | ID | Environnement exact a archiver | Besoin physique | Verdict actuel |
|---:|---|---|---|---|
| 1 si disponible | `HW-MAC` | MacBook Air M2 16 Gio propose, macOS + build, Apple Silicon, clavier/layout, Spaces | machine Apple Silicon reelle; VM/cross-build insuffisant pour TCC/event taps | `UNAVAILABLE_ENVIRONMENT` dans ce worktree |
| 1 sinon | `HW-WIN` | Windows 11 x64, i5-1240P 16 Gio propose; version/build, integrite cible, desktop/session | hote reel; test normal + cible elevee controlee | configuration exacte `UNAVAILABLE_ENVIRONMENT` ici |
| 1b faisabilite | `HW-WIN-ALT-01` | Windows 11 Pro build 26200 x64, i7-8650U, 15.8 Gio | hote reel accessible; qualification QA requise avant baseline | hote disponible, campagnes `NOT_RUN` |
| 2 | `HW-LNX-X11` | Ubuntu LTS x86_64 GNOME Xorg, kernel, Xorg, WM, XTEST | session X11 interactive | `UNAVAILABLE_ENVIRONMENT` |
| 3a | `HW-LNX-WAY-GNOME` | Ubuntu LTS, GNOME/Mutter, portal frontend/backend versions | session Wayland interactive | `UNAVAILABLE_ENVIRONMENT` |
| 3b | `HW-LNX-WAY-KDE` | distribution/version bornee, Plasma/KWin et backend portal | machine/VM avec session graphique et consent dialogs | `UNAVAILABLE_ENVIRONMENT` |
| 3c | `HW-LNX-WAY-WLR` | distribution/version bornee, Sway/wlroots et backend portal reel | session interactive, pas seulement nested sans justification | `UNAVAILABLE_ENVIRONMENT` |

Une VM peut preparer le harnais et prouver un echec de probe, mais les hotkeys physiques, verrouillage, veille, TCC, focus et presse-papiers inter-apps exigent une session interactive sur le systeme qualifie. Chaque machine conserve le meme commit et les memes hashes de fixtures.

## 12. Deroule du spike suivant

### Etape A — Probe sans mutation durable

1. produire environnement et versions;
2. enumerer les interfaces/API disponibles;
3. preflight permissions sans prompt si possible;
4. emettre `capability.json` avec raisons negatives;
5. verifier qu'aucun endpoint reseau n'est ouvert.

### Etape B — Hotkey isolee

Executer le harnais sans audio ni injection. Prouver down/up, conflits, cleanup et verrouillage. Si PTT echoue, conserver toggle UI et ne pas ouvrir le lot cible.

### Etape C — Cible sans remise

Capturer/revalider uniquement l'identite minimale sur fixtures. Ne lire aucune valeur. Si l'identite ne peut etre revalidee, desactiver L2 par capability flag et passer a L1/L0.

### Etape D — Clipboard et collage synthetiques

Utiliser seulement les fixtures. Introduire les courses focus/clipboard. Evaluer L2 puis exercer L1/L0 meme si L2 passe.

### Etape E — Permissions et fautes

Refus, revocation, cible detruite, integrite, verrouillage, crash et redemarrage. Executer le scan egress/secrets/chemins et la revue securite.

### Etape F — Decision

Mettre a jour `PLATFORM-CAPABILITIES.md` uniquement depuis des run IDs valides. Toute promotion est bornee a la ligne OS/build/session/compositor/backend/mecanisme. Les hypotheses restantes deviennent dette avec proprietaire et fallback.

## 13. Indicateurs utilisateur requis

Le spike doit rendre observables, visuellement et via etat accessible du helper:

- `Raccourci disponible`, `Conflit` ou `Utiliser le controle UI`;
- `Cible memorisee` sans nom/titre de document;
- `Cible changee — collage annule`;
- `Copie seule — collez manuellement`;
- `Collage tente, non confirme` distinct de `Collage confirme`;
- `Permission requise/refusee/revoquee`, avec action de reglage et sans boucle;
- `Texte brut disponible` jusqu'a copie explicite ou fin choisie par l'utilisateur.

L'indicateur Fluent complete, sans remplacer, les indicateurs OS. Aucun succes n'est deduit de la disparition du widget ou du retour de focus.

## 14. Nettoyage et rollback

### Nettoyage de chaque essai

- desinscrire hotkey/grab et retirer hook/event tap;
- fermer les sessions portal et handles natifs;
- relacher ownership clipboard/selection seulement selon la garde de section 8;
- zeroiser best-effort la fixture et le snapshot en memoire;
- fermer la cible helper et verifier l'absence de processus/hook residuel;
- ne jamais modifier une permission OS en dehors de l'action utilisateur documentee.

### Rollback de conception

| Echec prouve | Rollback |
|---|---|
| PTT global non fiable | toggle UI accessible; autre mecanisme derriere `PlatformAdapter` seulement apres nouvelle preuve |
| Snapshot non revalidable | desactiver L2/L3, L1/L0 |
| Collage simule sous seuil | capability flag off pour mecanisme/cible; copie manuelle |
| Permission macOS excessive ou UX inacceptable | retirer la voie concernee, garder permissions minimales et L1/L0 |
| Portal Wayland absent/refuse/disproportionne | controle UI + surface Fluent focalisee + copie explicite + collage manuel |
| Tauri/plugin impose une surface IPC trop large | spike natif isole; aucune seconde commande Tauri avant allowlist F-05 |

Tout changement de stack, permission structurelle ou garantie de confidentialite exige un ADR. Les prototypes ne contiennent aucune donnee irremplacable et peuvent etre supprimes integralement.

## 15. Integration supply-chain et revue

- F-05: aucune nouvelle commande Tauri, WebView ou capability avant registre commandes/fenetres/origines et allowlist approuves.
- F-01/F-02: le harnais Linux releve le graphe Tauri/Wry/GTK utilise; il ne masque pas `glib 0.18.5` ni les advisories non maintenues. Ce plan ne les resout pas.
- Toute crate/plugin/helper candidat fournit version, source officielle, licence, checksum/lockfile et surface de permission avant adoption.
- Aucun outil de clipboard/hotkey installe globalement ne devient dependance produit par commodite de test.
- Le `security-reviewer` revoit TM-02 (capture persistante), TM-04 (clipboard), TM-05 (mauvaise cible), TM-14 (IPC) et TM-18 (residus) avant promotion.

## 16. Gate du lot

Ce document passe le lot de conception si:

- chaque OS/session a un mecanisme candidat, un probe et un fallback;
- Wayland est separe par compositor/backend/capability sans promesse universelle;
- permissions macOS, cible TOCTOU, clipboard, indicateurs, cleanup et rollback sont testables;
- commandes, fixtures, artefacts, tailles de campagne et criteres PASS/FAIL sont explicites;
- `HW-WIN` est la reference pratique seulement si `HW-MAC` est indisponible et cette absence est archivee;
- les preuves documentaires, hypotheses et environnements indisponibles ne sont jamais confondus avec un resultat natif.

Ce document ne satisfait pas a lui seul le critere Gate 02 « une injection de preuve fonctionne ». Ce critere reste `PENDING` jusqu'a une campagne reelle sur la plateforme de reference pratique ou produit, puis revue QA/securite.
