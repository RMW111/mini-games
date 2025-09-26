CREATE TABLE refresh_tokens
(
    id         UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_unique UNIQUE (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
