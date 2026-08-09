#![forbid(unsafe_code)]

use serde::Serialize;

/// Response returned by the foundation IPC smoke test.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct HealthCheckResponse {
    pub status: String,
    pub version: String,
}

impl HealthCheckResponse {
    #[must_use]
    pub fn ok(version: impl Into<String>) -> Self {
        Self {
            status: "ok".to_owned(),
            version: version.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::HealthCheckResponse;

    #[test]
    fn health_check_response_matches_the_ipc_contract() {
        let response = HealthCheckResponse::ok("0.1.0");

        assert_eq!(
            serde_json::to_value(response).expect("health response must serialize"),
            json!({"status": "ok", "version": "0.1.0"})
        );
    }
}
