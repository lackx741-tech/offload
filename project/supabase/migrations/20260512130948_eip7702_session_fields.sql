/*
  # EIP-7702 Session Fields

  ## Purpose
  Adds columns needed for the EIP-7702 delegation flow where the EOA itself
  becomes the smart wallet. No separate CREATE2 deployment is needed.

  ## Changes to sequence_sessions

  ### New columns
  - `mode` (text, default 'create2') — 'eip7702' for EOA-as-wallet sessions,
    'create2' for legacy CREATE2-deployed wallet sessions
  - `delegation_tx` (text, nullable) — the Type-4 transaction hash that set the
    EOA's code to the Sequence EIP-7702 module
  - `is_delegated` (boolean, default false) — true once the EIP-7702 delegation
    transaction has been confirmed on-chain

  ## Notes
  - For EIP-7702 sessions, `wallet` == `eoa` (same address)
  - `image_hash` still used to encode the signer config inside the module
  - `is_deployed` is repurposed: for eip7702 mode it means the delegation tx
    was confirmed (same as `is_delegated`)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequence_sessions' AND column_name = 'mode'
  ) THEN
    ALTER TABLE sequence_sessions ADD COLUMN mode text NOT NULL DEFAULT 'create2';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequence_sessions' AND column_name = 'delegation_tx'
  ) THEN
    ALTER TABLE sequence_sessions ADD COLUMN delegation_tx text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sequence_sessions' AND column_name = 'is_delegated'
  ) THEN
    ALTER TABLE sequence_sessions ADD COLUMN is_delegated boolean NOT NULL DEFAULT false;
  END IF;
END $$;
