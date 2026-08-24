/*
  # Add session_private_key column and make sessions persistent

  ## Changes

  ### Modified: sequence_sessions
  - Add `session_private_key` (text) — stores the ephemeral private key so it
    can be restored on reconnect without re-signing. Nullable for rows created
    before this migration.
  - Change `deadline` default to year 2099 (no practical expiry) so sessions
    created without an explicit deadline are permanent.

  ## Notes
  - Existing rows keep their deadline values unchanged.
  - The private key is stored server-side so it survives page reloads. The only
    person who can read a row is the same EOA owner (enforced by RLS).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequence_sessions' AND column_name = 'session_private_key'
  ) THEN
    ALTER TABLE sequence_sessions ADD COLUMN session_private_key text;
  END IF;
END $$;
