/**
 * company.js — Company Manager Portal (Phase 8)
 * Typeopplæring.no Safety Training Platform
 * L2 — Corporate Manager Dashboard
 */

import API, { MockData } from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store } from './utils.js';

export async function renderCompany(params) {
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;
  const user = Auth.user;

  // Role guard (additional double check)
  if (!Auth.isManager() && !Auth.isAdmin()) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">🔒</div>
          <h2>Ingen tilgang</h2>
          <p>Du må være registrert som bedriftsleder for å se denne siden.</p>
          <a href="#/" class="btn btn-primary" style="margin-top:1rem">Gå til Hjem</a>
        </div>`,
      init: () => {}
    };
  }

  const companyId = user.companyId || 'comp_001'; // Fallback to demo company
  const activeTab = params[0] || 'team';

  let companyTeam = { company: null, operators: [] };
  try {
    companyTeam = await API.getCompanyTeam(companyId);
  } catch (err) {
    console.warn('Could not load company team portal data:', err);
  }

  const company = companyTeam.company || { name: 'Din Bedrift', orgNo: '000000000', creditApproved: true, billingMethod: 'invoice' };
  const operators = companyTeam.operators || [];

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding-bottom:var(--space-16)">
        <!-- Company Header Banner -->
        <div style="background:linear-gradient(135deg,var(--color-dark),var(--color-dark-card));border-bottom:1px solid var(--color-border);padding:var(--space-8) 0 var(--space-6);color:#fff">
          <div class="container">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
              <div>
                <div class="section-label animate-fadeInDown" style="color:var(--color-gold)">🏢 Bedriftsportal · ${company.name}</div>
                <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:800;margin:var(--space-2) 0 0;color:#fff" class="animate-fadeInUp">
                  HMS & Opplæringsstyring
                </h1>
                <p style="color:var(--color-text-muted);font-size:var(--text-xs);margin-top:0.25rem">Org.nr: ${company.orgNo} · Faktureringsmetode: ${company.billingMethod === 'invoice' ? 'Faktura (Netto 30)' : 'Kort/Vipps'}</p>
              </div>
              <div>
                <button class="btn btn-gold btn-sm hover-glow-gold" id="company-export-hse-btn">
                  📋 Last ned HMS-rapport (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Navigation Tabs -->
        <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);position:sticky;top:60px;z-index:10">
          <div class="container">
            <div class="tabs" style="border:none;margin:0">
              <button class="tab-btn ${activeTab === 'team' ? 'active' : ''}" data-tab="team">
                👥 ${t('company.team')} <span class="badge badge-primary" style="font-size:0.7rem;margin-left:0.25rem" id="badge-team-count">${operators.length}</span>
              </button>
              <button class="tab-btn ${activeTab === 'invite' ? 'active' : ''}" data-tab="invite">
                ➕ ${t('company.invite')}
              </button>
              <button class="tab-btn ${activeTab === 'billing' ? 'active' : ''}" data-tab="billing">
                💳 ${t('company.billing')}
              </button>
              <button class="tab-btn ${activeTab === 'reports' ? 'active' : ''}" data-tab="reports">
                🛡️ HMS-Sikkerhet
              </button>
            </div>
          </div>
        </div>

        <div class="container" style="margin-top:var(--space-6)">
          <!-- TAB: TEAM PROGRESS OVERVIEW -->
          <div id="company-tab-team" class="tab-pane ${activeTab === 'team' ? 'active' : ''}">
            <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-4)">Ansattes utdanning og sertifiseringer</h2>

            ${operators.length === 0 ? `
              <div class="card" style="padding:var(--space-12);text-align:center">
                <div style="font-size:3.5rem;margin-bottom:var(--space-3)">👥</div>
                <h3 style="font-family:var(--font-heading);font-weight:700">Teamet ditt er tomt</h3>
                <p style="color:var(--color-text-muted);margin-bottom:var(--space-6)">Bruk invitasjonsskjermen til å legge til ansatte slik at du kan spore opplæringen deres.</p>
                <button class="btn btn-primary" onclick="document.querySelector('[data-tab=invite]').click()">➕ Inviter ansatte nå</button>
              </div>
            ` : `
              <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                ${operators.map((op, idx) => {
                  const certCount = op.certificates?.length || 0;
                  const activeEnr = op.enrollments?.find(e => e.status !== 'certified');
                  
                  return `
                    <div class="card animate-fadeInUp delay-${(idx+1)*100}">
                      <div class="card-body" style="padding:var(--space-5)">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
                          <div style="display:flex;align-items:center;gap:1rem">
                            <div class="avatar avatar-md" style="width:42px;height:42px;background:var(--color-surface);border:1px solid var(--color-border);font-family:var(--font-heading);font-weight:700;display:flex;align-items:center;justify-content:center">
                              ${op.avatar || op.name.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <h3 style="font-family:var(--font-heading);font-size:var(--text-md);font-weight:700;margin:0;color:var(--color-text)">${op.name}</h3>
                              <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin:0">✉️ ${op.email}</p>
                            </div>
                          </div>
                          
                          <div style="display:flex;gap:var(--space-6);align-items:center;flex-wrap:wrap">
                            <div>
                              <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase;margin-bottom:0.15rem">Kompetansebevis</div>
                              <div style="font-family:var(--font-heading);font-weight:800;color:var(--color-gold);font-size:var(--text-md)">🏆 ${certCount} bestått</div>
                            </div>
                            
                            ${activeEnr ? `
                              <div style="min-width:160px">
                                <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase;margin-bottom:0.15rem">Aktivt Kurs (fremdrift)</div>
                                <div style="display:flex;align-items:center;gap:0.5rem">
                                  <div style="flex:1;background:rgba(0,0,0,0.06);height:6px;border-radius:3px;overflow:hidden">
                                    <div style="background:var(--gradient-gold);width:${activeEnr.progress}%;height:100%"></div>
                                  </div>
                                  <span style="font-size:var(--text-xxs);font-weight:700;color:var(--color-text-secondary);width:32px;text-align:right">${activeEnr.progress}%</span>
                                </div>
                              </div>
                            ` : `
                              <div style="min-width:160px;text-align:right;color:var(--color-text-muted);font-size:var(--text-xs)">
                                🟢 Klar for nye kurs
                              </div>
                            `}
                          </div>
                        </div>

                        ${certCount > 0 ? `
                          <div class="divider" style="margin:var(--space-4) 0 var(--space-3)"></div>
                          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
                            <span style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase">Diplomer på fil:</span>
                            ${op.certificates.map(c => `
                              <a href="#/certificate/${c.id}" class="badge badge-gray" style="text-decoration:none;font-size:0.65rem;font-weight:600;padding:0.2rem 0.5rem;display:inline-flex;align-items:center;gap:0.25rem">
                                📜 ${c.courseName}
                              </a>
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- TAB: INVITE EMPLOYEE -->
          <div id="company-tab-invite" class="tab-pane ${activeTab === 'invite' ? 'active' : ''}">
            <div style="max-width:600px;margin:0 auto">
              <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-3)">Legg til ny ansatt i din bedriftskonto</h2>
              <p style="color:var(--color-text-secondary);font-size:var(--text-sm);line-height:1.6;margin-bottom:var(--space-5)">
                Når du oppretter en ansatt under din bedriftsprofil, kan de logge inn umiddelbart, og kursgebyret vil automatisk belastes bedriftens månedlige fellesfaktura.
              </p>

              <form class="card" style="padding:var(--space-6)" id="company-invite-form">
                <div class="form-group">
                  <label class="form-label">Fullt Navn</label>
                  <input type="text" id="invite-name" class="form-input" placeholder="e.g. Morten Hansen" required />
                </div>
                <div class="form-group">
                  <label class="form-label">E-postadresse</label>
                  <input type="email" id="invite-email" class="form-input" placeholder="e.g. morten@buildcorp.no" required />
                </div>

                <div class="divider" style="margin:var(--space-5) 0"></div>

                <div style="display:flex;justify-content:flex-end">
                  <button type="submit" class="btn btn-primary" id="submit-invite-btn">
                    🚀 Opprett ansatt og send invitasjon
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- TAB: BILLING & CREDITS -->
          <div id="company-tab-billing" class="tab-pane ${activeTab === 'billing' ? 'active' : ''}">
            <div style="display:grid;grid-template-columns:1fr;gap:var(--space-6)" id="billing-sub-grid">
              <!-- Credit spec card -->
              <div class="card">
                <div class="card-header">
                  <h3 style="font-family:var(--font-heading);font-weight:800">Bedriftens Kredittstatus</h3>
                </div>
                <div class="card-body" style="padding:var(--space-5)">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-5)">
                    <div>
                      <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase">Kredittgrense</div>
                      <div style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:900;color:var(--color-text)">50,000 NOK</div>
                    </div>
                    <div>
                      <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase">Utestående beløp</div>
                      <div style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:900;color:var(--color-primary)">3,588 NOK</div>
                    </div>
                    <div>
                      <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase">Bevilget kreditt</div>
                      <div style="font-weight:700;color:var(--color-success)">🟢 Kredittgodkjent</div>
                    </div>
                    <div>
                      <div style="font-size:var(--text-xxs);color:var(--color-text-muted);text-transform:uppercase">MVA-sats</div>
                      <div style="font-weight:700">25% (Norsk MVA)</div>
                    </div>
                  </div>
                  
                  <div class="divider" style="margin:var(--space-4) 0"></div>
                  
                  <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin:0;line-height:1.5">
                    Bedriften din er godkjent for fakturering med <strong>Netto 30 dagers forfall</strong>. Transaksjoner belastes løpende ved kursstart for tilknyttede ansatte.
                  </p>
                </div>
              </div>

              <!-- Invoices list -->
              <div class="card">
                <div class="card-header">
                  <h3 style="font-family:var(--font-heading);font-weight:800">Bedriftsfakturaer</h3>
                </div>
                <div class="card-body" style="padding:0">
                  <div class="table-responsive">
                    <table class="table" style="margin:0">
                      <thead>
                        <tr>
                          <th>Faktura nr.</th>
                          <th>Periode</th>
                          <th>Beløp (MVA inkl)</th>
                          <th>Forfallsdato</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><span style="font-family:monospace;font-weight:600">INV-2024-0012</span></td>
                          <td>Mai 2026</td>
                          <td><strong>3,588.00 NOK</strong></td>
                          <td>30.06.2026</td>
                          <td><span class="badge badge-warning" style="font-size:0.65rem">Ubetalt</span></td>
                        </tr>
                        <tr>
                          <td><span style="font-family:monospace;font-weight:600">INV-2024-0008</span></td>
                          <td>April 2026</td>
                          <td><strong>5,980.00 NOK</strong></td>
                          <td>30.05.2026</td>
                          <td><span class="badge badge-success" style="font-size:0.65rem">Betalt</span></td>
                        </tr>
                        <tr>
                          <td><span style="font-family:monospace;font-weight:600">INV-2024-0002</span></td>
                          <td>Mars 2026</td>
                          <td><strong>1,196.00 NOK</strong></td>
                          <td>30.04.2026</td>
                          <td><span class="badge badge-success" style="font-size:0.65rem">Betalt</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: HMS SECURITY & COMPLIANCE -->
          <div id="company-tab-reports" class="tab-pane ${activeTab === 'reports' ? 'active' : ''}">
            <div class="card" style="padding:var(--space-6);margin-bottom:var(--space-6)">
              <div style="display:flex;align-items:center;gap:1rem;margin-bottom:var(--space-4)">
                <div style="font-size:3rem">🛡️</div>
                <div>
                  <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:800;margin:0">Sikkerhetsrevisjon & HMS-samsvar</h2>
                  <p style="color:var(--color-text-secondary);font-size:var(--text-xs);margin:0">Overholdelse av <em>Forskrift om utførelse av arbeid</em> § 10-2</p>
                </div>
              </div>
              <p style="color:var(--color-text-secondary);font-size:var(--text-sm);line-height:1.6;margin-bottom:var(--space-4)">
                Norsk lovgivning krever at arbeidsgiver sikrer at alle operatører har dokumentert sikkerhetsopplæring på den spesifikke maskintypen de bruker. Denne portalen gir deg fullverdig dokumentasjon ved eventuelt tilsyn av Arbeidstilsynet.
              </p>
              <div class="glass-light" style="padding:var(--space-4);border-radius:var(--radius-md)">
                <h4 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-xs);margin-bottom:var(--space-2);text-transform:uppercase">HSE Oppsummering:</h4>
                <ul style="display:flex;flex-direction:column;gap:0.25rem;font-size:var(--text-sm);color:var(--color-text-secondary);margin:0">
                  <li>✅ Godkjente operatører på fil: <strong>${operators.filter(o => o.certificates?.length > 0).length} ansatte</strong></li>
                  <li>✅ Manglende godkjenninger / Pågående: <strong>${operators.filter(o => o.enrollments?.some(e => e.status !== 'certified')).length} ansatte</strong></li>
                  <li>💯 Samsvarsgrad: <strong>${operators.length > 0 ? Math.round((operators.filter(o => o.certificates?.length > 0).length / operators.length) * 100) : 100}%</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    init: () => initCompanyHandlers(company, operators)
  };
}

function initCompanyHandlers(company, operators) {
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
      const activePane = document.getElementById(`company-tab-${tabName}`);
      if (activePane) activePane.classList.add('active');

      // Update hash parameters silently
      window.history.replaceState(null, null, `#/company/${tabName}`);
    });
  });

  // Responsive billing grid
  const billingGrid = document.getElementById('billing-sub-grid');
  if (billingGrid && window.innerWidth >= 900) {
    billingGrid.style.gridTemplateColumns = '1fr 1.5fr';
  }

  // HSE Report CSV export triggers
  const exportHseBtn = document.getElementById('company-export-hse-btn');
  if (exportHseBtn) {
    exportHseBtn.addEventListener('click', () => {
      exportHseLedgerCSV(company.name, operators);
    });
  }

  const exportHseReportLink = document.getElementById('company-export-hse-btn');

  // Interactive Employee Onboarding wizard submit
  const inviteForm = document.getElementById('company-invite-form');
  if (inviteForm) {
    inviteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('invite-name').value.trim();
      const email = document.getElementById('invite-email').value.trim().toLowerCase();

      if (!name || !email) {
        Toast.error('Vennligst oppgi både navn og e-post.', 'Feil');
        return;
      }

      // Check if employee already exists in MockDB
      const existing = MockData.users.find(u => u.email === email);
      if (existing) {
        Toast.error('Denne e-postadressen er allerede registrert i systemet.', 'Eksisterer allerede');
        return;
      }

      // Create new operator in local database
      const newOperator = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role: 'operator',
        company: company.name,
        companyId: Auth.user.companyId || 'comp_001',
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2),
        verified: true
      };

      // Push to memory and store
      MockData.users.push(newOperator);
      
      // Auto enroll in sakselifter electrically to give them an active course to start
      MockData.enrollments.push({
        id: `enr_${Date.now()}`,
        userId: newOperator.id,
        equipmentId: 'EQ-SAKS-001',
        status: 'reading',
        paid: true,
        paymentRef: 'COMP_INVOICE_BILLING',
        startedAt: new Date().toISOString(),
        completedAt: null,
        progress: 0,
        currentPage: 0,
        score: null,
        certId: null
      });

      Toast.success(`${name} har blitt lagt til i bedriftens team! E-post sendt med påloggingsdetaljer.`, 'Ansatt opprettet');
      inviteForm.reset();

      // Refresh page view after short delay to show in table
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
}

