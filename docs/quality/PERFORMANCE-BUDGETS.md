# Budgets de performance et de fiabilite

## Statut et regle de lecture

Ce document cadre les mesures de Fluent avant les prototypes. Les valeurs marquees
**cible MVP proposee** sont des hypotheses de produit et de QA : elles ne sont ni un
engagement de release, ni un critere de gate acquis. Elles deviennent un seuil de
gate seulement apres la validation des prototypes de la phase 02, le choix du
moteur ASR et la designation du materiel de reference.

Les valeurs **cible optimale** servent a orienter les choix d'architecture. Une
mesure qui ne peut pas encore etre figee est explicitement listee dans la derniere
section; elle ne doit pas etre maquillee en succes ou echec de phase.

## Conventions communes

- **p95** et **p99** sont calcules sur des essais independants; aucun simple
  « meilleur temps » ne vaut preuve.
- Les latences sont monotoniques et mesurees depuis l'evenement defini dans la
  ligne concernee jusqu'a l'evenement de fin defini dans la meme ligne.
- Le CPU est exprime en coeurs logiques equivalents (`temps CPU / temps mur`),
  pour etre comparable entre machines; la memoire est le RSS du processus,
  somme des processus enfants requis comprise.
- Hors cas contraire, un resultat porte sur 30 repetitions apres 3 repetitions
  de chauffe. Les essais end-to-end sont executes reseau desactive en mode local.
- Les resultats doivent indiquer version de l'application, commit, OS, architecture,
  moteur, modele, quantification, accelerateur, langue, peripherique audio et
  profil d'alimentation.

## Materiel de reference propose

Ces configurations sont les **candidats** de reference. Les proprietaires
plateforme et ASR les confirmeront ou les remplaceront pendant les prototypes.

| ID | Systeme et scenario requis | Configuration candidate | Pourquoi |
|---|---|---|---|
| HW-WIN | Windows 11 x64, secteur et batterie | portable Intel Core i5-1240P, 16 Go RAM, SSD NVMe, micro integre | reference x86 integree, sans GPU dedie |
| HW-MAC | macOS sur Apple Silicon | MacBook Air M2, 16 Go RAM, SSD interne, micro integre | mesure Metal/unified memory et permissions macOS |
| HW-LNX | Ubuntu LTS x86_64, GNOME | portable Ryzen 7 7840U, 16 Go RAM, SSD NVMe; session X11 puis Wayland | couvre audio et integrations X11/Wayland sans GPU dedie |

Une reference n'est valable que si les versions OS, pilotes audio, mode
d'alimentation et peripherique sont archives avec le resultat. Les tests de
compatibilite ne se limitent pas a ces trois postes : ils servent de baseline,
pas de promesse de support exhaustif.

## Budgets proposes

