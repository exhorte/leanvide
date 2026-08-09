# Matrice plateformes et capacités

Statut: **cible proposée, à prouver par spikes**

Décisions liées: `D-03` à `D-07`

Références: [PRD MVP](PRD-MVP.md), [ADR-0001](../architecture/ADR-0001-STACK-CIBLE.md)

## 1. Légende

La matrice décrit des voies techniques candidates, pas des fonctionnalités déjà implémentées.

| Marque | Sens |
|---|---|
| `CIBLE` | capacité visée, soumise aux critères du PRD |
| `SPIKE` | faisabilité ou comportement à démontrer avant engagement |
| `FALLBACK` | résultat récupérable sans automatisation complète |
| `LIMITÉ` | support borné à des versions/configurations nommées |
| `HORS MVP` | aucun engagement dans le MVP candidat |
| `OUVERT` | dépend d'une décision produit D-01 à D-14 |

## 2. Politique de support proposée

Une plateforme n'est « supportée » que si les éléments suivants sont nommés et testés ensemble:

- famille et version du système;
- architecture CPU;
- session graphique/compositor lorsque pertinent;
- WebView et dépendances natives;
- mécanisme de permission;
- moteur, modèle et accélérateur ASR;
- mécanisme de remise du texte;
- format de packaging, signature et mise à jour;
- matériel minimal et matériel de référence.

`Windows`, `macOS` ou `Linux` seuls ne constituent donc pas une déclaration de support.

## 3. Matrice fonctionnelle candidate

| Capacité | Windows | macOS | Linux X11 | Linux Wayland |
|---|---|---|---|---|
| Shell Tauri 2 + WebView système | `CIBLE`, versions à décider | `CIBLE`, versions/architectures à décider | `CIBLE`, distribution/WebKitGTK à décider | `CIBLE`, distribution/WebKitGTK à décider |
| Capture microphone | `SPIKE` périphériques, changements et permission | `SPIKE` permission et changements de périphérique | `SPIKE` pile audio retenue | `SPIKE` pile audio + PipeWire/portal selon environnement |
| Push-to-talk global | `SPIKE` conflits, key-up perdu, élévation | `SPIKE` permission Input Monitoring/Accessibility selon voie | `SPIKE` serveur X et conflits WM | `LIMITÉ/SPIKE`; dépend compositor/portal, aucune universalité promise |
| Mode toggle | `CIBLE` comme repli potentiel | `CIBLE` comme repli potentiel | `CIBLE` comme repli potentiel | `CIBLE` si hotkey disponible; sinon contrôle UI |
| Écoute continue | `HORS MVP` tant que D-07 ouverte | `HORS MVP` | `HORS MVP` | `HORS MVP` |
| Widget toujours visible | `SPIKE` focus, multi-écrans, DPI | `SPIKE` Spaces, plein écran, niveaux de fenêtre | `SPIKE` WM, multi-écrans, scaling | `SPIKE`; règles du compositor |
| Détection de cible | `SPIKE` fenêtre/processus et niveaux d'intégrité | `SPIKE` application/fenêtre et permissions | `SPIKE` fenêtres X11/WM | `LIMITÉ/SPIKE`; protocole et compositor |
| Injection/collage automatisé | `SPIKE`; API native et focus à tester | `SPIKE`; événements synthétiques et permission à tester | `SPIKE`; mécanisme X11 à choisir | `LIMITÉ`; seulement voies explicitement autorisées |
| Copie du résultat | `FALLBACK` candidat | `FALLBACK` candidat | `FALLBACK` candidat | `FALLBACK` principal candidat |
| Collage manuel guidé | `FALLBACK` | `FALLBACK` | `FALLBACK` | `FALLBACK` obligatoire si aucune injection autorisée |
| Texte brut récupérable | `CIBLE` proposée | `CIBLE` proposée | `CIBLE` proposée | `CIBLE` proposée |
| ASR local CPU | `SPIKE` moteur/modèle/matériel | `SPIKE` moteur/modèle/matériel | `SPIKE` moteur/modèle/matériel | `SPIKE` moteur/modèle/matériel |
| Accélération locale | `SPIKE`; backend à choisir | `SPIKE`; Apple Silicon candidat | `SPIKE`; matériel/pilotes à borner | `SPIKE`; matériel/pilotes à borner |
| Fonctionnement hors ligne | `OUVERT` D-09/D-10 | `OUVERT` | `OUVERT` | `OUVERT` |
| Stockage local SQLite | `CIBLE` proposée | `CIBLE` proposée | `CIBLE` proposée | `CIBLE` proposée |
| Lancement automatique/tray | `HORS MVP` ou `SPIKE` selon parcours | `HORS MVP` ou `SPIKE` | `HORS MVP` ou `SPIKE` | `HORS MVP` ou `SPIKE` |
| Packaging signé | `HORS MVP`, requis avant bêta publique | `HORS MVP`, requis avant bêta publique | `HORS MVP`; formats à décider | `HORS MVP`; formats à décider |
| Mise à jour automatique | `HORS MVP` | `HORS MVP` | `HORS MVP` | `HORS MVP` |

