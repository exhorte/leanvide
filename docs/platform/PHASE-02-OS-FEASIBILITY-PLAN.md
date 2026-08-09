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
- Inference: aucun retour `SendInput` ne vaut confirmation de collage. Seul l'oracle de la fixture cible peut produire `ConfirmedExact`.

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

Les probes precedant toute action sont sans prompt quand l'OS le permet. Un etat inconnu ne devient jamais `true` par defaut. Les reason codes minimaux sont: `api_absent`, `backend_absent`, `permission_denied`, `permission_revoked`, `shortcut_conflict`, `target_missing`, `target_changed`, `target_protected`, `integrity_boundary`, `focus_unverifiable`, `clipboard_busy`, `clipboard_changed`, `clipboard_owner_unknown`, `clipboard_sequence_unknown`, `indicator_inaccessible`, `injection_rejected`, `oracle_mismatch`, `session_locked`, `timeout`.

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
4. refuser si cible nulle, detruite, changee, protegee, elevee, ambigue ou non revalidable; si zero effet est prouve, emettre `RejectedBeforeEffect` et conserver l'indication canonique `RawAvailable` selon le contrat architecture;
5. publier le clipboard Fluent;
6. verifier que la cible n'a pas change une seconde fois;
7. simuler uniquement la combinaison de collage;
8. attendre l'oracle borne de la fixture; sans oracle, produire `OutcomeUnknown` avec `DELIVERY_OUTCOME_UNKNOWN`, `retryable=false` et aucune nouvelle copie/injection automatique jusqu'a resolution utilisateur, jamais `ConfirmedExact`;
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
2. Le spike ne lit, ne persiste, ne sauvegarde et ne restaure jamais l'ancien contenu, y compris pour un cleanup apres crash. Cette interdiction est normative, pas une option de harnais.
3. L'ecriture vient seulement d'une action utilisateur explicite. Avant l'action `Copier`, un texte accessible annonce: « Le presse-papiers, son historique et sa synchronisation peuvent etre lus par d'autres applications ou appareils; ne l'utilisez pas pour un secret. »
4. L'UI reprend sans la redefinir la taxonomie architecture: `ClipboardPrepared` (L1), `ConfirmedExact` (L2/L3), `InternalRecoveryAvailable` (L0), `RejectedBeforeEffect` et `OutcomeUnknown`. Un succes d'API ne change pas seul le resultat en `ConfirmedExact`; `OutcomeUnknown` interdit retry ou copie automatique jusqu'a resolution utilisateur.
5. La valeur synthetique ecrite peut porter un digest uniquement en memoire et, lorsque l'OS l'offre, un numero de sequence/change count. Ni la valeur ni le digest ne sont persistants ou journalises.
6. Le cleanup represente l'observation d'ownership/sequence par un etat a trois valeurs et applique la table normative ci-dessous.
7. Le TTL de cleanup est un parametre du spike, teste a `0 s`, `30 s` et `120 s`; ce plan ne choisit pas le TTL produit.
8. Arret normal, annulation, crash simule et redemarrage testent le cleanup best-effort. Aucun processus gardien permanent n'est introduit.
9. Sous X11/Wayland, la perte d'ownership est un resultat attendu; Fluent ne revendique pas `ClipboardPrepared` si la fixture cible ne peut pas obtenir la selection.
10. Sous Wayland sans clipboard en arriere-plan autorise, l'utilisateur ouvre la surface Fluent, active `Copier`, puis colle manuellement. Une session Remote Desktop/Input Capture ne peut etre promue que si security-reviewer et produit jugent son scope et son UX proportionnes.

### 8.1 Etat normatif du cleanup

| Etat observe | Condition minimale | Mutation autorisee | Resultat |
|---|---|---|---|
| `MATCHED` | meme instance Fluent encore proprietaire **et** sequence/change count connu et inchange | essai de cleanup autorise seulement dans le spike | resultat enregistre; aucune promesse produit |
| `CHANGED` | ownership ou sequence/change count a change | **aucune mutation** | `clipboard_changed` |
| `UNKNOWN` | API absente/erreur, valeur non initialisee, processus mort, crash, redemarrage ou perte du marqueur en memoire | **aucune mutation** | `clipboard_owner_unknown` ou `clipboard_sequence_unknown` |

