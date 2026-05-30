/**
 * app.js — Main Application Router & State Manager
 * Typeopplæring.no Safety Training Platform
 */

import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Toast, Store, scrollToTop } from './utils.js';
import { renderLogin, renderRegister, renderForgotPassword, initLoginHandlers, initRegisterHandlers, initForgotPasswordHandlers } from './auth.js';

// ── Lazy-loaded view modules ──────────────────────────────────────────────────
const ViewLoaders = {
  home:           () => import('./views/home.js').then(m => m.renderHome),
  catalog:        () => import('./catalog.js').then(m => m.renderCatalog),
  equipment:      () => import('./catalog.js').then(m => m.renderEquipmentDetail),
  course:         () => import('./course.js').then(m => m.renderCourse),
  assessment:     () => import('./assessment.js').then(m => m.renderAssessment),
  'course-complete': () => import('./course.js').then(m => m.renderCourseComplete),
  payment:        () => import('./payment.js').then(m => m.renderPayment),
  sign:           () => import('./signature.js').then(m => m.renderSignature),
  certificate:    () => import('./certificate.js').then(m => m.renderCertificate),
  profile:        () => import('./profile.js').then(m => m.renderProfile),
  admin:          () => import('./admin.js').then(m => m.renderAdmin),
  company:        () => import('./company.js').then(m => m.renderCompany),
  qr:             () => import('./qr.js').then(m => m.renderQR),
  checklist:      () => import('./checklist.js').then(m => m.renderChecklist),
  verify:         () => import('./certificate.js').then(m => m.renderVerify),
  cv:             () => import('./certificate.js').then(m => m.renderCV),
};

