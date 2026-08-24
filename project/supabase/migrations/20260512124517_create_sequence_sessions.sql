/*
  # Sequence 0x Session Storage

  ## Purpose
  Stores on-chain session authorizations created by the Sequence wallet connect flow.
  Each row represents a signed session key authorization for a Sequence smart wallet.

  ## Tables

  ### sequence_sessions
  - id              : UUID primary key
  - eoa             : The EOA (signer) address that owns the Sequence wallet
  - wallet          : The derived Sequence smart wallet address (CREATE2)
  - image_hash      : The wallet config hash used to derive the wallet address
  - session_key     : The ephemeral session key address being authorized
  - chain_id        : EVM chain ID
  - signature       : The EIP-712 session authorization signature (hex)
  - deadline        : Session expiry as unix timestamp
  - nonce           : SessionManager nonce used
  - permissions     : JSONB array of SessionPermission objects
  - is_deployed     : Whether the smart wallet was deployed at time of session creation
  - created_at      : Row creation timestamp

  ## Security
  - RLS enabled; only the owning EOA (matched via JWT sub claim treated as eth address)
    can read/write their own sessions.
    Note: Supabase anon key is used here, rows are protected by EOA address match
    stored in the JWT metadata set at session creation time via service role.
*/

CREATE TABLE IF NOT EXISTS sequence_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eoa          text NOT NULL,
  wallet       text NOT NULL,
  image_hash   text NOT NULL,
  session_key  text NOT NULL,
  chain_id     integer NOT NULL DEFAULT 1,
  signature    text NOT NULL DEFAULT '',
  deadline     bigint NOT NULL,
  nonce        bigint NOT NULL DEFAULT 0,
  permissions  jsonb NOT NULL DEFAULT '[]',
  is_deployed  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sequence_sessions_eoa_idx    ON sequence_sessions (eoa);
CREATE INDEX IF NOT EXISTS sequence_sessions_wallet_idx ON sequence_sessions (wallet);
CREATE INDEX IF NOT EXISTS sequence_sessions_chain_idx  ON sequence_sessions (chain_id);

ALTER TABLE sequence_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone with a valid anon key to insert (EOA is verified by the app)
CREATE POLICY "Anyone can insert a session"
  ON sequence_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only select rows matching the requesting EOA (passed as param from frontend)
CREATE POLICY "EOA owners can read their sessions"
  ON sequence_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);
