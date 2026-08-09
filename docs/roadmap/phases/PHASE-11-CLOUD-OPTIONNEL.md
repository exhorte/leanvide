# Phase 11 — Backend Cloud facultatif

## But

Ajouter les services qui apportent une valeur multi-appareil sans rendre le produit local dependant du reseau.

## Responsables

- Lead: `backend-lead`
- Architecture: `product-architect`
- Clients: `frontend-lead`, `rust-core-lead`
- Revue: `security-reviewer`

## Travaux

1. Definir cas justifiant le Cloud: compte, sync chiffree, abonnement, ASR/LLM optionnels.
2. Initialiser FastAPI type, PostgreSQL, migrations et OpenAPI.
3. Integrer auth avec tokens courts, refresh securise et deconnexion globale.
4. Concevoir synchronisation idempotente et resolution de conflits.
5. Implementer passerelle IA sans retention audio par defaut.
6. Ajouter quotas, rate limits, timeouts, retries bornes et circuit breakers.
7. Integrer Stripe seulement apres definition des offres.
8. Ajouter audit, export/suppression et politique de retention.
9. Deployer environnement de test minimal avec IaC.
10. Tester panne totale du Cloud: le mode local reste utilisable.

## Livrables exclus par defaut

Pas de Redis, Temporal, ClickHouse, Kafka ou microservices sans ADR et charge mesuree.

## Gate 11

- [ ] Desktop local fonctionne sans compte ni reseau.
- [ ] Contrats OpenAPI et migrations testes.
- [ ] Sync idempotente et conflits demonstrables.
- [ ] Aucune retention audio implicite.
- [ ] Cout, quotas, SLO, suppression et incident response documentes.

