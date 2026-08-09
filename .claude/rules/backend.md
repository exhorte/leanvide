---
paths:
  - "services/api/**/*.py"
---

# Regles backend

- FastAPI, Python type, Pydantic et PostgreSQL.
- Commencer par un monolithe modulaire; pas de Redis, Temporal ou ClickHouse sans ADR et besoin mesure.
- Les endpoints Cloud sont facultatifs et ne degradent pas le mode local.
- Ne jamais conserver l'audio par defaut. Documenter retention, consentement et suppression.
- Toute migration de schema possede un chemin avant/arriere et un test.

