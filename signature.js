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
        <h2>${t('sign.not_completed')}</h2>
        <p class="empty-state-desc">${t('sign.not_completed_desc')}</p>
        <a href="#/assessment/${equipmentId}" class="btn btn-primary" style="margin-top:1rem">${t('sign.btn_to_test')}</a>
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
            <div class="section-label" style="justify-content:center">${t('sign.step_indicator')}</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--space-3)">${t('sign.title')}</h1>
            <p style="color:var(--color-text-secondary)">${eqName}</p>
          </div>

          <!-- Signing Progress Steps -->
          <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-4);margin-bottom:var(--space-8)" class="animate-fadeInUp">
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <div style="width:36px;height:36px;border-radius:50%;background:${operatorSigned ? 'var(--color-success)' : 'var(--color-gold)'};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;color:#fff">
                ${operatorSigned ? '✓' : '1'}
              </div>
              <span style="font-size:var(--text-sm);font-weight:600;color:${operatorSigned ? 'var(--color-success)' : 'var(--color-gold)'}">${t('cert.template.operator')}</span>
            </div>
            <div style="flex:1;max-width:80px;height:2px;background:${operatorSigned ? 'var(--color-success)' : 'var(--color-border)'}"></div>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              <div style="width:36px;height:36px;border-radius:50%;background:${fullySigned ? 'var(--color-success)' : (operatorSigned ? 'var(--color-gold)' : 'var(--color-border)')};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;color:#fff">
                ${fullySigned ? '✓' : '2'}
              </div>
              <span style="font-size:var(--text-sm);font-weight:600;color:${fullySigned ? 'var(--color-success)' : (operatorSigned ? 'var(--color-gold)' : 'var(--color-text-muted)')}">${t('cert.oslo_lift_sig')}</span>
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
              <span class="badge badge-pending">${t('sign.status.waiting')}</span>
            </div>
            <div class="card-body" style="padding:var(--space-5)">
              <p style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-4)">
                ${t('sign.pad_instructions')}
              </p>

              <!-- Signature Pad -->
              <div style="position:relative;border:2px dashed var(--color-border);border-radius:var(--radius-lg);background:rgba(255,255,255,0.02);overflow:hidden;transition:border-color 0.2s" id="sig-pad-wrapper">
                <canvas id="operator-sig-canvas"
                  style="display:block;width:100%;cursor:crosshair;touch-action:none"
                  width="600" height="200">
                </canvas>
                <div id="sig-placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:var(--text-sm);pointer-events:none">
                  ${t('sign.draw_here')}
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
                    ${t('sign.declaration_text').replace('{{name}}', eqName)}
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
                ${t('sign.awaiting_desc')}
              </p>
              <div class="badge badge-gold" style="margin-bottom:var(--space-6);display:inline-flex">${t('sign.awaiting_badge')}</div>
              <br/>
              <a href="#/profile" class="btn btn-ghost">${t('sign.btn_my_courses')}</a>
 
              ${isAdmin ? `
              <div style="margin-top:var(--space-8);padding-top:var(--space-6);border-top:1px solid var(--color-border)">
                <h4 style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-4)">${t('sign.admin_auth')}</h4>
                <div style="position:relative;border:2px dashed var(--color-border);border-radius:var(--radius-lg);background:rgba(255,255,255,0.02);overflow:hidden" id="admin-sig-pad-wrapper">
                  <canvas id="admin-sig-canvas" style="display:block;width:100%;cursor:crosshair;touch-action:none" width="600" height="180"></canvas>
                  <div id="admin-sig-placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:var(--text-sm);pointer-events:none">${t('sign.admin_placeholder')}</div>
                </div>
                <div style="display:flex;gap:var(--space-3);margin-top:var(--space-3)">
                  <button class="btn btn-ghost btn-sm" id="clear-admin-sig">${t('sign.admin_btn_clear')}</button>
                  <button class="btn btn-gold btn-sm" id="approve-btn" style="flex:1" disabled>${t('sign.admin_btn_approve')}</button>
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
      <p style="color:var(--color-text-secondary);margin-bottom:var(--space-6)">${I18n.t('sign.complete_desc')}</p>
      <a href="#/certificate/${enrollment?.certId || equipmentId}" class="btn btn-gold btn-xl btn-block hover-glow-gold">
        ${I18n.t('sign.complete_btn_cert')}
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
          Toast.success(I18n.t('sign.toast_signed'), I18n.lang === 'no' ? '✅ Signert' : '✅ Signed');
          // Reload view to show awaiting state
          setTimeout(() => { window.location.hash = `#/sign/${equipmentId}`; location.reload(); }, 1000);
        } catch (err) {
          Toast.error(I18n.t('sign.toast_error'), I18n.lang === 'no' ? 'Feil' : 'Error');
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
          Toast.success(I18n.t('sign.toast_approved'), I18n.lang === 'no' ? '🏆 Godkjent' : '🏆 Approved');
          setTimeout(() => { window.location.hash = `#/certificate/${cert.id}`; }, 1200);
        } catch (err) {
          Toast.error(I18n.t('sign.toast_approve_error'), I18n.lang === 'no' ? 'Feil' : 'Error');
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
    const width = rect.width || canvas.width || 600;
    const height = rect.height || canvas.height || 200;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#FAA21B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  resizeCanvas();

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e) {
    if (e.cancelable) e.preventDefault();
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
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
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
