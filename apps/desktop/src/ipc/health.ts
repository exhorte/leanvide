import { invoke } from "@tauri-apps/api/core";

export type HealthCheckResponse = {
  status: "ok";
  version: string;
};

const HEALTH_CHECK_COMMAND = "health_check";

export function healthCheck(): Promise<HealthCheckResponse> {
  return invoke<HealthCheckResponse>(HEALTH_CHECK_COMMAND);
}
