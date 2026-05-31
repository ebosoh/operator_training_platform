/**
 * catalog.js — Equipment Catalog & Manual Library
 * Typeopplæring.no Safety Training Platform
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Store, Toast, debounce, statusBadge } from './utils.js';

// ── Equipment Catalog View ────────────────────────────────────────────────────
export async function renderCatalog(params) {
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  // Get initial filter from URL params
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const initialCat = urlParams.get('cat') || 'all';

  let equipment = [];
  try {
    const result = await API.getEquipment({ category: initialCat === 'all' ? null : initialCat });
    equipment = result.items || [];
  } catch (err) {
    console.warn('Could not load equipment:', err);
  }

  const categories = [
    { key: 'all', label_no: 'Alle', label_en: 'All', icon: '🏗️' },
    { key: 'Lifter', label_no: 'Lifter', label_en: 'Lifts', icon: '✂️' },
    { key: 'Maskiner', label_no: 'Maskiner', label_en: 'Machines', icon: '⚙️' },
    { key: 'Truck/Minikran', label_no: 'Truck / Minikran', label_en: 'Truck / Mini Crane', icon: '🚛' },
  ];

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh">
        <!-- Catalog Header -->
        <div style="background:linear-gradient(180deg,var(--color-surface),var(--color-bg));border-bottom:1px solid var(--color-border);padding:var(--space-8) 0 var(--space-6)">
          <div class="container">
            <div class="section-label animate-fadeInDown">140+ ${lang === 'no' ? 'Maskiner' : 'Machines'} · Oslo Liftutleie</div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
              <div>
                <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:800;margin-bottom:var(--space-2)" class="animate-fadeInUp">
                  ${t('catalog.title')}
                </h1>
                <p style="color:var(--color-text-secondary);font-size:var(--text-md)" class="animate-fadeInUp delay-100">${t('catalog.subtitle')}</p>
              </div>
              ${Auth.isAdmin() ? `
                <a href="#/admin/equipment" class="btn btn-gold btn-sm hover-glow-gold animate-fadeInUp">
                  ➕ ${lang === 'no' ? 'Legg til ny maskin' : 'Add New Machine'}
                </a>
              ` : ''}
            </div>

            <!-- Search -->
            <div class="search-wrapper animate-fadeInUp delay-200" style="max-width:520px;margin-top:var(--space-6)">
              <span class="search-icon">🔍</span>
              <input type="search" id="catalog-search" class="search-input"
                placeholder="${t('catalog.search')}" autocomplete="off" />
            </div>

            <!-- Category Filter Pills -->
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:var(--space-4)" class="animate-fadeInUp delay-300" id="cat-filter">
              ${categories.map(cat => `
                <button
                  class="btn btn-sm ${initialCat === cat.key ? 'btn-gold' : 'btn-ghost'} cat-filter-btn"
                  data-cat="${cat.key}"
                  style="border-radius:var(--radius-full)"
                >
                  ${cat.icon} ${lang === 'no' ? cat.label_no : cat.label_en}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Equipment Grid -->
        <div class="container" style="padding-top:var(--space-8);padding-bottom:var(--space-16)">
          <div id="catalog-results-count" style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4)">
            ${t('catalog.results_found').replace('{{count}}', equipment.length)}
          </div>
          <div id="equipment-grid" class="grid-auto-fill-md">
            ${renderEquipmentCards(equipment, lang)}
          </div>
          <div id="catalog-empty" class="empty-state hidden">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">${t('catalog.empty_title')}</div>
            <div class="empty-state-desc">${t('catalog.empty_desc')}</div>
          </div>
        </div>
      </div>
    `,
    init: () => initCatalogHandlers(equipment),
  };
}

function renderEquipmentCards(items, lang) {
  if (!items.length) return '';
  const user = Auth.user;
  return items.map((eq, i) => {
    const isLoggedIn = Auth.isLoggedIn();
    const enrollment = null; // Would check from user's enrollments
    const name = lang === 'no' ? eq.nameNo : eq.name;

    return `
      <a href="#/equipment/${eq.id}" class="card card-interactive hover-lift animate-fadeInUp delay-${(i % 6 + 1) * 100}"
         style="display:block;text-decoration:none;overflow:hidden">
        <!-- Image -->
        <div style="height:180px;overflow:hidden;position:relative">
          <img src="${eq.image}" alt="${name}" loading="lazy"
            style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease"
            class="equipment-card-image"
            onerror="this.src='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=60'" />
          <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(11,22,35,0.8),transparent 60%)"></div>

          <!-- Category badge -->
          <div style="position:absolute;top:var(--space-3);left:var(--space-3)">
            <span class="badge badge-gray">${eq.subcategory}</span>
          </div>

          <!-- Work height badge -->
          ${eq.workHeight && eq.workHeight !== 'N/A' ? `
            <div style="position:absolute;top:var(--space-3);right:var(--space-3)">
              <span class="badge badge-gold">⬆ ${eq.workHeight}</span>
            </div>
          ` : ''}
        </div>

        <!-- Content -->
        <div class="card-body" style="padding:var(--space-5)">
          <h3 style="font-family:var(--font-heading);font-size:var(--text-md);font-weight:700;margin-bottom:var(--space-2);line-height:1.3">${name}</h3>
          <p style="font-size:var(--text-xs);color:var(--color-text-muted);line-height:1.6;margin-bottom:var(--space-4);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
            ${lang === 'no' ? eq.description : eq.descriptionEn}
          </p>

          <!-- Meta row -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <span style="font-size:var(--text-xs);color:var(--color-text-muted)">📄 ${eq.manualPages} ${I18n.t('catalog.pages')}</span>
              ${eq.videoId ? `<span style="font-size:var(--text-xs);color:var(--color-text-muted)">🎬 Video</span>` : ''}
            </div>
            <span style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-sm);color:var(--color-gold)">299 NOK</span>
          </div>

          <!-- CTA -->
          <div class="btn btn-primary btn-block btn-sm" style="text-align:center">
            ${I18n.t('catalog.enroll')} →
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function initCatalogHandlers(allEquipment) {
  let activeCategory = 'all';
  let searchQuery = '';

  function filterAndRender() {
    let filtered = [...allEquipment];

    if (activeCategory !== 'all') {
      filtered = filtered.filter(eq =>
        eq.category === activeCategory || eq.subcategory === activeCategory
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(eq =>
        eq.name.toLowerCase().includes(q) ||
        eq.nameNo.toLowerCase().includes(q) ||
        eq.subcategory.toLowerCase().includes(q) ||
        (eq.tags || []).some(t => t.includes(q))
      );
    }

    const grid = document.getElementById('equipment-grid');
    const empty = document.getElementById('catalog-empty');
    const count = document.getElementById('catalog-results-count');

    if (grid) grid.innerHTML = renderEquipmentCards(filtered, I18n.lang);
    if (count) count.textContent = I18n.t('catalog.results_found').replace('{{count}}', filtered.length);
    if (empty) empty.classList.toggle('hidden', filtered.length > 0);
  }

  // Category filter
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      document.querySelectorAll('.cat-filter-btn').forEach(b => {
        b.classList.remove('btn-gold');
        b.classList.add('btn-ghost');
      });
      btn.classList.add('btn-gold');
      btn.classList.remove('btn-ghost');
      filterAndRender();
    });
  });

  // Search
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      searchQuery = e.target.value.trim();
      filterAndRender();
    }, 300));
  }
}

// ── Equipment Detail View ─────────────────────────────────────────────────────
export async function renderEquipmentDetail(params) {
  const id = params[0];
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  let equipment = null;
  try {
    equipment = await API.getEquipmentById(id);
  } catch (err) {
    return {
      html: `<div class="empty-state min-h-screen"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">${t('catalog.not_found_title')}</div><a href="#/catalog" class="btn btn-primary">${t('catalog.back_to_catalog')}</a></div>`,
      init: () => {}
    };
  }

  const name = lang === 'no' ? equipment.nameNo : equipment.name;
  const desc = lang === 'no' ? equipment.description : equipment.descriptionEn;
  const isLoggedIn = Auth.isLoggedIn();

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh">
        <!-- Breadcrumb -->
        <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:var(--space-3) 0">
          <div class="container">
            <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--color-text-muted)">
              <a href="#/catalog" style="color:var(--color-text-muted);hover:color:var(--color-gold)">${t('catalog.breadcrumb_root')}</a>
              <span>›</span>
              <span style="color:var(--color-text-secondary)">${equipment.category}</span>
              <span>›</span>
              <span style="color:var(--color-text-primary)">${name}</span>
            </div>
          </div>
        </div>

        <div class="container" style="padding-top:var(--space-8);padding-bottom:var(--space-16)">
          <div style="display:grid;grid-template-columns:1fr;gap:var(--space-8)" id="detail-grid">

            <!-- Image & Quick Info -->
            <div class="animate-fadeInLeft">
              <div style="border-radius:var(--radius-xl);overflow:hidden;margin-bottom:var(--space-6)">
                <img src="${equipment.image}" alt="${name}"
                  style="width:100%;height:320px;object-fit:cover"
                  onerror="this.src='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=70'" />
              </div>

              <!-- Specs Grid -->
              <div class="card">
                <div class="card-header">
                  <h3 style="font-family:var(--font-heading);font-weight:700">${t('catalog.tech_specs')}</h3>
                </div>
                <div class="card-body">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
                    ${[
                      { label: t('catalog.spec.category'), value: equipment.category },
                      { label: t('catalog.spec.type'), value: equipment.subcategory },
                      equipment.workHeight !== 'N/A' ? { label: t('catalog.spec.height'), value: equipment.workHeight } : null,
                      { label: t('catalog.spec.weight'), value: equipment.weight },
                      { label: t('catalog.spec.manual_pages'), value: t('catalog.spec.manual_pages_val').replace('{{pages}}', equipment.manualPages) },
                      equipment.videoId ? { label: t('catalog.spec.video'), value: t('catalog.spec.video_available') } : null,
                    ].filter(Boolean).map(item => `
                      <div>
                        <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.25rem">${item.label}</div>
                        <div style="font-weight:600;font-size:var(--text-sm)">${item.value}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Detail & CTA Panel -->
            <div class="animate-fadeInRight">
              <div class="badge badge-gray" style="margin-bottom:var(--space-3)">${equipment.subcategory}</div>
              <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:800;margin-bottom:var(--space-4)">${name}</h1>
              <p style="color:var(--color-text-secondary);font-size:var(--text-md);line-height:1.75;margin-bottom:var(--space-6)">${desc}</p>

              <!-- What's included -->
              <div style="margin-bottom:var(--space-6)">
                <h3 style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-3);font-size:var(--text-md)">${t('catalog.included.title')}</h3>
                <div style="display:flex;flex-direction:column;gap:var(--space-2)">
                  ${[
                    t('catalog.included.manual').replace('{{pages}}', equipment.manualPages),
                    equipment.videoId ? t('catalog.included.video') : null,
                    t('catalog.included.test'),
                    t('catalog.included.signature'),
                    t('catalog.included.cert'),
                    t('catalog.included.share'),
                    t('catalog.included.lifetime'),
                  ].filter(Boolean).map(item => `
                    <div style="display:flex;align-items:center;gap:var(--space-3);font-size:var(--text-sm);color:var(--color-text-secondary)">
                      <span>${item}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Pricing & CTA -->
              <div class="card card-premium" style="padding:var(--space-6)">
                <div style="display:flex;align-items:baseline;gap:var(--space-2);margin-bottom:var(--space-2)">
                  <span style="font-family:var(--font-heading);font-size:var(--text-4xl);font-weight:900;color:var(--color-gold)">299</span>
                  <span style="color:var(--color-text-muted);font-size:var(--text-md)">${t('catalog.price_vat').replace('299 ', '')}</span>
                </div>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:var(--space-5)">${t('catalog.lifetime_access')}</p>

                ${isLoggedIn ? `
                  <a href="#/payment/${equipment.id}" class="btn btn-primary btn-block btn-lg hover-glow-red" id="enroll-btn" style="margin-bottom:var(--space-3)">
                    ${t('catalog.btn_enroll')}
                  </a>
                ` : `
                  <a href="#/register" class="btn btn-primary btn-block btn-lg hover-glow-red" style="margin-bottom:var(--space-3)">
                    ${t('catalog.btn_register_enroll')}
                  </a>
                  <a href="#/login" class="btn btn-ghost btn-block btn-sm">
                    ${t('catalog.has_account')}
                  </a>
                `}

                <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-4);margin-top:var(--space-4)">
                  <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('catalog.card_pay')}</span>
                  <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('catalog.vipps_pay')}</span>
                  <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('catalog.invoice_pay')}</span>
                </div>
              </div>

              <!-- QR Code -->
              <div style="margin-top:var(--space-6);text-align:center">
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:var(--space-3)">${t('catalog.qr_onsite')}</p>
                <div id="equipment-qr" style="display:inline-block;padding:var(--space-3);background:white;border-radius:var(--radius-md)"></div>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-2)">${equipment.qrCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    init: () => {
      // Generate QR code
      if (window.QRCode) {
        const qrEl = document.getElementById('equipment-qr');
        if (qrEl) {
          new window.QRCode(qrEl, {
            text: `${window.location.origin}${window.location.pathname}#/qr/${equipment.qrCode}`,
            width: 120, height: 120,
            colorDark: '#0B1623', colorLight: '#FFFFFF',
            correctLevel: window.QRCode.CorrectLevel.H
          });
        }
      }

      // Desktop layout
      const grid = document.getElementById('detail-grid');
      if (grid && window.innerWidth >= 1024) {
        grid.style.gridTemplateColumns = '1fr 1fr';
      }
    }
  };
}
