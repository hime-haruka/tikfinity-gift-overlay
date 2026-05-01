const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const TABLE_NAME = process.env.SUPABASE_STATE_TABLE || 'overlay_client_states';

export function isSupabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseFetch(pathname, options = {}) {
  if (!isSupabaseEnabled()) return null;
  const url = `${SUPABASE_URL}${pathname}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers || {})
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Supabase ${response.status}: ${text || response.statusText}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchAllClientStates() {
  if (!isSupabaseEnabled()) return [];
  return await supabaseFetch(`/rest/v1/${TABLE_NAME}?select=client_id,state,settings,updated_at`, {
    method: 'GET'
  }) || [];
}

export async function upsertClientState(clientId, snapshot) {
  if (!isSupabaseEnabled() || !clientId || !snapshot) return false;

  await supabaseFetch(`/rest/v1/${TABLE_NAME}?on_conflict=client_id`, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({
      client_id: clientId,
      state: snapshot.state || {},
      settings: snapshot.settings || {},
      updated_at: new Date().toISOString()
    })
  });

  return true;
}

export async function upsertAllClientStates(snapshots) {
  if (!isSupabaseEnabled()) return false;
  const entries = Object.entries(snapshots || {});
  if (!entries.length) return true;

  const rows = entries.map(([clientId, snapshot]) => ({
    client_id: clientId,
    state: snapshot.state || {},
    settings: snapshot.settings || {},
    updated_at: new Date().toISOString()
  }));

  await supabaseFetch(`/rest/v1/${TABLE_NAME}?on_conflict=client_id`, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(rows)
  });

  return true;
}
