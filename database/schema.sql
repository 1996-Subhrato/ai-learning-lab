-- database/schema.sql

-- Enable pgcrypto extension to guarantee gen_random_uuid() availability across environments
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- updated_at will be maintained by the backend during UPDATE operations.
    -- Automatic database triggers are intentionally postponed to a future PR.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ON DELETE CASCADE ensures deleting a chat automatically wipes its messages, maintaining referential integrity
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    -- Restrict role to known actors using a CHECK constraint to prevent invalid data insertion
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    complete BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for improved retrieval performance (e.g., fetching a chat's history ordered by time)
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
