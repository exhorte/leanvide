# Registre consolidé des décisions produit — PHASE-00

- Cycle de proposition: `CYCLE-20260809-01`
- Cycle de confirmation: `CYCLE-20260809-02`
- Date: 2026-08-09
- Statut: **D-01 A D-14 CONFIRMEES**
- Preuve: acceptation explicite de l'utilisateur — « J’accepte D-01 à D-14 telles que recommandées. »
- Portee: les options recommandees ci-dessous deviennent les decisions de reference; leurs limites et validations differees restent applicables

## Faits verifies

- `Fluent` est le nom de travail utilise par la documentation; le depot GitHub s'appelle `leanvide` et le dossier local `leanvibeApp`.
- Le depot GitHub est actuellement public.
- Le texte officiel Apache-2.0 est present dans `LICENSE` depuis la confirmation de D-12.
- Aucun fichier `.cs`, `.csproj`, `.sln` ou `.xaml` n'existe dans ce depot; cela ne prouve pas l'absence d'une application WPF externe.
- Les documents normatifs imposent le local-first et interdisent tout envoi audio ou contextuel sans consentement explicite.

## Decisions confirmees

Les quatorze recommandations ont ete acceptees ensemble le 2026-08-09. `CONFIRMEE` signifie que le choix produit est tranche; cela ne transforme pas une hypothese de performance ou une verification juridique explicitement differee en preuve acquise.

| ID | Decision demandee | Option recommandee | Alternatives principales | Impact de la recommandation | Statut |
|---|---|---|---|---|---|
| D-01 | Nom definitif | **Fluent**, sous reserve d'une verification marque/domaine avant publication | Leanvide; nouveau nom | aligne les documents existants; exige harmonisation depot, package IDs et actifs de marque | **CONFIRMEE** |
| D-02 | Utilisateur cible principal | **professionnel desktop a forte production ecrite, sensible a la confidentialite** | utilisateur Linux technique; equipe/administrateur entreprise | priorise dictes courtes multi-apps, mode local, recuperation et sobriete; reporte SSO/admin | **CONFIRMEE** |
| D-03 | Plateforme de reference | **macOS Apple Silicon**, si une machine de test est disponible | Windows 11 x64; Ubuntu LTS x86_64 | donne une baseline ASR/permissions/packaging nette; sans materiel disponible, Windows doit devenir la reference pratique | **CONFIRMEE** |
| D-04 | Ordre des OS | **macOS -> Linux -> Windows**, conforme a la roadmap actuelle | macOS -> Windows -> Linux; Windows-first si WPF reutilisable | preserve le plan actuel et traite tot Wayland; retarde la couverture Windows | **CONFIRMEE** |
| D-05 | Langues MVP | **francais**, avec termes anglais/code dans le corpus mais sans promesse bilingue complete | anglais seul; francais + anglais complets | borne corpus, normalisation et WER/CER; une seconde langue double la surface d'evaluation | **CONFIRMEE** |
| D-06 | Materiel minimal | **plancher provisoire 4 coeurs modernes, 8 Gio RAM, 2 Gio libres, GPU dedie non requis; reference 16 Gio** | minimum 16 Gio; acceleration obligatoire | maintient l'accessibilite materielle; le support definitif reste conditionne aux benchmarks Phase 02 | **CONFIRMEE** |
| D-07 | Interaction de capture | **push-to-talk par defaut + toggle accessible; pas d'ecoute continue au MVP** | toggle seul; ecoute continue/VAD | reduit la surcapture et simplifie l'etat; impose des hotkeys/release fiables et un repli UI | **CONFIRMEE** |
| D-08 | Historique | **zero-history par defaut; historique texte local opt-in avec retention configurable; aucun audio persiste par defaut** | historique texte active par defaut; aucune fonction d'historique | minimise le risque; exige schema, purge, export et UX seulement si l'opt-in est retenu | **CONFIRMEE** |
| D-09 | Compte | **aucun compte requis pour installer et utiliser le chemin local** | compte requis; compte demande seulement pour telechargement | preserve offline/local-first; reserve l'auth aux fonctions distantes futures | **CONFIRMEE** |
| D-10 | Cloud dans le MVP | **absent du MVP; seulement contrats/ports sans implementation distante** | Cloud ASR optionnel; sync optionnelle des le MVP | reduit risque, cout et delai; reporte validation commerciale des services distants | **CONFIRMEE** |
| D-11 | Visibilite du depot | **rester public apres choix immediat d'une licence et revue de l'historique** | rendre prive; separer core public et produit prive | capitalise sur l'etat actuel, mais exige discipline secrets, contributions et actifs redistribuables | **CONFIRMEE** |
| D-12 | Licence du code | **Apache-2.0** | double MIT/Apache-2.0; MIT; proprietaire | fournit un octroi de brevets explicite; les modeles, donnees et marques gardent leurs licences propres | **CONFIRMEE** |
| D-13 | Modele economique | **coeur local gratuit; Cloud/sync facultatifs payants apres validation** | achat unique desktop; abonnement complet; produit gratuit | aligne absence de compte local et couts Cloud; necessite definir la frontiere open-source/commerciale | **CONFIRMEE** |
| D-14 | Application WPF | **traiter le projet comme greenfield; aucune migration sans depot/inventaire fourni** | migrer une base WPF externe; coexistence temporaire | evite une architecture fondee sur une source absente; un inventaire externe peut rouvrir l'ADR avant Phase 01 | **CONFIRMEE** |

## Consequences et validations differees

- Le blocage produit du Gate 00 est leve; le verdict final depend encore de la coherence des preuves de cadrage.
- D-03 reste conditionnee a la disponibilite effective d'une machine macOS Apple Silicon; l'absence de cette machine declenche le repli Windows documente, sans modifier implicitement la decision.
- D-06 conserve son caractere provisoire jusqu'aux benchmarks reproductibles de `PHASE-02`.
- D-01 exige toujours une verification marque/domaine avant publication commerciale.
- D-11/D-12 imposent la revue continue des secrets, contributions et licences tierces; `LICENSE` couvre le code du depot, pas automatiquement les modeles, donnees ni marques.
- D-13 ne vaut pas lancement du Cloud: l'implementation distante reste hors MVP selon D-10.
- D-14 peut etre rouverte seulement si un depot ou inventaire WPF externe est fourni avant une fondation irreversible.

## Tracabilite

- Proposition et analyse initiales: `docs/project-management/cycles/CYCLE-20260809-01.md`.
- Confirmation et reevaluation du gate: `docs/project-management/cycles/CYCLE-20260809-02.md`.
