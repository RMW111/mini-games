ALTER TABLE game_sessions
    ADD COLUMN game_stats jsonb NOT NULL DEFAULT '{}';
