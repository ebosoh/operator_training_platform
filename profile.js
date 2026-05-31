/**
 * profile.js — Operator Profile & Diploma Dashboard (Phase 8)
 * Typeopplæring.no Safety Training Platform
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store, statusBadge, copyToClipboard, shareContent } from './utils.js';

export async function renderProfile(params) {
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;
  const user = Auth.user;

  if (!user) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">🔒</div>
          <h2>${I18n.t('qr.login_required')}</h2>
          <a href="#/login" class="btn btn-primary" style="margin-top:1rem">${t('nav.login')}</a>
        </div>`,
      init: () => {}
    };
  }

  // Determine active tab from URL parameter
  const activeTab = params[0] === 'diplomas' ? 'diplomas' : (params[0] || 'courses');

  let profileData = { enrollments: [], certificates: [] };
  try {
    profileData = await API.getProfile(user.id);
  } catch (err) {
    console.warn('Could not fetch profile data:', err);
  }

  const enrollments = profileData.enrollments || [];
  const certificates = profileData.certificates || [];

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding-bottom:var(--space-16)">
        <!-- Profile Banner -->
        <div class="profile-banner animate-fadeIn" style="background:linear-gradient(135deg, var(--color-dark), var(--color-dark-card)); border-bottom:1px solid var(--color-border); padding:var(--space-10) 0 var(--space-8); color:#fff; position:relative; overflow:hidden;">
          <div class="container" style="position:relative; z-index:2; display:flex; align-items:center; gap:var(--space-6); flex-wrap:wrap;">
            <div class="avatar avatar-xl" style="width:90px; height:90px; border-radius:50%; background:var(--gradient-gold); color:var(--color-dark); font-family:var(--font-heading); font-size:2.5rem; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg);">
              ${user.avatar || user.name?.slice(0, 2).toUpperCase() || 'OP'}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <h1 style="font-family:var(--font-heading); font-size:var(--text-2xl); font-weight:800; margin:0; color:#fff;">${user.name}</h1>
                <span class="badge badge-gold" style="font-size:var(--text-xxs); padding:0.25rem 0.5rem;">${user.role === 'admin' ? t('profile.role.admin') : (user.role === 'manager' ? t('profile.role.manager') : t('profile.role.operator'))}</span>
              </div>
              <p style="color:var(--color-text-muted); margin:0.25rem 0 0.5rem; font-size:var(--text-sm);">✉️ ${user.email} ${user.company ? `· 🏢 ${user.company}` : t('profile.comp.independent')}</p>
              <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-ghost btn-xs" id="share-cv-btn" style="border-color:rgba(255,255,255,0.2); color:#fff;">
                  🔗 ${t('profile.cv_link')}
                </button>
              </div>
            </div>
          </div>
          <!-- Grid background effect -->
          <div style="position:absolute; inset:0; opacity:0.05; background-image:linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size:20px 20px;"></div>
        </div>

        <!-- Profile Tabs -->
        <div style="background:var(--color-surface); border-bottom:1px solid var(--color-border); position:sticky; top:60px; z-index:10;">
          <div class="container">
            <div class="tabs" style="border:none; margin:0;">
              <button class="tab-btn ${activeTab === 'courses' ? 'active' : ''}" data-tab="courses" style="font-family:var(--font-heading); font-weight:600; padding:1.25rem 1rem;">
                📖 ${t('profile.my_courses')} <span class="badge badge-gray" style="font-size:0.7rem; margin-left:0.25rem">${enrollments.length}</span>
              </button>
              <button class="tab-btn ${activeTab === 'diplomas' ? 'active' : ''}" data-tab="diplomas" style="font-family:var(--font-heading); font-weight:600; padding:1.25rem 1rem;">
                🏆 ${t('profile.diplomas')} <span class="badge badge-gray" style="font-size:0.7rem; margin-left:0.25rem">${certificates.length}</span>
              </button>
              <button class="tab-btn ${activeTab === 'signature' ? 'active' : ''}" data-tab="signature" style="font-family:var(--font-heading); font-weight:600; padding:1.25rem 1rem;">
                ${t('profile.active_tabs.signature')}
              </button>
              <button class="tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings" style="font-family:var(--font-heading); font-weight:600; padding:1.25rem 1rem;">
                ⚙️ ${t('profile.settings')}
              </button>
            </div>
          </div>
        </div>

        <!-- Tab Contents -->
        <div class="container" style="margin-top:var(--space-6);">
          <!-- Tab: Courses -->
          <div id="tab-content-courses" class="tab-pane ${activeTab === 'courses' ? 'active' : ''}">
            <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin-bottom:var(--space-4);">${t('profile.active_tabs.courses')}</h2>
            ${enrollments.length === 0 ? `
              <div class="card" style="padding:var(--space-12); text-align:center;">
                <div style="font-size:3.5rem; margin-bottom:var(--space-4);">🏗️</div>
                <h3 style="font-family:var(--font-heading); font-weight:700;">${t('profile.empty.courses_title')}</h3>
                <p style="color:var(--color-text-muted); margin-bottom:var(--space-6); max-width:400px; margin-left:auto; margin-right:auto;">
                  ${t('profile.empty.courses_desc')}
                </p>
                <a href="#/catalog" class="btn btn-primary">${t('profile.empty.courses_cta')}</a>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:1fr; gap:var(--space-4);" id="enrollment-list-container">
                <!-- Courses list -->
              </div>
            `}
          </div>

          <!-- Tab: Diplomas -->
          <div id="tab-content-diplomas" class="tab-pane ${activeTab === 'diplomas' ? 'active' : ''}">
            <div style="display:flex; justify-content:between; align-items:center; margin-bottom:var(--space-4); flex-wrap:wrap; gap:1rem;">
              <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin:0;">${t('profile.active_tabs.diplomas')}</h2>
              ${certificates.length > 0 ? `
                <button class="btn btn-ghost btn-sm" id="share-diploma-wall">
                  ${lang === 'no' ? '📁 Del diplomvegg' : '📁 Share diploma wall'}
                </button>
              ` : ''}
            </div>

            ${certificates.length === 0 ? `
              <div class="card" style="padding:var(--space-12); text-align:center;">
                <div style="font-size:3.5rem; margin-bottom:var(--space-4);">🏆</div>
                <h3 style="font-family:var(--font-heading); font-weight:700;">${t('profile.empty.diplomas_title')}</h3>
                <p style="color:var(--color-text-muted); margin-bottom:var(--space-6); max-width:400px; margin-left:auto; margin-right:auto;">
                  ${t('profile.empty.diplomas_desc')}
                </p>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:var(--space-6);">
                ${certificates.map((cert, idx) => {
                  const issuedDate = new Date(cert.issuedAt).toLocaleDateString(lang === 'no' ? 'no-NO' : 'en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  });
                  return `
                    <div class="card card-interactive hover-lift animate-fadeInUp delay-${(idx + 1) * 100}" style="border-top: 4px solid var(--color-gold); overflow:hidden;">
                      <div class="card-body" style="padding:var(--space-5)">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:var(--space-3)">
                          <div class="badge badge-gold" style="font-size:0.65rem;">BESTÅTT ✓</div>
                          <span style="font-size:var(--text-xxs); color:var(--color-text-muted); font-family:monospace;">${cert.certNumber}</span>
                        </div>
                        <h3 style="font-family:var(--font-heading); font-size:var(--text-md); font-weight:800; margin:0 0 0.5rem; color:var(--color-text);">${cert.courseName}</h3>
                        <p style="font-size:var(--text-xs); color:var(--color-text-secondary); margin-bottom:var(--space-4)">Utstedt: ${issuedDate}</p>
                        
                        <div class="divider" style="margin:var(--space-3) 0"></div>

                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:var(--space-3)">
                          <a href="#/certificate/${cert.id}" class="btn btn-primary btn-sm" style="flex:1; text-align:center;">
                            ${t('qr.btn_view_diploma')}
                          </a>
                          <button class="btn btn-ghost btn-sm share-cert-btn" data-id="${cert.id}" data-no="${cert.certNumber}" style="padding:0 0.75rem;">
                            🔗 ${lang === 'no' ? 'Del' : 'Share'}
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Tab: Signature -->
          <div id="tab-content-signature" class="tab-pane ${activeTab === 'signature' ? 'active' : ''}">
            <div style="max-width:600px; margin:0 auto;">
              <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin-bottom:var(--space-3);">${t('profile.active_tabs.sig_title')}</h2>
              <p style="color:var(--color-text-secondary); font-size:var(--text-sm); line-height:1.6; margin-bottom:var(--space-5);">
                ${t('profile.active_tabs.sig_desc')}
              </p>

              <div class="card" style="padding:var(--space-6); text-align:center; background:var(--color-surface); margin-bottom:var(--space-6);">
                <div style="font-size:var(--text-xs); color:var(--color-text-muted); text-transform:uppercase; margin-bottom:var(--space-3)">${t('profile.active_tabs.sig_current')}</div>
                <div id="saved-sig-container" style="background:#fff; border:1px dashed var(--color-border); border-radius:var(--radius-md); min-height:150px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                  <!-- Img injected here if exists -->
                  <div style="color:var(--color-text-muted); font-size:var(--text-sm)">${t('profile.active_tabs.sig_none')}</div>
                </div>
              </div>

              <div class="card" style="padding:var(--space-6)">
                <h3 style="font-family:var(--font-heading); font-size:var(--text-md); font-weight:700; margin-bottom:var(--space-3);">${t('profile.active_tabs.sig_update')}</h3>
                
                <!-- Canvas Drawing Board -->
                <div style="background:#ffffff; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; position:relative; touch-action:none; margin-bottom:var(--space-4);">
                  <canvas id="profile-sig-canvas" style="width:100%; height:180px; display:block; cursor:crosshair;"></canvas>
                  <div style="position:absolute; bottom:0.5rem; left:0.5rem; pointer-events:none; font-size:var(--text-xxs); color:var(--color-text-muted); font-family:monospace; background:rgba(255,255,255,0.7); padding:2px 6px; border-radius:3px;">
                    ${t('profile.active_tabs.sig_placeholder')}
                  </div>
                </div>

                <div style="display:flex; gap:0.5rem;">
                  <button class="btn btn-ghost" id="clear-profile-sig-btn" style="flex:1">${t('profile.active_tabs.sig_btn_clear')}</button>
                  <button class="btn btn-primary" id="save-profile-sig-btn" style="flex:2">${t('profile.active_tabs.sig_btn_save')}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Settings -->
          <div id="tab-content-settings" class="tab-pane ${activeTab === 'settings' ? 'active' : ''}">
            <div style="max-width:600px; margin:0 auto;">
              <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin-bottom:var(--space-4);">${t('profile.settings.title')}</h2>
              <form class="card" style="padding:var(--space-6);" id="profile-settings-form">
                <div class="form-group">
                  <label class="form-label">${t('profile.settings.name_label')}</label>
                  <input type="text" id="settings-name" class="form-input" value="${user.name}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">${t('profile.settings.email_label')}</label>
                  <input type="email" id="settings-email" class="form-input" value="${user.email}" readonly style="background:var(--color-surface); cursor:not-allowed;" />
                  <span style="font-size:var(--text-xxs); color:var(--color-text-muted)">${t('profile.settings.email_hint')}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">${t('profile.settings.company_label')}</label>
                  <input type="text" id="settings-company" class="form-input" value="${user.company || ''}" placeholder="${t('profile.settings.company_ph')}" />
                </div>

                <div class="divider" style="margin:var(--space-5) 0"></div>

                <div style="display:flex; justify-content:flex-end;">
                  <button type="submit" class="btn btn-primary" id="save-settings-btn">
                    ${t('profile.settings.btn_save')}
                  </button>
                </div>
              </form>

              <!-- Database & Demo Configuration -->
              <div class="card" style="padding:var(--space-6); margin-top:var(--space-6); border-top:3px solid var(--color-gold)">
                <h3 style="font-family:var(--font-heading); font-size:var(--text-md); font-weight:700; color:var(--color-gold); margin-bottom:0.25rem">
                  ${localStorage.getItem('ol_use_mock') === 'true' ? (I18n.lang === 'no' ? 'Databasemodus: Frakoblet Demo (Mock)' : 'Database Mode: Offline Demo (Mock)') : (I18n.lang === 'no' ? 'Databasemodus: Live Google Sheets' : 'Database Mode: Live Google Sheets')}
                </h3>
                <p style="color:var(--color-text-secondary); font-size:var(--text-xs); margin-bottom:var(--space-4);">
                  ${localStorage.getItem('ol_use_mock') === 'true'
                    ? (I18n.lang === 'no' ? 'Du kjører appen i frakoblet modus med simulerte demodata. Du kan når som helst bytte tilbake til det levende Google Sheets-regnearket ditt.' : 'You are running the app in offline mode with simulated demo data. You can switch back to your live Google Sheets spreadsheet at any time.')
                    : (I18n.lang === 'no' ? 'Appen er koblet til ditt ekte Google Sheets-regneark. Hvis du opplever nettverksfeil eller vil teste offline, kan du bytte til simulert demo-modus.' : 'The app is connected to your real Google Sheets spreadsheet. If you experience network errors or want to test offline, you can switch to simulated demo mode.')}
                </p>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
                  <button class="btn btn-ghost btn-sm" id="toggle-database-mode-btn" style="color:var(--color-gold); border-color:var(--color-gold);">
                    ${localStorage.getItem('ol_use_mock') === 'true'
                      ? (I18n.lang === 'no' ? '🔌 Bytt til Live Google Sheets' : '🔌 Switch to Live Google Sheets')
                      : (I18n.lang === 'no' ? '🔑 Bytt til Frakoblet Demo (Mock)' : '🔑 Switch to Offline Demo (Mock)')}
                  </button>
                  <button class="btn btn-ghost btn-sm" id="reset-mock-db-btn" style="color:var(--color-danger); border-color:var(--color-danger);">
                    ${t('profile.danger.btn_reset')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    init: () => initProfileHandlers(enrollments, certificates, user)
  };
}

async function initProfileHandlers(enrollments, certificates, user) {
  const lang = I18n.lang;
  const t = (k) => I18n.t(k);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active tab pane
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(`tab-content-${tabName}`);
      if (activePane) activePane.classList.add('active');

      // Update hash parameters silently
      window.history.replaceState(null, null, `#/profile/${tabName}`);

      // Handle specific tab initialization
      if (tabName === 'signature') {
        initSignatureTabHandlers();
      }
    });
  });

  // Share CV wall
  const shareCvBtn = document.getElementById('share-cv-btn');
  if (shareCvBtn) {
    shareCvBtn.addEventListener('click', async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}#/cv/${user.id}`;
      await copyToClipboard(shareUrl);
      Toast.success(I18n.t('profile.toast.cv_copied'), I18n.lang === 'no' ? '🔗 Del profil' : '🔗 Share CV');
    });
  }

  // Share Diploma Wall button
  const shareWallBtn = document.getElementById('share-diploma-wall');
  if (shareWallBtn) {
    shareWallBtn.addEventListener('click', async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}#/cv/${user.id}`;
      await copyToClipboard(shareUrl);
      Toast.success(I18n.t('profile.toast.cv_copied'), I18n.lang === 'no' ? '🔗 Del diplomvegg' : '🔗 Share Diploma Wall');
    });
  }

  // Load and render enrollment card list with rich course data
  await renderEnrollmentsList(enrollments);

  // Share Cert handler
  document.querySelectorAll('.share-cert-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const certId = btn.dataset.id;
      const certNo = btn.dataset.no;
      const shareUrl = `${window.location.origin}${window.location.pathname}#/verify/${certNo}`;
      await copyToClipboard(shareUrl);
      Toast.success(I18n.t('profile.toast.cert_copied').replace('{{no}}', certNo), I18n.lang === 'no' ? '🔗 Del diplom' : '🔗 Share Certificate');
    });
  });

  // Settings form submission
  const settingsForm = document.getElementById('profile-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('settings-name').value.trim();
      const newCompany = document.getElementById('settings-company').value.trim();

      if (!newName) {
        Toast.error('Navn er påkrevd', 'Feil');
        return;
      }

      // Update Auth session and store
      user.name = newName;
      user.company = newCompany || null;
      user.avatar = newName.slice(0,2).toUpperCase();
      Auth.user = user;
      localStorage.setItem('ol_user', JSON.stringify(user));

      Toast.success(I18n.t('profile.toast.settings_saved'), I18n.lang === 'no' ? 'Oppdatert' : 'Updated');
      
      // Reload page to reflect header avatar change
      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
  }

  // Reset Mock DB button
  const resetBtn = document.getElementById('reset-mock-db-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm(I18n.t('profile.toast.reset_confirm'))) {
        localStorage.clear();
        Toast.info(I18n.t('profile.toast.reset_info'));
        setTimeout(() => {
          window.location.hash = '#/';
          window.location.reload();
        }, 1500);
      }
    });
  }

  // Toggle Database Mode button
  const toggleDbBtn = document.getElementById('toggle-database-mode-btn');
  if (toggleDbBtn) {
    toggleDbBtn.addEventListener('click', () => {
      const currentlyMock = localStorage.getItem('ol_use_mock') === 'true';
      if (currentlyMock) {
        localStorage.removeItem('ol_use_mock');
        Toast.success(I18n.lang === 'no' ? 'Byttet til Live Google Sheets-modus' : 'Switched to Live Google Sheets mode');
      } else {
        localStorage.setItem('ol_use_mock', 'true');
        Toast.success(I18n.lang === 'no' ? 'Byttet til Frakoblet Demo-modus' : 'Switched to Offline Demo mode');
      }
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    });
  }

  // If signature tab was open initially
  const activeBtn = document.querySelector('.tab-btn.active');
  if (activeBtn && activeBtn.dataset.tab === 'signature') {
    initSignatureTabHandlers();
  }
}

// Renders the enrollment cards with equipment names
async function renderEnrollmentsList(enrollments) {
  const container = document.getElementById('enrollment-list-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;justify-content:center;padding:var(--space-6);">
      <div class="spinner"></div>
    </div>`;

  try {
    const listHtml = await Promise.all(enrollments.map(async (enr, i) => {
      let eq = null;
      try {
        eq = await API.getEquipmentById(enr.equipmentId);
      } catch (err) {
        eq = { nameNo: enr.equipmentId, name: enr.equipmentId, category: 'Utstyr' };
      }
      
      const title = I18n.lang === 'no' ? eq.nameNo : eq.name;
      
      // Determine action buttons based on enrollment status
      let actionBtnHtml = '';
      let statusText = '';
      let statusClass = 'badge-gray';

      if (enr.status === 'certified') {
        statusText = I18n.t('profile.status.certified');
        statusClass = 'badge-success';
        actionBtnHtml = `
          <a href="#/certificate/${enr.certId}" class="btn btn-ghost btn-sm" style="flex:1; text-align:center;">${I18n.t('qr.btn_view_diploma')}</a>
        `;
      } else if (enr.status === 'awaiting_signature') {
        statusText = I18n.t('profile.status.sign');
        statusClass = 'badge-gold';
        actionBtnHtml = `
          <a href="#/sign/${enr.id}" class="btn btn-primary btn-sm hover-glow-red" style="flex:1; text-align:center;">${I18n.t('profile.status.sign_btn')}</a>
        `;
      } else if (enr.status === 'awaiting_oslo_sig') {
        statusText = I18n.t('profile.status.awaiting');
        statusClass = 'badge-warning';
        actionBtnHtml = `
          <div style="font-size:var(--text-xs); color:var(--color-text-muted); display:flex; align-items:center; gap:0.25rem;">
            ${I18n.t('profile.status.awaiting_desc')}
          </div>
        `;
      } else {
        // reading / in progress
        statusText = I18n.t('profile.status.reading').replace('{{progress}}', enr.progress);
        statusClass = 'badge-gray';
        actionBtnHtml = `
          <a href="#/course/${enr.id}" class="btn btn-primary btn-sm" style="flex:1; text-align:center;">${I18n.t('profile.status.continue_btn')}</a>
        `;
      }

      return `
        <div class="card animate-fadeInUp delay-${(i % 5 + 1) * 100}">
          <div class="card-body" style="padding:var(--space-4); display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:var(--space-4); flex:1; min-width:240px;">
              <div style="font-size:2rem;">🏗️</div>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.25rem;">
                  <h3 style="font-family:var(--font-heading); font-size:var(--text-sm); font-weight:700; margin:0;">${title}</h3>
                  <span class="badge ${statusClass}" style="font-size:0.6rem; padding:0.1rem 0.4rem;">${statusText}</span>
                </div>
                <div style="font-size:var(--text-xxs); color:var(--color-text-muted); display:flex; align-items:center; gap:0.5rem;">
                  <span>${eq.subcategory}</span>
                  <span>·</span>
                  <span>${I18n.t('profile.card.height').replace('{{height}}', eq.workHeight || 'N/A')}</span>
                </div>
                
                ${enr.status !== 'certified' && enr.status !== 'awaiting_signature' && enr.status !== 'awaiting_oslo_sig' ? `
                  <div style="margin-top:0.5rem; display:flex; align-items:center; gap:0.5rem;">
                    <div style="flex:1; background:rgba(0,0,0,0.06); height:6px; border-radius:3px; overflow:hidden;">
                      <div style="background:var(--gradient-gold); width:${enr.progress}%; height:100%;"></div>
                    </div>
                    <span style="font-size:var(--text-xxs); color:var(--color-text-secondary); width:32px; text-align:right;">${enr.progress}%</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div style="display:flex; gap:0.5rem; align-items:center; min-width:140px; justify-content:flex-end;">
              ${actionBtnHtml}
            </div>
          </div>
        </div>
      `;
    }).join(''));

    container.innerHTML = listHtml;
  } catch (err) {
    container.innerHTML = `<p style="color:var(--color-danger); text-align:center;">Kunne ikke hente kursoversikt: ${err.message}</p>`;
  }
}

// Canvas signature drawing setup
function initSignatureTabHandlers() {
  const canvas = document.getElementById('profile-sig-canvas');
  const clearBtn = document.getElementById('clear-profile-sig-btn');
  const saveBtn = document.getElementById('save-profile-sig-btn');
  const savedContainer = document.getElementById('saved-sig-container');

  if (!canvas) return;

  // Set visual width and height
  const ctx = canvas.getContext('2d');
  
  // Handle high DPI screens
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 180 * dpr; // Static height
  ctx.scale(dpr, dpr);

  ctx.strokeStyle = '#0B1623'; // Dark ink
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  // Retrieve existing signature
  const currentSig = Auth.user.signature || Store.get('operator_sig_base64');
  if (currentSig && savedContainer) {
    savedContainer.innerHTML = `<img src="${currentSig}" alt="Lagret signatur" style="max-height:120px; max-width:90%; object-fit:contain; filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.1));" />`;
  }

  function getMousePos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startDrawing(e) {
    drawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getMousePos(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
  }

  function stopDrawing() {
    drawing = false;
  }

  // Pointer events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Check if blank
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      
      if (canvas.toDataURL() === blank.toDataURL()) {
        Toast.error(I18n.t('profile.toast.sig_blank'), I18n.lang === 'no' ? 'Tom signatur' : 'Blank signature');
        return;
      }

      const sigBase64 = canvas.toDataURL('image/png');
      
      // Save in Auth and Store
      const user = Auth.user;
      user.signature = sigBase64;
      Auth.user = user;
      localStorage.setItem('ol_user', JSON.stringify(user));
      Store.set('operator_sig_base64', sigBase64);

      Toast.success(I18n.t('profile.toast.sig_saved'), I18n.lang === 'no' ? 'Vellykket' : 'Success');
      
      if (savedContainer) {
        savedContainer.innerHTML = `<img src="${sigBase64}" alt="Lagret signatur" style="max-height:120px; max-width:90%; object-fit:contain;" />`;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
}
