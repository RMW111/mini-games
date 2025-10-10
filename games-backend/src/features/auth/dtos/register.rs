use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
#[serde(rename_all =  "camelCase")]
pub struct RegisterDTO {
    #[validate(email(message = "Некорректный email"))]
    pub email: String,

    #[validate(length(min = 6, max = 30, message = "Пароль должен быть от 6 до 30 символов"))]
    pub password: String,

    #[validate(url(message = "Некорректная ссылка на аватар"))]
    pub avatar_url: String,
}
