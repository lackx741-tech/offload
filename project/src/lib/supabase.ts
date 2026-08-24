import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SequenceSessionRow {
  id:          string;
  eoa:         string;
  wallet:      string;
  image_hash:  string;
  session_key: string;
  chain_id:    number;
  signature:   string;
  deadline:    number;
  nonce:       number;
  permissions: SessionPermissionRow[];
  is_deployed: boolean;
  created_at:  string;
}

export interface SessionPermissionRow {
  target:      string;
  valueLimit:  string;
  deadline:    number;
}
