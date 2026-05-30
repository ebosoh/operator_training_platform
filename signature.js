/**
 * signature.js — Digital Signature Module (Phase 6)
 * Typeopplæring.no Safety Training Platform
 * Canvas-based, touch + mouse, cross-signing support
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, launchConfetti } from './utils.js';

export async function renderSignature(params) {
  const equipmentId = params[0];
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  let equipment = null, enrollment = null;
  try {
    equipment = await API.getEquipmentById(equipmentId);
    const userId = Auth.getUserId();
    if (userId) {
      const profile = await API.getProfile(userId);
      enrollment = profile.enrollments?.find(e => e.equipmentId === equipmentId) || null;
    }
  } catch (err) {
    console.warn('Sign load error:', err);
  }

  // Guard: must have passed assessment
  if (!enrollment || !['awaiting_signature', 'assessment_passed'].includes(enrollment.status) && enrollment.score === null) {
    return {
      html: `<div class="empty-state" style="min-height:80vh">
        <div class="empty-state-icon">🧪</div>
        <h2>Test ikke fullført</h2>
        <p class="empty-state-desc">Du må bestå sikkerhetstesten før signering.</p>
        <a href="#/assessment/${equipmentId}" class="btn btn-primary" style="margin-top:1rem">← Til test</a>
      </div>`,
      init: () => {}
    };
  }

  const eqName = lang === 'no' ? equipment?.nameNo : equipment?.name;
  const user = Auth.user;
  const isAdmin = Auth.isAdmin();
  const operatorSigned = enrollment.status === 'awaiting_oslo_sig' || enrollment.status === 'certified';
  const fullySigned = enrollment.status === 'certified';

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding:var(--space-8) 0 var(--space-16)">
        <div class="container-sm">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:var(--space-8)" class="animate-fadeInDown">
            <div class="section-label" style="justify-content:center">Trinn 3 av 3</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--space-3)">${t('sign.title')}</h1>
            <p style="color:var(--color-text-secondary)">${eqName}</p>
          </div>

          <!-- Signing Progress Steps -->
          <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-4);margin-bottom:var(--space-8)" class="animate-fadeInUp">
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <div style="width:36px;height:36px;border-radius:50%;background:${operatorSigned ? 'var(--color-success)' : 'var(--color-gold)'};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;color:#fff">
                ${operatorSigned ? '✓' : '1'}
              </div>
              <span style="font-size:var(--text-sm);font-weight:600;color:${operatorSigned ? 'var(--color-success)' : 'var(--color-gold)'}">Operatør</span>
            </div>
            <div style="flex:1;max-width:80px;height:2px;background:${operatorSigned ? 'var(--color-success)' : 'var(--color-border)'}"></div>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <div style="width:36px;height:36px;border-radius:50%;background:${fullySigned ? 'var(--color-success)' : (operatorSigned ? 'var(--color-gold)' : 'var(--color-border)')};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;color:#fff">
                ${fullySigned ? '✓' : '2'}
              </div>
              <span style="font-size:var(--text-sm);font-weight:600;color:${fullySigned ? 'var(--color-success)' : (operatorSigned ? 'var(--color-gold)' : 'var(--color-text-muted)')}">Oslo Liftutleie</span>
            </div>
          </div>

          ${fullySigned ? renderSigningComplete(enrollment, equipmentId) : ''}

          <!-- Operator Signature Section -->
          ${!operatorSigned ? `
          <div class="card animate-fadeInUp" id="operator-sign-card">
            <div class="card-header">
              <div>
                <h3 style="font-family:var(--font-heading);font-weight:700">✍️ ${t('sign.operator')}</h3>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px">${user?.name}</p>
              </div>
              <span class="badge badge-pending">Venter</span>
            </div>
            <div class="card-body" style="padding:var(--space-5)">
              <p style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-4)">
                Tegn signaturen din i feltet nedenfor med fingeren eller musen. Bekreft at du har lest og forstått sikkerhetsmanualen.
              </p>

              <!-- Signature Pad -->
              <div style="position:relative;border:2px dashed var(--color-border);border-radius:var(--radius-lg);background:rgba(255,255,255,0.02);overflow:hidden;transition:border-color 0.2s" id="sig-pad-wrapper">
                <canvas id="operator-sig-canvas"
                  style="display:block;width:100%;cursor:crosshair;touch-action:none"
                  width="600" height="200">
                </canvas>
                <div id="sig-placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:var(--text-sm);pointer-events:none">
                  ✍️ Tegn signaturen din her
                </div>
              </div>

              <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
                <button class="btn btn-ghost btn-sm" id="clear-op-sig">🗑️ ${t('sign.clear')}</button>
                <button class="btn btn-primary btn-sm" id="confirm-op-sig" style="flex:1" disabled>
                  ✅ ${t('sign.confirm')}
                </button>
              </div>

              <!-- Declaration -->
              <div style="margin-top:var(--space-4);padding:var(--space-4);background:rgba(250,162,27,0.05);border:1px solid rgba(250,162,27,0.2);border-radius:var(--radius-md)">
                <label class="form-checkbox" style="cursor:pointer">
                  <input type="checkbox" id="sign-declaration" />
                  <span class="checkbox-label" style="font-size:var(--text-xs)">
                    Jeg bekrefter at jeg har lest og forstått sikkerhetsmanualen for <strong>${eqName}</strong>, og at jeg er ansvarlig for trygg bruk av maskinen i henhold til forskrift om utførelse av arbeid.
                  </span>
                </label>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Awaiting Oslo Lift Signature -->
          ${operatorSigned && !fullySigned ? `
          <div class="card animate-scaleIn" id="awaiting-oslo-card">
            <div class="card-body" style="padding:var(--space-8);text-align:center">
              <div style="font-size:3rem;margin-bottom:var(--space-4);animation:pulse 2s infinite">⏳</div>
              <h3 style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-3)">${t('sign.awaiting')}</h3>
              <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-6)">
                Din signatur er registrert. En representant fra Oslo Liftutleie vil godkjenne og signere innen kort tid. Du vil motta en e-post med ditt diplom.
              </p>
              <div class="badge badge-gold" style="margin-bottom:var(--space-6);display:inline-flex">⏳ Venter på Oslo Liftutleie</div>
              <br/>
              <a href="#/profile" class="btn btn-ghost">Se mine kurs →</a>

              ${isAdmin ? `
              <div style="margin-top:var(--space-8);padding-top:var(--space-6);border-top:1px solid var(--color-border)">
                <h4 style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-4)">🔑 Oslo Liftutleie — Admin Godkjenning</h4>
                <div style="position:relative;border:2px dashed var(--color-border);border-radius:var(--radius-lg);background:rgba(255,255,255,0.02);overflow:hidden" id="admin-sig-pad-wrapper">
                  <canvas id="admin-sig-canvas" style="display:block;width:100%;cursor:crosshair;touch-action:none" width="600" height="180"></canvas>
                  <div id="admin-sig-placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:var(--text-sm);pointer-events:none">✍️ Oslo Liftutleie signatur</div>
                </div>
                <div style="display:flex;gap:var(--space-3);margin-top:var(--space-3)">
                  <button class="btn btn-ghost btn-sm" id="clear-admin-sig">🗑️ Slett</button>
                  <button class="btn btn-gold btn-sm" id="approve-btn" style="flex:1" disabled>🏆 Godkjenn og utsted diplom</button>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

        </div>
      </div>
    `,
    init: () => initSignatureHandlers({ enrollment, equipmentId, isAdmin, operatorSigned, fullySigned }),
  };
}

function renderSigningComplete(enrollment, equipmentId) {
  return `
    <div class="card card-premium animate-scaleIn" style="text-align:center;padding:var(--space-8);margin-bottom:var(--space-6)">
      <div style="font-size:4rem;margin-bottom:var(--space-4)">🏆</div>
      <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:900;margin-bottom:var(--space-3);color:var(--color-gold)">${I18n.t('sign.approved')}</h2>
      <p style="color:var(--color-text-secondary);margin-bottom:var(--space-6)">Begge signaturer er registrert. Ditt offisielle diplom er klart!</p>
      <a href="#/certificate/${enrollment?.certId || equipmentId}" class="btn btn-gold btn-xl btn-block hover-glow-gold">
        🏆 Se ditt diplom →
      </a>
    </div>
  `;
}

function initSignatureHandlers({ enrollment, equipmentId, isAdmin, operatorSigned, fullySigned }) {
  if (fullySigned) return; // Nothing to do

  // ── Operator Signature Pad ─────────────────────────────────────────────────
  if (!operatorSigned) {
    initSignaturePad({
      canvasId: 'operator-sig-canvas',
      placeholderId: 'sig-placeholder',
      wrapperId: 'sig-pad-wrapper',
      clearBtnId: 'clear-op-sig',
      confirmBtnId: 'confirm-op-sig',
      declarationId: 'sign-declaration',
      onConfirm: async (signatureBase64) => {
        const btn = document.getElementById('confirm-op-sig');
        if (btn) { btn.classList.add('loading'); btn.disabled = true; }
        try {
          await API.saveOperatorSignature(enrollment?.id || 'guest', signatureBase64);
          Toast.success('Din signatur er registrert!', '✅ Signert');
          // Reload view to show awaiting state
          setTimeout(() => { window.location.hash = `#/sign/${equipmentId}`; location.reload(); }, 1000);
        } catch (err) {
          Toast.error('Feil ved lagring av signatur. Prøv igjen.', 'Feil');
          if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        }
      }
    });
  }

  // ── Admin Cross-Signature Pad ──────────────────────────────────────────────
  if (operatorSigned && isAdmin) {
    initSignaturePad({
      canvasId: 'admin-sig-canvas',
      placeholderId: 'admin-sig-placeholder',
      wrapperId: 'admin-sig-pad-wrapper',
      clearBtnId: 'clear-admin-sig',
      confirmBtnId: 'approve-btn',
      declarationId: null, // no declaration needed for admin
      onConfirm: async (signatureBase64) => {
        const btn = document.getElementById('approve-btn');
        if (btn) { btn.classList.add('loading'); btn.disabled = true; }
        try {
          await API.saveOsloLiftSignature(enrollment?.id || 'guest', signatureBase64, Auth.user?.name);
          // Issue certificate
          const cert = await API.issueCertificate(enrollment?.id || 'guest');
          launchConfetti(5000);
          Toast.success('Diplom utstedt!', '🏆 Godkjent');
          setTimeout(() => { window.location.hash = `#/certificate/${cert.id}`; }, 1200);
        } catch (err) {
          Toast.error('Feil ved godkjenning. Prøv igjen.', 'Feil');
          if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        }
      }
    });
  }
}

// ── Signature Pad Engine ──────────────────────────────────────────────────────
function initSignaturePad({ canvasId, placeholderId, wrapperId, clearBtnId, confirmBtnId, declarationId, onConfirm }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let hasDrawn = false;
  let lastX = 0, lastY = 0;
  let declarationChecked = !declarationId;

  // Resize canvas to match display size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = (rect.height || 200) * scale;
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#FAA21B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  resizeCanvas();

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x; lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    // Hide placeholder
    const ph = document.getElementById(placeholderId);
    if (ph) ph.style.display = 'none';
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x; lastY = pos.y;
    if (!hasDrawn) {
      hasDrawn = true;
      updateConfirmButton();
      // Highlight wrapper
      const wrapper = document.getElementById(wrapperId);
      if (wrapper) wrapper.style.borderColor = 'var(--color-gold)';
    }
  }

  function endDraw() {
    isDrawing = false;
    ctx.closePath();
  }

  // Mouse events
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  // Touch events
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw);

  // Clear button
  document.getElementById(clearBtnId)?.addEventListener('click', () => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasDrawn = false;
    updateConfirmButton();
    const ph = document.getElementById(placeholderId);
    if (ph) ph.style.display = 'flex';
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) wrapper.style.borderColor = 'var(--color-border)';
  });

  // Declaration checkbox
  if (declarationId) {
    document.getElementById(declarationId)?.addEventListener('change', (e) => {
      declarationChecked = e.target.checked;
      updateConfirmButton();
    });
  }

  function updateConfirmButton() {
    const btn = document.getElementById(confirmBtnId);
    if (btn) btn.disabled = !(hasDrawn && declarationChecked);
  }

  // Confirm button
  document.getElementById(confirmBtnId)?.addEventListener('click', async () => {
    if (!hasDrawn) return;
    const signatureBase64 = canvas.toDataURL('image/png');
    if (onConfirm) await onConfirm(signatureBase64);
  });
}