// Compiles team and downloads a comprehensive HSE compliance report
function exportHseLedgerCSV(companyName, operators) {
  if (operators.length === 0) {
    Toast.info('Ingen ansatte å eksportere rapport for.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += `HMS samsvarsrapport,${companyName},Organisasjonsnummer: 987654321,Dato utstedt: ${new Date().toLocaleDateString('no-NO')}\r\n`;
  csvContent += 'Navn,E-post,Kurs,Serienummer,Samsvarsstatus,Fullfort dato,Testresultat\r\n';

  operators.forEach(op => {
    const certCount = op.certificates?.length || 0;
    const enrollments = op.enrollments || [];
    
    if (certCount === 0 && enrollments.length === 0) {
      csvContent += `"${op.name}",${op.email},Ingen kurs registrert,,IKKE SAMSVAR,,0%\r\n`;
    } else {
      // Print certificates
      if (op.certificates && op.certificates.length > 0) {
        op.certificates.forEach(c => {
          const completedDate = new Date(c.issuedAt).toLocaleDateString('no-NO');
          csvContent += `"${op.name}",${op.email},"${c.courseName}",${c.certNumber},SAMSVAR (Bestått),${completedDate},${c.score}%\r\n`;
        });
      }
      // Print active enrollments
      if (op.enrollments && op.enrollments.length > 0) {
        op.enrollments.forEach(e => {
          if (e.status !== 'certified') {
            const statusLabel = e.status === 'awaiting_signature' || e.status === 'awaiting_oslo_sig' ? 'Venter Godkjenning' : 'Under lesing';
            csvContent += `"${op.name}",${op.email},"${e.equipmentId}",,IKKE SAMSVAR (${statusLabel}),,0%\r\n`;
          }
        });
      }
    }
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const fileDate = new Date().toISOString().slice(0,10);
  link.setAttribute('download', `HMS_Samsvarsrapport_${companyName.replace(/ /g, '_')}_${fileDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  Toast.success('HMS-samsvarsrapport (CSV) klar og lastet ned!', 'HMS Rapport');
}
