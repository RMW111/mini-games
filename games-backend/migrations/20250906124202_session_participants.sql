CREATE TYPE participant_role AS ENUM ('creator', 'player', 'spectator');

CREATE TABLE session_participants
(
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role participant_role NOT NULL,
    joined_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE(session_id, user_id)
);
