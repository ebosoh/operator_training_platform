/**
 * profile.js — Operator Profile & Diploma Dashboard (Phase 8)
 * Typeopplæring.no Safety Training Platform
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store, statusBadge } from './utils.js';

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
          <a href="#/login" class="btn btn-primary" style="margin-top:1rem">Logg inn</a>
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
                <span class="badge badge-gold" style="font-size:var(--text-xxs); padding:0.25rem 0.5rem;">${user.role === 'admin' ? 'Oslo Lift Admin' : (user.role === 'manager' ? 'Bedriftsleder' : 'Operatør')}</span>
              </div>
              <p style="color:var(--color-text-muted); margin:0.25rem 0 0.5rem; font-size:var(--text-sm);">✉️ ${user.email} ${user.company ? `· 🏢 ${user.company}` : '· 🧑‍🔧 Selvstendig operatør'}</p>
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
                ✍️ Sikkerhetssignatur
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
            <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin-bottom:var(--space-4);">Dine aktive og fullførte kurs</h2>
            ${enrollments.length === 0 ? `
              <div class="card" style="padding:var(--space-12); text-align:center;">
                <div style="font-size:3.5rem; margin-bottom:var(--space-4);">🏗️</div>
                <h3 style="font-family:var(--font-heading); font-weight:700;">Ingen kurs startet ennå</h3>
                <p style="color:var(--color-text-muted); margin-bottom:var(--space-6); max-width:400px; margin-left:auto; margin-right:auto;">
                  Utforsk maskinkatalogen for å finne sikkerhetsmanualer og starte din sertifisering.
                </p>
                <a href="#/catalog" class="btn btn-primary">Se Kurskataloget →</a>
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
              <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin:0;">Dine utstedte diplomer og kompetansebevis</h2>
              ${certificates.length > 0 ? `
                <button class="btn btn-ghost btn-sm" id="share-diploma-wall">
                  📁 Del diplomvegg
                </button>
              ` : ''}
            </div>

            ${certificates.length === 0 ? `
              <div class="card" style="padding:var(--space-12); text-align:center;">
                <div style="font-size:3.5rem; margin-bottom:var(--space-4);">🏆</div>
                <h3 style="font-family:var(--font-heading); font-weight:700;">Ingen diplomer ennå</h3>
                <p style="color:var(--color-text-muted); margin-bottom:var(--space-6); max-width:400px; margin-left:auto; margin-right:auto;">
                  Fullfør kurs, bestå sikkerhetstesten og signer for å motta ditt offisielle diplom.
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
                            🏆 Vis Diplom
                          </a>
                          <button class="btn btn-ghost btn-sm share-cert-btn" data-id="${cert.id}" data-no="${cert.certNumber}" style="padding:0 0.75rem;">
                            🔗 Del
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
              <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin-bottom:var(--space-3);">Sikkerhetssignatur på fil</h2>
              <p style="color:var(--color-text-secondary); font-size:var(--text-sm); line-height:1.6; margin-bottom:var(--space-5);">
                Din digitale signatur brukes til å bekrefte fullførte typeopplæringer og blir preget inn på de offisielle diplomene. Sørg for at den tegnes nøyaktig.
              </p>

              <div class="card" style="padding:var(--space-6); text-align:center; background:var(--color-surface); margin-bottom:var(--space-6);">
                <div style="font-size:var(--text-xs); color:var(--color-text-muted); text-transform:uppercase; margin-bottom:var(--space-3)">Gjeldende Signatur</div>
                <div id="saved-sig-container" style="background:#fff; border:1px dashed var(--color-border); border-radius:var(--radius-md); min-height:150px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                  <!-- Img injected here if exists -->
                  <div style="color:var(--color-text-muted); font-size:var(--text-sm)">Ingen signatur lagret ennå</div>
                </div>
              </div>

              <div class="card" style="padding:var(--space-6)">
                <h3 style="font-family:var(--font-heading); font-size:var(--text-md); font-weight:700; margin-bottom:var(--space-3);">Oppdater signatur</h3>
                
                <!-- Canvas Drawing Board -->
                <div style="background:#ffffff; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; position:relative; touch-action:none; margin-bottom:var(--space-4);">
                  <canvas id="profile-sig-canvas" style="width:100%; height:180px; display:block; cursor:crosshair;"></canvas>
                  <div style="position:absolute; bottom:0.5rem; left:0.5rem; pointer-events:none; font-size:var(--text-xxs); color:var(--color-text-muted); font-family:monospace; background:rgba(255,255,255,0.7); padding:2px 6px; border-radius:3px;">
                    ✍️ Skriv under i ruten
                  </div>
                </div>

                <div style="display:flex; gap:0.5rem;">
                  <button class="btn btn-ghost" id="clear-profile-sig-btn" style="flex:1">Slett</button>
                  <button class="btn btn-primary" id="save-profile-sig-btn" style="flex:2">Lagre ny signatur</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Settings -->
          <div id="tab-content-settings" class="tab-pane ${activeTab === 'settings' ? 'active' : ''}">
            <div style="max-width:600px; margin:0 auto;">
              <h2 style="font-family:var(--font-heading); font-size:var(--text-lg); font-weight:700; margin-bottom:var(--space-4);">Kontoinnstillinger</h2>
              <form class="card" style="padding:var(--space-6);" id="profile-settings-form">
                <div class="form-group">
                  <label class="form-label">Fullt Navn (vist på diplom)</label>
                  <input type="text" id="settings-name" class="form-input" value="${user.name}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">E-postadresse</label>
                  <input type="email" id="settings-email" class="form-input" value="${user.email}" readonly style="background:var(--color-surface); cursor:not-allowed;" />
                  <span style="font-size:var(--text-xxs); color:var(--color-text-muted)">E-postadresse kan ikke endres. Kontakt support ved behov.</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Tilhørende Bedrift</label>
                  <input type="text" id="settings-company" class="form-input" value="${user.company || ''}" placeholder="Ingen bedrift (Selvstendig)" />
                </div>

                <div class="divider" style="margin:var(--space-5) 0"></div>

                <div style="display:flex; justify-content:flex-end;">
                  <button type="submit" class="btn btn-primary" id="save-settings-btn">
                    💾 Lagre endringer
                  </button>
                </div>
              </form>

              <!-- Reset Mock Database -->
              <div class="card" style="padding:var(--space-6); margin-top:var(--space-6); border-top:3px solid var(--color-danger)">
                <h3 style="font-family:var(--font-heading); font-size:var(--text-md); font-weight:700; color:var(--color-danger); margin-bottom:0.25rem">Farlig Sone</h3>
                <p style="color:var(--color-text-secondary); font-size:var(--text-xs); margin-bottom:var(--space-4);">Om du opplever problemer eller vil starte på nytt med tomme kurs og ferske data, kan du nullstille den lokale nettleserdatabasen her.</p>
                <button class="btn btn-ghost btn-sm" id="reset-mock-db-btn" style="color:var(--color-danger); border-color:var(--color-danger);">
                  🚨 Nullstill Demodata
                </button>
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
    shareCvBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}#/cv/${user.id}`;
      navigator.clipboard.writeText(shareUrl);
      Toast.success('CV-lenke kopiert til utklippstavlen', '🔗 Del profil');
    });
  }

  // Load and render enrollment card list with rich course data
  await renderEnrollmentsList(enrollments);

  // Share Cert handler
  document.querySelectorAll('.share-cert-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const certId = btn.dataset.id;
      const certNo = btn.dataset.no;
      const shareUrl = `${window.location.origin}${window.location.pathname}#/verify/${certNo}`;
      navigator.clipboard.writeText(shareUrl);
      Toast.success(`Verifiseringslenke for ${certNo} kopiert!`, '🔗 Del diplom');
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

      Toast.success('Profilinnstillinger er lagret', 'Oppdatert');
      
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
      if (confirm('Er du sikker på at du vil slette alle lokale kursframganger, betalinger og diplomer? Dette vil sette applikasjonen tilbake til opprinnelig demotilstand.')) {
        localStorage.clear();
        Toast.info('Lokale databaser nullstilt. Laster inn på nytt...');
        setTimeout(() => {
          window.location.hash = '#/';
          window.location.reload();
        }, 1500);
      }
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
        statusText = 'Fullført ✓';
        statusClass = 'badge-success';
        actionBtnHtml = `
          <a href="#/certificate/${enr.certId}" class="btn btn-ghost btn-sm" style="flex:1; text-align:center;">🏆 Se Diplom</a>
        `;
      } else if (enr.status === 'awaiting_signature') {
        statusText = 'Bestått - Må Signeres';
        statusClass = 'badge-gold';
        actionBtnHtml = `
          <a href="#/sign/${enr.id}" class="btn btn-primary btn-sm hover-glow-red" style="flex:1; text-align:center;">✍️ Signer Nå</a>
        `;
      } else if (enr.status === 'awaiting_oslo_sig') {
        statusText = 'Venter på Oslo Liftutleie';
        statusClass = 'badge-warning';
        actionBtnHtml = `
          <div style="font-size:var(--text-xs); color:var(--color-text-muted); display:flex; align-items:center; gap:0.25rem;">
            ⏳ Awaiting representative counter-signing
          </div>
        `;
      } else {
        // reading / in progress
        statusText = `Pågår (${enr.progress}%)`;
        statusClass = 'badge-gray';
        actionBtnHtml = `
          <a href="#/course/${enr.id}" class="btn btn-primary btn-sm" style="flex:1; text-align:center;">📖 Fortsett Kurs</a>
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
                  <span>Arbeidshøyde: ${eq.workHeight || 'N/A'}</span>
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
        Toast.error('Vennligst tegn signaturen din før du lagrer', 'Tom signatur');
        return;
      }

      const sigBase64 = canvas.toDataURL('image/png');
      
      // Save in Auth and Store
      const user = Auth.user;
      user.signature = sigBase64;
      Auth.user = user;
      localStorage.setItem('ol_user', JSON.stringify(user));
      Store.set('operator_sig_base64', sigBase64);

      Toast.success('Signaturen din er lagret på fil', 'Vellykket');
      
      if (savedContainer) {
        savedContainer.innerHTML = `<img src="${sigBase64}" alt="Lagret signatur" style="max-height:120px; max-width:90%; object-fit:contain;" />`;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
}
