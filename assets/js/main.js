// main.js — Site-wide JavaScript entry point

import { getArticles } from './cms.js';

// ── SEARCH CACHE ──
let _articleCache = null;

async function fetchAllPublished() {
  if (_articleCache) return _articleCache;
  const { data, error } = await getArticles({ status: 'published', limit: 200 });
  if (error || !data) return [];
  _articleCache = data;
  return _articleCache;
}

window.ciSearch = async function(term) {
  const all = await fetchAllPublished();
  const q = term.trim().toLowerCase();
  if (!q) return { results: [], recommended: [] };

  const results = all.filter(a => {
    const hay = `${a.title || ''} ${a.platform_name || ''} ${a.excerpt || ''} ${a.meta_description || ''}`.toLowerCase();
    return hay.includes(q);
  }).slice(0, 3);

  const recommended = all
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  return { results, recommended };
};

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

function initSearchBox() {
  const input = document.querySelector('.cs-search-input');
  const wrap  = document.querySelector('.cs-search-wrap');
  if (!input || !wrap) return;

  let dropdown = null;
  let debounce = null;

  function closeDropdown() {
    if (dropdown) { dropdown.remove(); dropdown = null; }
  }

  function badgeHtml(type) {
    const isGuide = (type || '').toLowerCase() === 'guide';
    const cls  = isGuide ? 'cs-search-badge--guide' : 'cs-search-badge--review';
    const label = isGuide ? 'Guide' : 'Review';
    return `<span class="cs-search-badge ${cls}">${label}</span>`;
  }

  function resultHtml(a) {
    const name    = a.title || a.platform_name || 'Untitled';
    const excerpt = (a.excerpt || a.meta_description || '').slice(0, 80);
    const slug    = a.slug || '';
    const url     = `/casino-insider/article.html?slug=${encodeURIComponent(slug)}`;
    return `
      <a class="cs-search-result" href="${url}">
        <div class="cs-search-result-top">
          ${badgeHtml(a.type)}
          <span class="cs-search-result-title">${name}</span>
        </div>
        ${excerpt ? `<div class="cs-search-result-excerpt">${excerpt}</div>` : ''}
      </a>`;
  }

  async function renderDropdown(term) {
    closeDropdown();
    const { results, recommended } = await window.ciSearch(term);

    dropdown = document.createElement('div');
    dropdown.className = 'cs-search-dropdown';

    if (term.trim()) {
      if (results.length === 0) {
        dropdown.innerHTML = `<div class="cs-search-no-results">No results for "${term}"</div>`;
      } else {
        dropdown.innerHTML = results.map(resultHtml).join('');
      }
    } else {
      dropdown.innerHTML =
        `<div class="cs-search-rec-label">Recommended</div>` +
        recommended.map(resultHtml).join('');
    }

    wrap.appendChild(dropdown);
  }

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderDropdown(input.value), 300);
  });

  input.addEventListener('focus', () => {
    renderDropdown(input.value);
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDropdown(); input.blur(); }
  });
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
initSearchBox();
