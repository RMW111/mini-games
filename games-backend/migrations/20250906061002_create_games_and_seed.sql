CREATE TABLE games
(
    id          uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    slug        text        NOT NULL UNIQUE,
    name        text        NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO games (slug, name, description)
VALUES ('minesweeper', 'Сапёр', 'Классическая игра-головоломка, где нужно найти все мины на поле'),
       ('chess', 'Шахматы', 'Стратегическая настольная игра для двух игроков')