`MATCHED` est une hypothese de spike a prouver par OS, pas une garantie qu'un cleanup automatique sera retenu dans le produit. `CHANGED` et `UNKNOWN` interdisent tout appel capable d'effacer, remplacer ou reprendre la selection. Apres crash ou redemarrage, l'etat initial est toujours `UNKNOWN`: aucune donnee persistante ne permet de le reclasser.

### 8.2 Course crash/sentinelle obligatoire

Le processus `fluent-clipboard-sentinel` utilise seulement des chaines synthetiques et fournit son propre oracle sans que Fluent lise le clipboard:

1. Fluent publie `FLUENT-SPIKE-...`, puis est tue au point de faute declare;
2. la sentinelle prend l'ownership et publie `SENTINEL-AFTER-<counter>`;
3. Fluent redemarre avec ownership/sequence `UNKNOWN`;
4. le chemin de cleanup s'execute;
5. la sentinelle verifie qu'elle reste proprietaire, que sa valeur est inchangee et qu'aucune mutation clipboard Fluent n'a ete appelee.

La variante `CHANGED` remplace le clipboard pendant que Fluent reste vivant. `PASS` exige zero effacement/remplacement et `mutation_attempted=false` dans les 30 essais de chaque variante. Une seule mutation quand l'etat est `CHANGED` ou `UNKNOWN` vaut `FAIL` securite.

Le presse-papiers reste observable par d'autres processus et, selon les fonctions OS, peut participer a un historique ou une synchronisation. L'indicateur utilisateur ne le presente jamais comme stockage confidentiel.

## 9. Oracle accessible bloquant

L'oracle accessible est une precondition executable des campagnes hotkey et fallback, pas une inspection visuelle a posteriori. Aucune campagne `hotkey` ou `fallback` ne commence sur un couple OS/AT tant que `a11y-preflight` n'a pas prouve les roles, noms, etats, navigation clavier, focus et annonces ci-dessous. Si l'AT ou l'API d'accessibilite manque, le resultat est `UNAVAILABLE_ENVIRONMENT` ou `UNSUPPORTED`; le test n'est pas saute en silence et aucune preuve d'accessibilite n'est revendiquee.

Ce plan specifie le futur oracle, mais ne l'implemente ni ne le declare execute dans `CYCLE-20260809-04`.

### 9.1 Contrat semantique et fail-safe

Le helper frontend expose des identifiants de test stables uniquement a l'oracle; l'utilisateur recoit les noms francais accessibles. Les roles natifs equivalents sont archives par l'adaptateur UI Automation, AX ou AT-SPI.

| Scenario | Nom accessible attendu | Role/etat attendu | Annonce et focus | Comportement sure |
|---|---|---|---|---|
| toggle pret | `Demarrer la dictee` | bouton toggle, `pressed=false`, enabled | atteignable par Tab/Shift+Tab; focus visible et programmatique | Espace/Entree demarre seulement si l'indicateur est accessible |
| capture active | `Arreter la dictee` | bouton toggle, `pressed=true`; statut `Ecoute en cours` | annonce live unique `Ecoute en cours`; focus reste sur le controle | Espace/Entree arrete; Escape annule |
| conflit hotkey | `Raccourci indisponible` | `alert`; toggle UI enabled | annonce `Raccourci indisponible, utilisez le bouton`; focus reste/revient au controle declencheur | aucune capture globale; toggle clavier seul reste utilisable |
| permission refusee/revoquee | `Permission clavier refusee` | `alert`; action de diagnostic nommee, toggle adapte | raison et action annoncees, sans boucle de prompt ni focus force | aucune hotkey; controle UI reste disponible s'il passe le preflight |
| key-up perdu | `Capture arretee` | `alert`; toggle `pressed=false` | annonce `Capture arretee, relachement de touche non recu`; focus stable | watchdog arrete la capture, aucun redemarrage automatique |
| session verrouillee | `Capture arretee` | statut persistant, toggle `pressed=false` au retour | annonce `Capture arretee, session verrouillee` apres deverrouillage; aucun focus exige pendant le verrouillage | coeur arrete immediatement sans dependre de l'AT |
| annulation | `Dictee annulee` | `status`; toggle `pressed=false` | annonce unique `Dictee annulee`; focus revient au controle logique | buffers/snapshot nettoyes; aucun collage |
| fallback copie | `Copier le texte` | bouton enabled; description accessible de risque clipboard | disclosure de section 8 lue avant l'action; annonce `Texte copie, collez-le manuellement` | action explicite seulement; L0 reste disponible |
| indicateur disparu/inaccessible | aucun noeud statut exploitable ou arbre UI indisponible | `indicator_inaccessible` | l'oracle emet la faute, sans simuler une annonce reussie | refuser l'armement, ou arreter une capture active via watchdog |