| Metrique | Definition et methode | Cible MVP proposee | Cible optimale | Percentile / unite | Materiel requis |
|---|---|---:|---:|---|---|
| Armement PTT | front descendant du raccourci physique jusqu'au premier bloc audio accepte par le pipeline; trace hotkey/audio monotone | <= 100 ms | <= 50 ms | p95; p99 <= 150 ms | HW-WIN, HW-MAC, HW-LNX X11; Wayland seulement si raccourci disponible |
| Fin de parole PTT | relachement du raccourci jusqu'a la fermeture de capture et remise du dernier bloc au consommateur ASR | <= 150 ms | <= 75 ms | p95; p99 <= 250 ms | meme matrice que l'armement |
| Fin de parole VAD | fin de la fenetre de silence configuree jusqu'a la remise ASR; le delai de silence configure est rapporte separement | <= 150 ms de surcout | <= 75 ms de surcout | p95; ms | plateformes/micro valides; fixture parole + silence |
| RTF ASR local | `temps de decodage / duree audio` sur corpus fige; prechargement du modele declare | <= 1.00 | <= 0.35 | p95; ratio sans unite | chaque HW, moteur/modele/quantification explicites |
| WER | distance de mots normalisee sur corpus de reference et normaliseur versionne | <= 12 % sur propre; <= 20 % sur bruit controle | <= 7 %; <= 12 % | point estimate + IC 95 %; % | corpus francais fige, chaque HW si le moteur varie |
| CER | distance de caracteres normalisee sur le meme corpus | <= 5 % sur propre; <= 10 % sur bruit controle | <= 2.5 %; <= 5 % | point estimate + IC 95 %; % | meme corpus et normalisation que WER |
| Injection reussie | texte final present une seule fois dans la cible correcte, sans substitution ni perte; test isole par application | >= 98 % Windows/macOS; >= 95 % X11 | >= 99.5 % partout ou injection est supportee | taux + IC binomial 95 % | applications cibles de `TEST-MATRIX.md` |
| Fallback Wayland | quand l'injection universelle est indisponible : clipboard contient le texte, instruction visible, aucun faux succes | >= 99 % de preparation clipboard | >= 99.9 % | taux + IC binomial 95 % | HW-LNX Wayland, compositor identifie |
| Perte d'echantillons | trous detectes par numeros de sequence de trames de 10 ms pendant capture synthetique et microphone | <= 0.01 % des trames; aucun essai 10 min avec trou > 30 ms | 0 trame perdue sur les essais qualifies | taux, maximum de trou en ms | chaque HW, 10 min x 3 par peripherique |
| CPU arme | processus Fluent, hotkey actif, aucune capture, modele non charge sauf declaration contraire | <= 0.03 coeur | <= 0.01 coeur | p95 sur 5 min | chaque HW |
| CPU capture/VAD | capture micro et VAD, sans decode ASR | <= 0.10 coeur | <= 0.04 coeur | p95 sur 5 min | chaque HW et micro integre |
| CPU ASR | decode local du corpus, hors installation/telchargement | <= 1.50 coeurs | <= 0.75 coeur | p95; aussi energie si disponible | chaque HW; profil ASR declare |
| Memoire | RSS en regime apres 5 min, sans historique de test; rapporter arme, capture et ASR separement | arme <= 350 MiB; capture <= 450 MiB; ASR <= 1.5 GiB | arme <= 200 MiB; capture <= 300 MiB; ASR <= 900 MiB | p95; MiB | chaque HW; modele declare |
| Demarrage chaud | lancement d'un processus deja en cache jusqu'a `ready`: tray/widget disponible et hotkey enregistre | <= 1.5 s | <= 0.75 s | p95; p99 <= 2.5 s | chaque HW, 30 lancements |
| Demarrage froid | cache applicatif/OS selon protocole archive jusqu'a `ready` | <= 3.0 s | <= 1.5 s | p95; p99 <= 4.5 s | chaque HW, protocole de froid explicite |
| Sessions sans crash | session eligibile = lancement a fermeture ou 30 min sans fermeture; crash natif, panic ou sortie non voulue compte echec | >= 99.5 % | >= 99.9 % | borne inferieure IC 95 % | beta consentie et campagnes de fault injection |
| Disque des modeles | taille de l'artefact verifie + espace temporaire de telechargement; binaire app rapporte a part | modele par defaut <= 600 MiB; espace libre preflight >= 1.5x artefact | <= 250 MiB; preflight >= 1.25x | MiB/GiB, taille exacte | chaque format de paquet/modeles signe |

## Particularites plateforme et fallbacks

Windows et macOS sont mesures pour l'injection dans les cibles autorisees apres
permissions explicites. Sous Linux X11, l'injection est testee comme capacite
native du protocole et de la cible. Sous Wayland, aucun budget ne suppose une
injection universelle : le compositor, les portals et les permissions disponibles
sont identifies par essai. En absence d'API autorisee, le resultat attendu est le
fallback clipboard explicite, jamais une simulation de frappe non verifiable.

Les taux d'injection excluent les cibles qui refusent volontairement le collage
ou l'accessibilite, mais ces exclusions doivent etre listees et teste-es comme
cas de fallback. Elles ne peuvent pas augmenter artificiellement le taux.

## Metriques non figables avant prototype

Les decisions suivantes conditionnent les valeurs de gate finales et restent
ouvertes :

- modele ASR par defaut, quantification, langues et acceleration CPU/GPU/Metal;
- algorithme VAD, seuil de silence, segmentation et definition UX de la
  « fin de parole » automatique;
- corpus sous licence, protocoles de normalisation, repartition propre/bruitee
  et seuils WER/CER acceptes par persona;
- API hotkey, capture de focus et injection disponibles par version de Windows,
  macOS, X11 et compositor Wayland;
- consommation energetique, pression memoire et temperatures; aucun seuil ne
  sera engage sans outil stable par OS;
- volume et instrumentations de sessions crash-free, qui exigent consentement
  explicite et politique de minimisation des donnees;
- taille finale de l'application et des modeles, dependantes des bindings et
  formats finalement retenus.

La phase 02 doit produire une baseline versionnee pour ces points. Toute valeur
modifiee apres cette baseline requiert une decision tracee dans le rapport de
cycle et l'actualisation conjointe du plan de mesure.
