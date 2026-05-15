// auth.js — Authentication logic (login, logout, session handling)

import { supabase } from './supabase.js';

/**
 * Signs in with email and password.
 * @returns {{ data: object|null, error: object|null }}
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error('auth/login:', error.message);
    return { data, error };
  } catch (err) {
    console.error('auth/login: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Signs out the current user.
 * @returns {{ error: object|null }}
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('auth/logout:', error.message);
    return { error };
  } catch (err) {
    console.error('auth/logout: unexpected error:', err);
    return { error: err };
  }
}

/**
 * Returns the current session, or null if the user is not signed in.
 * @returns {object|null}
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error('auth/getSession:', error.message);
    return data?.session ?? null;
  } catch (err) {
    console.error('auth/getSession: unexpected error:', err);
    return null;
  }
}

/**
 * Guards an admin page. Call once at the top of every admin page script.
 * Redirects to /admin/index.html if there is no active session.
 */
export async function guardPage() {
  try {
    const session = await getSession();
    if (!session) {
      window.location.replace('/admin/index.html');
    }
  } catch (err) {
    console.error('auth/guardPage: unexpected error:', err);
    window.location.replace('/admin/index.html');
  }
}
