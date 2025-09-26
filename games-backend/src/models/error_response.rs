use std::collections::HashMap;

#[derive(serde::Serialize)]
pub struct ErrorResponse {
    pub errors: HashMap<String, Vec<String>>,
}