// ── Router ────────────────────────────────────────────────────────────────────
const Router = {
  currentRoute: null,
  params: {},

  /** Parse #/path/param format */
  parseHash() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    const route = parts[0] || 'home';
    const params = parts.slice(1);
    return { route, params };
  },

  /** Navigate to a route */
  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  },

  /** Route definitions with guards */
  routes: {
    '':              { view: 'home',            auth: false },
    'home':          { view: 'home',            auth: false },
    'login':         { view: 'login',           auth: false, redirect: true },
    'register':      { view: 'register',        auth: false, redirect: true },
    'forgot-password': { view: 'forgot',        auth: false },
    'catalog':       { view: 'catalog',         auth: false },
    'equipment':     { view: 'equipment',       auth: false },
    'course':        { view: 'course',          auth: true  },
    'assessment':    { view: 'assessment',      auth: true  },
    'course-complete': { view: 'course-complete', auth: true },
    'payment':       { view: 'payment',         auth: true  },
    'sign':          { view: 'sign',            auth: true  },
    'certificate':   { view: 'certificate',     auth: true  },
    'profile':       { view: 'profile',         auth: true  },
    'admin':         { view: 'admin',           auth: true, role: 'admin' },
    'company':       { view: 'company',         auth: true, role: 'manager' },
    'qr':            { view: 'qr',              auth: false },
    'checklist':     { view: 'checklist',       auth: true  },
    'verify':        { view: 'verify',          auth: false },
    'cv':            { view: 'cv',              auth: false },
  },

  async dispatch() {
    const { route, params } = this.parseHash();
    this.params = params;
    this.currentRoute = route;

    const routeDef = this.routes[route] || this.routes[''];
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;

    // Auth guard
    if (routeDef.auth && !Auth.isLoggedIn()) {
      Store.set('redirect_after_login', window.location.hash);
      this.navigate('#/login');
      return;
    }

    // Role guard
    if (routeDef.role === 'admin' && !Auth.isAdmin()) {
      this.navigate('#/');
      Toast.error('Ingen tilgang', 'Ikke autorisert');
      return;
    }
    if (routeDef.role === 'manager' && !Auth.isManager() && !Auth.isAdmin()) {
      this.navigate('#/');
      Toast.error('Ingen tilgang', 'Ikke autorisert');
      return;
    }

    // Redirect if already logged in and hitting login/register
    if (routeDef.redirect && Auth.isLoggedIn()) {
      const redirectTo = Store.get('redirect_after_login') || '#/';
      Store.remove('redirect_after_login');
      this.navigate(redirectTo);
      return;
    }

    // Show loading state
    viewContainer.innerHTML = `
      <div style="min-height:80vh;display:flex;align-items:center;justify-content:center">
        <div style="display:flex;flex-direction:column;align-items:center;gap:1rem">
          <div class="spinner spinner-lg"></div>
          <p style="color:var(--color-text-muted);font-size:var(--text-sm)">Laster...</p>
        </div>
      </div>`;

    scrollToTop(false);
    App.updateNav();

    try {
      let html = '';
      let initFn = null;

      // Handle built-in views (no lazy loading)
      if (route === 'login') {
        html = renderLogin();
        initFn = initLoginHandlers;
      } else if (route === 'register') {
        html = renderRegister();
        initFn = initRegisterHandlers;
      } else if (route === 'forgot-password') {
        html = renderForgotPassword();
        initFn = initForgotPasswordHandlers;
      } else if (route === '' || route === 'home') {
        html = renderHomeView();
        initFn = initHomeHandlers;
      } else {
        // Lazy-loaded views
        const loaderKey = Object.keys(ViewLoaders).find(k => route.startsWith(k));
        if (loaderKey && ViewLoaders[loaderKey]) {
          try {
            const renderFn = await ViewLoaders[loaderKey]();
            const result = await renderFn(params);
            if (typeof result === 'string') {
              html = result;
            } else if (result?.html) {
              html = result.html;
              initFn = result.init;
            } else {
              html = renderNotFound();
            }
          } catch (err) {
            console.warn(`View load error for ${route}:`, err);
            html = renderFallbackView(route, params);
            initFn = null;
          }
        } else {
          html = renderNotFound();
        }
      }

      // Set content with animation
      viewContainer.innerHTML = `<div class="page-enter">${html}</div>`;
      I18n.applyAll();
      if (initFn) {
        requestAnimationFrame(() => initFn(params));
      }

    } catch (err) {
      console.error('Router dispatch error:', err);
      viewContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Noe gikk galt</div>
          <div class="empty-state-desc">Prøv igjen eller gå tilbake til forsiden.</div>
          <a href="#/" class="btn btn-primary" style="margin-top:1rem">Til forsiden</a>
        </div>`;
    }
  },
};

// ── Home View (built-in for performance) ─────────────────────────────────────
function renderHomeView() {
  const t = (k) => I18n.t(k);
  const isLoggedIn = Auth.isLoggedIn();
  return `
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-bg-overlay"></div>
      <!-- Animated particles -->
      <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
        ${Array.from({length:8},(_,i)=>`
          <div style="position:absolute;width:${Math.random()*300+100}px;height:${Math.random()*300+100}px;
            border-radius:50%;background:radial-gradient(circle,rgba(192,39,45,0.06),transparent);
            top:${Math.random()*100}%;left:${Math.random()*100}%;
            animation:float ${3+i}s ease-in-out ${i*0.5}s infinite alternate"></div>
        `).join('')}
      </div>
      <div class="container hero-content" style="padding-top:var(--space-20);padding-bottom:var(--space-20)">
        <div style="max-width:720px">
          <div class="section-label animate-fadeInDown">${t('home.hero.tag')} · Oslo Liftutleie</div>
          <h1 style="font-family:var(--font-heading);font-size:var(--text-hero);font-weight:900;line-height:1.05;margin-bottom:1.5rem;color:#fff" class="animate-fadeInUp delay-100">
            ${t('home.hero.title').replace('\n', '<br>')}
          </h1>
          <p style="font-size:var(--text-lg);color:var(--color-text-secondary);max-width:560px;line-height:1.7;margin-bottom:2.5rem" class="animate-fadeInUp delay-200">
            ${t('home.hero.subtitle')}
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center" class="animate-fadeInUp delay-300">
            <a href="${isLoggedIn ? '#/catalog' : '#/register'}" class="btn btn-primary btn-xl hover-glow-red">
              🚀 ${t('home.hero.cta')}
            </a>
            <a href="#/catalog" class="btn btn-ghost btn-lg">
              ${t('home.hero.cta2')} →
            </a>
          </div>
          <!-- Trust badges -->
          <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:2.5rem" class="animate-fadeInUp delay-400">
            ${[
              { icon: '🏅', text: t('home.hero.badge1') },
              { icon: '💳', text: t('home.hero.badge2') },
              { icon: '🔒', text: t('home.hero.badge3') },
            ].map(b => `
              <div class="glass-light" style="padding:0.5rem 1rem;border-radius:var(--radius-full);display:flex;align-items:center;gap:0.5rem;font-size:var(--text-xs);font-weight:600;color:var(--color-text-secondary)">
                <span>${b.icon}</span><span>${b.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <!-- Scroll indicator -->
      <div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);animation:bounce-dot 2s infinite;color:var(--color-text-muted);font-size:1.5rem">↓</div>
    </section>

    <!-- STATS SECTION -->
    <section style="background:var(--color-surface);border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border);padding:var(--space-12) 0">
      <div class="container">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--space-6)">
          ${[
            { value: '140+', label: t('home.stats.courses'), icon: '🏗️' },
            { value: '2,400+', label: t('home.stats.certs'), icon: '📜' },
            { value: '85+', label: t('home.stats.companies'), icon: '🏢' },
            { value: '94%', label: t('home.stats.pass_rate'), icon: '✅' },
          ].map((s, i) => `
            <div class="animate-fadeInUp delay-${(i+1)*100}" style="text-align:center">
              <div style="font-size:2rem;margin-bottom:0.5rem">${s.icon}</div>
              <div style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;color:var(--color-gold);margin-bottom:0.25rem">${s.value}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="section" style="background:var(--color-bg)">
      <div class="container">
        <div class="section-header" style="text-align:center">
          <div class="section-label" style="justify-content:center">Slik fungerer det</div>
          <h2 class="section-title">Fra QR-kode til diplom<br><span class="text-gradient-gold">på under én time</span></h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-6);margin-top:var(--space-8)">
          ${[
            { step:'01', icon:'📱', title:'Skann QR', desc:'Skann QR-koden på maskinen eller søk i katalogen for å finne riktig opplæring.' },
            { step:'02', icon:'💳', title:'Betal', desc:'299 NOK per typegodkjenning. Kortbetaling, Vipps eller faktura for bedrifter.' },
            { step:'03', icon:'📖', title:'Les manualen', desc:'Gå gjennom sikkerhetsmanualen og se instruksjonsvideoer på din mobil.' },
            { step:'04', icon:'✍️', title:'Test & Signer', desc:'Bestå 3-4 sikkerhetsspørsmål og signer digitalt — klar på sekunder.' },
            { step:'05', icon:'🏆', title:'Få diplom', desc:'Få offisielt diplom tilsendt på e-post. Del på CV og LinkedIn.' },
          ].map((s, i) => `
            <div class="card card-interactive hover-lift animate-fadeInUp delay-${(i+1)*100}" style="position:relative;overflow:visible">
              <div style="position:absolute;top:-1rem;left:1.5rem;font-family:var(--font-heading);font-size:0.7rem;font-weight:900;color:var(--color-primary);letter-spacing:0.1em;opacity:0.7">${s.step}</div>
              <div class="card-body" style="text-align:center;padding-top:var(--space-8)">
                <div style="font-size:2.5rem;margin-bottom:var(--space-4)">${s.icon}</div>
                <h3 style="font-family:var(--font-heading);font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-3)">${s.title}</h3>
                <p style="color:var(--color-text-secondary);font-size:var(--text-sm);line-height:1.7">${s.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- CATEGORIES PREVIEW -->
    <section class="section" style="background:var(--color-bg-alt)">
      <div class="container">
        <div class="section-header" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:1rem">
          <div>
            <div class="section-label">Utstyrskategorier</div>
            <h2 class="section-title" style="margin-bottom:0">Finn din maskin</h2>
          </div>
          <a href="#/catalog" class="btn btn-ghost">Se alle 140+ →</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-5);margin-top:var(--space-8)">
          ${[
            { icon:'✂️', name:'Sakselifter', nameEn:'Scissor Lift', count:18, img:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=60', cat:'Lifter' },
            { icon:'💥', name:'Bomlifter', nameEn:'Boom Lift', count:24, img:'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=400&q=60', cat:'Lifter' },
            { icon:'🚛', name:'Billifter', nameEn:'Vehicle Lift', count:12, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=60', cat:'Lifter' },
            { icon:'🏗️', name:'Anleggsmaskiner', nameEn:'Construction Machines', count:22, img:'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=60', cat:'Maskiner' },
            { icon:'🏚️', name:'Minikran', nameEn:'Mini Crane', count:8, img:'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=400&q=60', cat:'Truck/Minikran' },
            { icon:'🔧', name:'Stillas', nameEn:'Scaffolding', count:15, img:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=60', cat:'Maskiner' },
          ].map((cat, i) => `
            <a href="#/catalog?cat=${encodeURIComponent(cat.cat)}" class="card card-interactive hover-lift animate-fadeInUp delay-${(i+1)*100}" style="display:block;text-decoration:none;overflow:hidden">
              <div style="height:160px;overflow:hidden;position:relative">
                <img src="${cat.img}" alt="${cat.name}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease" class="equipment-card-image" loading="lazy" />
                <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(11,22,35,0.85),transparent)"></div>
                <div style="position:absolute;bottom:var(--space-3);left:var(--space-4)">
                  <span class="badge badge-gray">${cat.count} kurs</span>
                </div>
              </div>
              <div class="card-body" style="padding:var(--space-4)">
                <div style="display:flex;align-items:center;gap:var(--space-3)">
                  <span style="font-size:1.5rem">${cat.icon}</span>
                  <div>
                    <div style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-md)">${I18n.lang === 'no' ? cat.name : cat.nameEn}</div>
                    <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${cat.cat}</div>
                  </div>
                  <span style="margin-left:auto;color:var(--color-gold);font-size:1.2rem">→</span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- PRICING SECTION -->
    <section class="section" style="background:var(--color-bg)">
      <div class="container-sm" style="text-align:center">
        <div class="section-label" style="justify-content:center">Priser</div>
        <h2 class="section-title">Enkel og transparent<br><span class="text-gradient-red">prising</span></h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);margin-top:var(--space-10)">
          <!-- Per Course -->
          <div class="card" style="position:relative;padding:var(--space-8)">
            <div style="font-size:2.5rem;margin-bottom:var(--space-4)">⚡</div>
            <h3 style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:800;margin-bottom:var(--space-2)">Per Kurs</h3>
            <div style="font-family:var(--font-heading);font-size:var(--text-4xl);font-weight:900;color:var(--color-gold);margin:var(--space-4) 0">
              299 <span style="font-size:var(--text-lg);color:var(--color-text-muted)">NOK</span>
            </div>
            <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-6)">inkl. 25% MVA · Livstidstilgang</p>
            <ul style="display:flex;flex-direction:column;gap:var(--space-3);text-align:left;margin-bottom:var(--space-6)">
              ${['✅ Øyeblikkelig tilgang', '✅ Diplom + digital signatur', '✅ Del til CV', '✅ Kortbetaling / Vipps'].map(f => `
                <li style="font-size:var(--text-sm);color:var(--color-text-secondary)">${f}</li>
              `).join('')}
            </ul>
            <a href="#/register" class="btn btn-primary btn-block">Kom i gang →</a>
          </div>
          <!-- Business -->
          <div class="card card-premium" style="position:relative;padding:var(--space-8)">
            <div style="position:absolute;top:var(--space-4);right:var(--space-4)" class="badge badge-gold">Populær</div>
            <div style="font-size:2.5rem;margin-bottom:var(--space-4)">🏢</div>
            <h3 style="font-family:var(--font-heading);font-size:var(--text-xl);font-weight:800;margin-bottom:var(--space-2)">Bedrift</h3>
            <div style="font-family:var(--font-heading);font-size:var(--text-4xl);font-weight:900;color:var(--color-gold);margin:var(--space-4) 0">
              Faktura <span style="font-size:var(--text-lg);color:var(--color-text-muted)">30 dager</span>
            </div>
            <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-6)">299 NOK/kurs · Kredittkjøp tilgjengelig</p>
            <ul style="display:flex;flex-direction:column;gap:var(--space-3);text-align:left;margin-bottom:var(--space-6)">
              ${['✅ Alt i Per Kurs', '✅ Felles faktura for hele teamet', '✅ Oversikt over teamets fremdrift', '✅ HSE-rapporter (PDF/CSV)', '✅ API-integrasjon (Winlet)'].map(f => `
                <li style="font-size:var(--text-sm);color:var(--color-text-secondary)">${f}</li>
              `).join('')}
            </ul>
            <a href="#/register" class="btn btn-gold btn-block">Kontakt oss →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA BANNER -->
    <section style="background:linear-gradient(135deg,var(--color-primary-dark),var(--color-primary));padding:var(--space-16) 0;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;opacity:0.1;background:url('hero_bg.png') center/cover"></div>
      <div class="container" style="text-align:center;position:relative">
        <h2 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;color:#fff;margin-bottom:1rem">
          Klar for å bli sertifisert?
        </h2>
        <p style="color:rgba(255,255,255,0.8);font-size:var(--text-lg);margin-bottom:2rem">
          Slut deg til 2 400+ sertifiserte operatører i dag.
        </p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
          <a href="#/register" class="btn btn-gold btn-xl hover-glow-gold">🚀 Start gratis registrering</a>
          <a href="#/catalog" class="btn btn-ghost btn-lg" style="border-color:rgba(255,255,255,0.3);color:white">Se kurskataloget</a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer style="background:var(--color-surface);border-top:1px solid var(--color-border);padding:var(--space-12) 0 var(--space-8)">
      <div class="container">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:var(--space-8);margin-bottom:var(--space-8)" class="grid-cols-1 grid-cols-4">
          <div>
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
              <div class="nav-logo-mark">OL</div>
              <div>
                <div class="nav-logo-name">Typeopplæring.no</div>
                <div class="nav-logo-tag">Oslo Liftutleie</div>
              </div>
            </div>
            <p style="color:var(--color-text-muted);font-size:var(--text-sm);line-height:1.7;max-width:280px">
              Norges ledende digitale plattform for typegodkjenning av tungt maskineri. Sikker, rask og lovpålagt.
            </p>
          </div>
          ${[
            { title:'Plattform', links:['Kurskataloget', 'Priser', 'For bedrifter', 'API'] },
            { title:'Support', links:['Hjelp', 'Kontakt', 'Personvern', 'Vilkår'] },
            { title:'Oslo Liftutleie', links:['Om oss', 'Lifter', 'Maskiner', 'Truck/Minikran'] },
          ].map(col => `
            <div>
              <h4 style="font-family:var(--font-heading);font-size:var(--text-sm);font-weight:700;margin-bottom:1rem;color:var(--color-text-primary)">${col.title}</h4>
              <ul style="display:flex;flex-direction:column;gap:0.5rem">
                ${col.links.map(l => `<li><a href="#" style="color:var(--color-text-muted);font-size:var(--text-sm);transition:color 0.15s" onmouseover="this.style.color='var(--color-gold)'" onmouseout="this.style.color='var(--color-text-muted)'">${l}</a></li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        <div class="divider"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
          <p style="color:var(--color-text-muted);font-size:var(--text-xs)">© 2024 Oslo Liftutleie AS. Alle rettigheter reservert. · Org.nr: 123 456 789 · Typeopplæring.no</p>
          <div style="display:flex;gap:1rem">
            ${['🇳🇴 Norsk', 'GDPR', 'Personvern'].map(l => `<span style="color:var(--color-text-muted);font-size:var(--text-xs)">${l}</span>`).join('<span style="color:var(--color-border)">·</span>')}
          </div>
        </div>
      </div>
    </footer>
  `;
}

function initHomeHandlers() {
  // Animate stats on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animate-fadeInUp');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-fadeInUp[class*="delay-"]').forEach(el => {
    observer.observe(el);
  });
}

// ── Not Found View ────────────────────────────────────────────────────────────
function renderNotFound() {
  return `
    <div class="empty-state min-h-screen">
      <div style="font-size:5rem">🔍</div>
      <h1 class="section-title">404 — Side ikke funnet</h1>
      <p class="empty-state-desc">Siden du leter etter finnes ikke. Gå tilbake til forsiden.</p>
      <a href="#/" class="btn btn-primary" style="margin-top:1.5rem">← Til forsiden</a>
    </div>`;
}

// ── Fallback view for unbuilt modules ─────────────────────────────────────────
function renderFallbackView(route, params) {
  const labels = {
    catalog: { icon: '📚', title: 'Kurskataloget', desc: 'Utforsk 140+ opplæringsmoduler for tungt maskineri.' },
    course: { icon: '📖', title: 'Kursleser', desc: 'Les sikkerhetsmanualen og fullfør opplæringen.' },
    payment: { icon: '💳', title: 'Betaling', desc: 'Betal og få tilgang til kurset.' },
    sign: { icon: '✍️', title: 'Digital Signering', desc: 'Signer digitalt for å fullføre sertifiseringen.' },
    certificate: { icon: '🏆', title: 'Ditt Diplom', desc: 'Se og del ditt offisielle typegodkjenningsbevis.' },
    profile: { icon: '👤', title: 'Min Profil', desc: 'Se dine kurs og diplomer.' },
    admin: { icon: '⚙️', title: 'Admin Dashboard', desc: 'Systemadministrasjon for Oslo Liftutleie.' },
    company: { icon: '🏢', title: 'Bedriftsportal', desc: 'Administrer teamets opplæring.' },
    qr: { icon: '📱', title: 'QR Skann', desc: 'Maskinopplæring via QR-kode.' },
    checklist: { icon: '✅', title: 'Forhåndskontroll', desc: 'Sjekk maskinen før bruk.' },
  };
  const info = labels[route] || { icon: '🔧', title: route, desc: 'Kommer snart' };
  return `
    <div style="padding:var(--space-8)">
      <div class="container-md">
        <div class="card card-premium" style="padding:var(--space-12);text-align:center">
          <div style="font-size:4rem;margin-bottom:var(--space-4)">${info.icon}</div>
          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:var(--space-3)">${info.title}</h2>
          <p style="color:var(--color-text-secondary);margin-bottom:var(--space-6)">${info.desc}</p>
          <div class="badge badge-gold" style="display:inline-flex;margin-bottom:var(--space-6)">Under utvikling — Fase ${Object.keys(labels).indexOf(route)+2}</div>
          <div><a href="#/" class="btn btn-ghost">← Tilbake til forsiden</a></div>
          ${params[0] ? `<p style="color:var(--color-text-muted);font-size:var(--text-xs);margin-top:1rem">Parameter: ${params.join('/')}</p>` : ''}
        </div>
      </div>
    </div>`;
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const App = {
  init() {
    Auth.init();
    I18n.applyAll();
    this.renderShell();
    this.setupEventListeners();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW:', e));
    }

    // Initial route
    Router.dispatch();

    // Handle hash changes
    window.addEventListener('hashchange', () => Router.dispatch());

    // Handle online/offline
    window.addEventListener('online', () => Toast.success('Tilkoblet til internett', '🌐 Online'));
    window.addEventListener('offline', () => Toast.warning('Jobber offline — noen funksjoner kan være begrenset', '📴 Offline'));
  },

  renderShell() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
      <!-- TOP NAVIGATION -->
      <nav class="top-nav" id="top-nav">
        <div class="nav-inner">
          <a href="#/" class="nav-logo" id="nav-logo">
            <div class="nav-logo-mark">OL</div>
            <div class="nav-logo-text hide-mobile">
              <span class="nav-logo-name">Typeopplæring.no</span>
              <span class="nav-logo-tag">Oslo Liftutleie</span>
            </div>
          </a>

          <!-- Desktop Nav Links -->
          <div class="nav-links" id="nav-links">
            <a href="#/" class="nav-link" data-route="home" data-i18n="nav.home">Hjem</a>
            <a href="#/catalog" class="nav-link" data-route="catalog" data-i18n="nav.catalog">Kurskataloget</a>
            <a href="#/profile" class="nav-link nav-auth-only" data-route="profile" data-i18n="nav.my_courses">Mine Kurs</a>
            <a href="#/admin" class="nav-link nav-admin-only" data-route="admin" data-i18n="nav.admin">Admin</a>
            <a href="#/company" class="nav-link nav-manager-only" data-route="company" data-i18n="nav.company">Bedrift</a>
          </div>

          <div class="nav-actions">
            <button class="nav-lang-toggle" id="lang-toggle" onclick="window.__app?.toggleLang()">🇬🇧 EN</button>
            <div id="nav-auth-area"></div>
            <div class="nav-hamburger" id="nav-hamburger" onclick="window.__app?.toggleDrawer()">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </nav>

      <!-- MAIN CONTENT -->
      <main id="main-content">
        <div id="view-container"></div>
      </main>

      <!-- BOTTOM NAVIGATION (Mobile) -->
      <nav class="bottom-nav" id="bottom-nav">
        <div class="bottom-nav-items">
          <a href="#/" class="bottom-nav-item" data-route="home" id="bnav-home">
            <span class="nav-icon">🏠</span>
            <span class="nav-label" data-i18n="nav.home">Hjem</span>
          </a>
          <a href="#/catalog" class="bottom-nav-item" data-route="catalog" id="bnav-catalog">
            <span class="nav-icon">📚</span>
            <span class="nav-label" data-i18n="nav.catalog">Katalog</span>
          </a>
          <a href="#/profile" class="bottom-nav-item nav-auth-only" data-route="profile" id="bnav-profile">
            <span class="nav-icon">🎓</span>
            <span class="nav-label" data-i18n="nav.my_courses">Mine kurs</span>
          </a>
          <a href="#/profile" class="bottom-nav-item nav-auth-only" data-route="diplomas" id="bnav-diplomas">
            <span class="nav-icon">🏆</span>
            <span class="nav-label" data-i18n="nav.diplomas">Diplomer</span>
          </a>
          <a href="#/login" class="bottom-nav-item nav-guest-only" data-route="login" id="bnav-login">
            <span class="nav-icon">👤</span>
            <span class="nav-label" data-i18n="nav.login">Logg inn</span>
          </a>
        </div>
      </nav>

      <!-- SIDE DRAWER (Mobile Menu) -->
      <div class="drawer-overlay" id="drawer-overlay" onclick="window.__app?.closeDrawer()"></div>
      <div class="drawer" id="side-drawer">
        <div class="drawer-header">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <div class="nav-logo-mark" style="width:32px;height:32px;font-size:0.75rem">OL</div>
            <span style="font-size:var(--text-sm);font-weight:700">Typeopplæring.no</span>
          </div>
          <div class="drawer-close" onclick="window.__app?.closeDrawer()">✕</div>
        </div>
        <div class="drawer-nav" id="drawer-nav"></div>
        <div class="drawer-footer" id="drawer-footer"></div>
      </div>

      <!-- TOAST CONTAINER -->
      <div class="toast-container" id="toast-container"></div>
    `;
  },

  updateNav() {
    const isLoggedIn = Auth.isLoggedIn();
    const isAdmin = Auth.isAdmin();
    const isManager = Auth.isManager();
    const { route } = Router.parseHash();
    const user = Auth.user;

    // Auth area (desktop)
    const authArea = document.getElementById('nav-auth-area');
    if (authArea) {
      if (isLoggedIn && user) {
        authArea.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.5rem">
            <a href="#/profile" class="nav-avatar" title="${user.name}">${user.avatar || I18n.t ? user.name?.slice(0,2).toUpperCase() : '??'}</a>
          </div>`;
      } else {
        authArea.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.5rem">
            <a href="#/login" class="btn btn-ghost btn-sm hide-mobile">Logg inn</a>
            <a href="#/register" class="btn btn-primary btn-sm">Registrer</a>
          </div>`;
      }
    }

    // Show/hide auth-dependent nav items
    document.querySelectorAll('.nav-auth-only').forEach(el => {
      el.style.display = isLoggedIn ? '' : 'none';
    });
    document.querySelectorAll('.nav-guest-only').forEach(el => {
      el.style.display = isLoggedIn ? 'none' : '';
    });
    document.querySelectorAll('.nav-admin-only').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
    document.querySelectorAll('.nav-manager-only').forEach(el => {
      el.style.display = isManager ? '' : 'none';
    });

    // Active nav highlighting
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route ||
        (route === '' && el.dataset.route === 'home'));
    });

    // Scroll handler for nav
    const nav = document.getElementById('top-nav');
    const handleScroll = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Drawer nav items
    this.updateDrawerNav(isLoggedIn, isAdmin, isManager, user);
  },

  updateDrawerNav(isLoggedIn, isAdmin, isManager, user) {
    const drawerNav = document.getElementById('drawer-nav');
    const drawerFooter = document.getElementById('drawer-footer');
    if (!drawerNav) return;

    const items = [
      { icon: '🏠', label: 'Hjem', href: '#/', key: 'nav.home', always: true },
      { icon: '📚', label: 'Kurskataloget', href: '#/catalog', key: 'nav.catalog', always: true },
      { icon: '📖', label: 'Mine Kurs', href: '#/profile', key: 'nav.my_courses', auth: true },
      { icon: '🏆', label: 'Mine Diplomer', href: '#/profile/diplomas', key: 'nav.diplomas', auth: true },
      { icon: '🏢', label: 'Bedriftsportal', href: '#/company', key: 'nav.company', manager: true },
      { icon: '⚙️', label: 'Admin', href: '#/admin', key: 'nav.admin', admin: true },
    ];

    drawerNav.innerHTML = items.filter(item =>
      item.always || (item.auth && isLoggedIn) ||
      (item.manager && isManager) || (item.admin && isAdmin)
    ).map(item => `
      <a href="${item.href}" class="drawer-nav-item" onclick="window.__app?.closeDrawer()">
        <span class="item-icon">${item.icon}</span>
        <span data-i18n="${item.key}">${item.label}</span>
      </a>
    `).join('');

    if (drawerFooter) {
      drawerFooter.innerHTML = isLoggedIn && user ? `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
          <div class="avatar avatar-md">${user.avatar || user.name?.slice(0,2).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm)">${user.name}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${user.email}</div>
          </div>
        </div>
        <button onclick="window.__app?.logout()" class="btn btn-ghost btn-sm btn-block" style="color:var(--color-danger)">🚪 Logg ut</button>
      ` : `
        <a href="#/login" class="btn btn-primary btn-block" onclick="window.__app?.closeDrawer()">Logg inn</a>
        <a href="#/register" class="btn btn-ghost btn-block" style="margin-top:0.5rem" onclick="window.__app?.closeDrawer()">Registrer deg</a>
      `;
    }
  },

  toggleDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('side-drawer');
    const hamburger = document.getElementById('nav-hamburger');
    const isOpen = drawer?.classList.contains('open');
    overlay?.classList.toggle('open', !isOpen);
    drawer?.classList.toggle('open', !isOpen);
    hamburger?.classList.toggle('open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  },

  closeDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('side-drawer');
    const hamburger = document.getElementById('nav-hamburger');
    overlay?.classList.remove('open');
    drawer?.classList.remove('open');
    hamburger?.classList.remove('open');
    document.body.style.overflow = '';
  },

  toggleLang() {
    I18n.toggle();
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = I18n.lang === 'no' ? '🇬🇧 EN' : '🇳🇴 NO';
    Toast.info(I18n.lang === 'no' ? 'Byttet til norsk' : 'Switched to English');
  },

  logout() {
    this.closeDrawer();
    Auth.logout();
    Toast.info('Du er logget ut');
  },

  setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDrawer();
    });

    // Handle links that should not trigger hash change
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        const href = link.getAttribute('href');
        if (href !== window.location.hash) {
          this.closeDrawer();
        }
      }
    });
  },
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────
window.__app = App;
window.addEventListener('DOMContentLoaded', () => App.init());

export default App;
