# Memoire frontend-lead

- Dashboard avec shadcn/ui; widget flottant dans un bundle minimal separe.
- Serveur MCP de projet: `shadcn` dans `.mcp.json` et `.vscode/mcp.json`.
- Phase 01: shadcn/ui est explicitement differe a la Phase 03; la convention MCP a ete consultee mais aucun composant n'a ete ajoute.
- Le smoke IPC frontend passe exclusivement par `apps/desktop/src/ipc/health.ts`: `invoke<HealthCheckResponse>("health_check")`, avec `{ status: "ok", version: string }` et un fallback UI generique sans detail natif.
- Le socle frontend est React/TypeScript strict/Vite; Node 24.15.0 et pnpm 11.8.0 sont epingles a la racine. TypeScript 5.9.3 est retenu car `typescript-eslint` ne supporte pas encore TypeScript 7.
