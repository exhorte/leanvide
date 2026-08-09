import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

describe("App", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("affiche la disponibilité renvoyée par le contrat IPC health_check", async () => {
    invoke.mockResolvedValue({ status: "ok", version: "0.1.0" });

    render(<App />);

    expect(await screen.findByText(/Application prête — version 0\.1\.0\./)).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("health_check");
  });

  it("masque les détails natifs quand le contrôle de santé échoue", async () => {
    invoke.mockRejectedValue(new Error("native detail that must not reach the UI"));

    render(<App />);

    expect(await screen.findByText("Impossible de vérifier l’état de l’application.")).toBeInTheDocument();
    expect(screen.queryByText(/native detail/)).not.toBeInTheDocument();
  });
});
