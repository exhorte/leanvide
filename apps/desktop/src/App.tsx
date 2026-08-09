import { useEffect, useState } from "react";

import { healthCheck, type HealthCheckResponse } from "./ipc/health";

type HealthState =
  | { kind: "loading" }
  | { kind: "ready"; response: HealthCheckResponse }
  | { kind: "error" };

const GENERIC_HEALTH_ERROR = "Impossible de vérifier l’état de l’application.";

export function App() {
  const [health, setHealth] = useState<HealthState>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    void healthCheck().then(
      (response) => {
        if (active) {
          setHealth({ kind: "ready", response });
        }
      },
      () => {
        if (active) {
          setHealth({ kind: "error" });
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <section className="health-card" aria-describedby="privacy-note">
        <p className="eyebrow">Fluent</p>
        <h1 id="app-title">Dictée vocale locale</h1>
        <p id="privacy-note">Aucune donnée n’est envoyée hors de votre appareil.</p>
        <div aria-live="polite" role="status">
          {health.kind === "loading" && <p>Vérification de l’application…</p>}
          {health.kind === "ready" && (
            <p>Application prête — version {health.response.version}.</p>
          )}
          {health.kind === "error" && <p>{GENERIC_HEALTH_ERROR}</p>}
        </div>
      </section>
    </main>
  );
}
