/**
 * utils.js — Shared Utilities
 * Typeopplæring.no Safety Training Platform
 */

// ── Storage ──────────────────────────────────────────────────────────────────
export const Store = {
  set(key, val) {
    try { localStorage.setItem(`ol_${key}`, JSON.stringify(val)); } catch(e) {}
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(`ol_${key}`);
      return v ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(`ol_${key}`); } catch(e) {}
  },
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('ol_'))
      .forEach(k => localStorage.removeItem(k));
  }
};

// ── Formatters ───────────────────────────────────────────────────────────────
export const Format = {
  currency(amount, currency = 'NOK') {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency }).format(amount / 100);
  },
  date(dateStr, lang = 'no') {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat(lang === 'no' ? 'nb-NO' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(dateStr));
  },
  dateShort(dateStr, lang = 'no') {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat(lang === 'no' ? 'nb-NO' : 'en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date(dateStr));
  },
  initials(name) {
    return (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);
  },
  timeAgo(dateStr, lang = 'no') {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (lang === 'no') {
      if (mins < 2)    return 'akkurat nå';
      if (mins < 60)   return `${mins} min siden`;
      if (hours < 24)  return `${hours} timer siden`;
      if (days < 30)   return `${days} dager siden`;
      return Format.date(dateStr, lang);
    } else {
      if (mins < 2)    return 'just now';
      if (mins < 60)   return `${mins} min ago`;
      if (hours < 24)  return `${hours}h ago`;
      if (days < 30)   return `${days} days ago`;
      return Format.date(dateStr, lang);
    }
  }
};

// ── DOM Helpers ───────────────────────────────────────────────────────────────
export const $ = (selector, ctx = document) => ctx.querySelector(selector);
export const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'class') element.className = val;
    else if (key === 'html') element.innerHTML = val;
    else if (key === 'text') element.textContent = val;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), val);
    else element.setAttribute(key, val);
  });
  children.forEach(child => {
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else if (child instanceof Node) element.appendChild(child);
  });
  return element;
}

export function render(container, content) {
  if (typeof container === 'string') container = $(container);
  if (!container) return;
  if (typeof content === 'string') {
    container.innerHTML = content;
  } else if (content instanceof Node) {
    container.innerHTML = '';
    container.appendChild(content);
  }
}

// ── Toast Notifications ───────────────────────────────────────────────────────
export const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = el('div', { id: 'toast-container', class: 'toast-container' });
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', title = '', duration = 4000) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = el('div', { class: `toast ${type}` });
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-text">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div>${message}</div>
      </div>
      <span class="toast-close">✕</span>
    `;
    this.container.appendChild(toast);
    toast.querySelector('.toast-close').onclick = () => this.remove(toast);
    if (duration > 0) setTimeout(() => this.remove(toast), duration);
    return toast;
  },
  remove(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  },
  success(msg, title)  { return this.show(msg, 'success', title); },
  error(msg, title)    { return this.show(msg, 'error', title, 6000); },
  warning(msg, title)  { return this.show(msg, 'warning', title); },
  info(msg, title)     { return this.show(msg, 'info', title); },
};

// ── Modal Helper ─────────────────────────────────────────────────────────────
export const Modal = {
  show(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },
  hide(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  },
  create({ title, body, footer = '', id = `modal_${Date.now()}` }) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const overlay = el('div', { class: 'modal-overlay', id });
    overlay.innerHTML = `
      <div class="modal animate-scaleIn">
        <div class="modal-header">
          <h3 class="text-lg font-bold">${title}</h3>
          <button class="drawer-close modal-close-btn" onclick="document.getElementById('${id}').classList.remove('open'); document.body.style.overflow=''">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide(id);
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';
    return id;
  }
};

