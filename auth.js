/**
 * auth.js — Authentication Module
 * Typeopplæring.no Safety Training Platform
 */

import API from './api.js';
import I18n from './i18n.js';
import { Store, Toast, Validate, $ } from './utils.js';

// ── Auth State ────────────────────────────────────────────────────────────────
export const Auth = {
  user: null,
  token: null,

  init() {
    this.token = Store.get('token');
    this.user = Store.get('user');
    return this.isLoggedIn();
  },

  isLoggedIn() {
    if (!this.token || !this.user) return false;
    try {
      const payload = JSON.parse(atob(this.token));
      if (payload.exp < Date.now()) { this.logout(); return false; }
      return true;
    } catch { return false; }
  },

  isAdmin()   { return this.user?.role === 'admin'; },
  isManager() { return this.user?.role === 'manager'; },
  isOperator(){ return this.user?.role === 'operator'; },
  isIndependent() { return this.user?.independent === true; },

  getRole()   { return this.user?.role || null; },
  getUserId() { return this.user?.id || null; },
  getCompanyId() { return this.user?.companyId || null; },

  setSession(user, token) {
    this.user = user;
    this.token = token;
    Store.set('user', user);
    Store.set('token', token);
  },

  logout() {
    this.user = null;
    this.token = null;
    Store.remove('user');
    Store.remove('token');
    window.location.hash = '#/login';
  },
};

