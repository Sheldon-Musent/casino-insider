// cms.js — CMS operations (CRUD for content via Supabase)

import { supabase } from './supabase.js';

const TABLE = 'articles';
const BUCKET = 'media';

/**
 * Fetch articles with optional filters.
 * @param {{ type?: string, status?: string, market?: string, limit?: number }} opts
 * @returns {{ data: object[]|null, error: object|null }}
 */
export async function getArticles({ type, status, market, limit } = {}) {
  try {
    let query = supabase.from(TABLE).select('*');

    if (type)   query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (market) query = query.eq('market', market);
    if (limit)  query = query.limit(limit);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) console.error('cms/getArticles:', error.message);
    return { data, error };
  } catch (err) {
    console.error('cms/getArticles: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch a single article by its slug.
 * @param {string} slug
 * @returns {{ data: object|null, error: object|null }}
 */
export async function getArticleBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) console.error('cms/getArticleBySlug:', error.message);
    return { data, error };
  } catch (err) {
    console.error('cms/getArticleBySlug: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Insert a new article.
 * @param {object} data — article fields matching the articles table schema
 * @returns {{ data: object|null, error: object|null }}
 */
export async function createArticle(data) {
  try {
    const { data: created, error } = await supabase
      .from(TABLE)
      .insert(data)
      .select()
      .single();

    if (error) console.error('cms/createArticle:', error.message);
    return { data: created, error };
  } catch (err) {
    console.error('cms/createArticle: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Update an existing article by id.
 * @param {string|number} id
 * @param {object} data — fields to update
 * @returns {{ data: object|null, error: object|null }}
 */
export async function updateArticle(id, data) {
  try {
    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('cms/updateArticle:', error.message);
    return { data: updated, error };
  } catch (err) {
    console.error('cms/updateArticle: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete an article by id.
 * @param {string|number} id
 * @returns {{ data: object|null, error: object|null }}
 */
export async function deleteArticle(id) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('cms/deleteArticle:', error.message);
    return { data, error };
  } catch (err) {
    console.error('cms/deleteArticle: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Set an article's status to 'published'.
 * @param {string|number} id
 * @returns {{ data: object|null, error: object|null }}
 */
export async function publishArticle(id) {
  return updateArticle(id, { status: 'published' });
}

/**
 * Upload an image file to the media Storage bucket.
 * The storage path is: <timestamp>-<sanitised filename>
 * @param {File} file
 * @returns {{ data: { path: string }|null, error: object|null }}
 */
export async function uploadMedia(file) {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (error) console.error('cms/uploadMedia:', error.message);
    return { data, error };
  } catch (err) {
    console.error('cms/uploadMedia: unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Remove an image from the media Storage bucket.
 * @param {string} path — the storage path returned by uploadMedia (data.path)
 * @returns {{ data: object|null, error: object|null }}
 */
export async function deleteMedia(path) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) console.error('cms/deleteMedia:', error.message);
    return { data, error };
  } catch (err) {
    console.error('cms/deleteMedia: unexpected error:', err);
    return { data: null, error: err };
  }
}