## 4. Niveaux de remise du texte

Le produit ne doit pas réduire la remise à un booléen « injection supportée ».

| Niveau | Résultat | Exigence candidate |
|---|---|---|
| L0 — résultat interne | le texte brut est visible/récupérable dans Fluent | aucun texte produit ne disparaît |
| L1 — copie | Fluent place le texte dans le presse-papiers après action/consentement défini | état explicite; risque presse-papiers documenté |
| L2 — collage automatisé | Fluent tente un collage dans une cible revalidée | permission et focus vérifiés; timeout borné |
| L3 — insertion native | Fluent utilise une API d'accessibilité ou d'édition adaptée | seulement pour applications/OS prouvés; pas d'universalité |

Le MVP candidat accepte L2 sur les environnements prouvés et retombe vers L1/L0. Sous Wayland, L1/L0 doivent être considérés comme des comportements normaux, pas comme une erreur exceptionnelle.

### Garde-fous presse-papiers proposés

- ne jamais journaliser son contenu;
- ne pas lire l'ancien contenu sans besoin explicite;
- ne pas restaurer automatiquement un contenu sensible sans threat model et test de course;
- signaler que d'autres processus peuvent observer le presse-papiers;
- offrir L0 lorsque l'utilisateur refuse L1;
- distinguer « copié » de « collé et confirmé ».

Ces choix restent soumis à validation sécurité et produit.

## 5. Contraintes par environnement

### 5.1 Windows

Points à prouver:

- disponibilité et comportement de la WebView sur les versions retenues;
- capture audio, changement/suspension de périphérique et formats négociés;
- raccourcis globaux, key-up perdu, verrouillage de session et conflits système;
- règles de focus/foreground, applications élevées et bureaux virtuels;
- injection dans applications Win32, WebView, navigateur, terminal et applications riches;
- DPI, multi-écrans, veille/reprise;
- format d'installation, signature et migration d'une version précédente.

Dégradation proposée: si la cible ne peut pas être revalidée ou si son niveau d'intégrité interdit l'action, conserver le texte et passer à L1/L0.

### 5.2 macOS

Points à prouver:

- versions macOS et architectures Intel/Apple Silicon retenues;
- permission microphone, Input Monitoring et Accessibility selon mécanisme exact;
- comportement des event taps/hotkeys, perte de key-up et Secure Input;
- focus entre applications, Spaces, plein écran et bureaux;
- insertion dans applications Cocoa, navigateur, terminal et éditeurs riches;
- fenêtre flottante sans voler le focus;
- signature, hardened runtime, entitlements et notarisation.

Dégradation proposée: une permission refusée désactive uniquement la capacité concernée, explique le chemin de réglage et préserve L0/L1.

### 5.3 Linux X11

Points à prouver:

- distribution, environnement de bureau et serveur X de référence;
- backend audio réellement retenu;
- hotkeys et conflits avec le gestionnaire de fenêtres;
- récupération/revalidation de fenêtre active;
- mécanisme d'injection et dépendances autorisées;
- WebKitGTK, tray, scaling et packaging;
- comportement sous sandbox ou bureau distant.

