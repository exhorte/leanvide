#![forbid(unsafe_code)]

use fluent_core::HealthCheckResponse;

#[tauri::command]
fn health_check() -> HealthCheckResponse {
    HealthCheckResponse::ok(env!("CARGO_PKG_VERSION"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![health_check])
        .run(tauri::generate_context!())
        .expect("Fluent desktop shell failed to run");
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::health_check;

    #[test]
    fn health_check_has_no_request_and_returns_the_app_version() {
        let response = health_check();

        assert_eq!(
            serde_json::to_value(response).expect("health response must serialize"),
            json!({"status": "ok", "version": env!("CARGO_PKG_VERSION")})
        );
    }
}
