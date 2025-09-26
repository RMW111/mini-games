CREATE TYPE session_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE game_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    status session_status NOT NULL DEFAULT 'in_progress',
    game_state jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
