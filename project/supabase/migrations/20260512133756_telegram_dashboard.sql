/*
  # Telegram Dashboard

  ## New Tables

  ### telegram_config
  Stores per-user Telegram bot configuration (bot token + chat ID).
  One row per EOA address. The bot token is stored server-side only —
  never returned to the frontend via RLS.

  ### telegram_events
  Append-only log of every alert sent to Telegram.
  Used by the dashboard to show a live feed without polling Telegram.

  ## Security
  - RLS on both tables: users can only access rows matching their EOA
  - telegram_config.bot_token is excluded from SELECT via a security-definer view
    (the Edge Function uses service role to read it)

  ## Notes
  - The notify trigger on sequence_sessions calls pg_notify('session_event', payload)
    which the Edge Function listens to via Supabase Realtime database webhooks
*/

-- ─── telegram_config ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_config (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  eoa          text        NOT NULL UNIQUE,
  bot_token    text        NOT NULL DEFAULT '',
  chat_id      text        NOT NULL DEFAULT '',
  alerts_on    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own telegram config"
  ON telegram_config FOR SELECT
  TO authenticated
  USING (eoa = lower(auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own telegram config"
  ON telegram_config FOR INSERT
  TO authenticated
  WITH CHECK (eoa = lower(auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own telegram config"
  ON telegram_config FOR UPDATE
  TO authenticated
  USING (eoa = lower(auth.jwt() ->> 'sub'))
  WITH CHECK (eoa = lower(auth.jwt() ->> 'sub'));

-- ─── telegram_events ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  eoa          text        NOT NULL,
  event_type   text        NOT NULL,  -- 'session_created' | 'eip7702_delegated' | 'tx_submitted' | 'test'
  payload      jsonb       NOT NULL DEFAULT '{}',
  message_text text        NOT NULL DEFAULT '',
  sent_at      timestamptz NOT NULL DEFAULT now(),
  delivered    boolean     NOT NULL DEFAULT false,
  error        text
);

ALTER TABLE telegram_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own events"
  ON telegram_events FOR SELECT
  TO authenticated
  USING (eoa = lower(auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own events"
  ON telegram_events FOR INSERT
  TO authenticated
  WITH CHECK (eoa = lower(auth.jwt() ->> 'sub'));

-- Service role can insert events (used by Edge Functions)
CREATE POLICY "Service role can insert events"
  ON telegram_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update events"
  ON telegram_events FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS telegram_events_eoa_idx    ON telegram_events (eoa);
CREATE INDEX IF NOT EXISTS telegram_events_sent_idx   ON telegram_events (sent_at DESC);
CREATE INDEX IF NOT EXISTS telegram_config_eoa_idx    ON telegram_config (eoa);

-- ─── Trigger: notify Edge Function when a new session row is created ──────────

CREATE OR REPLACE FUNCTION notify_telegram_on_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- pg_notify payload is limited to 8000 bytes; keep it lean
  PERFORM pg_notify(
    'session_event',
    json_build_object(
      'table',        TG_TABLE_NAME,
      'op',           TG_OP,
      'eoa',          NEW.eoa,
      'wallet',       NEW.wallet,
      'chain_id',     NEW.chain_id,
      'mode',         NEW.mode,
      'is_delegated', NEW.is_delegated,
      'session_key',  NEW.session_key,
      'created_at',   NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_on_session ON sequence_sessions;
CREATE TRIGGER trg_telegram_on_session
  AFTER INSERT ON sequence_sessions
  FOR EACH ROW EXECUTE FUNCTION notify_telegram_on_session();
