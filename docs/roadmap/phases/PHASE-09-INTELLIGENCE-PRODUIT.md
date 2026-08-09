# Phase 09 — Dictionnaire, contexte et formatage

## But

Ameliorer la precision percue sans sacrifier fidelite, confidentialite ou controle utilisateur.

## Responsables

- Lead: `ai-asr-lead`
- UX: `frontend-lead`
- Plateforme: `platform-lead`
- Revue: `security-reviewer`

## Travaux

1. Ajouter dictionnaire personnel avec import/export et priorites.
2. Creer profils de formatage par application et type de champ.
3. Collecter uniquement le contexte necessaire via accessibilite.
4. Ajouter noms propres/texte selectionne comme hints, pas comme contenu permanent.
5. Implementer ponctuation, paragraphes, commandes vocales et corrections orales.
6. Separer transcription exacte, normalisation deterministe et reecriture generative.
7. Afficher clairement l'etape Cloud et permettre de la desactiver.
8. Conserver texte brut pour fallback et comparaison locale controlee.
9. Mesurer gain WER/acceptation et taux de corrections utilisateur.
10. Reporter OCR plein ecran apres threat model et consentement dedies.

## Gate 09

- [ ] Dictionnaire ameliore le corpus cible sans regression globale significative.
- [ ] Chaque transformation est tracable, desactivable et testee.
- [ ] Echec de reecriture retourne exactement au texte brut disponible.
- [ ] Contexte sensible n'est ni journalise ni conserve par defaut.
- [ ] Profils applicatifs se comportent de facon deterministe.

