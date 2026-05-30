/**
 * qr.js — QR Scan Landing & Validation (Phase 9)
 * Typeopplæring.no Safety Training Platform
 * Scanned from physical machinery tags (OL-EQ-XXXX format)
 */

import API, { MockData } from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store } from './utils.js';

export async function renderQR(params) {
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;
  const qrCode = params[0];

  if (!qrCode) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">📱</div>
          <h2>Ugyldig skanning</h2>
          <p>Ingen QR-kode ble oppgitt. Vennligst skann en fysisk maskintag fra Oslo Liftutleie.</p>
          <a href="#/catalog" class="btn btn-primary" style="margin-top:1rem">Vis maskinkatalog</a>
        </div>`,
      init: () => {}
    };
  }

  let equipment = null;
  try {
    equipment = await API.getEquipmentByQR(qrCode);
  } catch (err) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">⚠️</div>
          <h2>Maskin ikke funnet</h2>
          <p>Kunne ikke finne utstyr knyttet til koden <strong>${qrCode}</strong>.</p>
          <a href="#/catalog" class="btn btn-primary" style="margin-top:1rem">Til Kurskatalogen</a>
        </div>`,
      init: () => {}
    };
  }

  const name = lang === 'no' ? equipment.nameNo : equipment.name;
  const desc = lang === 'no' ? equipment.description : equipment.descriptionEn;
  const isLoggedIn = Auth.isLoggedIn();

  // Determine enrollment / certification status
  let certStatus = 'guest'; // guest, not_enrolled, reading, awaiting_sig, certified
  let enrollment = null;
  let cert = null;

  if (isLoggedIn) {
    certStatus = 'not_enrolled';
    // Fetch profile to check enrollments for this equipment
    try {
      const profile = await API.getProfile(Auth.user.id);
      const enr = (profile.enrollments || []).find(e => e.equipmentId === equipment.id);
      if (enr) {
        enrollment = enr;
        if (enr.status === 'certified') {
          certStatus = 'certified';
          cert = (profile.certificates || []).find(c => c.enrollmentId === enr.id);
        } else if (enr.status === 'awaiting_signature' || enr.status === 'awaiting_oslo_sig') {
          certStatus = 'awaiting_sig';
        } else {
          certStatus = 'reading';
        }
      }
    } catch (err) {
      console.warn('Could not inspect certification status:', err);
    }
  }

  // Render status specific elements
  let statusCardHtml = '';
  if (certStatus === 'guest') {
    statusCardHtml = `
      <div class="card" style="border-top:4px solid var(--color-primary);padding:var(--space-6);margin-bottom:var(--space-6)">
        <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🔒</div>
        <h3 style="font-family:var(--font-heading);font-weight:700;margin:0 0 var(--space-2)">Logg inn for å verifisere</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm);line-height:1.5;margin-bottom:var(--space-4)">
          Du må logge inn eller opprette en profil for å sjekke om du har gyldig sertifisering på denne maskinen.
        </p>
        <div style="display:flex;gap:0.5rem">
          <a href="#/login" class="btn btn-primary btn-sm" style="flex:1;text-align:center">Logg inn</a>
          <a href="#/register" class="btn btn-ghost btn-sm" style="flex:1;text-align:center">Opprett konto</a>
        </div>
      </div>
    `;
  } else if (certStatus === 'not_enrolled') {
    statusCardHtml = `
      <div class="card" style="border-top:4px solid var(--color-primary);padding:var(--space-6);margin-bottom:var(--space-6)">
        <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🚫</div>
        <h3 style="font-family:var(--font-heading);font-weight:800;color:var(--color-primary);margin:0 0 var(--space-2)">Ikke typegodkjent</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm);line-height:1.5;margin-bottom:var(--space-5)">
          Du har ikke registrert typegodkjenning for denne maskinen. Norske HMS-forskrifter krever dokumentert opplæring før bruk.
        </p>
        <a href="#/payment/${equipment.id}" class="btn btn-primary btn-block hover-glow-red">
          🚀 Meld på kurs (299 NOK)
        </a>
      </div>
    `;
  } else if (certStatus === 'reading') {
    statusCardHtml = `
      <div class="card" style="border-top:4px solid var(--color-warning);padding:var(--space-6);margin-bottom:var(--space-6)">
        <div style="font-size:2.5rem;margin-bottom:var(--space-3)">⏳</div>
        <h3 style="font-family:var(--font-heading);font-weight:800;color:var(--color-warning);margin:0 0 var(--space-2)">Opplæring pågår</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4)">
          Du er meldt på kurset og har fullført <strong>${enrollment.progress}%</strong> av sikkerhetsmanualen.
        </p>
        
        <div style="background:rgba(0,0,0,0.06);height:6px;border-radius:3px;overflow:hidden;margin-bottom:var(--space-5)">
          <div style="background:var(--gradient-gold);width:${enrollment.progress}%;height:100%"></div>
        </div>

        <a href="#/course/${enrollment.id}" class="btn btn-primary btn-block">
          📖 Fortsett opplæringen
        </a>
      </div>
    `;
  } else if (certStatus === 'awaiting_sig') {
    statusCardHtml = `
      <div class="card" style="border-top:4px solid var(--color-gold);padding:var(--space-6);margin-bottom:var(--space-6)">
        <div style="font-size:2.5rem;margin-bottom:var(--space-3)">✍️</div>
        <h3 style="font-family:var(--font-heading);font-weight:800;color:var(--color-gold);margin:0 0 var(--space-2)">Mangler signering</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-5)">
          Du har bestått sikkerhetstesten! ${enrollment.status === 'awaiting_signature' ? 'Signer digitalt for å motta beviset ditt.' : 'Venter på representant-countersignering.'}
        </p>
        ${enrollment.status === 'awaiting_signature' ? `
          <a href="#/sign/${enrollment.id}" class="btn btn-primary btn-block hover-glow-red">
            ✍️ Gå til signering
          </a>
        ` : `
          <div class="badge badge-gray btn-block" style="text-align:center;padding:0.5rem">Awaiting Oslo Lift review</div>
        `}
      </div>
    `;
  } else if (certStatus === 'certified') {
    statusCardHtml = `
      <div class="card card-premium" style="border-top:4px solid var(--color-success);padding:var(--space-6);margin-bottom:var(--space-6);background:linear-gradient(180deg, var(--color-surface), #fff)">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:var(--space-3)">
          <div style="font-size:2.8rem">🎖️</div>
          <div class="badge badge-success" style="padding:0.25rem 0.5rem">GODKJENT OPERATØR</div>
        </div>
        <h3 style="font-family:var(--font-heading);font-weight:900;color:var(--color-success);margin:0 0 var(--space-2);font-size:var(--text-lg)">Typegodkjent ✓</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm);line-height:1.5;margin-bottom:var(--space-5)">
          Du har gyldig og fullført dokumentert sikkerhetsopplæring på <strong>${name}</strong> utstedt av Oslo Liftutleie.
        </p>
        
        <div style="display:flex;gap:0.5rem">
          <a href="#/certificate/${enrollment.certId}" class="btn btn-ghost btn-sm" style="flex:1;text-align:center">🏆 Vis Diplom</a>
          <a href="#/checklist/${equipment.id}" class="btn btn-primary btn-sm hover-glow-red" style="flex:1.2;text-align:center">🛠️ Forhåndskontroll</a>
        </div>
      </div>
    `;
  }

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding-bottom:var(--space-16)">
        <div class="container-sm" style="padding-top:var(--space-8)">
          <!-- Scanned Equipment Image -->
          <div class="card animate-fadeInUp" style="overflow:hidden;margin-bottom:var(--space-6)">
            <div style="height:200px;position:relative;overflow:hidden">
              <img src="${equipment.image}" alt="${name}" style="width:100%;height:100%;object-fit:cover" />
              <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(11,22,35,0.85), transparent)"></div>
              <div style="position:absolute;bottom:var(--space-3);left:var(--space-4)">
                <span class="badge badge-gold" style="font-size:var(--text-xxs)">${equipment.subcategory}</span>
              </div>
            </div>
            <div class="card-body" style="padding:var(--space-5)">
              <div style="font-size:var(--text-xxs);color:var(--color-text-muted);font-family:monospace;margin-bottom:0.25rem">SKANNET MASKINTAG · ${equipment.qrCode}</div>
              <h2 style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:800;margin:0 0 0.5rem">${name}</h2>
              <p style="color:var(--color-text-secondary);font-size:var(--text-xs);line-height:1.6;margin-bottom:var(--space-4)">${desc}</p>
              
              <!-- Quick specs -->
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;background:var(--color-surface);padding:0.5rem;border-radius:var(--radius-md);text-align:center">
                <div>
                  <div style="font-size:0.55rem;color:var(--color-text-muted);text-transform:uppercase">Høyde</div>
                  <div style="font-size:var(--text-xs);font-weight:700;color:var(--color-gold)">${equipment.workHeight || 'N/A'}</div>
                </div>
                <div>
                  <div style="font-size:0.55rem;color:var(--color-text-muted);text-transform:uppercase">Vekt</div>
                  <div style="font-size:var(--text-xs);font-weight:700">${equipment.weight}</div>
                </div>
                <div>
                  <div style="font-size:0.55rem;color:var(--color-text-muted);text-transform:uppercase">Manual</div>
                  <div style="font-size:var(--text-xs);font-weight:700">${equipment.manualPages} s</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Status Card -->
          <div class="animate-fadeInUp delay-100">
            ${statusCardHtml}
          </div>

          <!-- Daily pre-use safety checklist info (Social proof / instruction) -->
          <div class="card animate-fadeInUp delay-200" style="padding:var(--space-5)">
            <h3 style="font-family:var(--font-heading);font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-3)">💡 Hva er daglig forhåndskontroll?</h3>
            <p style="color:var(--color-text-secondary);font-size:var(--text-xs);line-height:1.6;margin:0 0 var(--space-3)">
              Forhåndskontrollen sikrer at maskinen er i fullverdig teknisk stand før arbeidsdagen starter. Gjennomgang tar 2-3 minutter, og avvik varsler depotet direkte med mulighet for foto-opplasting.
            </p>
            <div style="font-size:var(--text-xxs);color:var(--color-text-muted);display:flex;align-items:center;gap:0.25rem">
              🛡️ Lovpålagt ansvar etter *Arbeidsmiljøloven*
            </div>
          </div>
        </div>
      </div>
    `,
    init: () => {}
  };
}
