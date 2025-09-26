use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct LoginDTO {
    #[validate(email(message = "Некорректный email"))]
    pub email: String,
    pub password: String,
}
