# Registre consolidé des décisions produit — PHASE-00

- Cycle: `CYCLE-20260809-01`
- Date: 2026-08-09
- Statut: **ARBITRAGE UTILISATEUR REQUIS**
- Portee: decisions necessaires au Gate 00; aucune ligne ouverte ne vaut decision implicite

## Faits verifies

- `Fluent` est le nom de travail utilise par la documentation; le depot GitHub s'appelle `leanvide` et le dossier local `leanvibeApp`.
- Le depot GitHub est actuellement public.
- Aucune licence de code n'est presente dans les fichiers suivis.
- Aucun fichier `.cs`, `.csproj`, `.sln` ou `.xaml` n'existe dans ce depot; cela ne prouve pas l'absence d'une application WPF externe.
- Les documents normatifs imposent le local-first et interdisent tout envoi audio ou contextuel sans consentement explicite.

## Arbitrages proposes

Les recommandations ci-dessous sont argumentees mais non confirmees. La reponse utilisateur peut accepter l'ensemble ou remplacer seulement certains IDs.

| ID | Decision demandee | Option recommandee | Alternatives principales | Impact de la recommandation | Statut |
|---|---|---|---|---|---|
| D-01 | Nom definitif | **Fluent**, sous reserve d'une verification marque/domaine avant publication | Leanvide; nouveau nom | aligne les documents existants; exige harmonisation depot, package IDs et actifs de marque | ouverte |
| D-02 | Utilisateur cible principal | **professionnel desktop a forte production ecrite, sensible a la confidentialite** | utilisateur Linux technique; equipe/administrateur entreprise | priorise dictes courtes multi-apps, mode local, recuperation et sobriete; reporte SSO/admin | ouverte |
| D-03 | Plateforme de reference | **macOS Apple Silicon**, si une machine de test est disponible | Windows 11 x64; Ubuntu LTS x86_64 | donne une baseline ASR/permissions/packaging nette; sans materiel disponible, Windows doit devenir la reference pratique | ouverte |
| D-04 | Ordre des OS | **macOS -> Linux -> Windows**, conforme a la roadmap actuelle | macOS -> Windows -> Linux; Windows-first si WPF reutilisable | preserve le plan actuel et traite tot Wayland; retarde la couverture Windows | ouverte |
| D-05 | Langues MVP | **francais**, avec termes anglais/code dans le corpus mais sans promesse bilingue complete | anglais seul; francais + anglais complets | borne corpus, normalisation et WER/CER; une seconde langue double la surface d'evaluation | ouverte |
| D-06 | Materiel minimal | **plancher provisoire 4 coeurs modernes, 8 Gio RAM, 2 Gio libres, GPU dedie non requis; reference 16 Gio** | minimum 16 Gio; acceleration obligatoire | maintient l'accessibilite materielle; le support definitif reste conditionne aux benchmarks Phase 02 | ouverte |
| D-07 | Interaction de capture | **push-to-talk par defaut + toggle accessible; pas d'ecoute continue au MVP** | toggle seul; ecoute continue/VAD | reduit la surcapture et simplifie l'etat; impose des hotkeys/release fiables et un repli UI | ouverte |
| D-08 | Historique | **zero-history par defaut; historique texte local opt-in avec retention configurable; aucun audio persiste par defaut** | historique texte active par defaut; aucune fonction d'historique | minimise le risque; exige schema, purge, export et UX seulement si l'opt-in est retenu | ouverte |
| D-09 | Compte | **aucun compte requis pour installer et utiliser le chemin local** | compte requis; compte demande seulement pour telechargement | preserve offline/local-first; reserve l'auth aux fonctions distantes futures | ouverte |
| D-10 | Cloud dans le MVP | **absent du MVP; seulement contrats/ports sans implementation distante** | Cloud ASR optionnel; sync optionnelle des le MVP | reduit risque, cout et delai; reporte validation commerciale des services distants | ouverte |
| D-11 | Visibilite du depot | **rester public apres choix immediat d'une licence et revue de l'historique** | rendre prive; separer core public et produit prive | capitalise sur l'etat actuel, mais exige discipline secrets, contributions et actifs redistribuables | ouverte |
| D-12 | Licence du code | **Apache-2.0** | double MIT/Apache-2.0; MIT; proprietaire | fournit un octroi de brevets explicite; les modeles, donnees et marques gardent leurs licences propres | ouverte |
| D-13 | Modele economique | **coeur local gratuit; Cloud/sync facultatifs payants apres validation** | achat unique desktop; abonnement complet; produit gratuit | aligne absence de compte local et couts Cloud; necessite definir la frontiere open-source/commerciale | ouverte |
| D-14 | Application WPF | **traiter le projet comme greenfield; aucune migration sans depot/inventaire fourni** | migrer une base WPF externe; coexistence temporaire | evite une architecture fondee sur une source absente; un inventaire externe peut rouvrir l'ADR avant Phase 01 | ouverte |

## Consequences sur le Gate 00

Le Gate 00 reste bloque tant que ces decisions ne sont pas explicitement datees et confirmees. Les plus structurantes pour autoriser `PHASE-01` sont D-02 a D-10, D-12 et D-14. D-01, D-11 et D-13 doivent au minimum etre resolues avant packaging public, contributions ou choix d'entitlements.

## Format de reponse accepte

La reponse la plus courte est:

```text
J'accepte D-01 a D-14 telles que recommandees.
```

Pour modifier seulement certaines lignes:

```text
D-03: Windows 11 x64.
D-04: Windows -> macOS -> Linux.
D-11: prive.
Toutes les autres recommandations sont acceptees.
```
