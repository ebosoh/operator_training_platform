/**
 * payment.js — Payment Flow (Phase 5)
 * Typeopplæring.no Safety Training Platform
 * GitHub Pages hosted — mock payment, ready for Stripe/Vipps integration
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Store, Toast, Validate } from './utils.js';

export async function renderPayment(params) {
  const equipmentId = params[0];
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  if (!equipmentId) {
    return { html: '<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">⚠️</div><h2>Ugyldig forespørsel</h2></div>', init: () => {} };
  }

  // Redirect to login if not authenticated
  if (!Auth.isLoggedIn()) {
    Store.set('redirect_after_login', `#/payment/${equipmentId}`);
    setTimeout(() => { window.location.hash = '#/login'; }, 100);
    return { html: '<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">🔒</div><h2>Logg inn for å betale</h2></div>', init: () => {} };
  }

  let equipment = null;
  try {
    equipment = await API.getEquipmentById(equipmentId);
  } catch (err) {
    return { html: `<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">⚠️</div><h2>${t('payment.not_found')}</h2></div>`, init: () => {} };
  }

  // Check if already paid
  const userId = Auth.getUserId();
  let alreadyEnrolled = false;
  try {
    const profile = await API.getProfile(userId);
    alreadyEnrolled = profile.enrollments?.some(e => e.equipmentId === equipmentId && e.paid);
  } catch (_) {}

  if (alreadyEnrolled) {
    setTimeout(() => { window.location.hash = `#/course/${equipmentId}`; }, 100);
    return { html: `<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">✅</div><h2>${t('payment.already_enrolled')}</h2></div>`, init: () => {} };
  }

  const eqName = lang === 'no' ? equipment.nameNo : equipment.name;
  const user = Auth.user;
  const isCompany = !Auth.isIndependent() && user?.company;

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh;padding:var(--space-8) 0 var(--space-16)">
        <div class="container-sm">

          <!-- Breadcrumb -->
          <div style="margin-bottom:var(--space-6)">
            <a href="#/equipment/${equipmentId}" style="color:var(--color-text-muted);font-size:var(--text-sm);text-decoration:none">${t('payment.back_to_machine')}</a>
          </div>

          <div style="display:grid;grid-template-columns:1fr;gap:var(--space-6)" id="payment-layout">

            <!-- Order Summary (Right Side on Desktop) -->
            <div id="order-summary-panel">
              <div class="card card-premium">
                <div class="card-header">
                  <h3 style="font-family:var(--font-heading);font-weight:700">${t('payment.summary_title')}</h3>
                </div>
                <div class="card-body">
                   <!-- Equipment info -->
                  <div style="display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-5);padding-bottom:var(--space-4);border-bottom:1px solid var(--color-border)">
                    <img src="${equipment.image}" alt="${eqName}" style="width:72px;height:56px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0"
                      onerror="this.src='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=60'" />
                    <div>
                      <div style="font-weight:700;font-size:var(--text-sm)">${eqName}</div>
                      <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${equipment.subcategory} · ${equipment.manualPages} ${t('payment.pages_label')}</div>
                    </div>
                  </div>
 
                  <!-- Price breakdown -->
                  ${[
                    { label: t('payment.fee_label'), value: '239,20 NOK' },
                    { label: t('payment.vat_label'), value: '59,80 NOK' },
                  ].map(row => `
                    <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-3)">
                      <span style="color:var(--color-text-secondary);font-size:var(--text-sm)">${row.label}</span>
                      <span style="font-size:var(--text-sm)">${row.value}</span>
                    </div>
                  `).join('')}
                  <div style="height:1px;background:var(--color-border);margin:var(--space-3) 0"></div>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-weight:700">${t('payment.total_label')}</span>
                    <span style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:900;color:var(--color-gold)">299 NOK</span>
                  </div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px">${t('payment.vat_included')}</div>
                </div>
              </div>
 
              <!-- What you get -->
              <div class="card" style="margin-top:var(--space-4)">
                <div class="card-body">
                  <h4 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-sm);margin-bottom:var(--space-3)">${t('payment.included_title')}</h4>
                  ${[
                    t('payment.inc.manual'),
                    equipment.videoId ? t('payment.inc.video') : null,
                    t('payment.inc.test'),
                    t('payment.inc.sig'),
                    t('payment.inc.cert'),
                    t('payment.inc.share'),
                  ].filter(Boolean).map(item => `
                    <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);font-size:var(--text-xs);color:var(--color-text-secondary)">${item}</div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Payment Form (Left side on desktop) -->
            <div id="payment-form-panel">
              <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:var(--space-6)">${t('payment.title')}</h2>

              <!-- Payment Method Tabs -->
              <div class="tabs" id="payment-method-tabs" style="margin-bottom:var(--space-6)">
                <div class="tab active" data-method="card" id="tab-card">💳 ${t('payment.card')}</div>
                <div class="tab" data-method="vipps" id="tab-vipps">📱 Vipps</div>
                ${isCompany ? `<div class="tab" data-method="invoice" id="tab-invoice">🏢 ${t('payment.invoice')}</div>` : ''}
              </div>

              <!-- Card Payment Panel -->
              <div id="panel-card" class="payment-panel">
                <form id="card-form" novalidate>
                  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                    <div class="form-group">
                      <label class="form-label required">${t('payment.card.holder')}</label>
                      <div class="input-wrapper">
                        <span class="input-icon-left">👤</span>
                        <input type="text" id="card-name" class="form-input has-icon-left"
                          value="${user?.name || ''}"
                          placeholder="${t('payment.card.holder_ph')}" autocomplete="cc-name" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label required">${t('payment.card.number')}</label>
                      <div class="input-wrapper">
                        <span class="input-icon-left">💳</span>
                        <input type="text" id="card-number" class="form-input has-icon-left"
                          placeholder="4242 4242 4242 4242" maxlength="19"
                          autocomplete="cc-number" inputmode="numeric" />
                        <span class="input-icon-right" id="card-brand" style="pointer-events:none">💳</span>
                      </div>
                      <span class="form-hint">${t('payment.card.demo_hint')}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
                      <div class="form-group">
                        <label class="form-label required">${t('payment.card.expiry')}</label>
                        <input type="text" id="card-expiry" class="form-input"
                          placeholder="MM/ÅÅ" maxlength="5"
                          autocomplete="cc-exp" inputmode="numeric" />
                      </div>
                      <div class="form-group">
                        <label class="form-label required">${t('payment.card.cvc')}</label>
                        <div class="input-wrapper">
                          <input type="text" id="card-cvc" class="form-input"
                            placeholder="123" maxlength="4"
                            autocomplete="cc-csc" inputmode="numeric" />
                          <span class="input-icon-right" style="pointer-events:none" title="${t('payment.card.cvc_hint')}">🔒</span>
                        </div>
                      </div>
                    </div>

                    <label class="form-checkbox">
                      <input type="checkbox" id="save-card" />
                      <span class="checkbox-label" style="font-size:var(--text-xs)">${t('payment.card.save')}</span>
                    </label>

                    <button type="submit" class="btn btn-primary btn-block btn-xl" id="pay-card-btn">
                      ${t('payment.card.btn_pay')}
                    </button>
                    <p style="text-align:center;font-size:var(--text-xs);color:var(--color-text-muted)">${t('payment.card.secure_hint')}</p>
                  </div>
                </form>
              </div>

              <!-- Vipps Panel -->
              <div id="panel-vipps" class="payment-panel hidden">
                <div style="text-align:center;padding:var(--space-8)">
                  <div style="font-size:4rem;margin-bottom:var(--space-4)">📱</div>
                  <h3 style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-3)">${t('payment.vipps.title')}</h3>
                  <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-6)">
                    ${t('payment.vipps.desc')}
                  </p>

                  <!-- Phone input for Vipps -->
                  <div class="form-group" style="max-width:280px;margin:0 auto var(--space-6)">
                    <label class="form-label">${t('payment.vipps.phone')}</label>
                    <div class="input-wrapper">
                      <span class="input-icon-left">📱</span>
                      <input type="tel" id="vipps-phone" class="form-input has-icon-left"
                        placeholder="+47 000 00 000" value="${user?.phone || ''}"
                        autocomplete="tel" inputmode="tel" />
                    </div>
                  </div>

                  <div style="background:linear-gradient(135deg,#ff5b24,#ff5b24 60%,#e84f1a);border-radius:var(--radius-xl);padding:var(--space-1);display:inline-block;margin-bottom:var(--space-4)">
                    <button id="pay-vipps-btn" class="btn" style="background:white;color:#ff5b24;font-weight:700;padding:1rem 2.5rem;border-radius:var(--radius-lg);font-size:var(--text-lg);min-width:220px">
                      ${t('payment.vipps.btn')}
                    </button>
                  </div>
                  <br/>
                  <p style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('payment.vipps.footer')}</p>
                </div>
              </div>

              <!-- Invoice Panel -->
              ${isCompany ? `
              <div id="panel-invoice" class="payment-panel hidden">
                <div style="padding:var(--space-4)">
                  <div class="card" style="background:rgba(250,162,27,0.05);border-color:rgba(250,162,27,0.2);margin-bottom:var(--space-5);padding:var(--space-4)">
                    <div style="display:flex;align-items:center;gap:var(--space-3)">
                      <span style="font-size:1.5rem">🏢</span>
                      <div>
                        <div style="font-weight:700;font-size:var(--text-sm)">${user?.company || 'Din bedrift'}</div>
                        <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('payment.invoice.company_desc')}</div>
                      </div>
                    </div>
                  </div>

                  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
                    <div class="form-group">
                      <label class="form-label">${t('payment.invoice.email')}</label>
                      <input type="email" id="invoice-email" class="form-input" placeholder="regnskap@bedrift.no" value="" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">${t('payment.invoice.ref')}</label>
                      <input type="text" id="invoice-ref" class="form-input" placeholder="${t('payment.invoice.ref_ph')}" />
                    </div>
                    <button id="pay-invoice-btn" class="btn btn-primary btn-block btn-xl">
                      ${t('payment.invoice.btn')}
                    </button>
                  </div>
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Processing overlay -->
          <div id="payment-processing" class="hidden" style="position:fixed;inset:0;background:rgba(11,22,35,0.9);backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1.5rem">
            <div class="spinner spinner-lg"></div>
            <div style="text-align:center">
              <div style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-lg);margin-bottom:0.5rem">${t('payment.processing')}</div>
              <div style="color:var(--color-text-muted);font-size:var(--text-sm)">${t('payment.processing_desc')}</div>
            </div>
          </div>
        </div>
      </div>
    `,
    init: () => initPaymentHandlers({ equipment, equipmentId, userId, user, isCompany }),
  };
}

function initPaymentHandlers({ equipment, equipmentId, userId, user, isCompany }) {
  // Desktop 2-col layout
  const layout = document.getElementById('payment-layout');
  if (layout && window.innerWidth >= 1024) {
    layout.style.gridTemplateColumns = '1fr 400px';
    layout.style.alignItems = 'start';
    // Move order summary to right
    const summary = document.getElementById('order-summary-panel');
    const form = document.getElementById('payment-form-panel');
    if (summary && form) {
      layout.appendChild(summary);
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  document.querySelectorAll('[data-method]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-method]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const method = tab.dataset.method;
      ['card', 'vipps', 'invoice'].forEach(m => {
        const panel = document.getElementById(`panel-${m}`);
        if (panel) panel.classList.toggle('hidden', m !== method);
      });
    });
  });

  // ── Card number formatting ────────────────────────────────────────────────
  const cardNumInput = document.getElementById('card-number');
  const cardBrandEl = document.getElementById('card-brand');
  if (cardNumInput) {
    cardNumInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
      // Brand detection
      if (cardBrandEl) {
        if (v.startsWith('4')) cardBrandEl.textContent = '💳 Visa';
        else if (v.startsWith('5')) cardBrandEl.textContent = '💳 MC';
        else if (v.startsWith('3')) cardBrandEl.textContent = '💳 Amex';
        else cardBrandEl.textContent = '💳';
      }
    });
  }

  // Expiry formatting
  const expiryInput = document.getElementById('card-expiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
      e.target.value = v;
    });
  }

  // CVC: numbers only
  const cvcInput = document.getElementById('card-cvc');
  if (cvcInput) {
    cvcInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  // ── Card Payment Submit ───────────────────────────────────────────────────
  document.getElementById('card-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cardNum = document.getElementById('card-number')?.value?.replace(/\s/g, '');
    const expiry = document.getElementById('card-expiry')?.value;
    const cvc = document.getElementById('card-cvc')?.value;
    const name = document.getElementById('card-name')?.value?.trim();

    // Basic validation
    if (!name || name.length < 2) {
      Toast.error('Oppgi kortinnehaverens navn', 'Valideringsfeil'); return;
    }
    if (cardNum?.length !== 16) {
      Toast.error('Kortnummeret må ha 16 siffer', 'Valideringsfeil'); return;
    }
    if (!expiry || expiry.length < 5) {
      Toast.error('Oppgi gyldig utløpsdato (MM/ÅÅ)', 'Valideringsfeil'); return;
    }
    if (!cvc || cvc.length < 3) {
      Toast.error('CVC-kode må ha 3-4 siffer', 'Valideringsfeil'); return;
    }

    await processPayment('card');
  });

  // ── Vipps Submit ──────────────────────────────────────────────────────────
  document.getElementById('pay-vipps-btn')?.addEventListener('click', async () => {
    const phone = document.getElementById('vipps-phone')?.value?.trim();
    if (!phone || !Validate.phone(phone)) {
      Toast.error('Oppgi et gyldig mobilnummer', 'Valideringsfeil'); return;
    }
    await processPayment('vipps');
  });

  // ── Invoice Submit ────────────────────────────────────────────────────────
  document.getElementById('pay-invoice-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('invoice-email')?.value?.trim();
    if (!email || !Validate.email(email)) {
      Toast.error('Oppgi en gyldig e-postadresse for faktura', 'Valideringsfeil'); return;
    }
    await processPayment('invoice');
  });

  // ── Core Payment Processor ────────────────────────────────────────────────
  async function processPayment(method) {
    const processingEl = document.getElementById('payment-processing');
    if (processingEl) processingEl.classList.remove('hidden');

    try {
      // Initiate payment
      const paymentInit = await API.initiatePayment(userId, equipmentId, method);

      // Simulate processing delay (in prod: redirect to Stripe/Vipps)
      await new Promise(r => setTimeout(r, 2200));

      // Confirm payment
      await API.confirmPayment(paymentInit.paymentId, userId, equipmentId);

      // Enroll in course
      await API.enroll(userId, equipmentId, paymentInit.paymentId);

      if (processingEl) processingEl.classList.add('hidden');

      // Show success
      showPaymentSuccess(equipment, method);

    } catch (err) {
      if (processingEl) processingEl.classList.add('hidden');
      Toast.error('Betalingen mislyktes. Prøv igjen eller velg en annen betalingsmetode.', '❌ Feil');
      console.error('Payment error:', err);
    }
  }
}

function showPaymentSuccess(equipment, method) {
  const eqName = I18n.lang === 'no' ? equipment.nameNo : equipment.name;
  const layout = document.getElementById('payment-layout');
  if (!layout) return;

  layout.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:var(--space-12) var(--space-4)" class="animate-scaleIn">
      <div style="font-size:5rem;margin-bottom:var(--space-4)">🎉</div>
      <h2 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--space-3);color:var(--color-success)">${I18n.t('payment.success')}</h2>
      <p style="color:var(--color-text-secondary);font-size:var(--text-md);margin-bottom:var(--space-8);max-width:480px;margin-left:auto;margin-right:auto">
        Du har nå tilgang til <strong>${eqName}</strong>. Start opplæringen og fullfør for å få ditt offisielle diplom.
      </p>

      <!-- Receipt summary -->
      <div class="card card-premium" style="max-width:380px;margin:0 auto var(--space-8);text-align:left">
        <div class="card-body">
          <div style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-4)">Kvittering</div>
          ${[
            { label: 'Kurs', value: eqName },
            { label: 'Beløp', value: '299 NOK' },
            { label: 'Metode', value: method === 'card' ? 'Kortbetaling' : method === 'vipps' ? 'Vipps' : 'Faktura' },
            { label: 'Dato', value: new Date().toLocaleDateString('nb-NO') },
            { label: 'Referanse', value: `PAY-${Date.now().toString(36).toUpperCase()}` },
          ].map(row => `
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">${row.label}</span>
              <span style="font-weight:600">${row.value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-3)">
        <a href="#/course/${equipment.id}" class="btn btn-primary btn-xl hover-glow-red" style="min-width:280px">
          📖 Start kurset nå →
        </a>
        <a href="#/catalog" class="btn btn-ghost">← Se flere kurs</a>
      </div>
    </div>
  `;
}