Dégradation proposée: si hotkey ou injection manque, contrôle UI + L1/L0, avec diagnostic de la dépendance/capacité absente.

### 5.4 Linux Wayland

Wayland est une famille de protocoles et politiques de compositor. Fluent ne promet pas de contrôle global, de focus ou d'injection universels.

Points à prouver par compositor/session:

- portals disponibles et consentements visibles;
- hotkey globale si le desktop expose une voie autorisée;
- capture audio via la pile retenue;
- identification de l'application cible sans lecture excessive de contexte;
- voie de saisie automatisée explicitement permise;
- comportement du widget et activation de fenêtre;
- fallback L1/L0 indépendant de l'injection.

Dégradation minimale proposée:

```text
contrôle UI ou hotkey disponible
        -> capture et ASR
        -> texte brut dans Fluent
        -> copie explicite
        -> collage manuel par l'utilisateur
```

Cette dégradation doit être testée comme un parcours de premier rang.

## 6. Matrice local/Cloud candidate

| Capacité | Local candidat | Cloud candidat | MVP |
|---|---|---|---|
| capture | obligatoire sur l'appareil | aucune capture distante directe | proposé |
| ASR | moteur local initial | fournisseur derrière une passerelle explicite | D-10 ouverte |
| réécriture | déterministe ou moteur local futur | LLM opt-in avec brut préservé | hors MVP candidat |
| dictionnaire | local | synchronisation optionnelle | V1/ultérieur |
| historique | local selon D-08 | synchronisation selon D-08/D-10 | ouvert/hors MVP candidat |
| compte | aucun pour le chemin local proposé | nécessaire seulement aux fonctions distantes | D-09 ouverte |
| diagnostics | local expurgé | envoi opt-in et minimisé | threat model requis |
| modèles | fichiers locaux avec intégrité | manifestes/téléchargement via distribution | proposé |

## 7. Ordre des plateformes

L'ordre réel reste D-04. L'ordre des phases macOS -> Linux -> Windows dans la roadmap ne constitue pas à lui seul une décision produit.

Critères d'arbitrage proposés:

1. concentration du persona principal par OS;
2. disponibilité des machines et responsables de test;
3. capacité à établir une baseline CPU sans accélérateur;
4. coût des permissions, du packaging et de la signature;
5. risque d'injection et qualité du fallback;
6. possibilité de réutiliser les contrats sans fausse parité;
7. éventuelle base WPF externe établie par D-14.

## 8. Spikes de Phase 02 nécessaires

| Spike | Environnements | Preuve de sortie | Échec/rollback |
|---|---|---|---|
| P-01 capture temps réel | plateforme de référence, puis une machine faible | pertes, jitter, CPU, changements périphérique | remplacer l'adaptateur audio sans toucher aux états métier |
| P-02 hotkey | chaque environnement retenu | 1 000 cycles down/up, veille, verrouillage, conflits | basculer vers toggle ou contrôle UI |
| P-03 widget | chaque WebView/window manager retenu | armement, focus, multi-écrans, a11y | widget natif/minimal ou fenêtre principale uniquement |
| P-04 remise | matrice d'applications | taux L2/L3 et repli L1/L0 | désactiver la voie non fiable par capability flag |
| P-05 ASR | matériels/langues retenus | RTF, latence, WER, mémoire | changer modèle/backend derrière le trait |
| P-06 packaging | OS de référence | build/install/uninstall/signature reproductibles | suspendre la plateforme sans casser le core |

## 9. Critères pour promouvoir une capacité

Une case passe de `SPIKE` à `CIBLE CONFIRMÉE` seulement si:

- l'environnement exact est documenté;
- le test est reproductible et versionné;
- permissions et données manipulées sont connues;
- la dégradation a été exercée;
- le taux de succès et le budget ont été acceptés;
- un rollback ou capability flag existe;
- QA et sécurité ont revu la preuve proportionnellement au risque.
