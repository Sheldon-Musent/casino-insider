/*
 * supabase.js — Supabase client + shared helpers
 *
 * Any HTML file that imports this module must include these two <meta> tags
 * inside <head> before the <script type="module"> that loads this file:
 *
 *   <meta name="supabase-url"      content="https://YOUR_PROJECT.supabase.co">
 *   <meta name="supabase-anon-key" content="YOUR_ANON_KEY">
 *
 * The anon key is safe to expose in the browser — it is restricted by your
 * Supabase Row Level Security policies.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const url = document.querySelector('meta[name="supabase-url"]')?.content;
const key = document.querySelector('meta[name="supabase-anon-key"]')?.content;

if (!url || !key) {
  throw new Error(
    'supabase.js: missing <meta name="supabase-url"> or <meta name="supabase-anon-key"> in <head>.'
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    storage:          window.localStorage,
    storageKey:       `sb-${new URL(url).hostname.split('.')[0]}-auth-token`,
  },
});

/**
 * Returns the full public URL for a file in a Supabase Storage public bucket.
 * @param {string} bucket - The bucket name (e.g. 'media').
 * @param {string} path   - The file path within the bucket (e.g. 'images/logo.png').
 * @returns {string} Absolute public URL.
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