Le watchdog d'essai utilise une limite **candidate de 1 000 ms** entre la detection `indicator_inaccessible` et l'etat capture inactive. Cette valeur rend le test executable; elle ne devient un TTL produit qu'apres mesure/revue. Le coeur ne depend pas du lecteur d'ecran pour s'arreter: disparition du noeud, crash UI ou rupture du canal d'etat declenche le meme fail-safe.

### 9.2 Navigation et annonces a exercer

- lancer le parcours depuis le clavier uniquement: Tab, Shift+Tab, Espace/Entree et Escape;
- verifier ordre de focus, focus visible, focus programmatique et absence de piege clavier;
- ne jamais deplacer le focus vers une live region ou une alerte non interactive;
- verifier chaque changement via evenement d'accessibilite machine-readable, puis par le lecteur d'ecran nomme;
- refuser les etats contradictoires (`pressed=true` avec `Capture arretee`) et les annonces dupliquees;
- limiter l'arbre et les traces au helper Fluent et aux chaines synthetiques; ne pas inspecter l'arbre de l'application cible ni son texte;
- apres verrouillage, verifier l'arret par l'etat du coeur puis l'annonce au retour, sans attendre que l'AT fonctionne sur l'ecran verrouille.

### 9.3 Matrice OS/technologie d'assistance

| Environnement | AT utilisateur nommee | Oracle programme candidat | Disponibilite actuelle | Preuve requise |
|---|---|---|---|---|
| `HW-WIN` / `HW-WIN-ALT-01` | Narrateur Windows | arbre/evenements UI Automation | hote alternatif disponible; AT/preflight `NOT_RUN` | run-id Windows + version/build + version Narrateur |
| `HW-MAC` | VoiceOver | arbre/evenements AX; Accessibility Inspector comme diagnostic | `UNAVAILABLE_ENVIRONMENT` ici | run-id macOS + build + VoiceOver, machine Apple Silicon |
| `HW-LNX-X11` GNOME | Orca | arbre/evenements AT-SPI2 | `UNAVAILABLE_ENVIRONMENT` | run-id X11 + GNOME/Orca/AT-SPI2 versions |
| `HW-LNX-WAY-GNOME` | Orca | AT-SPI2 de la surface Fluent | `UNAVAILABLE_ENVIRONMENT` | run-id Mutter/backend portal + versions AT |
| `HW-LNX-WAY-KDE` | Orca | AT-SPI2 de la surface Fluent | `UNAVAILABLE_ENVIRONMENT` | run-id KWin/backend portal + versions AT |
| `HW-LNX-WAY-WLR` | Orca si disponible | AT-SPI2 de la surface Fluent, a prober | `UNAVAILABLE_ENVIRONMENT` | support ou absence archivee par compositor |

La presence nominale d'un lecteur d'ecran ne prouve pas la chaine WebView/accessibilite. Chaque ligne reste `HYPOTHESIS` jusqu'au preflight reel sur la surface du build teste.

### 9.4 Responsabilites du cycle executable

