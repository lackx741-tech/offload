/*
  # Fix telegram_config and telegram_events RLS for anon key usage

  The app uses Supabase anon key without Supabase Auth, so auth.jwt() ->> 'sub'
  is always null. Replace the auth-based policies with open anon policies that
  allow the frontend to read/write freely. The EOA address in the row acts as
  the application-level identity.
*/

-- ─── telegram_config ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can select own telegram config" ON telegram_config;
DROP POLICY IF EXISTS "Users can insert own telegram config" ON telegram_config;
DROP POLICY IF EXISTS "Users can update own telegram config" ON telegram_config;

CREATE POLICY "Anon can select telegram config"
  ON telegram_config FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert telegram config"
  ON telegram_config FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update telegram config"
  ON telegram_config FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─── telegram_events ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can select own events" ON telegram_events;
DROP POLICY IF EXISTS "Users can insert own events" ON telegram_events;

CREATE POLICY "Anon can select telegram events"
  ON telegram_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert telegram events"
  ON telegram_events FOR INSERT
  TO anon
  WITH CHECK (true);
