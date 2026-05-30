/**
 * checklist.js — Pre-Use Daily Inspection Checklist (Phase 9)
 * Typeopplæring.no Safety Training Platform
 * Touch-optimized daily safety check with offline queuing and camera photos
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store } from './utils.js';

export async function renderChecklist(params) {
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;
  const equipmentId = params[0];

  if (!Auth.isLoggedIn()) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">🔒</div>
          <h2>Logg inn påkrevd</h2>
          <p>Du må være logget inn for å gjennomføre forhåndskontroll.</p>
          <a href="#/login" class="btn btn-primary">Logg inn</a>
        </div>`,
      init: () => {}
    };
  }

  let equipment = null;
  try {
    equipment = await API.getEquipmentById(equipmentId);
  } catch (err) {
    return {
      html: `
        <div class="empty-state" style="min-height:80vh">
          <div class="empty-state-icon">⚠️</div>
          <h2>Maskin ikke funnet</h2>
          <a href="#/catalog" class="btn btn-primary">Til Kurskatalogen</a>
        </div>`,
      init: () => {}
    };
  }

  const name = lang === 'no' ? equipment.nameNo : equipment.name;

  // Checklist items
  const checkItems = [
    { id: 'item_battery', label: 'Batterinivå, lading og væsker', labelEn: 'Battery level, charging & fluids' },
    { id: 'item_wheels', label: 'Dekk, hjul, støtteben og bremser', labelEn: 'Tires, wheels, outriggers & brakes' },
    { id: 'item_estop', label: 'Nødstopp og sikkerhetsbrytere', labelEn: 'Emergency stop & safety switches' },
    { id: 'item_hydraulics', label: 'Hydraulikk, sylindere og slanger', labelEn: 'Hydraulics, cylinders & hoses' },
    { id: 'item_structure', label: 'Rekkverk, låser og strukturell integritet', labelEn: 'Handrails, locks & structural integrity' },
    { id: 'item_harness', label: 'Fallsikringsutstyr og forankringspunkter', labelEn: 'Harness gear & anchoring points' }
  ];

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding-bottom:var(--space-16)">
        <div class="container-sm" style="padding-top:var(--space-8)">
          <div class="card animate-fadeInUp" style="margin-bottom:var(--space-6)">
            <div class="card-body" style="padding:var(--space-5)">
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:var(--space-3)">
                <div style="font-size:2rem">🛠️</div>
                <div>
                  <div style="font-size:var(--text-xxs);color:var(--color-text-muted);font-family:monospace;">DAGLIG FORHÅNDSKONTROLL</div>
                  <h2 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:800;margin:0">${name}</h2>
                </div>
              </div>
              <p style="color:var(--color-text-secondary);font-size:var(--text-xs);line-height:1.6;margin:0">
                Gå gjennom punktene under før du starter maskinen. Eventuelle avvik må registreres med foto og beskrivelse.
              </p>
            </div>
          </div>

          <!-- Checklist Form -->
          <form class="animate-fadeInUp delay-100" id="safety-checklist-form">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-bottom:var(--space-6)">
              ${checkItems.map((item, idx) => `
                <div class="card checklist-card" style="padding:var(--space-4)" id="card-${item.id}">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
                    <div style="flex:1;min-width:200px">
                      <div style="font-family:var(--font-heading);font-size:var(--text-sm);font-weight:700">${lang === 'no' ? item.label : item.labelEn}</div>
                    </div>
                    <div style="display:flex;gap:0.5rem;align-items:center">
                      <label style="display:flex;align-items:center;gap:0.25rem;cursor:pointer;font-size:var(--text-xs);font-weight:600;color:var(--color-success)">
                        <input type="radio" name="status-${item.id}" value="ok" checked style="accent-color:var(--color-success)" class="check-radio" data-id="${item.id}" />
                        OK
                      </label>
                      <label style="display:flex;align-items:center;gap:0.25rem;cursor:pointer;font-size:var(--text-xs);font-weight:600;color:var(--color-danger);margin-left:0.5rem">
                        <input type="radio" name="status-${item.id}" value="defect" style="accent-color:var(--color-danger)" class="check-radio" data-id="${item.id}" />
                        AVVIK
                      </label>
                    </div>
                  </div>

                  <!-- Defect Description Box (Hidden by default) -->
                  <div id="defect-box-${item.id}" style="display:none;margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--color-border)">
                    <div class="form-group" style="margin:0">
                      <label class="form-label" style="font-size:var(--text-xxs);color:var(--color-danger)">Beskriv feilen / avviket:</label>
                      <textarea id="desc-${item.id}" class="form-input" style="height:70px;font-size:var(--text-xs)" placeholder="Hva er feil med denne delen? e.g. oljelekkasje, sprukket rekkverk..."></textarea>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Photos Upload Card -->
            <div class="card" style="padding:var(--space-5);margin-bottom:var(--space-6)">
              <h3 style="font-family:var(--font-heading);font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-3)">📸 Last opp bilder av avvik (valgfritt)</h3>
              <p style="color:var(--color-text-secondary);font-size:var(--text-xs);line-height:1.5;margin-bottom:var(--space-4)">
                Om du fant skader eller avvik, ta bilder med mobilkameraet ditt slik at Oslo Liftutleie depotet kan reparere det raskt.
              </p>

              <!-- Photo Previews Grid -->
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:var(--space-4)" id="photo-preview-grid">
                <!-- Injected thumbnails -->
              </div>

              <!-- Real HTML5 file input simulated premiumly -->
              <div style="position:relative">
                <input type="file" id="checklist-camera-input" accept="image/*" multiple style="display:none" />
                <button type="button" class="btn btn-ghost btn-block" id="checklist-upload-btn">
                  📷 Legg til bilde (Max 3)
                </button>
              </div>
            </div>

            <!-- Big Submit Buttons -->
            <div id="danger-alert-box" class="card" style="display:none;border-left:4px solid var(--color-danger);padding:var(--space-4);margin-bottom:var(--space-6);background:rgba(231,76,60,0.05)">
              <div style="display:flex;gap:0.5rem;align-items:center;color:var(--color-danger);font-weight:700;font-size:var(--text-sm)">
                <span>🚫</span>
                <span>AVVIK OPPDAGET: Bruk IKKE maskinen før skadene er klarert!</span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg hover-glow-red" id="submit-checklist-btn">
              ✓ Fullfør og lagre kontroll
            </button>
          </form>
        </div>
      </div>
    `,
    init: () => initChecklistHandlers(equipment, checkItems)
  };
}

function initChecklistHandlers(equipment, checkItems) {
  const form = document.getElementById('safety-checklist-form');
  const fileInput = document.getElementById('checklist-camera-input');
  const uploadBtn = document.getElementById('checklist-upload-btn');
  const previewGrid = document.getElementById('photo-preview-grid');
  const dangerBox = document.getElementById('danger-alert-box');

  const photosList = []; // Stores base64 strings of uploaded photos

  // Handle radio toggle changes
  document.querySelectorAll('.check-radio').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const itemId = radio.dataset.id;
      const val = radio.value;
      const defectBox = document.getElementById(`defect-box-${itemId}`);
      const parentCard = document.getElementById(`card-${itemId}`);

      if (val === 'defect') {
        if (defectBox) defectBox.style.display = 'block';
        if (parentCard) {
          parentCard.style.borderLeft = '3px solid var(--color-danger)';
          parentCard.style.background = 'rgba(231, 76, 60, 0.02)';
        }
      } else {
        if (defectBox) defectBox.style.display = 'none';
        if (parentCard) {
          parentCard.style.borderLeft = 'none';
          parentCard.style.background = '';
        }
      }

      // Check if any defect is selected across all radios to show block warn box
      checkTotalSafetyStatus();
    });
  });

  function checkTotalSafetyStatus() {
    let hasDefect = false;
    document.querySelectorAll('.check-radio:checked').forEach(r => {
      if (r.value === 'defect') hasDefect = true;
    });

    if (dangerBox) {
      dangerBox.style.display = hasDefect ? 'block' : 'none';
    }
  }

  // Camera upload triggers
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      if (photosList.length >= 3) {
        Toast.warning('Du kan maksimalt laste opp 3 bilder.', 'Maksgrense nådd');
        return;
      }
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (!files.length) return;

      Array.from(files).forEach(file => {
        if (photosList.length >= 3) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          photosList.push(base64);
          renderPhotoPreviews();
        };
        reader.readAsDataURL(file);
      });
      
      fileInput.value = ''; // Reset
    });
  }

  function renderPhotoPreviews() {
    if (!previewGrid) return;
    previewGrid.innerHTML = photosList.map((photo, idx) => `
      <div style="width:70px;height:70px;border-radius:var(--radius-md);overflow:hidden;position:relative;border:1px solid var(--color-border)">
        <img src="${photo}" style="width:100%;height:100%;object-fit:cover" />
        <span class="remove-photo-btn" data-idx="${idx}" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;cursor:pointer">✕</span>
      </div>
    `).join('');

    // Re-attach delete handlers
    document.querySelectorAll('.remove-photo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        photosList.splice(idx, 1);
        renderPhotoPreviews();
      });
    });
  }

  // Form submission with offline fallback queue
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const itemsStatus = {};
      let hasDefects = false;

      checkItems.forEach(item => {
        const val = form.querySelector(`input[name="status-${item.id}"]:checked`).value;
        const desc = document.getElementById(`desc-${item.id}`).value.trim();
        itemsStatus[item.id] = { status: val, desc: val === 'defect' ? desc : '' };
        if (val === 'defect') hasDefects = true;
      });

      const submissionData = {
        equipmentId: equipment.id,
        equipmentName: equipment.nameNo,
        operatorId: Auth.user.id,
        operatorName: Auth.user.name,
        statuses: itemsStatus,
        hasDefects,
        photos: photosList,
        timestamp: new Date().toISOString()
      };

      // Check online status
      if (!navigator.onLine) {
        // Queuing offline!
        const offlineQueue = Store.get('offline_checklists') || [];
        offlineQueue.push(submissionData);
        Store.set('offline_checklists', offlineQueue);
        
        Toast.warning('Lagret offline! Sjekklisten sendes automatisk når internett er tilbake.', '📴 Jobber offline');
        
        // Register offline sync event
        registerOfflineSyncListener();

        // Redirect back to profile after short delay
        setTimeout(() => {
          window.location.hash = '#/profile';
        }, 1500);

      } else {
        // Online post
        try {
          Toast.info('Sender inn sikkerhetskontroll...');
          await API.submitChecklist(submissionData);

          if (hasDefects) {
            Toast.error('AVVIK REGISTRERT: Utstyrsdepotet er varslet. Maskinen skal IKKE startes.', 'Forhåndskontroll');
          } else {
            Toast.success('Kontroll fullført og godkjent. Maskinen kan trygt betjenes.', 'Godkjent');
          }

          // Redirect
          setTimeout(() => {
            window.location.hash = `#/qr/${equipment.qrCode}`;
          }, 1500);

        } catch (err) {
          Toast.error('Klarte ikke sende sjekkliste: ' + err.message);
        }
      }
    });
  }
}

// Background offline sync queue processing
function registerOfflineSyncListener() {
  const syncHandler = async () => {
    const queue = Store.get('offline_checklists') || [];
    if (queue.length === 0) {
      window.removeEventListener('online', syncHandler);
      return;
    }

    Toast.info('Koblet til internett! Synkroniserer sikkerhetsrapporter...');

    for (let i = 0; i < queue.length; i++) {
      try {
        await API.submitChecklist(queue[i]);
      } catch (err) {
        console.warn('Sync failed for checklist item', i, err);
      }
    }

    Store.remove('offline_checklists');
    Toast.success('Alle offline sikkerhetskontroller har blitt synkronisert med suksess!', '🛡️ HMS Synkronisert');
    window.removeEventListener('online', syncHandler);
  };

  window.addEventListener('online', syncHandler);
}