| Responsable | Livrable futur borne | Interdiction |
|---|---|---|
| `frontend-lead` | helper/surface semantique: controles, live regions, noms/roles/etats, ordre clavier, focus visible et fault switch `indicator_inaccessible` | ne choisit pas API hotkey, timeout natif ou resultat de remise |
| `platform-lead` | stimuli hotkey/permission/lock/key-up, pont d'etat et watchdog sans contenu cible | ne definit pas les semantiques frontend, ne remplace pas l'oracle QA et ne promet pas la parite OS |
| `qa-release-lead` | commande `fluent-a11y-oracle`, adaptateurs d'observation UIA/AX/AT-SPI, executions AT, artefacts et verdict PASS/FAIL | ne waive pas un AT/materiel absent comme PASS |
| `security-reviewer` | revue fail-safe, expurgation et absence de contenu cible/clipboard dans les preuves | aucune implementation produit par defaut |

Le manager attribue les fichiers disjoints avant ce cycle executable. Le present document n'autorise aucun changement frontend, QA, runtime, dependance ou permission.

### 9.5 Artefacts et verdict

Avant hotkey/fallback, la commande future est:

```powershell
fluent-a11y-oracle preflight --platform <windows|macos|x11|wayland> --at <narrator|voiceover|orca> --scenarios ready,active,conflict,permission-denied,key-up-lost,locked,cancelled,fallback,indicator-lost --output artifacts/quality/<run-id>
```

Elle ajoute `accessibility.json`, `a11y-tree.json`, `keyboard.ndjson`, `announcements.ndjson`, `focus.ndjson` et `watchdog.json`. Les arbres sont limites aux IDs/roles/etats et chaines synthetiques Fluent; les noms de compte, titres/fenetres externes, texte dicte et contenu clipboard sont interdits. Les sorties AT manuelles sont une checklist horodatee sans enregistrement de session utilisateur.

Campagne minimale: 3 chauffes + 30 repetitions par scenario, sauf verrouillage 10 cycles; 30 fautes `indicator_inaccessible`. `PASS` exige:

- noms, roles et etats exacts dans 100 % des essais;
- parcours complet clavier seul, ordre/focus correct et annonce non seulement visuelle;
- zero capture sur conflit/refus et zero capture residuelle apres key-up perdu, lock ou annulation;
- 30/30 arrets watchdog en <= 1 000 ms et `pressed=false` final;
- zero contenu non synthetique dans les artefacts.

Une annonce absente, un focus perdu/piege, une capture active alors que l'indicateur est inaccessible, un role/etat faux ou un seul depassement watchdog vaut `FAIL` pour le couple OS/AT. Un environnement manquant reste `UNAVAILABLE_ENVIRONMENT`, jamais preuve realisee.

## 10. Harnais, commandes et fixtures

### 10.1 Commandes contractuelles a implementer au cycle suivant

Ces commandes n'existent pas dans le cycle actuel:

```powershell
# Build local release, aucun telechargement ni telemetrie.
fluent-platform-spike probe --output artifacts/quality/<run-id>
fluent-platform-spike hotkey --mode ptt --runs 1000 --output artifacts/quality/<run-id>
fluent-platform-spike target --scenario stable,target-switch,target-destroyed,protected --runs 100 --output artifacts/quality/<run-id>
fluent-platform-spike deliver --level l2 --fixture tests/fixtures/platform/targets.json --runs 100 --output artifacts/quality/<run-id>
fluent-platform-spike fallback --level l1-l0 --runs 100 --output artifacts/quality/<run-id>
fluent-platform-spike cleanup --scenario normal,cancel,changed,crash-sentinel,restart-unknown --runs 30 --output artifacts/quality/<run-id>
```

Sous Linux, le lanceur archive avant essai les sorties expurgees de:

```text
uname -srmo
loginctl show-session <id> -p Type -p Desktop
xdg-desktop-portal --version
gdbus introspect --session --dest org.freedesktop.portal.Desktop --object-path /org/freedesktop/portal/desktop
```

Les identifiants de session, noms d'utilisateur, variables d'environnement completes et chemins personnels sont filtres. Le harnais n'utilise ni shell privilege, ni `sudo`, ni outil d'automatisation non declare.

