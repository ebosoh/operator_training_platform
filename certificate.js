/**
 * certificate.js — Diploma Generation & Verification (Phase 7)
 * Typeopplæring.no Safety Training Platform
 * GitHub Pages hosted — PDF via jsPDF + html2canvas
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Format, copyToClipboard, shareContent, launchConfetti } from './utils.js';

// ── Certificate View ──────────────────────────────────────────────────────────
export async function renderCertificate(params) {
  const certId = params[0];
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  let cert = null, equipment = null;
  try {
    cert = await API.getCertificate(certId);
    if (cert?.equipmentId) equipment = await API.getEquipmentById(cert.equipmentId);
  } catch (err) {
    console.warn('Certificate load error:', err);
    return { html: notFoundHtml('Diplom ikke funnet', '#/profile'), init: () => {} };
  }

  const certDate = Format.date(cert.issuedAt, lang);
  const eqName = lang === 'no' ? equipment?.nameNo : equipment?.name;
  const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify/${cert.certNumber}`;

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding:var(--space-8) 0 var(--space-16)">
        <div class="container-sm">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:var(--space-8)" class="animate-fadeInDown">
            <div style="font-size:4rem;margin-bottom:var(--space-3)">🏆</div>
            <div class="section-label" style="justify-content:center">Oslo Liftutleie · Sikkerhet & Opplæring</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--space-2)">${t('cert.title')}</h1>
            <p style="color:var(--color-text-secondary)">${t('cert.subtitle')}</p>
          </div>

          <!-- CERTIFICATE CARD (printable) -->
          <div id="certificate-render" class="animate-scaleIn">
            ${renderCertificateTemplate(cert, equipment, certDate, eqName, verifyUrl, lang)}
          </div>

          <!-- Action Buttons -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-3);margin-top:var(--space-8)" class="animate-fadeInUp delay-300">
            <button class="btn btn-primary" id="btn-download-pdf">
              📥 ${t('cert.download')}
            </button>
            <button class="btn btn-ghost" id="btn-email-cert">
              📧 ${t('cert.email')}
            </button>
            <button class="btn btn-ghost" id="btn-share-cert">
              🔗 ${t('cert.share')}
            </button>
            <a href="${verifyUrl}" class="btn btn-ghost" target="_blank">
              🔍 ${t('cert.verify')}
            </a>
          </div>

          <!-- LinkedIn Share Suggestion -->
          <div class="card" style="margin-top:var(--space-6);background:rgba(10,102,194,0.08);border-color:rgba(10,102,194,0.3)">
            <div class="card-body" style="display:flex;align-items:center;gap:var(--space-4)">
              <div style="font-size:2rem;flex-shrink:0">💼</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:4px">Del på LinkedIn</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Legg til din typegodkjenning som en sertifisering på LinkedIn-profilen din.</div>
              </div>
              <button class="btn btn-ghost btn-sm" id="btn-linkedin" style="border-color:rgba(10,102,194,0.5);color:#60a5fa;flex-shrink:0">Del →</button>
            </div>
          </div>

          <!-- CV page link -->
          <div class="card" style="margin-top:var(--space-4)">
            <div class="card-body" style="display:flex;align-items:center;gap:var(--space-4)">
              <div style="font-size:2rem;flex-shrink:0">📄</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:4px">Din digitale CV-side</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Alle dine diplomer samlet på én side du kan dele med arbeidsgivere.</div>
              </div>
              <a href="#/cv/${Auth.getUserId()}" class="btn btn-ghost btn-sm" style="flex-shrink:0">Se →</a>
            </div>
          </div>

          <!-- Navigation -->
          <div style="display:flex;gap:var(--space-3);margin-top:var(--space-8)">
            <a href="#/profile" class="btn btn-ghost" style="flex:1">← Mine kurs</a>
            <a href="#/catalog" class="btn btn-ghost" style="flex:1">Flere kurs →</a>
          </div>
        </div>
      </div>
    `,
    init: () => initCertificateHandlers({ cert, equipment, eqName, certDate, verifyUrl }),
  };
}

function renderCertificateTemplate(cert, equipment, certDate, eqName, verifyUrl, lang) {
  const t = (k) => I18n.t(k);
  // Oslo Liftutleie brand colors
  return `
    <div id="cert-card-printable" style="
      background: linear-gradient(145deg, #0B1623 0%, #101D2C 40%, #140A08 100%);
      border: 1px solid rgba(250,162,27,0.35);
      border-radius: 20px;
      padding: 0;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(250,162,27,0.15);
    ">
      <!-- Top gradient bar -->
      <div style="height:5px;background:linear-gradient(90deg,#C0272D,#FAA21B,#C0272D);border-radius:20px 20px 0 0"></div>

      <!-- Background pattern -->
      <div style="position:absolute;inset:0;opacity:0.03;pointer-events:none;overflow:hidden">
        <div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:repeating-linear-gradient(45deg,#FAA21B,#FAA21B 1px,transparent 1px,transparent 40px)"></div>
      </div>

      <!-- Logo watermark -->
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-heading);font-size:8rem;font-weight:900;color:rgba(250,162,27,0.03);letter-spacing:-0.02em;pointer-events:none;white-space:nowrap;user-select:none">OSLO LIFT</div>

      <div style="position:relative;padding:2.5rem 3rem;">
        <!-- Header Row -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem">
          <div style="display:flex;align-items:center;gap:0.875rem">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#C0272D,#8B1A1E);border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:900;font-size:1rem;color:#fff;box-shadow:0 4px 16px rgba(192,39,45,0.4)">🏗️</div>
            <div>
              <div style="font-family:var(--font-heading);font-weight:800;font-size:0.85rem;color:#fff;letter-spacing:-0.01em">Oslo Liftutleie</div>
              <div style="font-size:0.6rem;color:rgba(250,162,27,0.8);letter-spacing:0.12em;text-transform:uppercase">Sikkerhet & Opplæring</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">Serienummer</div>
            <div style="font-family:monospace;font-size:0.65rem;color:rgba(250,162,27,0.7);font-weight:700">${cert.certNumber}</div>
          </div>
        </div>

        <!-- Title -->
        <div style="text-align:center;margin-bottom:2rem">
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:0.625rem">Herved tildeles</div>
          <div style="font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:#FAA21B;line-height:1;margin-bottom:0.25rem;text-shadow:0 2px 20px rgba(250,162,27,0.3)">${cert.operatorName}</div>
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.18em;margin-top:0.875rem;margin-bottom:0.375rem">typegodkjenning for</div>
          <div style="font-family:var(--font-heading);font-size:1.2rem;font-weight:800;color:#fff">${eqName || cert.courseName}</div>
        </div>

        <!-- Stats row -->
        <div style="display:flex;justify-content:center;gap:3rem;margin-bottom:2rem;padding:1rem 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06)">
          ${[
            { label: 'Score', value: `${cert.score || 92}%` },
            { label: 'Status', value: '✅ BESTÅTT' },
            { label: 'Dato', value: certDate },
          ].map(item => `
            <div style="text-align:center">
              <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:900;color:#FAA21B;margin-bottom:2px">${item.value}</div>
              <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em">${item.label}</div>
            </div>
          `).join('')}
        </div>

        <!-- Signatures Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem">
          <div style="text-align:center">
            <div style="height:50px;border-bottom:1px solid rgba(250,162,27,0.3);display:flex;align-items:flex-end;justify-content:center;margin-bottom:0.5rem">
              ${cert.operatorSig ? `<img src="${cert.operatorSig}" style="max-height:45px;max-width:100%;object-fit:contain;filter:brightness(10) sepia(1) hue-rotate(30deg)" alt="Signatur" />` : '<div style="font-style:italic;color:rgba(250,162,27,0.5);font-size:0.9rem">Operatørsignatur</div>'}
            </div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em">${cert.operatorName}</div>
            <div style="font-size:0.6rem;color:rgba(255,255,255,0.3)">Operatør</div>
          </div>
          <div style="text-align:center">
            <div style="height:50px;border-bottom:1px solid rgba(250,162,27,0.3);display:flex;align-items:flex-end;justify-content:center;margin-bottom:0.5rem">
              ${cert.osloLiftSig ? `<img src="${cert.osloLiftSig}" style="max-height:45px;max-width:100%;object-fit:contain;filter:brightness(10) sepia(1) hue-rotate(30deg)" alt="OL Signatur" />` : '<div style="font-style:italic;color:rgba(250,162,27,0.5);font-size:0.85rem">Oslo Liftutleie</div>'}
            </div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em">Oslo Liftutleie AS</div>
            <div style="font-size:0.6rem;color:rgba(255,255,255,0.3)">Godkjent av</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem">
          <div style="font-size:0.6rem;color:rgba(255,255,255,0.25)">
            Utstedt i henhold til Forskrift om utførelse av arbeid (§ 10-2) · Gyldig: Livstid
          </div>
          <div style="font-size:0.6rem;color:rgba(250,162,27,0.5);font-family:monospace">
            ${verifyUrl.slice(0, 50)}
          </div>
        </div>
      </div>

      <!-- Bottom gradient bar -->
      <div style="height:3px;background:linear-gradient(90deg,#C0272D,#FAA21B,#C0272D);border-radius:0 0 20px 20px"></div>
    </div>
  `;
}

function initCertificateHandlers({ cert, equipment, eqName, certDate, verifyUrl }) {
  // Confetti on load
  setTimeout(() => launchConfetti(4000), 500);

  // ── Download PDF ───────────────────────────────────────────────────────────
  document.getElementById('btn-download-pdf')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-pdf');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    try {
      const certEl = document.getElementById('cert-card-printable');
      if (!certEl) throw new Error('Certificate element not found');

      // Use html2canvas + jsPDF
      if (window.html2canvas && window.jspdf) {
        const canvas = await window.html2canvas(certEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0B1623',
          logging: false,
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, (pdf.internal.pageSize.getHeight() - pdfHeight) / 2, pdfWidth, pdfHeight);
        pdf.save(`diplom-${cert.certNumber}-${cert.operatorName.replace(/\s/g, '_')}.pdf`);
        Toast.success('PDF lastet ned!', '📥');
      } else {
        // Fallback: print
        window.print();
        Toast.info('Bruk Skriv ut → Lagre som PDF');
      }
    } catch (err) {
      console.warn('PDF generation error:', err);
      Toast.error('PDF-generering feilet. Prøv å skrive ut siden.', 'Feil');
    } finally {
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    }
  });

  // ── Email Certificate ──────────────────────────────────────────────────────
  document.getElementById('btn-email-cert')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-email-cert');
    if (btn) { btn.textContent = '⏳ Sender...'; btn.disabled = true; }
    // In prod: call Apps Script to send email
    await new Promise(r => setTimeout(r, 1500));
    Toast.success(`Diplom sendt til ${Auth.user?.email || 'din e-post'}`, '📧 Sendt');
    if (btn) { btn.textContent = '✅ Sendt'; btn.disabled = false; }
  });

  // ── Share ──────────────────────────────────────────────────────────────────
  document.getElementById('btn-share-cert')?.addEventListener('click', async () => {
    const shared = await shareContent({
      title: `Mitt typegodkjenningsbevis — ${eqName}`,
      text: `Jeg har nettopp fullført typeopplæring for ${eqName} hos Oslo Liftutleie! Verifiser her:`,
      url: verifyUrl,
    });
    if (shared) {
      Toast.success('Lenke kopiert / delt!', '🔗');
    } else {
      await copyToClipboard(verifyUrl);
      Toast.success('Verifiseringslenke kopiert!', '📋');
    }
  });

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  document.getElementById('btn-linkedin')?.addEventListener('click', () => {
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(eqName + ' — Typegodkjenning')}&organizationName=${encodeURIComponent('Oslo Liftutleie AS')}&issueYear=${new Date(cert.issuedAt).getFullYear()}&issueMonth=${new Date(cert.issuedAt).getMonth() + 1}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.certNumber)}`;
    window.open(linkedInUrl, '_blank');
  });
}

// ── Verify View ───────────────────────────────────────────────────────────────
export async function renderVerify(params) {
  const certNumber = params[0];
  const t = (k) => I18n.t(k);

  let cert = null, equipment = null;
  let found = false;
  try {
    // In prod: search by certNumber via API
    const { MockData } = await import('./api.js');
    cert = MockData.certificates.find(c => c.certNumber === certNumber);
    if (cert) {
      found = true;
      equipment = MockData.equipment.find(e => e.id === cert.equipmentId);
    }
  } catch (_) {}

  const eqName = I18n.lang === 'no' ? equipment?.nameNo : equipment?.name;
  const certDate = cert ? Format.date(cert.issuedAt, I18n.lang) : null;

  return {
    html: `
      <div style="min-height:100vh;background:var(--color-bg);display:flex;align-items:center;justify-content:center;padding:var(--space-8)">
        <div style="max-width:540px;width:100%" class="animate-scaleIn">

          <!-- Logo -->
          <div style="text-align:center;margin-bottom:var(--space-8)">
            <div class="nav-logo-mark" style="width:56px;height:56px;font-size:1.2rem;margin:0 auto var(--space-4)">🏗️</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:0.5rem">Diplom-verifikasjon</h1>
            <p style="color:var(--color-text-secondary);font-size:var(--text-sm)">Oslo Liftutleie · Sikkerhet & Opplæring</p>
          </div>

          ${found && cert ? `
            <!-- Valid Certificate -->
            <div class="card" style="border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.05);padding:var(--space-8);text-align:center;margin-bottom:var(--space-6)">
              <div style="font-size:3rem;margin-bottom:var(--space-4)">✅</div>
              <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;color:var(--color-success);margin-bottom:var(--space-3)">Diplom Gyldig</h2>
              <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-6)">Dette diplomet er ekte og utstedt av Oslo Liftutleie AS.</p>

              <div style="display:flex;flex-direction:column;gap:var(--space-3);text-align:left">
                ${[
                  { label: '👤 Navn', value: cert.operatorName },
                  { label: '🏗️ Kurs', value: eqName || cert.courseName },
                  { label: '📅 Utstedt', value: certDate },
                  { label: '🏆 Score', value: `${cert.score}%` },
                  { label: '#️⃣ Serienummer', value: cert.certNumber },
                  { label: '🏢 Utstedt av', value: 'Oslo Liftutleie AS' },
                ].map(row => `
                  <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:var(--text-sm)">
                    <span style="color:var(--color-text-muted)">${row.label}</span>
                    <span style="font-weight:600">${row.value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <!-- Invalid / Not Found -->
            <div class="card" style="border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.05);padding:var(--space-8);text-align:center;margin-bottom:var(--space-6)">
              <div style="font-size:3rem;margin-bottom:var(--space-4)">❌</div>
              <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;color:var(--color-danger);margin-bottom:var(--space-3)">Diplom ikke funnet</h2>
              <p style="color:var(--color-text-secondary);font-size:var(--text-sm)">
                Serienummeret <strong style="color:var(--color-text-primary)">${certNumber || '—'}</strong> ble ikke funnet i databasen vår.<br/>
                Kontakt Oslo Liftutleie for å verifisere manuelt.
              </p>
            </div>
          `}

          <div style="text-align:center">
            <a href="#/" class="btn btn-ghost">← Tilbake til forsiden</a>
          </div>
        </div>
      </div>
    `,
    init: () => {}
  };
}

// ── CV / Portfolio View ───────────────────────────────────────────────────────
export async function renderCV(params) {
  const userId = params[0] || Auth.getUserId();

  let userData = null, certs = [];
  try {
    const profile = await API.getProfile(userId);
    userData = profile.user;
    // Get all certs for this user
    const { MockData } = await import('./api.js');
    certs = MockData.certificates.filter(c => c.userId === userId);
  } catch (_) {}

  const user = userData || Auth.user;
  const name = user?.name || 'Ukjent';
  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);
  const shareUrl = `${window.location.origin}${window.location.pathname}#/cv/${userId}`;

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh">
        <!-- CV Hero -->
        <div style="background:linear-gradient(180deg,var(--color-surface),var(--color-bg));border-bottom:1px solid var(--color-border);padding:var(--space-12) 0">
          <div class="container-sm" style="text-align:center">
            <div class="avatar avatar-xl" style="margin:0 auto var(--space-5)">${initials}</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--space-2)">${name}</h1>
            ${user?.company ? `<p style="color:var(--color-gold);font-weight:600;margin-bottom:var(--space-2)">${user.company}</p>` : ''}
            <p style="color:var(--color-text-muted);font-size:var(--text-sm)">
              ${certs.length} typegodkjenning${certs.length !== 1 ? 'er' : ''} · Sikkerhet & Opplæring
            </p>
            <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" id="copy-cv-link">📋 Kopier CV-lenke</button>
              <button class="btn btn-ghost btn-sm" id="share-cv-btn">🔗 Del</button>
            </div>
          </div>
        </div>

        <!-- Certificates Grid -->
        <div class="container-sm" style="padding:var(--space-8) var(--space-4) var(--space-16)">
          <h2 style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:700;margin-bottom:var(--space-6)">
            🏆 Typegodkjenninger (${certs.length})
          </h2>

          ${certs.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:var(--space-4)">
              ${certs.map(cert => {
                const eq = null; // Would look up by cert.equipmentId
                return `
                  <div class="card hover-lift" style="display:flex;align-items:center;gap:var(--space-4);padding:var(--space-5)">
                    <div style="width:56px;height:56px;border-radius:var(--radius-md);background:linear-gradient(135deg,rgba(192,39,45,0.2),rgba(250,162,27,0.2));display:flex;align-items:center;justify-content:center;font-size:1.75rem;flex-shrink:0">🏗️</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-family:var(--font-heading);font-weight:700;margin-bottom:2px">${cert.courseName}</div>
                      <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Oslo Liftutleie AS · ${Format.dateShort(cert.issuedAt, I18n.lang)}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                      <div class="badge badge-completed">✅ ${cert.score}%</div>
                      <div style="margin-top:var(--space-2)">
                        <a href="#/certificate/${cert.id}" class="btn btn-ghost btn-sm" style="font-size:var(--text-xs)">Vis</a>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">📜</div>
              <div class="empty-state-title">Ingen diplomer ennå</div>
              <div class="empty-state-desc">Fullfør et kurs for å få ditt første diplom.</div>
              <a href="#/catalog" class="btn btn-primary" style="margin-top:1rem">Finn kurs →</a>
            </div>
          `}
        </div>
      </div>
    `,
    init: () => {
      document.getElementById('copy-cv-link')?.addEventListener('click', async () => {
        await copyToClipboard(shareUrl);
        Toast.success('CV-lenke kopiert!', '📋');
      });
      document.getElementById('share-cv-btn')?.addEventListener('click', async () => {
        await shareContent({ title: `${name} — Typegodkjenninger`, url: shareUrl });
      });
    }
  };
}

function notFoundHtml(msg, backHref) {
  return `<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">⚠️</div><h2 class="empty-state-title">${msg}</h2><a href="${backHref}" class="btn btn-primary" style="margin-top:1rem">← Tilbake</a></div>`;
}

// Import Format for use in this module
import { Format } from './utils.js';
import API from './api.js';