// ── Ripple Effect ─────────────────────────────────────────────────────────────
export function addRipple(element) {
  element.classList.add('ripple-container');
  element.addEventListener('click', (e) => {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = el('span', {
      class: 'ripple',
      style: `width:${size}px;height:${size}px;left:${x}px;top:${y}px`
    });
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────
export const Validate = {
  email(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  phone(v) { return /^[+\d\s\-()]{7,15}$/.test(v); },
  password(v) { return v && v.length >= 8; },
  required(v) { return v !== null && v !== undefined && String(v).trim() !== ''; },
  orgNo(v) { return /^\d{9}$/.test(v.replace(/\s/g, '')); },
};

// ── Debounce ──────────────────────────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── QR Code Generator (using QRCode.js CDN) ───────────────────────────────────
export function generateQRCode(containerId, text, options = {}) {
  const el = document.getElementById(containerId);
  if (!el || !window.QRCode) return;
  el.innerHTML = '';
  new window.QRCode(el, {
    text,
    width: options.width || 200,
    height: options.height || 200,
    colorDark: options.dark || '#0B1623',
    colorLight: options.light || '#FFFFFF',
    correctLevel: window.QRCode.CorrectLevel.H
  });
}

// ── Confetti ──────────────────────────────────────────────────────────────────
export function launchConfetti(duration = 3000) {
  const colors = ['#C0272D', '#FAA21B', '#22C55E', '#3B82F6', '#F59E0B', '#FFFFFF'];
  const particles = 60;
  const container = el('div', { style: 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden' });
  document.body.appendChild(container);

  for (let i = 0; i < particles; i++) {
    const particle = el('div', {
      style: `
        position:absolute;
        width:${Math.random() * 8 + 4}px;
        height:${Math.random() * 8 + 4}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}%;
        top:-10px;
        border-radius:${Math.random() > 0.5 ? '50%' : '0'};
        animation:confetti-fall ${Math.random() * 2 + 2}s ease-in ${Math.random() * duration/1000}s both;
        opacity:${Math.random() * 0.8 + 0.2};
      `
    });
    container.appendChild(particle);
  }
  setTimeout(() => container.remove(), duration + 3000);
}

// ── Scroll to Top ─────────────────────────────────────────────────────────────
export function scrollToTop(smooth = true) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

// ── Copy to Clipboard ─────────────────────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  }
}

// ── Share ─────────────────────────────────────────────────────────────────────
export async function shareContent(data) {
  if (navigator.share) {
    try { await navigator.share(data); return true; } catch(e) {}
  }
  // Fallback: copy URL
  if (data.url) await copyToClipboard(data.url);
  return false;
}

// ── Status Badge HTML ──────────────────────────────────────────────────────────
export function statusBadge(status, lang = 'no') {
  const map = {
    enrolled:           { class: 'badge-blue',    label_no: 'Påmeldt',     label_en: 'Enrolled' },
    reading:            { class: 'badge-pending',  label_no: 'Leser',       label_en: 'Reading' },
    assessment:         { class: 'badge-pending',  label_no: 'Test',        label_en: 'Testing' },
    assessment_passed:  { class: 'badge-green',    label_no: 'Test bestått',label_en: 'Test Passed' },
    awaiting_signature: { class: 'badge-gold',     label_no: 'Venter sig.', label_en: 'Awaiting Sig.' },
    awaiting_oslo_sig:  { class: 'badge-gold',     label_no: 'Venter OL',   label_en: 'Awaiting OL' },
    certified:          { class: 'badge-completed',label_no: 'Sertifisert', label_en: 'Certified' },
    failed:             { class: 'badge-red',      label_no: 'Ikke bestått',label_en: 'Failed' },
    payment_pending:    { class: 'badge-gray',     label_no: 'Betaling',    label_en: 'Payment' },
  };
  const s = map[status] || { class: 'badge-gray', label_no: status, label_en: status };
  const label = lang === 'no' ? s.label_no : s.label_en;
  return `<span class="badge ${s.class}">${label}</span>`;
}

// ── Role Badge HTML ────────────────────────────────────────────────────────────
export function roleBadge(role, lang = 'no') {
  const map = {
    admin:    { class: 'badge-admin',   label_no: 'Admin',    label_en: 'Admin' },
    manager:  { class: 'badge-manager', label_no: 'Leder',    label_en: 'Manager' },
    operator: { class: 'badge-operator',label_no: 'Operatør', label_en: 'Operator' },
  };
  const r = map[role] || { class: 'badge-gray', label_no: role, label_en: role };
  return `<span class="badge ${r.class}">${lang === 'no' ? r.label_no : r.label_en}</span>`;
}

// ── Loading Overlay ────────────────────────────────────────────────────────────
export const Loader = {
  overlay: null,
  show(message = '') {
    if (this.overlay) return;
    this.overlay = el('div', {
      style: 'position:fixed;inset:0;background:rgba(11,22,35,0.85);backdrop-filter:blur(4px);z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem'
    });
    this.overlay.innerHTML = `
      <div class="spinner spinner-lg"></div>
      ${message ? `<p style="color:var(--color-text-secondary);font-size:var(--text-sm)">${message}</p>` : ''}
    `;
    document.body.appendChild(this.overlay);
  },
  hide() {
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
  }
};
