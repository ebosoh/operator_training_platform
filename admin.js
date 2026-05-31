/**
 * admin.js — Admin Dashboard (Phase 8)
 * Typeopplæring.no Safety Training Platform
 * L1 — Oslo Liftutleie Administrator Console
 */

import API, { MockData } from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store, scrollToTop, launchConfetti } from './utils.js';

export async function renderAdmin(params) {
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;
  const user = Auth.user;

  // Role guard (additional client-side double check)
  if (!Auth.isAdmin()) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">🔒</div>
          <h2>${lang === 'no' ? 'Ingen tilgang' : 'Access Denied'}</h2>
          <p>${lang === 'no' ? 'Du må være registrert som systemadministrator for å se denne siden.' : 'You must be registered as a system administrator to view this page.'}</p>
          <a href="#/" class="btn btn-primary" style="margin-top:1rem">${lang === 'no' ? 'Gå til Hjem' : 'Go to Home'}</a>
        </div>`,
      init: () => {}
    };
  }

  const activeTab = params[0] || 'overview';

  let stats = { totalUsers: 0, totalCerts: 0, totalCompanies: 0, pendingApprovals: 0, revenueThisMonth: 0, passRate: 0, recentCerts: [] };
  let pendingList = [];
  let usersList = [];
  let equipmentList = [];

  try {
    stats = await API.getAdminStats();
    pendingList = await API.getPendingApprovals();
    usersList = await API.getAllUsers();
    const eqResult = await API.getEquipment();
    equipmentList = eqResult.items || [];
  } catch (err) {
    console.warn('Could not load admin workspace data:', err);
  }

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding-bottom:var(--space-16)">
        <!-- Admin Header -->
        <div style="background:linear-gradient(180deg,var(--color-dark),var(--color-dark-card));border-bottom:1px solid var(--color-border);padding:var(--space-8) 0 var(--space-6);color:#fff">
          <div class="container">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
              <div>
                <div class="section-label animate-fadeInDown" style="color:var(--color-gold)">⚙️ Oslo Liftutleie · ${lang === 'no' ? 'Administrator' : 'Administrator'}</div>
                <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:800;margin:var(--space-2) 0 0;color:#fff" class="animate-fadeInUp">
                  ${lang === 'no' ? 'Systemadministrasjon' : 'System Administration'}
                </h1>
              </div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                <button class="btn btn-primary btn-sm hover-glow-red animate-fadeInUp" id="admin-header-add-eq-btn">
                  ➕ ${lang === 'no' ? 'Legg til maskin' : 'Add Machine'}
                </button>
                <button class="btn btn-gold btn-sm hover-glow-gold animate-fadeInUp" id="admin-export-visma-btn">
                  📊 ${t('admin.export_visma')} (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Admin Tabs -->
        <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);position:sticky;top:60px;z-index:10">
          <div class="container">
            <div class="tabs" style="border:none;margin:0">
              <button class="tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                📈 ${t('admin.dashboard')}
              </button>
              <button class="tab-btn ${activeTab === 'pending' ? 'active' : ''}" data-tab="pending">
                ⏳ ${t('admin.pending')} <span class="badge badge-primary" style="font-size:0.7rem;margin-left:0.25rem" id="badge-pending-count">${pendingList.length}</span>
              </button>
              <button class="tab-btn ${activeTab === 'equipment' ? 'active' : ''}" data-tab="equipment">
                🏗️ ${t('admin.equipment')} <span class="badge badge-gray" style="font-size:0.7rem;margin-left:0.25rem">${equipmentList.length}</span>
              </button>
              <button class="tab-btn ${activeTab === 'users' ? 'active' : ''}" data-tab="users">
                👥 ${t('admin.users')} <span class="badge badge-gray" style="font-size:0.7rem;margin-left:0.25rem">${usersList.length}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="container" style="margin-top:var(--space-6)">
          <!-- TAB: OVERVIEW -->
          <div id="admin-tab-overview" class="tab-pane ${activeTab === 'overview' ? 'active' : ''}">
            <!-- Stats Grid -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-5);margin-bottom:var(--space-8)">
              ${[
                { icon: '👥', label: lang === 'no' ? 'Brukere totalt' : 'Total Users', val: stats.totalUsers, color: 'var(--color-primary)' },
                { icon: '📜', label: lang === 'no' ? 'Godkjenninger' : 'Approvals', val: stats.totalCerts, color: 'var(--color-gold)' },
                { icon: '⏳', label: lang === 'no' ? 'Venter signatur' : 'Awaiting Signature', val: pendingList.length, color: 'var(--color-warning)' },
                { icon: '💳', label: lang === 'no' ? 'Inntekt denne mnd' : 'Revenue This Month', val: `${(stats.revenueThisMonth / 100).toLocaleString()} NOK`, color: 'var(--color-success)' },
                { icon: '📈', label: lang === 'no' ? 'Bestått-andel' : 'Pass Rate', val: `${stats.passRate}%`, color: 'var(--color-success)' },
              ].map(s => `
                <div class="card">
                  <div class="card-body" style="padding:var(--space-5);display:flex;align-items:center;gap:1rem">
                    <div style="font-size:2rem;background:rgba(0,0,0,0.03);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center">${s.icon}</div>
                    <div>
                      <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.06em">${s.label}</div>
                      <div style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:900;color:var(--color-text);margin-top:0.15rem">${s.val}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Recent Certs Grid -->
            <div class="card" style="margin-bottom:var(--space-8)">
              <div class="card-header">
                <h3 style="font-family:var(--font-heading);font-weight:700">Nylig utstedte sertifikater</h3>
              </div>
              <div class="card-body" style="padding:0">
                <div class="table-responsive">
                  <table class="table" style="margin:0">
                    <thead>
                      <tr>
                        <th>Serienummer</th>
                        <th>Operatør</th>
                        <th>Kurs / Maskin</th>
                        <th>Dato utstedt</th>
                        <th style="text-align:right">Handling</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${stats.recentCerts.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted)">Ingen utstedte bevis på fil ennå.</td></tr>` : 
                        stats.recentCerts.map(cert => `
                          <tr>
                            <td><span style="font-family:monospace;font-weight:600">${cert.certNumber}</span></td>
                            <td><strong>${cert.operatorName}</strong></td>
                            <td>${cert.courseName}</td>
                            <td>${new Date(cert.issuedAt).toLocaleDateString()}</td>
                            <td style="text-align:right">
                              <a href="#/certificate/${cert.id}" class="btn btn-ghost btn-xs">👁️ Vis diplom</a>
                            </td>
                          </tr>
                        `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: PENDING APPROVALS -->
          <div id="admin-tab-pending" class="tab-pane ${activeTab === 'pending' ? 'active' : ''}">
            <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-4)">Opplæring klar til countersignering</h2>
            
            ${pendingList.length === 0 ? `
              <div class="card" style="padding:var(--space-12);text-align:center">
                <div style="font-size:3rem;margin-bottom:var(--space-3)">✅</div>
                <h3 style="font-family:var(--font-heading);font-weight:700">Alt godkjent!</h3>
                <p style="color:var(--color-text-muted)">Det er ingen pågående kurs som venter på Oslo Liftutleie countersignering akkurat nå.</p>
              </div>
            ` : `
              <div style="display:flex;flex-direction:column;gap:var(--space-3)" id="admin-pending-list-container">
                ${pendingList.map((pend, idx) => `
                  <div class="card animate-fadeInUp delay-${(idx+1)*100}">
                    <div class="card-body" style="padding:var(--space-4);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
                      <div>
                        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.25rem">
                          <h3 style="font-family:var(--font-heading);font-size:var(--text-sm);font-weight:700;margin:0">${pend.userName}</h3>
                          <span class="badge badge-gold" style="font-size:0.6rem;padding:0.1rem 0.4rem">Bestått: ${pend.score}%</span>
                        </div>
                        <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin:0">
                          Maskintype: <strong>${pend.equipmentName}</strong> · Fullført: ${new Date(pend.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <button class="btn btn-primary btn-sm admin-approve-btn" data-id="${pend.enrollmentId}" data-user="${pend.userName}" data-eq="${pend.equipmentName}">
                          ✍️ Signer & Godkjenn
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- TAB: EQUIPMENT MANAGER -->
          <div id="admin-tab-equipment" class="tab-pane ${activeTab === 'equipment' ? 'active' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap;gap:1rem">
              <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:700;margin:0">Oslo Lift Maskinflåte & Kursmateriell</h2>
              <button class="btn btn-primary btn-sm hover-glow-red" id="admin-add-equipment-btn">
                ➕ Legg til ny maskin
              </button>
            </div>

            <div class="card" style="margin-bottom:var(--space-8)">
              <div class="card-body" style="padding:0">
                <div class="table-responsive">
                  <table class="table" style="margin:0">
                    <thead>
                      <tr>
                        <th>ID / QR</th>
                        <th>Maskinnavn (Norsk)</th>
                        <th>Hovedkategori</th>
                        <th>Underkategori</th>
                        <th>Høyde</th>
                        <th>Pris</th>
                        <th>Sider</th>
                        <th style="text-align:right">Handling</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${equipmentList.map(eq => `
                        <tr>
                          <td><span style="font-family:monospace;font-weight:600;font-size:var(--text-xs);background:rgba(0,0,0,0.04);padding:2px 4px;border-radius:3px">${eq.qrCode}</span></td>
                          <td><strong>${eq.nameNo}</strong></td>
                          <td>${eq.category}</td>
                          <td>${eq.subcategory}</td>
                          <td><span class="badge badge-gold">${eq.workHeight || 'N/A'}</span></td>
                          <td><strong>${(eq.price / 100 || 299)} NOK</strong></td>
                          <td>📄 ${eq.manualPages} s</td>
                          <td style="text-align:right;white-space:nowrap">
                            <a href="#/equipment/${eq.id}" class="btn btn-ghost btn-xs" style="padding:0.2rem 0.4rem;display:inline-block">Vis</a>
                            <button class="btn btn-gold btn-xs admin-edit-eq-btn" data-id="${eq.id}" style="padding:0.2rem 0.4rem;margin-left:0.25rem">✏️ Endre</button>
                            <button class="btn btn-primary btn-xs admin-delete-eq-btn" data-id="${eq.id}" style="padding:0.2rem 0.4rem;margin-left:0.25rem;background:var(--color-danger);border-color:transparent">🗑️ Slett</button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: USER MANAGER -->
          <div id="admin-tab-users" class="tab-pane ${activeTab === 'users' ? 'active' : ''}">
            <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-4)">Registrerte brukere</h2>
            <div class="card">
              <div class="card-body" style="padding:0">
                <div class="table-responsive">
                  <table class="table" style="margin:0">
                    <thead>
                      <tr>
                        <th>Navn</th>
                        <th>E-post</th>
                        <th>Rolle</th>
                        <th>Tilhørighet</th>
                        <th style="text-align:right">Handling</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${usersList.map(usr => `
                        <tr>
                          <td>
                            <div style="display:flex;align-items:center;gap:0.5rem">
                              <div class="avatar avatar-sm" style="width:28px;height:28px;font-size:0.7rem">${usr.avatar || usr.name.slice(0,2).toUpperCase()}</div>
                              <strong>${usr.name}</strong>
                            </div>
                          </td>
                          <td>${usr.email}</td>
                          <td>
                            <span class="badge ${usr.role === 'admin' ? 'badge-primary' : (usr.role === 'manager' ? 'badge-gold' : 'badge-gray')}" style="font-size:0.65rem">
                              ${usr.role.toUpperCase()}
                            </span>
                          </td>
                          <td><span style="color:var(--color-text-secondary);font-size:var(--text-xs)">${usr.company || 'Selvstendig'}</span></td>
                          <td style="text-align:right">
                            <select class="form-input admin-role-select" data-id="${usr.id}" style="width:auto;display:inline-block;padding:2px 4px;font-size:var(--text-xs);margin:0">
                              <option value="operator" ${usr.role === 'operator' ? 'selected' : ''}>Operator</option>
                              <option value="manager" ${usr.role === 'manager' ? 'selected' : ''}>Manager</option>
                              <option value="admin" ${usr.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COUNTERSIGN APPROVAL MODAL -->
      <div class="modal-overlay" id="admin-sign-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;align-items:center;justify-content:center;padding:var(--space-4)">
        <div class="modal card" style="width:100%;max-width:500px;overflow:visible">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h3 style="font-family:var(--font-heading);font-weight:800;margin:0">Countersignering & Godkjenning</h3>
            <span style="cursor:pointer;font-size:1.5rem" id="close-admin-modal-btn">✕</span>
          </div>
          <div class="card-body" style="padding:var(--space-5)">
            <p style="font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.6;margin-bottom:var(--space-4)">
              Signer under som representant for <strong>Oslo Liftutleie AS</strong> for å godkjenne opplæringen for:
            </p>
            <div class="glass-light" style="padding:0.75rem;border-radius:var(--radius-md);margin-bottom:var(--space-4)">
              <div style="font-size:var(--text-xs);color:var(--color-text-muted)">OPERATØR</div>
              <div style="font-weight:700;font-size:var(--text-md)" id="modal-operator-name">Lars Andersen</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:0.5rem">MOTEGODKJENT UTSTYR</div>
              <div style="font-weight:700;font-size:var(--text-md)" id="modal-eq-name">Sakselifter 8m Electric</div>
            </div>

            <!-- Signature Pad -->
            <div style="background:#ffffff;border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;position:relative;touch-action:none;margin-bottom:var(--space-4)">
              <canvas id="admin-sig-canvas" style="width:100%;height:150px;display:block;cursor:crosshair"></canvas>
              <div style="position:absolute;bottom:0.5rem;left:0.5rem;pointer-events:none;font-size:var(--text-xxs);color:var(--color-text-muted);font-family:monospace;background:rgba(255,255,255,0.7);padding:2px 6px;border-radius:3px">
                ✍️ Tegn Oslo Liftutleie signatur
              </div>
            </div>

            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-ghost" id="clear-admin-sig-btn" style="flex:1">Slett</button>
              <button class="btn btn-primary hover-glow-red" id="submit-admin-sig-btn" style="flex:2">Godkjenn & Utsted Bevis</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ADD EQUIPMENT MODAL -->
      <div class="modal-overlay" id="admin-add-eq-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;align-items:center;justify-content:center;padding:var(--space-4)">
        <div class="modal card" style="width:100%;max-width:550px;overflow:visible">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h3 style="font-family:var(--font-heading);font-weight:800;margin:0" id="add-eq-modal-title">Legg til ny maskin i flåten</h3>
            <span style="cursor:pointer;font-size:1.5rem" id="close-add-eq-modal-btn">✕</span>
          </div>
          <form class="card-body" style="padding:var(--space-5);display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;max-height:75dvh;overflow-y:auto" id="add-eq-form">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label" style="font-size:var(--text-xs)">Maskinnavn (Norsk)</label>
              <input type="text" id="add-eq-name-no" class="form-input" placeholder="e.g. Sakselifter 12m Diesel" required />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label" style="font-size:var(--text-xs)">Maskinnavn (Engelsk)</label>
              <input type="text" id="add-eq-name-en" class="form-input" placeholder="e.g. Scissor Lift 12m Diesel" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Hovedkategori</label>
              <select id="add-eq-cat" class="form-input" required>
                <option value="Lifter">Lifter</option>
                <option value="Maskiner">Maskiner</option>
                <option value="Truck/Minikran">Truck/Minikran</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Underkategori</label>
              <input type="text" id="add-eq-subcat" class="form-input" placeholder="e.g. Sakselifter" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Arbeidshøyde</label>
              <input type="text" id="add-eq-height" class="form-input" placeholder="e.g. 12m" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Maskinvekt</label>
              <input type="text" id="add-eq-weight" class="form-input" placeholder="e.g. 3200 kg" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Manual omfang (sider)</label>
              <input type="number" id="add-eq-pages" class="form-input" value="48" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Unik QR-kode</label>
              <input type="text" id="add-eq-qr" class="form-input" placeholder="e.g. OL-EQ-SAKS-002" required />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:var(--text-xs)">Kurspris (NOK)</label>
              <input type="number" id="add-eq-price" class="form-input" value="299" required />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label" style="font-size:var(--text-xs)">Håndbok Beskrivelse (Norsk)</label>
              <textarea id="add-eq-desc-no" class="form-input" style="height:60px;resize:vertical" placeholder="Skriv beskrivelse på norsk..."></textarea>
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label" style="font-size:var(--text-xs)">Håndbok Beskrivelse (Engelsk)</label>
              <textarea id="add-eq-desc-en" class="form-input" style="height:60px;resize:vertical" placeholder="Write description in English..."></textarea>
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label" style="font-size:var(--text-xs)">Håndbok PDF-lenke (Valgfritt / Optional)</label>
              <input type="url" id="add-eq-pdf" class="form-input" placeholder="https://.../manual.pdf" />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label" style="font-size:var(--text-xs)">Foto (Unsplash URL)</label>
              <input type="url" id="add-eq-image" class="form-input" placeholder="https://..." value="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70" />
            </div>

            <!-- Dynamic Videos Builder -->
            <div style="grid-column: span 2;border-top:1px dashed var(--color-border);margin:var(--space-3) 0;padding-top:var(--space-3)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
                <h4 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--color-gold);margin:0">
                  🎬 Opplæringsvideoer (Valgfritt / Optional)
                </h4>
                <button type="button" class="btn btn-ghost btn-xs" id="add-video-row-btn" style="padding:0.2rem 0.5rem">
                  ➕ Legg til video
                </button>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.5rem" id="form-videos-container"></div>
            </div>

            <!-- Dynamic Manual Sections Builder -->
            <div style="grid-column: span 2;border-top:1px dashed var(--color-border);margin:var(--space-3) 0;padding-top:var(--space-3)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
                <h4 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--color-gold);margin:0">
                  📚 Egendefinerte Håndbokavsnitt (Valgfritt)
                </h4>
                <button type="button" class="btn btn-ghost btn-xs" id="add-manual-sec-btn" style="padding:0.2rem 0.5rem">
                  ➕ Legg til avsnitt
                </button>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.75rem" id="form-manual-sections-container"></div>
            </div>

            <div style="grid-column: span 2;display:flex;gap:0.5rem;margin-top:var(--space-4)">
              <button type="button" class="btn btn-ghost" id="cancel-add-eq-btn" style="flex:1">Avbryt</button>
              <button type="submit" class="btn btn-primary hover-glow-red" id="submit-eq-form-btn" style="flex:1">Lagre maskin</button>
            </div>
          </form>
        </div>
      </div>
    `,
    init: () => initAdminHandlers(pendingList, equipmentList)
  };
}

function initAdminHandlers(pendingList, equipmentList) {
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
      const activePane = document.getElementById(`admin-tab-${tabName}`);
      if (activePane) activePane.classList.add('active');

      // Update hash parameters silently
      window.history.replaceState(null, null, `#/admin/${tabName}`);
    });
  });

  // Visma Exporter CSV
  const exportBtn = document.getElementById('admin-export-visma-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportVismaCSV();
    });
  }

  // Role selection change triggers database updates
  document.querySelectorAll('.admin-role-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const userId = select.dataset.id;
      const newRole = select.value;
      const targetUser = MockData.users.find(u => u.id === userId);
      if (targetUser) {
        targetUser.role = newRole;
        Toast.success(`Rolle for ${targetUser.name} oppdatert til ${newRole.toUpperCase()}`, 'Suksess');
      }
    });
  });

  // ── PENDING APPROVAL MODAL CONTROLLER ──────────────────────────────────────
  let activeEnrollmentId = null;
  const signModal = document.getElementById('admin-sign-modal');
  const closeBtn = document.getElementById('close-admin-modal-btn');
  const canvas = document.getElementById('admin-sig-canvas');
  const clearCanvasBtn = document.getElementById('clear-admin-sig-btn');
  const submitSignatureBtn = document.getElementById('submit-admin-sig-btn');

  // Interactive modal buttons for approval queue
  document.querySelectorAll('.admin-approve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const enrId = btn.dataset.id;
      const userName = btn.dataset.user;
      const eqName = btn.dataset.eq;

      activeEnrollmentId = enrId;
      document.getElementById('modal-operator-name').textContent = userName;
      document.getElementById('modal-eq-name').textContent = eqName;

      // Show modal
      if (signModal) {
        signModal.style.display = 'flex';
        requestAnimationFrame(() => signModal.classList.add('open'));
        document.body.style.overflow = 'hidden';
        initAdminCanvasSignature();
      }
    });
  });

  // Close modals
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (signModal) {
        signModal.classList.remove('open');
        setTimeout(() => {
          signModal.style.display = 'none';
        }, 300);
      }
      document.body.style.overflow = '';
      activeEnrollmentId = null;
    });
  }

  // ── ADD EQUIPMENT MODAL CONTROLLER ─────────────────────────────────────────
  const addEqModal = document.getElementById('admin-add-eq-modal');
  const addEqBtn = document.getElementById('admin-add-equipment-btn');
  const closeAddEqBtn = document.getElementById('close-add-eq-modal-btn');
  const cancelAddEqBtn = document.getElementById('cancel-add-eq-btn');
  const addEqForm = document.getElementById('add-eq-form');

  const manualSectionsContainer = document.getElementById('form-manual-sections-container');
  const addManualSecBtn = document.getElementById('add-manual-sec-btn');

  const videosContainer = document.getElementById('form-videos-container');
  const addVideoRowBtn = document.getElementById('add-video-row-btn');

  let activeEditId = null;

  function renderVideoRow(vid = { titleNo: '', titleEn: '', videoId: '' }) {
    if (!videosContainer) return;
    const row = document.createElement('div');
    row.className = 'form-video-row glass-light';
    row.style = 'padding:0.5rem;border-radius:var(--radius-sm);border:1px solid var(--color-border);display:grid;grid-template-columns:2fr 2fr 1.5fr;gap:0.5rem;position:relative;margin-bottom:0.5rem';
    row.innerHTML = `
      <div class="form-group" style="margin:0">
        <input type="text" class="form-input video-title-no" placeholder="Tittel (Norsk)" value="${vid.titleNo || ''}" required style="padding:4px 8px;font-size:var(--text-xs)" />
      </div>
      <div class="form-group" style="margin:0">
        <input type="text" class="form-input video-title-en" placeholder="Title (English)" value="${vid.titleEn || ''}" required style="padding:4px 8px;font-size:var(--text-xs)" />
      </div>
      <div class="form-group" style="margin:0;display:flex;gap:4px;align-items:center">
        <input type="text" class="form-input video-id-val" placeholder="YouTube-ID / Link" value="${vid.videoId || ''}" required style="padding:4px 8px;font-size:var(--text-xs);flex:1;min-width:0" />
        <span class="remove-video-row-btn" style="cursor:pointer;font-size:var(--text-md);color:var(--color-danger);font-weight:700;padding:0 4px;user-select:none" title="Fjern">✕</span>
      </div>
    `;
    row.querySelector('.remove-video-row-btn').addEventListener('click', () => {
      row.remove();
    });
    videosContainer.appendChild(row);
  }

  if (addVideoRowBtn) {
    addVideoRowBtn.addEventListener('click', () => {
      renderVideoRow();
    });
  }

  function renderManualSectionRow(sec = { titleNo: '', titleEn: '', contentNo: '', contentEn: '' }) {
    if (!manualSectionsContainer) return;
    const row = document.createElement('div');
    row.className = 'form-manual-sec-row glass-light';
    row.style = 'padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--color-border);display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;position:relative;margin-bottom:0.5rem';
    row.innerHTML = `
      <span class="remove-manual-sec-btn" style="position:absolute;top:0.35rem;right:0.5rem;cursor:pointer;font-size:var(--text-xs);color:var(--color-danger);font-weight:700" title="Fjern avsnitt">✕</span>
      <div style="grid-column: span 2;height:var(--space-2)"></div>
      <div class="form-group">
        <label class="form-label" style="font-size:var(--text-xxs)">Avsnittstittel (Norsk)</label>
        <input type="text" class="form-input manual-sec-title-no" placeholder="e.g. 1. Sikkerhetskontroll" value="${sec.titleNo || ''}" required style="padding:4px 8px;font-size:var(--text-xs)" />
      </div>
      <div class="form-group">
        <label class="form-label" style="font-size:var(--text-xxs)">Avsnittstittel (Engelsk)</label>
        <input type="text" class="form-input manual-sec-title-en" placeholder="e.g. 1. Safety Check" value="${sec.titleEn || ''}" required style="padding:4px 8px;font-size:var(--text-xs)" />
      </div>
      <div class="form-group" style="grid-column: span 2">
        <label class="form-label" style="font-size:var(--text-xxs)">Innhold (Norsk)</label>
        <textarea class="form-input manual-sec-content-no" placeholder="HTML eller ren tekst..." required style="height:50px;padding:4px 8px;font-size:var(--text-xs);resize:vertical">${sec.contentNo || ''}</textarea>
      </div>
      <div class="form-group" style="grid-column: span 2">
        <label class="form-label" style="font-size:var(--text-xxs)">Innhold (Engelsk)</label>
        <textarea class="form-input manual-sec-content-en" placeholder="HTML or plain text..." required style="height:50px;padding:4px 8px;font-size:var(--text-xs);resize:vertical">${sec.contentEn || ''}</textarea>
      </div>
    `;
    row.querySelector('.remove-manual-sec-btn').addEventListener('click', () => {
      row.remove();
    });
    manualSectionsContainer.appendChild(row);
  }

  if (addManualSecBtn) {
    addManualSecBtn.addEventListener('click', () => {
      renderManualSectionRow();
    });
  }

  if (addEqBtn) {
    addEqBtn.addEventListener('click', () => {
      activeEditId = null;
      document.getElementById('add-eq-modal-title').textContent = lang === 'no' ? 'Legg til ny maskin i flåten' : 'Add New Machine to Fleet';
      document.getElementById('submit-eq-form-btn').textContent = lang === 'no' ? 'Lagre maskin' : 'Save Machine';
      if (addEqForm) addEqForm.reset();
      if (manualSectionsContainer) manualSectionsContainer.innerHTML = '';
      if (videosContainer) videosContainer.innerHTML = '';
      if (addEqModal) {
        addEqModal.style.display = 'flex';
        requestAnimationFrame(() => addEqModal.classList.add('open'));
        document.body.style.overflow = 'hidden';
      }
    });
  }

  const headerAddBtn = document.getElementById('admin-header-add-eq-btn');
  if (headerAddBtn) {
    headerAddBtn.addEventListener('click', () => {
      activeEditId = null;
      document.getElementById('add-eq-modal-title').textContent = lang === 'no' ? 'Legg til ny maskin i flåten' : 'Add New Machine to Fleet';
      document.getElementById('submit-eq-form-btn').textContent = lang === 'no' ? 'Lagre maskin' : 'Save Machine';
      if (addEqForm) addEqForm.reset();
      if (manualSectionsContainer) manualSectionsContainer.innerHTML = '';
      if (videosContainer) videosContainer.innerHTML = '';
      if (addEqModal) {
        addEqModal.style.display = 'flex';
        requestAnimationFrame(() => addEqModal.classList.add('open'));
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // Edit machine handler
  document.querySelectorAll('.admin-edit-eq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const eqId = btn.dataset.id;
      const eq = equipmentList.find(e => e.id === eqId);
      if (!eq) return;

      activeEditId = eqId;
      document.getElementById('add-eq-modal-title').textContent = lang === 'no' ? 'Rediger maskin / kurs' : 'Edit Machine / Course';
      document.getElementById('submit-eq-form-btn').textContent = lang === 'no' ? 'Oppdater maskin' : 'Update Machine';

      // Pre-populate fields
      document.getElementById('add-eq-name-no').value = eq.nameNo || '';
      document.getElementById('add-eq-name-en').value = eq.name || '';
      document.getElementById('add-eq-cat').value = eq.category || 'Lifter';
      document.getElementById('add-eq-subcat').value = eq.subcategory || '';
      document.getElementById('add-eq-height').value = eq.workHeight || '';
      document.getElementById('add-eq-weight').value = eq.weight || '';
      document.getElementById('add-eq-pages').value = eq.manualPages || 48;
      document.getElementById('add-eq-qr').value = eq.qrCode || '';
      document.getElementById('add-eq-price').value = eq.price ? (eq.price / 100) : 299;
      document.getElementById('add-eq-desc-no').value = eq.description || '';
      document.getElementById('add-eq-desc-en').value = eq.descriptionEn || '';
      document.getElementById('add-eq-pdf').value = eq.pdfUrl || '';
      document.getElementById('add-eq-image').value = eq.image || '';

      // Pre-populate videos
      if (videosContainer) {
        videosContainer.innerHTML = '';
        if (eq.videoId) {
          if (eq.videoId.startsWith('[')) {
            try {
              const videos = JSON.parse(eq.videoId);
              videos.forEach(v => renderVideoRow(v));
            } catch(e) {
              renderVideoRow({ titleNo: 'Opplæringsvideo', titleEn: 'Instructional Video', videoId: eq.videoId });
            }
          } else {
            renderVideoRow({ titleNo: 'Opplæringsvideo', titleEn: 'Instructional Video', videoId: eq.videoId });
          }
        }
      }

      // Pre-populate manual sections
      if (manualSectionsContainer) {
        manualSectionsContainer.innerHTML = '';
        if (eq.manualSections && eq.manualSections.length > 0) {
          eq.manualSections.forEach(sec => renderManualSectionRow(sec));
        }
      }

      // Show modal
      if (addEqModal) {
        addEqModal.style.display = 'flex';
        requestAnimationFrame(() => addEqModal.classList.add('open'));
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Delete machine handler
  document.querySelectorAll('.admin-delete-eq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const eqId = btn.dataset.id;
      const eq = equipmentList.find(e => e.id === eqId);
      if (!eq) return;

      const confirmMsg = lang === 'no' 
        ? `Er du sikker på at du vil slette "${eq.nameNo}" og dens tilhørende kurs? Historiske HMS-diplomer vil bli bevart, men kurset vil bli slettet for fremtidige brukere.`
        : `Are you sure you want to delete "${eq.name}" and its course? Historical certificates will be preserved, but the course will be removed from the catalog.`;

      if (confirm(confirmMsg)) {
        try {
          Toast.info(lang === 'no' ? 'Sletter maskin...' : 'Deleting machine...');
          API.deleteEquipment(eqId).then(() => {
            Toast.success(lang === 'no' ? 'Maskinen har blitt slettet!' : 'Machine has been deleted!', lang === 'no' ? 'Slettet' : 'Deleted');
            setTimeout(() => {
              window.location.reload();
            }, 800);
          }).catch(err => {
            Toast.error('Kunne ikke slette: ' + err.message, 'Feil');
          });
        } catch (err) {
          Toast.error('Kunne ikke slette: ' + err.message, 'Feil');
        }
      }
    });
  });

  function closeAddEqModal() {
    if (addEqModal) {
      addEqModal.classList.remove('open');
      setTimeout(() => {
        addEqModal.style.display = 'none';
      }, 300);
    }
    document.body.style.overflow = '';
    if (addEqForm) addEqForm.reset();
  }

  if (closeAddEqBtn) closeAddEqBtn.addEventListener('click', closeAddEqModal);
  if (cancelAddEqBtn) cancelAddEqBtn.addEventListener('click', closeAddEqModal);

  if (addEqForm) {
    addEqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameNo = document.getElementById('add-eq-name-no').value.trim();
      const nameEn = document.getElementById('add-eq-name-en').value.trim();
      const category = document.getElementById('add-eq-cat').value;
      const subcategory = document.getElementById('add-eq-subcat').value.trim();
      const workHeight = document.getElementById('add-eq-height').value.trim() || 'N/A';
      const weight = document.getElementById('add-eq-weight').value.trim();
      const manualPages = parseInt(document.getElementById('add-eq-pages').value) || 48;
      const qrCode = document.getElementById('add-eq-qr').value.trim();
      // Helper to extract YouTube video ID from links or raw ID
      function extractYouTubeId(urlOrId) {
        if (!urlOrId) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = urlOrId.match(regExp);
        return (match && match[2].length === 11) ? match[2] : urlOrId;
      }

      // Compile dynamic videos
      const videoList = [];
      document.querySelectorAll('.form-video-row').forEach(row => {
        const tNo = row.querySelector('.video-title-no').value.trim();
        const tEn = row.querySelector('.video-title-en').value.trim();
        const rawId = row.querySelector('.video-id-val').value.trim();
        const vId = extractYouTubeId(rawId);
        if (vId) {
          videoList.push({ titleNo: tNo || 'Video', titleEn: tEn || 'Video', videoId: vId });
        }
      });

      const videoId = videoList.length > 0 ? JSON.stringify(videoList) : null;
      const price = (parseInt(document.getElementById('add-eq-price').value) || 299) * 100;
      const description = document.getElementById('add-eq-desc-no').value.trim();
      const descriptionEn = document.getElementById('add-eq-desc-en').value.trim();
      const pdfUrl = document.getElementById('add-eq-pdf').value.trim() || null;
      const image = document.getElementById('add-eq-image').value.trim();

      // Sanitize Unsplash page URLs to direct image hotlinks
      let finalImageUrl = image;
      if (image.includes('unsplash.com/photos/')) {
        const match = image.match(/unsplash\.com\/photos\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          const segment = match[1];
          const parts = segment.split('-');
          const photoId = parts[parts.length - 1];
          finalImageUrl = `https://images.unsplash.com/photo-${photoId}?w=600&q=70`;
        }
      }

      // Compile dynamic manual sections
      const manualSections = [];
      document.querySelectorAll('.form-manual-sec-row').forEach(row => {
        const tNo = row.querySelector('.manual-sec-title-no').value.trim();
        const tEn = row.querySelector('.manual-sec-title-en').value.trim();
        const cNo = row.querySelector('.manual-sec-content-no').value.trim();
        const cEn = row.querySelector('.manual-sec-content-en').value.trim();
        if (tNo || tEn) {
          manualSections.push({ titleNo: tNo, titleEn: tEn, contentNo: cNo, contentEn: cEn });
        }
      });

      const eqData = {
        name: nameEn, nameNo,
        category, subcategory,
        workHeight, weight,
        image: finalImageUrl, manualPages,
        price, currency: 'NOK',
        videoId,
        description: description || `${nameNo} for profesjonell bruk. Typeopplæring og sikkerhetskontroll tilgjengelig.`,
        descriptionEn: descriptionEn || `${nameEn} for professional use. Type approval training and safety control available.`,
        qrCode,
        pdfUrl,
        manualSections,
        tags: [category.toLowerCase(), subcategory.toLowerCase()]
      };

      try {
        if (activeEditId) {
          // Edit branch
          eqData.id = activeEditId;
          await API.updateEquipment(activeEditId, eqData);
          Toast.success(`${nameNo} har blitt oppdatert!`, 'Maskin oppdatert');
        } else {
          // Create branch
          eqData.id = `EQ-${subcategory.substring(0,4).toUpperCase()}-${Date.now()}`;
          await API.addEquipment(eqData);
          Toast.success(`${nameNo} har blitt lagt til i maskinlisten!`, 'Maskin opprettet');
        }
        closeAddEqModal();

        // Reload admin workspace after short delay to show new item
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err) {
        Toast.error('Kunne ikke lagre maskin: ' + err.message, 'Feil');
      }
    });
  }

  // ── ADMIN CANVAS SIGNATURE ────────────────────────────────────────────────
  let ctx = null;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function initAdminCanvasSignature() {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // Reset canvas dimensions and state
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 150 * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#8B1A1E'; // Red ink for admin approval signatures
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener('click', () => {
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  if (submitSignatureBtn) {
    submitSignatureBtn.addEventListener('click', async () => {
      if (!activeEnrollmentId) return;

      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      if (canvas.toDataURL() === blank.toDataURL()) {
        Toast.error('Representanten må signere før godkjenning kan utstedes.', 'Signatur mangler');
        return;
      }

      const sigBase64 = canvas.toDataURL('image/png');

      try {
        Toast.info('Signerer og oppretter offisielt bevis...');
        
        // 1. Save Oslo Lift signature on the backend enrollment
        const appUser = Auth.user.name || 'Oslo Lift Rep';
        await API.saveOsloLiftSignature(activeEnrollmentId, sigBase64, appUser);

        // 2. Issue the formal PDF certificate
        const cert = await API.issueCertificate(activeEnrollmentId);

        // 3. Remove from pending approvals queue in MockData
        const pendIndex = MockData.pendingApprovals.findIndex(p => p.enrollmentId === activeEnrollmentId);
        if (pendIndex !== -1) {
          MockData.pendingApprovals.splice(pendIndex, 1);
        }

        // Celebrate!
        if (signModal) {
          signModal.classList.remove('open');
          setTimeout(() => {
            signModal.style.display = 'none';
          }, 300);
        }
        document.body.style.overflow = '';
        launchConfetti();
        Toast.success(`Sertifikat ${cert.certNumber} er utstedt! E-post sendt til operatør.`, 'Sertifisert');
        
        // Reload admin to update pending badge and lists
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        Toast.error('Feil under godkjenning: ' + err.message, 'Feil');
      }
    });
  }
}

// Helper to compile and download accounting ledger in Visma format
function exportVismaCSV() {
  const payments = MockData.payments || [];
  if (payments.length === 0) {
    Toast.info('Ingen betalinger å eksportere.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Visma columns
  csvContent += 'TransaksjonsID,Dato,BrukerID,UtstyrsID,BelopNOK,MVA,Betalingsmetode,Referanse,Status\r\n';

  payments.forEach(p => {
    const belop = p.amount / 100;
    const mva = (belop * 0.2).toFixed(2); // 25% MVA is included in 299 (299/1.25 = 239.2 base, MVA is 59.8)
    const formattedDate = new Date(p.createdAt).toLocaleDateString('no-NO');
    csvContent += `${p.id},${formattedDate},${p.userId},${p.equipmentId},${belop},${mva},${p.method},${p.ref},${p.status}\r\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Oslo_Lift_Visma_Export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  Toast.success('Visma-regnskapsfil (CSV) lastet ned!', 'Eksportert');
}
