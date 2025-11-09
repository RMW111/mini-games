use serde::Deserialize;
use std::fmt::Display;
use std::str::FromStr;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GameSlug {
    Minesweeper,
    Go,
}

impl FromStr for GameSlug {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "minesweeper" => Ok(Self::Minesweeper),
            "go" => Ok(Self::Go),
            _ => Err("Unknown slug".into()),
        }
    }
}

impl Display for GameSlug {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = match self {
            GameSlug::Minesweeper => String::from("minesweeper"),
            GameSlug::Go => String::from("go"),
        };
        write!(f, "{}", str)
    }
}