### 10.2 Fixtures non sensibles

Le futur `tests/fixtures/platform/targets.json` reference des applications locales et un helper `fluent-target-fixture` possede par QA, avec quatre champs controles:

- champ texte simple renvoyant exactitude et nombre d'insertions;
- champ riche avec evenement de focus asynchrone;
- champ protege qui refuse lecture/injection et ne conserve rien;
- cible destructible/recreable avec generation connue.

Applications de diversite, versions archivees: Notepad/TextEdit/GNOME Text Editor, Edge ou Safari ou Firefox/Chromium, VS Code, plus le helper deterministe. Les tests de terminal n'executent jamais le texte: la chaine commence par `# FLUENT-SPIKE` et le shell de fixture est remplace par un champ inerte.

Le `frontend-lead` livre separement la future surface `fluent-accessibility-fixture` de section 9; QA en observe les roles/etats sans reutiliser `fluent-target-fixture` comme oracle d'accessibilite implicite. Le processus `fluent-clipboard-sentinel` appartient au harnais QA et connait uniquement sa propre chaine synthetique.

### 10.3 Artefacts obligatoires

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
  accessibility.json
  a11y-tree.json
  keyboard.ndjson
  announcements.ndjson
  focus.ndjson
  watchdog.json
  raw.ndjson
  summary.json
  stdout.txt
  stderr.txt
  checksums.sha256