// ── Login View ────────────────────────────────────────────────────────────────
export function renderLogin() {
  const t = (k) => I18n.t(k);
  return `
    <div class="auth-layout">
      <!-- Left Brand Panel (Desktop) -->
      <div class="auth-panel-left">
        <div class="hero-bg" style="position:absolute;inset:0;background-image:url('hero_bg.png');background-size:cover;background-position:center;filter:brightness(0.25)"></div>
        <div style="position:relative;z-index:1;padding:3rem;display:flex;flex-direction:column;justify-content:space-between;height:100%">
          <div>
            <div class="nav-logo-mark" style="width:56px;height:56px;font-size:1.2rem;margin-bottom:1.5rem">🏗️</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:800;line-height:1.15;color:white;margin-bottom:1rem">
              Trygg opplæring.<br>
              <span class="text-gradient-gold">Overalt.</span>
            </h1>
            <p style="color:var(--color-text-secondary);font-size:var(--text-md);line-height:1.7;max-width:380px">
              Norges ledende plattform for digital typegodkjenning av tungt maskineri. Sertifisert av Oslo Liftutleie.
            </p>
          </div>
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div class="glass" style="border-radius:var(--radius-lg);padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem">
              <span style="font-size:2rem">🏆</span>
              <div>
                <div style="font-weight:700;color:white;font-size:var(--text-sm)">140+ maskintyper</div>
                <div style="color:var(--color-text-muted);font-size:var(--text-xs)">Komplett kursbibliotek</div>
              </div>
            </div>
            <div class="glass" style="border-radius:var(--radius-lg);padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem">
              <span style="font-size:2rem">📱</span>
              <div>
                <div style="font-weight:700;color:white;font-size:var(--text-sm)">Diplom på mobilen</div>
                <div style="color:var(--color-text-muted);font-size:var(--text-xs)">Del til CV og LinkedIn</div>
              </div>
            </div>
            <div class="glass" style="border-radius:var(--radius-lg);padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem">
              <span style="font-size:2rem">⚖️</span>
              <div>
                <div style="font-weight:700;color:white;font-size:var(--text-sm)">Lovpålagt sertifisering</div>
                <div style="color:var(--color-text-muted);font-size:var(--text-xs)">Forskrift om utførelse av arbeid</div>
              </div>
            </div>
          </div>
          <div style="color:var(--color-text-muted);font-size:var(--text-xs)">
            © 2024 Oslo Liftutleie AS · Sikkerhet & Opplæring
          </div>
        </div>
      </div>

      <!-- Right Auth Panel -->
      <div class="auth-panel-right">
        <div class="auth-card animate-fadeInUp">
          <!-- Logo (mobile only) -->
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:2.5rem" class="show-mobile-only hide-desktop">
            <div class="nav-logo-mark">🏗️</div>
            <div>
              <div class="nav-logo-name">Oslo Liftutleie</div>
              <div class="nav-logo-tag">Sikkerhet & Opplæring</div>
            </div>
          </div>

          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:0.375rem">${t('auth.login.title')}</h2>
          <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:2rem">${t('auth.login.subtitle')}</p>

          <!-- Quick Demo Login Buttons -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:1.5rem">
            <button class="btn btn-ghost btn-sm demo-login" data-role="admin" style="flex-direction:column;gap:0.25rem;height:auto;padding:0.625rem 0.5rem">
              <span>🔑</span><span style="font-size:0.6rem">Admin</span>
            </button>
            <button class="btn btn-ghost btn-sm demo-login" data-role="manager" style="flex-direction:column;gap:0.25rem;height:auto;padding:0.625rem 0.5rem">
              <span>🏢</span><span style="font-size:0.6rem">Manager</span>
            </button>
            <button class="btn btn-ghost btn-sm demo-login" data-role="operator" style="flex-direction:column;gap:0.25rem;height:auto;padding:0.625rem 0.5rem">
              <span>👷</span><span style="font-size:0.6rem">Operatør</span>
            </button>
          </div>
          <div style="text-align:center;color:var(--color-text-muted);font-size:var(--text-xs);margin-bottom:1.5rem">Demo — klikk for å logge inn</div>

          <div class="divider-text" style="margin-bottom:1.5rem">
            <span>${t('auth.login.or')}</span>
          </div>

          <form id="login-form" novalidate>
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label class="form-label">${t('auth.login.email')}</label>
                <div class="input-wrapper">
                  <span class="input-icon-left">📧</span>
                  <input type="email" id="login-email" class="form-input has-icon-left"
                    placeholder="navn@bedrift.no" autocomplete="email" data-i18n-target="placeholder" />
                </div>
                <span class="form-error hidden" id="login-email-err"></span>
              </div>

              <div class="form-group">
                <label class="form-label">${t('auth.login.password')}</label>
                <div class="input-wrapper">
                  <span class="input-icon-left">🔒</span>
                  <input type="password" id="login-password" class="form-input has-icon-left"
                    placeholder="••••••••" autocomplete="current-password" />
                  <button type="button" class="input-icon-right" id="toggle-pw" style="pointer-events:all;cursor:pointer;background:none;border:none;font-size:1rem">👁️</button>
                </div>
                <span class="form-error hidden" id="login-pw-err"></span>
              </div>

              <div style="display:flex;justify-content:flex-end">
                <a href="#/forgot-password" style="font-size:var(--text-xs);color:var(--color-gold);text-decoration:none">${t('auth.login.forgot')}</a>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-submit">
                ${t('auth.login.btn')}
              </button>
            </div>
          </form>

          <p style="text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);margin-top:1.5rem">
            ${t('auth.login.no_account')}
            <a href="#/register" style="color:var(--color-gold);font-weight:600;margin-left:0.25rem">${t('auth.login.register_link')}</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

// ── Register View ─────────────────────────────────────────────────────────────
export function renderRegister() {
  const t = (k) => I18n.t(k);
  return `
    <div class="auth-layout">
      <div class="auth-panel-left">
        <div style="position:absolute;inset:0;background-image:url('hero_bg.png');background-size:cover;background-position:center;filter:brightness(0.2)"></div>
        <div style="position:relative;z-index:1;padding:3rem;display:flex;flex-direction:column;justify-content:center;height:100%;gap:2rem">
          <div class="nav-logo-mark" style="width:56px;height:56px;font-size:1.2rem">🏗️</div>
          <div>
            <div class="section-label" style="margin-bottom:1rem">299 NOK per godkjenning</div>
            <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:800;color:white;margin-bottom:1rem">Din karriere.<br><span class="text-gradient-gold">Din dokumentasjon.</span></h1>
            <p style="color:var(--color-text-secondary);line-height:1.7;max-width:360px">
              Samle alle dine typegodkjenninger på ett sted. Del din CV-side med arbeidsgivere.
            </p>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            ${['✅ Øyeblikkelig tilgang etter betaling', '📜 Offisielt diplom med digital signatur', '📱 Tilgjengelig på mobil og PC', '🔒 GDPR-sikkert og norsk personvern'].map(item =>
              `<div style="display:flex;align-items:center;gap:0.75rem;color:var(--color-text-secondary);font-size:var(--text-sm)"><span>${item}</span></div>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="auth-panel-right" style="padding-top:2rem;padding-bottom:2rem">
        <div class="auth-card animate-fadeInUp" style="max-width:480px">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:2rem" class="show-mobile-only hide-desktop">
            <div class="nav-logo-mark">🏗️</div>
            <div class="nav-logo-name">Oslo Liftutleie</div>
          </div>

          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:0.375rem">${t('auth.register.title')}</h2>
          <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:2rem">${t('auth.register.subtitle')}</p>

          <!-- Step Indicator -->
          <div style="position:relative;margin-bottom:2.5rem">
            <div class="steps" id="register-steps">
              ${[1,2,3].map((n, i) => `
                <div class="step ${i === 0 ? 'active' : ''}" id="step-indicator-${n}">
                  <div class="step-dot">${n}</div>
                  ${i < 2 ? '<div class="step-line"></div>' : ''}
                </div>
              `).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:0.625rem">
              <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('auth.register.step1')}</span>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('auth.register.step2')}</span>
              <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('auth.register.step3')}</span>
            </div>
          </div>

          <form id="register-form" novalidate>
            <!-- STEP 1: Personal Info -->
            <div id="reg-step-1" class="register-step">
              <div style="display:flex;flex-direction:column;gap:1rem">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                  <div class="form-group">
                    <label class="form-label required">${t('auth.register.first_name')}</label>
                    <input type="text" id="reg-firstname" class="form-input" placeholder="Ola" autocomplete="given-name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label required">${t('auth.register.last_name')}</label>
                    <input type="text" id="reg-lastname" class="form-input" placeholder="Nordmann" autocomplete="family-name" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label required">${t('auth.register.email')}</label>
                  <div class="input-wrapper">
                    <span class="input-icon-left">📧</span>
                    <input type="email" id="reg-email" class="form-input has-icon-left" placeholder="ola@bedrift.no" autocomplete="email" />
                  </div>
                  <span class="form-error hidden" id="reg-email-err"></span>
                </div>
                <div class="form-group">
                  <label class="form-label">${t('auth.register.phone')}</label>
                  <div class="input-wrapper">
                    <span class="input-icon-left">📱</span>
                    <input type="tel" id="reg-phone" class="form-input has-icon-left" placeholder="+47 000 00 000" autocomplete="tel" />
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 2: Company -->
            <div id="reg-step-2" class="register-step hidden">
              <div style="display:flex;flex-direction:column;gap:1rem">
                <div class="form-group">
                  <label class="form-label">${t('auth.register.company_type')}</label>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:0.25rem">
                    <label style="cursor:pointer">
                      <input type="radio" name="account-type" value="company" id="type-company" checked style="display:none" />
                      <div class="account-type-card" id="card-company" style="border:2px solid var(--color-gold);border-radius:var(--radius-lg);padding:1rem;text-align:center;background:rgba(250,162,27,0.08);transition:all 0.2s">
                        <div style="font-size:1.75rem;margin-bottom:0.5rem">🏢</div>
                        <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:0.25rem">${t('auth.register.company_emp')}</div>
                        <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Faktura tilgjengelig</div>
                      </div>
                    </label>
                    <label style="cursor:pointer">
                      <input type="radio" name="account-type" value="independent" id="type-independent" style="display:none" />
                      <div class="account-type-card" id="card-independent" style="border:2px solid var(--color-border);border-radius:var(--radius-lg);padding:1rem;text-align:center;background:transparent;transition:all 0.2s">
                        <div style="font-size:1.75rem;margin-bottom:0.5rem">👷</div>
                        <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:0.25rem">${t('auth.register.independent')}</div>
                        <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Kortbetaling</div>
                      </div>
                    </label>
                  </div>
                </div>
                <div id="company-fields">
                  <div style="display:flex;flex-direction:column;gap:0.75rem">
                    <div class="form-group">
                      <label class="form-label">${t('auth.register.company_name')}</label>
                      <input type="text" id="reg-company-name" class="form-input" placeholder="Bedrift AS" autocomplete="organization" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">${t('auth.register.company_org')}</label>
                      <input type="text" id="reg-org-no" class="form-input" placeholder="123 456 789" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 3: Account Security -->
            <div id="reg-step-3" class="register-step hidden">
              <div style="display:flex;flex-direction:column;gap:1rem">
                <div class="form-group">
                  <label class="form-label required">${t('auth.register.password')}</label>
                  <div class="input-wrapper">
                    <span class="input-icon-left">🔒</span>
                    <input type="password" id="reg-password" class="form-input has-icon-left" placeholder="Min. 8 tegn" autocomplete="new-password" />
                  </div>
                  <div id="pw-strength" style="display:flex;gap:0.25rem;margin-top:0.5rem">
                    ${[1,2,3,4].map(n => `<div style="flex:1;height:3px;background:var(--color-border);border-radius:999px;transition:background 0.3s" id="pw-bar-${n}"></div>`).join('')}
                  </div>
                  <span class="form-error hidden" id="reg-pw-err"></span>
                </div>
                <div class="form-group">
                  <label class="form-label required">${t('auth.register.confirm_pw')}</label>
                  <div class="input-wrapper">
                    <span class="input-icon-left">🔒</span>
                    <input type="password" id="reg-confirm-pw" class="form-input has-icon-left" placeholder="••••••••" autocomplete="new-password" />
                  </div>
                  <span class="form-error hidden" id="reg-cpw-err"></span>
                </div>
                <label class="form-checkbox">
                  <input type="checkbox" id="reg-terms" />
                  <span class="checkbox-label">
                    ${t('auth.register.terms')} —
                    <a href="#" style="color:var(--color-gold)">vilkår</a> og
                    <a href="#" style="color:var(--color-gold)">personvern</a>
                  </span>
                </label>
                <span class="form-error hidden" id="reg-terms-err"></span>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
              <button type="button" id="reg-prev" class="btn btn-ghost hidden" style="flex:1">${t('common.prev')}</button>
              <button type="button" id="reg-next" class="btn btn-gold" style="flex:1">${t('common.next')}</button>
              <button type="submit" id="reg-submit" class="btn btn-primary hidden" style="flex:1">${t('auth.register.btn')}</button>
            </div>
          </form>

          <p style="text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);margin-top:1.5rem">
            ${t('auth.register.has_account')}
            <a href="#/login" style="color:var(--color-gold);font-weight:600;margin-left:0.25rem">${t('auth.register.login_link')}</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

// ── Forgot Password View ──────────────────────────────────────────────────────
export function renderForgotPassword() {
  const t = (k) => I18n.t(k);
  return `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:var(--color-bg)">
      <div style="width:100%;max-width:420px" class="animate-scaleIn">
        <div style="text-align:center;margin-bottom:2rem">
          <div class="nav-logo-mark" style="width:56px;height:56px;font-size:1.2rem;margin:0 auto 1rem">🏗️</div>
          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:0.5rem">${t('auth.forgot.title')}</h2>
          <p style="color:var(--color-text-secondary);font-size:var(--text-sm)">${t('auth.forgot.subtitle')}</p>
        </div>
        <form id="forgot-form" novalidate>
          <div class="form-group" style="margin-bottom:1.25rem">
            <label class="form-label">${t('auth.forgot.email')}</label>
            <div class="input-wrapper">
              <span class="input-icon-left">📧</span>
              <input type="email" id="forgot-email" class="form-input has-icon-left" placeholder="din@epost.no" autocomplete="email" />
            </div>
            <span class="form-error hidden" id="forgot-err"></span>
          </div>
          <div id="forgot-success" class="hidden" style="background:var(--color-success-bg);border:1px solid rgba(34,197,94,0.3);border-radius:var(--radius-md);padding:1rem;margin-bottom:1rem;color:var(--color-success);font-size:var(--text-sm);text-align:center">
            ${t('auth.forgot.sent')}
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="forgot-submit">${t('auth.forgot.btn')}</button>
        </form>
        <p style="text-align:center;margin-top:1.5rem">
          <a href="#/login" style="color:var(--color-gold);font-size:var(--text-sm);font-weight:500">← ${t('auth.forgot.back')}</a>
        </p>
      </div>
    </div>
  `;
}

// ── Auth Event Handlers ───────────────────────────────────────────────────────
export function initLoginHandlers() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Demo login buttons
  document.querySelectorAll('.demo-login').forEach(btn => {
    btn.addEventListener('click', async () => {
      const role = btn.dataset.role;
      const demoEmails = {
        admin: 'admin@oslolift.no',
        manager: 'manager@buildcorp.no',
        operator: 'operator@email.com'
      };
      const emailInput = document.getElementById('login-email');
      const pwInput = document.getElementById('login-password');
      if (emailInput) emailInput.value = demoEmails[role] || '';
      if (pwInput) pwInput.value = 'demo1234';
      await performLogin(demoEmails[role], 'demo1234');
    });
  });

  // Toggle password visibility
  const togglePw = document.getElementById('toggle-pw');
  const pwInput = document.getElementById('login-password');
  if (togglePw && pwInput) {
    togglePw.addEventListener('click', () => {
      pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
      togglePw.textContent = pwInput.type === 'password' ? '👁️' : '🙈';
    });
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    await performLogin(email, password);
  });
}

async function performLogin(email, password) {
  const submitBtn = document.getElementById('login-submit');
  if (!email || !Validate.email(email)) {
    Toast.error('Ugyldig e-postadresse', 'Feil');
    return;
  }
  if (!password || password.length < 4) {
    Toast.error('Passordet er for kort', 'Feil');
    return;
  }
  if (submitBtn) { submitBtn.classList.add('loading'); submitBtn.disabled = true; }

  try {
    const result = await API.login(email, password);
    Auth.setSession(result.user, result.token);
    Toast.success(`Velkommen, ${result.user.name.split(' ')[0]}!`, 'Innlogget');

    // Role-based redirect
    setTimeout(() => {
      if (Auth.isAdmin()) window.location.hash = '#/admin';
      else if (Auth.isManager()) window.location.hash = '#/company';
      else window.location.hash = '#/';
    }, 500);
  } catch (err) {
    Toast.error('Feil e-post eller passord. Prøv igjen.', 'Innlogging feilet');
  } finally {
    if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
  }
}

export function initRegisterHandlers() {
  let currentStep = 1;
  const totalSteps = 3;

  function showStep(step) {
    document.querySelectorAll('.register-step').forEach(s => s.classList.add('hidden'));
    const stepEl = document.getElementById(`reg-step-${step}`);
    if (stepEl) stepEl.classList.remove('hidden');

    // Update step indicators
    for (let i = 1; i <= totalSteps; i++) {
      const ind = document.getElementById(`step-indicator-${i}`);
      if (!ind) continue;
      ind.classList.remove('active', 'completed');
      if (i < step) ind.classList.add('completed');
      else if (i === step) ind.classList.add('active');
    }

    const prev = document.getElementById('reg-prev');
    const next = document.getElementById('reg-next');
    const submit = document.getElementById('reg-submit');
    if (prev) prev.classList.toggle('hidden', step === 1);
    if (next) next.classList.toggle('hidden', step === totalSteps);
    if (submit) submit.classList.toggle('hidden', step !== totalSteps);
  }

  // Account type toggle
  document.querySelectorAll('input[name="account-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const companyFields = document.getElementById('company-fields');
      const cardCompany = document.getElementById('card-company');
      const cardIndep = document.getElementById('card-independent');
      const isCompany = document.getElementById('type-company')?.checked;

      if (companyFields) companyFields.style.display = isCompany ? 'block' : 'none';
      if (cardCompany) {
        cardCompany.style.border = `2px solid ${isCompany ? 'var(--color-gold)' : 'var(--color-border)'}`;
        cardCompany.style.background = isCompany ? 'rgba(250,162,27,0.08)' : 'transparent';
      }
      if (cardIndep) {
        cardIndep.style.border = `2px solid ${!isCompany ? 'var(--color-gold)' : 'var(--color-border)'}`;
        cardIndep.style.background = !isCompany ? 'rgba(250,162,27,0.08)' : 'transparent';
      }
    });
  });

  // Password strength indicator
  const pwInput = document.getElementById('reg-password');
  if (pwInput) {
    pwInput.addEventListener('input', () => {
      const pw = pwInput.value;
      const strength = [
        pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)
      ].filter(Boolean).length;
      const colors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'];
      for (let i = 1; i <= 4; i++) {
        const bar = document.getElementById(`pw-bar-${i}`);
        if (bar) bar.style.background = i <= strength ? colors[strength] : 'var(--color-border)';
      }
    });
  }

  // Navigation
  document.getElementById('reg-next')?.addEventListener('click', () => {
    if (currentStep < totalSteps) { currentStep++; showStep(currentStep); }
  });
  document.getElementById('reg-prev')?.addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; showStep(currentStep); }
  });

  // Form submit
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const terms = document.getElementById('reg-terms');
    if (!terms?.checked) {
      Toast.error('Godta vilkårene for å fortsette', 'Mangler samtykke');
      return;
    }
    const pw = document.getElementById('reg-password')?.value;
    const cpw = document.getElementById('reg-confirm-pw')?.value;
    if (pw !== cpw) { Toast.error('Passordene stemmer ikke overens', 'Feil'); return; }

    const submitBtn = document.getElementById('reg-submit');
    if (submitBtn) { submitBtn.classList.add('loading'); submitBtn.disabled = true; }

    try {
      const accountType = document.querySelector('input[name="account-type"]:checked')?.value || 'company';
      const data = {
        firstName: document.getElementById('reg-firstname')?.value?.trim(),
        lastName: document.getElementById('reg-lastname')?.value?.trim(),
        email: document.getElementById('reg-email')?.value?.trim(),
        phone: document.getElementById('reg-phone')?.value?.trim(),
        accountType,
        companyName: document.getElementById('reg-company-name')?.value?.trim(),
        orgNo: document.getElementById('reg-org-no')?.value?.trim(),
        password: pw,
      };

      const result = await API.register(data);
      Auth.setSession(result.user, result.token);
      Toast.success(`Konto opprettet! Velkommen, ${result.user.name.split(' ')[0]}!`);
      setTimeout(() => { window.location.hash = '#/catalog'; }, 600);
    } catch (err) {
      Toast.error('Registrering feilet. Prøv igjen.');
    } finally {
      if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
    }
  });
}

export function initForgotPasswordHandlers() {
  document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value?.trim();
    if (!Validate.email(email)) {
      Toast.error('Ugyldig e-postadresse');
      return;
    }
    const btn = document.getElementById('forgot-submit');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }
    // Simulate email send
    await new Promise(r => setTimeout(r, 1500));
    document.getElementById('forgot-success')?.classList.remove('hidden');
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; btn.textContent = 'Sendt!'; }
  });
}
