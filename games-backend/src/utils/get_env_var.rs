use std::env;

pub fn get_env_var(key: &str) -> String {
    env::var(key).expect(&format!("{key} must be set"))
}