```

`attempts.ndjson` contient des codes, timestamps monotones, latences et booleens, jamais les textes ou identifiants natifs bruts. `oracle.json` contient la chaine synthetique attendue par hash de fixture, le nombre attendu et le resultat exact/unique. Les captures visuelles eventuelles montrent uniquement les fixtures et sont listees par checksum.

## 11. Campagnes et criteres PASS/FAIL

### 11.1 Hotkey

Matrice minimale: 1 000 cycles down/up, auto-repeat, conflit, key-up perdu, app non focalisee, changement de layout, verrouillage, veille/reprise et arret brutal.

Precondition: le couple OS/AT correspondant a passe la section 9, y compris toggle clavier, conflit/refus, key-up perdu, verrouillage, annulation et watchdog d'indicateur. Sans ce run-id, la campagne ne demarre pas.

`PASS` pour un environnement/mecanisme si:

- enregistrement et desinscription sont confirmes;
- chaque cycle qualifiant produit exactement un down et un up dans l'ordre, sans double session;
- le conflit donne `shortcut_conflict` et conserve le toggle UI;
- perte de key-up/verrouillage/veille declenche annulation ou watchdog borne, jamais une capture persistante;
- aucun callback bloque, logue du contenu ou appelle le presse-papiers;
- les 1 000 essais et exclusions justifiees sont presents.

Un evenement manque, une session restee active ou un grab non libere vaut `FAIL`. L'absence du portail Wayland vaut `UNSUPPORTED` si le fallback UI passe, pas un succes hotkey.

### 11.2 Snapshot et revalidation

`PASS` si 100/100 essais par scenario stable remettent a la bonne fixture et si tous les scenarios change/destroyed/protected/elevation refusent L2 sans toucher une autre cible. Un seul faux succes ou texte dans une mauvaise cible vaut `FAIL` critique.

L'absence d'API de cible Wayland donne `UNSUPPORTED` avec L1/L0; elle ne peut pas etre classee `PROVEN` pour L2.

### 11.3 Injection/collage

Le budget candidat existant s'applique seulement apres preuve:

- Windows/macOS: >= 98 % de texte exact, unique, bonne cible;
- X11: >= 95 %;
- chaque taux publie son IC binomial 95 % et au moins 100 essais par cible/capability;
- un retour API sans egalite exacte de l'oracle est `OutcomeUnknown` avec code canonique et `retryable=false`, donc echec du taux d'injection et aucune seconde action automatique;
- cible non cooperative, champ protege et frontiere d'integrite doivent echouer explicitement ou passer en fallback, jamais annoncer un faux succes.

Les seuils restent des cibles proposees tant que la Phase 02 ne les a pas approuves avec artefacts.

### 11.4 Fallback

`PASS` si, sur 100 essais par environnement/capability:

- le texte brut reste visible L0 dans 100 % des cas;
- le preflight accessible de section 9 est `PASS` avant la campagne;
- l'action L1 explicite publie la fixture apres disclosure accessible, l'annonce n'est pas seulement visuelle et aucun faux `colle` n'est affiche;
- Wayland atteint la cible candidate >= 99 % de preparation clipboard lorsque la voie est disponible;
- si la voie clipboard ne l'est pas, L0 reste exploitable et le diagnostic nomme la limitation;
- le changement concurrent ou l'etat ownership/sequence inconnu produit zero mutation; les 30 essais `changed` et 30 essais `crash-sentinel/restart-unknown` conservent la valeur sentinelle;
- aucun contenu de fixture n'apparait dans logs, noms de fichiers ou artefacts techniques.

### 11.5 Permissions, cleanup et local-first

`PASS` si refus/revocation degradent uniquement la capability, si les prompts ne bouclent pas, si hotkeys/hooks/event taps/sessions portal/owners clipboard sont liberes sur tous les chemins, si `CHANGED`/`UNKNOWN` ne declenchent aucune mutation clipboard, et si une capture avec reseau bloque ne montre aucun egress applicatif. Toute permission non necessaire, persistance de contenu, mutation clipboard en etat non prouve, handler residuel ou egress vaut `FAIL`.

## 12. Matrice de machines et ordre d'execution

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

## 13. Deroule du spike suivant

### Etape A — Probe sans mutation durable

1. produire environnement et versions;
2. enumerer les interfaces/API disponibles;
3. preflight permissions sans prompt si possible;
4. emettre `capability.json` avec raisons negatives;
5. verifier qu'aucun endpoint reseau n'est ouvert.

### Etape B — Hotkey isolee

Executer d'abord `a11y-preflight`, puis le harnais sans audio ni injection. Prouver down/up, conflits, cleanup, verrouillage, navigation clavier et annonces. Si le preflight accessible echoue, ne pas armer la capture. Si PTT echoue apres ce preflight, conserver le toggle UI seulement si son oracle accessible passe, et ne pas ouvrir le lot cible.

### Etape C — Cible sans remise

Capturer/revalider uniquement l'identite minimale sur fixtures. Ne lire aucune valeur. Si l'identite ne peut etre revalidee, desactiver L2 par capability flag et passer a L1/L0.

### Etape D — Clipboard et collage synthetiques

Utiliser seulement les fixtures. Introduire les courses focus/clipboard, `CHANGED`, crash-sentinelle et redemarrage `UNKNOWN`. Evaluer L2 puis exercer L1/L0 meme si L2 passe; aucune mutation clipboard n'est autorisee apres un etat change ou inconnu.

### Etape E — Permissions et fautes

Refus, revocation, cible detruite, integrite, verrouillage, crash et redemarrage. Executer le scan egress/secrets/chemins et la revue securite.

### Etape F — Decision

Mettre a jour `PLATFORM-CAPABILITIES.md` uniquement depuis des run IDs valides. Toute promotion est bornee a la ligne OS/build/session/compositor/backend/mecanisme. Les hypotheses restantes deviennent dette avec proprietaire et fallback.

## 14. Indicateurs utilisateur requis

Le spike doit rendre observables, visuellement et via etat accessible du helper:

- `Raccourci disponible`, `Raccourci indisponible` ou `Utiliser le controle UI`;
- `Ecoute en cours`, puis arret explicite pour key-up perdu, verrouillage ou annulation;
- `Cible memorisee` sans nom/titre de document;
- `Cible changee — collage annule`;
- disclosure accessible du risque clipboard/historique/synchronisation avant `Copier le texte`;
- `ClipboardPrepared — collez manuellement`;
- `OutcomeUnknown` distinct de `ConfirmedExact`, sans retry/copie automatique;
- `Permission requise/refusee/revoquee`, avec action de reglage et sans boucle;
- `InternalRecoveryAvailable — texte brut disponible` jusqu'a copie explicite ou fin choisie par l'utilisateur.

Chaque indicateur suit les noms/roles/etats, focus et annonces de section 9. L'indicateur Fluent complete, sans remplacer, les indicateurs OS. Aucun succes n'est deduit de la disparition du widget ou du retour de focus. Si l'indicateur accessible disparait, le watchdog candidat arrete la capture en <= 1 000 ms; il ne transforme pas cette faute en succes.

## 15. Nettoyage et rollback

### Nettoyage de chaque essai

- desinscrire hotkey/grab et retirer hook/event tap;
- fermer les sessions portal et handles natifs;
- ne tenter de relacher/effacer ownership clipboard/selection que dans l'etat de spike `MATCHED`; `CHANGED` ou `UNKNOWN` implique zero mutation;
- zeroiser best-effort la fixture et le snapshot en memoire;
- fermer la cible helper et verifier l'absence de processus/hook residuel;
- ne jamais modifier une permission OS en dehors de l'action utilisateur documentee.

### Rollback de conception

| Echec prouve | Rollback |
|---|---|
| PTT global non fiable | toggle UI accessible; autre mecanisme derriere `PlatformAdapter` seulement apres nouvelle preuve |
| Indicateur accessible absent ou perdu | refuser l'armement ou arreter par watchdog; revenir a une surface principale accessible avant nouvel essai |
| Snapshot non revalidable | desactiver L2/L3, L1/L0 |
| Collage simule sous seuil | capability flag off pour mecanisme/cible; copie manuelle |
| Permission macOS excessive ou UX inacceptable | retirer la voie concernee, garder permissions minimales et L1/L0 |
| Portal Wayland absent/refuse/disproportionne | controle UI + surface Fluent focalisee + copie explicite + collage manuel |
| Tauri/plugin impose une surface IPC trop large | spike natif isole; aucune seconde commande Tauri avant allowlist F-05 |

Tout changement de stack, permission structurelle ou garantie de confidentialite exige un ADR. Les prototypes ne contiennent aucune donnee irremplacable et peuvent etre supprimes integralement.

## 16. Integration supply-chain et revue

- F-05: aucune nouvelle commande Tauri, WebView ou capability avant registre commandes/fenetres/origines et allowlist approuves.
- F-01/F-02: le harnais Linux releve le graphe Tauri/Wry/GTK utilise; il ne masque pas `glib 0.18.5` ni les advisories non maintenues. Ce plan ne les resout pas.
- Toute crate/plugin/helper candidat fournit version, source officielle, licence, checksum/lockfile et surface de permission avant adoption.
- Aucun outil de clipboard/hotkey installe globalement ne devient dependance produit par commodite de test.
- Le `security-reviewer` revoit TM-02 (capture persistante), TM-04 (clipboard), TM-05 (mauvaise cible), TM-14 (IPC) et TM-18 (residus) avant promotion.

## 17. Gate du lot

Ce document passe le lot de conception si:

- chaque OS/session a un mecanisme candidat, un probe et un fallback;
- Wayland est separe par compositor/backend/capability sans promesse universelle;
- permissions macOS, cible TOCTOU, clipboard, indicateurs, cleanup et rollback sont testables;
- l'oracle accessible bloque hotkey/fallback et fixe roles, noms, etats, clavier, focus, annonces, watchdog, matrice AT, artefacts et responsabilites frontend/QA sans pretendre une execution;
- `CHANGED`/`UNKNOWN` interdit normativement toute mutation clipboard; crash-sentinelle et redemarrage prouvent zero effacement avant toute promotion;
- commandes, fixtures, artefacts, tailles de campagne et criteres PASS/FAIL sont explicites;
- `HW-WIN` est la reference pratique seulement si `HW-MAC` est indisponible et cette absence est archivee;
- les preuves documentaires, hypotheses et environnements indisponibles ne sont jamais confondus avec un resultat natif.

Ce document ne satisfait pas a lui seul le critere Gate 02 « une injection de preuve fonctionne ». Ce critere reste `PENDING` jusqu'a une campagne reelle sur la plateforme de reference pratique ou produit, puis revue QA/securite.
