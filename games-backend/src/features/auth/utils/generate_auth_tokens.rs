use crate::features::auth::utils::jwt::generate_jwt;
use crate::utils::get_env_var::get_env_var;

pub fn generate_auth_tokens(uuid: String) -> (String, String) {
    let access_minutes = get_env_var("ACCESS_TOKEN_EXP_MIN").parse().unwrap();
    let refresh_minutes = get_env_var("REFRESH_TOKEN_EXP_MIN").parse().unwrap();
    let access_token = generate_jwt(&uuid, access_minutes);
    let refresh_token = generate_jwt(&uuid, refresh_minutes);
    (access_token, refresh_token)
}
