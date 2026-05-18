// main.js — Site-wide JavaScript entry point

import { getArticles } from './cms.js';

// Returns a ✓ / ✗ / ◑ span. Feature-flag columns are not yet in the schema,
// so callers pass null until those columns are added.
function featureCell(val) {
  if (val === true)  return '<span class="check">✓</span>';
  if (val === false) return '<span class="cross">✗</span>';
  return '<span class="partial">◑</span>';
}

// Formats an ISO date string as "May 2026"
function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
}

// Shared fetch: published reviews sorted by rating desc
async function fetchReviews() {
  const { data, error } = await getArticles({ type: 'review', status: 'published', limit: 10 });
  if (error || !data?.length) return [];
  return [...data].sort((a, b) => b.rating - a.rating);
}

// Fetch for trending pick: most recently published first
async function fetchTrending() {
  const { data, error } = await getArticles({ type: 'review', status: 'published', limit: 1 });
  if (error || !data?.length) return [];
  return [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Injects the #1 rated published review into .top-pick-card.
 * Only fields that exist in the schema are written; other elements
 * (badge, tagline, stats) keep their hardcoded fallback content.
 */
export async function renderTopPick() {
  const reviews = await fetchTrending();
  if (!reviews.length) return;

  const card = document.querySelector('.top-pick-card');
  if (!card) return;

  const r = reviews[0];
  const imgWrap = card.querySelector('.pick-image-wrap');
  if (r.cover_url) {
    imgWrap.textContent = '';
    imgWrap.style.backgroundImage = `url('${r.cover_url}')`;
  } else {
    imgWrap.textContent = r.platform_name;
  }
  card.querySelector('.pick-name').textContent       = r.platform_name;
  card.querySelector('.pick-verdict').textContent    = r.excerpt ?? '';
  card.querySelector('.btn-primary').href            = `/casino-insider/article.html?slug=${r.slug}`;
}

/**
 * Renders the top 3 published reviews (by rating) into .picks-grid.
 */
export async function renderPicksGrid() {
  const reviews = await fetchReviews();
  if (!reviews.length) return;

  const grid = document.querySelector('.picks-grid');
  if (!grid) return;

  grid.innerHTML = reviews.slice(0, 3).map((r, i) => `
    <div class="pick-card">
      <div class="card-image" ${r.cover_url ? `style="background-image:url('${r.cover_url}');background-size:cover;background-repeat:no-repeat;background-position:center;background-color:var(--bg-3,#111)"` : ''}>${r.cover_url ? '' : r.platform_name}</div>
      <div class="card-body">
        <p class="card-rank">#${i + 1}</p>
        <h3 class="card-name">${r.platform_name}</h3>
        <p class="card-desc">${r.excerpt ?? ''}</p>
        <div class="card-footer">
          <span class="card-rating">★ ${r.rating} / 5</span>
          <a href="/casino-insider/article.html?slug=${r.slug}" class="card-cta">Full Review →</a>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Renders the top 4 published reviews into .compare-table tbody.
 * Feature-flag columns (mobile_app, live_casino, etc.) are not in the schema yet —
 * they render as ◑ until those columns are added to the articles table.
 */
export async function renderCompareTable() {
  const reviews = await fetchReviews();
  if (!reviews.length) return;

  const tbody = document.querySelector('.compare-table tbody');
  if (!tbody) return;

  tbody.innerHTML = reviews.slice(0, 4).map((r, i) => `
    <tr${i === 0 ? ' class="top-row"' : ''}>
      <td>${r.platform_name}${i === 0 ? ' <span class="top-pick-pill">Top Pick</span>' : ''}</td>
      <td>${featureCell(null)}</td>
      <td>${featureCell(null)}</td>
      <td>${featureCell(null)}</td>
      <td>${featureCell(null)}</td>
      <td>${featureCell(null)}</td>
      <td>${featureCell(null)}</td>
      <td><strong>${r.rating}</strong></td>
      <td><a href="/casino-insider/article.html?slug=${r.slug}" class="table-cta">Review →</a></td>
    </tr>
  `).join('');
}

/**
 * Renders the 3 latest published guides into the main column of .articles-grid.
 * The sidebar column is left untouched.
 */
export async function renderLatestGuides() {
  const { data, error } = await getArticles({ type: 'guide', status: 'published', limit: 3 });
  if (error || !data?.length) return;

  const mainCol = document.querySelector('.articles-grid')?.firstElementChild;
  if (!mainCol) return;

  mainCol.innerHTML = data.map(g => `
    <div class="article-main">
      <h3 class="article-title"><a href="/casino-insider/article.html?slug=${g.slug}">${g.title}</a></h3>
      <p class="article-excerpt">${g.excerpt ?? ''}</p>
      <p class="article-meta">${formatDate(g.created_at)}</p>
    </div>
  `).join('');
}

function initCategoryStrip() {
  const items = document.querySelectorAll('.cs-item');
  items.forEach(item => {
    const btn = item.querySelector('.cs-btn');
    if (!btn) return;
    btn.addEventListener('click', e => {
      const isOpen = item.classList.contains('cs-item--open');
      items.forEach(i => i.classList.remove('cs-item--open'));
      if (!isOpen) item.classList.add('cs-item--open');
      e.stopPropagation();
    });
  });
  document.addEventListener('click', () => {
    items.forEach(i => i.classList.remove('cs-item--open'));
  });
}

renderTopPick();
renderPicksGrid();
renderCompareTable();
renderLatestGuides();
initCategoryStrip();
