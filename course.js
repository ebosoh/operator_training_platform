/**
 * course.js — Course Runner (Phase 4)
 * Typeopplæring.no Safety Training Platform
 * GitHub Pages compatible — no server-side rendering
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Store, Toast, $ } from './utils.js';

// ── Course Runner View ────────────────────────────────────────────────────────
export async function renderCourse(params) {
  const equipmentId = params[0];
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  if (!equipmentId) {
    return { html: notFoundHtml(t('assess.not_found'), '#/catalog'), init: () => {} };
  }

  // Load equipment + course content + enrollment
  let equipment = null, courseContent = null, enrollment = null;
  try {
    [equipment, courseContent] = await Promise.all([
      API.getEquipmentById(equipmentId),
      API.getCourseContent(equipmentId),
    ]);
    // Find existing enrollment
    const userId = Auth.getUserId();
    if (userId) {
      const profile = await API.getProfile(userId);
      enrollment = profile.enrollments?.find(e => e.equipmentId === equipmentId) || null;
    }
  } catch (err) {
    console.warn('Course load error:', err);
    return { html: notFoundHtml(I18n.lang === 'no' ? 'Kunne ikke laste kurset' : 'Could not load course', '#/catalog'), init: () => {} };
  }

  // Redirect to payment if not paid
  if (!enrollment?.paid) {
    setTimeout(() => { window.location.hash = `#/payment/${equipmentId}`; }, 100);
    return { html: `<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">💳</div><h2>${t('course.redirect_payment')}</h2></div>`, init: () => {} };
  }

  const sections = courseContent.sections || [];
  const totalPages = sections.length;
  const currentPage = enrollment.currentPage || 0;
  const readPages = Store.get(`course_read_${enrollmentId(enrollment)}`) || [];
  const eqName = lang === 'no' ? equipment.nameNo : equipment.name;

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh" id="course-wrapper">

        <!-- Course Header Bar -->
        <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:var(--space-3) 0;position:sticky;top:var(--nav-height);z-index:var(--z-sticky)">
          <div class="container">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)">
              <div style="display:flex;align-items:center;gap:var(--space-3);min-width:0;flex:1">
                <a href="#/equipment/${equipmentId}" style="color:var(--color-text-muted);text-decoration:none;flex-shrink:0;font-size:1.2rem">←</a>
                <div style="min-width:0">
                  <div style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eqName}</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted)" id="course-page-label">${t('course.page')} 1 ${t('course.of')} ${totalPages}</div>
                </div>
              </div>

              <!-- Progress -->
              <div style="flex:1;max-width:200px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('course.progress')}</span>
                  <span style="font-size:var(--text-xs);font-weight:700;color:var(--color-gold)" id="course-progress-pct">0%</span>
                </div>
                <div class="progress progress-sm">
                  <div class="progress-fill" id="course-progress-bar" style="width:0%"></div>
                </div>
              </div>

              <!-- Notes & Offline toggle -->
              <div style="display:flex;align-items:center;gap:var(--space-2);flex-shrink:0">
                ${Auth.isAdmin() ? `
                  <button class="btn btn-ghost btn-sm btn-icon" id="course-admin-edit-btn" title="${lang === 'no' ? 'Rediger kurs' : 'Edit Course'}" style="font-size:1rem">✏️</button>
                ` : ''}
                ${equipment.pdfUrl ? `
                  <a href="${equipment.pdfUrl}" target="_blank" class="btn btn-primary btn-sm hover-glow-red" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-size:var(--text-xs);font-weight:700;padding:var(--space-2) var(--space-3);height:auto" title="${lang === 'no' ? 'Last ned PDF' : 'Download PDF'}">
                    📥 PDF
                  </a>
                ` : ''}
                <button class="btn btn-ghost btn-sm btn-icon" id="notes-toggle-btn" title="Mine notater" style="font-size:1rem">📝</button>
                <div class="badge badge-green" id="offline-badge" style="display:none;font-size:var(--text-xs)">✓ Offline</div>
              </div>
            </div>
          </div>
        </div>

        <div class="container" style="padding-top:var(--space-6);padding-bottom:var(--space-16);max-width:800px">
          <div style="display:grid;grid-template-columns:1fr;gap:var(--space-6)" id="course-layout">

            <!-- Section Navigation (TOC) -->
            <div id="course-toc" class="card" style="display:none">
               <div class="card-header">
                <h3 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-sm)">${t('course.toc')}</h3>
                <button onclick="document.getElementById('course-toc').style.display='none'" style="color:var(--color-text-muted);font-size:1rem;background:none;border:none;cursor:pointer">✕</button>
              </div>
              <div class="card-body" style="padding:var(--space-3)">
                ${sections.map((s, i) => `
                  <button class="toc-item" data-page="${i}" style="width:100%;text-align:left;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);border:none;background:transparent;color:var(--color-text-secondary);font-size:var(--text-sm);cursor:pointer;display:flex;align-items:center;gap:var(--space-3);transition:all 0.15s;margin-bottom:2px">
                    <span id="toc-status-${i}" style="font-size:0.9rem;flex-shrink:0">${readPages.includes(i) ? '✅' : '○'}</span>
                    <span>${lang === 'no' ? s.title : (s.titleEn || s.title)}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Main Content Area -->
            <div>
              <!-- Section Content Card -->
              <div class="card animate-fadeInUp" id="section-card">
                <div class="card-body" id="section-content" style="padding:var(--space-8);font-size:var(--text-md);line-height:1.8;color:var(--color-text-secondary)">
                   <!-- Injected by JS -->
                </div>

                <!-- Read Confirmation -->
                <div class="card-footer" id="read-confirm-area" style="background:rgba(0,0,0,0.2);padding:var(--space-5) var(--space-6)">
                  <label class="form-checkbox" id="read-confirm-label" style="cursor:pointer;user-select:none">
                    <input type="checkbox" id="read-confirm-check" />
                    <span class="checkbox-label" style="font-weight:500;font-size:var(--text-sm)">${t('course.read_confirm')}</span>
                  </label>
                </div>
              </div>

              <!-- Video Section (if available) -->
              <div id="video-section" class="card animate-fadeInUp delay-100" style="display:none;margin-top:var(--space-4)">
                <div class="card-header">
                  <h4 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-sm)">🎬 ${t('course.video_label')}</h4>
                </div>
                <div class="card-body" style="padding:0">
                  <div style="position:relative;aspect-ratio:16/9;background:#000">
                    <iframe id="course-video" style="width:100%;height:100%;border:none" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                  </div>
                  <!-- Playlist tabs if more than one video -->
                  <div id="video-playlist-tabs" style="display:none;padding:var(--space-3);background:rgba(0,0,0,0.05);border-top:1px solid var(--color-border);overflow-x:auto;white-space:nowrap;gap:var(--space-2)"></div>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div style="display:flex;gap:var(--space-3);align-items:center;justify-content:space-between;margin-top:var(--space-6)" id="course-nav">
                <button class="btn btn-ghost" id="btn-prev-page" style="gap:0.5rem">← ${t('course.prev')}</button>

                <button class="btn btn-ghost btn-sm" id="toc-toggle-btn" style="font-size:var(--text-xs)">${t('course.toc_toggle')}</button>

                <button class="btn btn-primary" id="btn-next-page" disabled style="gap:0.5rem">${t('course.next')} →</button>
              </div>

              <!-- Final CTA: Start Assessment -->
              <div id="start-test-area" class="card card-premium animate-scaleIn" style="display:none;margin-top:var(--space-6);text-align:center;padding:var(--space-8)">
                <div style="font-size:3rem;margin-bottom:var(--space-4)">🎉</div>
                <h3 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;margin-bottom:var(--space-3)">${t('course.read_completed')}</h3>
                <p style="color:var(--color-text-secondary);margin-bottom:var(--space-6)">${t('course.read_completed_desc').replace('{{count}}', totalPages)}</p>
                <a href="#/assessment/${equipmentId}" class="btn btn-gold btn-xl hover-glow-gold">
                  🧪 ${t('course.start_test')} →
                </a>
              </div>
            </div>

            <!-- Notes Panel -->
            <div id="notes-panel" class="card animate-slideInRight" style="display:none">
              <div class="card-header">
                <h4 style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-sm)">📝 ${t('course.notes_label')}</h4>
                <button onclick="document.getElementById('notes-panel').style.display='none'" style="color:var(--color-text-muted);font-size:1rem;background:none;border:none;cursor:pointer">✕</button>
              </div>
              <div class="card-body">
                <textarea id="course-notes" class="form-textarea" style="min-height:200px;font-size:var(--text-sm)" placeholder="${t('course.notes_ph')}"></textarea>
                <button class="btn btn-ghost btn-sm btn-block" style="margin-top:var(--space-3)" id="save-notes-btn">${t('course.notes_save')}</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `,
    init: () => initCourseHandlers({ equipment, sections, enrollment, equipmentId, totalPages, readPages, lang }),
  };
}

function enrollmentId(enrollment) {
  return enrollment?.id || 'guest';
}

function initCourseHandlers({ equipment, sections, enrollment, equipmentId, totalPages, readPages, lang }) {
  let currentPage = enrollment?.currentPage || 0;
  let localReadPages = [...readPages];

  // ── Render Section ──────────────────────────────────────────────────────────
  function renderSection(pageIndex) {
    const section = sections[pageIndex];
    if (!section) return;

    const title = lang === 'no' ? section.title : (section.titleEn || section.title);

    // Update content
    const contentEl = document.getElementById('section-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="margin-bottom:var(--space-6)">
          <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--space-2)">
            ${I18n.t('course.page')} ${pageIndex + 1} ${I18n.t('course.of')} ${totalPages}
          </div>
          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:800;color:var(--color-text-primary);margin-bottom:var(--space-6)">${title}</h2>
          <div class="course-content-body">${section.content}</div>
        </div>
      `;
      // Animate in
      contentEl.style.opacity = '0';
      contentEl.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => {
        contentEl.style.transition = 'all 0.35s cubic-bezier(0.4,0,0.2,1)';
        contentEl.style.opacity = '1';
        contentEl.style.transform = 'translateY(0)';
      });
    }

    // Update page label
    const label = document.getElementById('course-page-label');
    if (label) label.textContent = `${I18n.t('course.page')} ${pageIndex + 1} ${I18n.t('course.of')} ${totalPages}`;

    // Update progress
    const pct = Math.round((localReadPages.length / totalPages) * 100);
    const bar = document.getElementById('course-progress-bar');
    const pctEl = document.getElementById('course-progress-pct');
    if (bar) bar.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;

    // Reset read confirm
    const check = document.getElementById('read-confirm-check');
    if (check) {
      check.checked = localReadPages.includes(pageIndex);
      check.disabled = localReadPages.includes(pageIndex);
    }

    // Update nav buttons
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    if (prevBtn) prevBtn.disabled = pageIndex === 0;
    if (nextBtn) {
      const canNext = localReadPages.includes(pageIndex);
      nextBtn.disabled = !canNext;
      nextBtn.textContent = pageIndex === totalPages - 1
        ? (localReadPages.includes(pageIndex) ? (I18n.lang === 'no' ? '✅ Ferdig — start test' : '✅ Finished — start test') : `${I18n.t('course.next')} →`)
        : `${I18n.t('course.next')} →`;
    }

    // Show video if last section and equipment has video
    const videoSection = document.getElementById('video-section');
    if (videoSection && equipment.videoId && pageIndex === totalPages - 1) {
      videoSection.style.display = 'block';
      
      // Parse videos
      let videos = [];
      if (equipment.videoId.startsWith('[')) {
        try {
          videos = JSON.parse(equipment.videoId);
        } catch(e) {
          videos = [{ titleNo: 'Video 1', titleEn: 'Video 1', videoId: equipment.videoId }];
        }
      } else {
        videos = [{ titleNo: lang === 'no' ? 'Instruksjonsvideo' : 'Instructional Video', titleEn: 'Instructional Video', videoId: equipment.videoId }];
      }

      const videoFrame = document.getElementById('course-video');
      const playlistTabs = document.getElementById('video-playlist-tabs');
      
      if (videoFrame && videos.length > 0) {
        // Set default to first video
        videoFrame.src = `https://www.youtube.com/embed/${videos[0].videoId}?rel=0`;
        
        if (playlistTabs) {
          if (videos.length > 1) {
            playlistTabs.style.display = 'flex';
            playlistTabs.innerHTML = videos.map((vid, idx) => {
              const activeClass = idx === 0 ? 'btn-gold' : 'btn-ghost';
              const title = lang === 'no' ? vid.titleNo : vid.titleEn;
              return `<button class="btn btn-xs ${activeClass} video-tab-btn" data-videoid="${vid.videoId}" data-index="${idx}" style="padding:var(--space-2) var(--space-3)">🎬 ${title}</button>`;
            }).join('');
            
            // Add click listeners to switcher buttons
            playlistTabs.querySelectorAll('.video-tab-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                // Switch video
                const vId = btn.dataset.videoid;
                videoFrame.src = `https://www.youtube.com/embed/${vId}?autoplay=1&rel=0`;
                
                // Toggle active style
                playlistTabs.querySelectorAll('.video-tab-btn').forEach(b => {
                  b.classList.remove('btn-gold');
                  b.classList.add('btn-ghost');
                });
                btn.classList.remove('btn-ghost');
                btn.classList.add('btn-gold');
              });
            });
          } else {
            playlistTabs.style.display = 'none';
          }
        }
      }
    } else if (videoSection) {
      videoSection.style.display = 'none';
    }

    // Update TOC
    document.querySelectorAll('.toc-item').forEach((item, i) => {
      const isRead = localReadPages.includes(i);
      const isCurrent = i === pageIndex;
      item.style.background = isCurrent ? 'rgba(250,162,27,0.1)' : 'transparent';
      item.style.color = isCurrent ? 'var(--color-gold)' : (isRead ? 'var(--color-text-primary)' : 'var(--color-text-secondary)');
      const statusEl = document.getElementById(`toc-status-${i}`);
      if (statusEl) statusEl.textContent = isRead ? '✅' : (isCurrent ? '▶' : '○');
    });

    // Show/hide finish CTA
    const allRead = localReadPages.length >= totalPages;
    const finishArea = document.getElementById('start-test-area');
    const navArea = document.getElementById('course-nav');
    if (finishArea && navArea) {
      const isLast = pageIndex === totalPages - 1;
      finishArea.style.display = (isLast && allRead) ? 'block' : 'none';
    }

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Read Confirmation ───────────────────────────────────────────────────────
  const readCheck = document.getElementById('read-confirm-check');
  if (readCheck) {
    readCheck.addEventListener('change', async () => {
      if (readCheck.checked && !localReadPages.includes(currentPage)) {
        localReadPages.push(currentPage);
        Store.set(`course_read_${enrollmentId(enrollment)}`, localReadPages);

        // Update progress in backend
        const pct = Math.round((localReadPages.length / totalPages) * 100);
        if (enrollment) {
          await API.updateProgress(enrollment.id, {
            progress: pct,
            currentPage,
            status: pct < 100 ? 'reading' : 'assessment'
          }).catch(() => {});
        }

        // Check offline indicator
        const offlineBadge = document.getElementById('offline-badge');
        if (offlineBadge) offlineBadge.style.display = 'flex';
        setTimeout(() => { if (offlineBadge) offlineBadge.style.display = 'none'; }, 3000);

        // Update next button
        const nextBtn = document.getElementById('btn-next-page');
        if (nextBtn) nextBtn.disabled = false;

        // Update TOC
        const statusEl = document.getElementById(`toc-status-${currentPage}`);
        if (statusEl) statusEl.textContent = '✅';

        // Show progress update
        const pct2 = Math.round((localReadPages.length / totalPages) * 100);
        const bar = document.getElementById('course-progress-bar');
        const pctEl = document.getElementById('course-progress-pct');
        if (bar) bar.style.width = `${pct2}%`;
        if (pctEl) pctEl.textContent = `${pct2}%`;

        // If all read, show finish
        if (localReadPages.length >= totalPages) {
          const finishArea = document.getElementById('start-test-area');
          if (finishArea && currentPage === totalPages - 1) finishArea.style.display = 'block';
        }
      }
    });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderSection(currentPage);
    }
  });

  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderSection(currentPage);
    }
  });

  // TOC items
  document.querySelectorAll('.toc-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = parseInt(item.dataset.page);
      currentPage = page;
      renderSection(currentPage);
      document.getElementById('course-toc').style.display = 'none';
    });
  });

  // TOC toggle
  document.getElementById('toc-toggle-btn')?.addEventListener('click', () => {
    const toc = document.getElementById('course-toc');
    if (toc) toc.style.display = toc.style.display === 'none' ? 'block' : 'none';
  });

  // Notes toggle
  document.getElementById('notes-toggle-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('notes-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  // Notes save
  const noteKey = `course_notes_${equipmentId}`;
  const notesArea = document.getElementById('course-notes');
  if (notesArea) {
    notesArea.value = Store.get(noteKey) || '';
    notesArea.addEventListener('input', () => {
      Store.set(noteKey, notesArea.value);
    });
  }
  document.getElementById('save-notes-btn')?.addEventListener('click', () => {
    Store.set(noteKey, notesArea?.value || '');
    Toast.success(I18n.t('course.notes_saved'), '📝');
  });

  // Admin edit button click listener
  document.getElementById('course-admin-edit-btn')?.addEventListener('click', () => {
    sessionStorage.setItem('auto_edit_eq_id', equipmentId);
    window.location.hash = '#/admin/equipment';
  });

  // ── Initial Render ──────────────────────────────────────────────────────────
  renderSection(currentPage);

  // Keyboard navigation
  document.addEventListener('keydown', handleKeyNav);
  function handleKeyNav(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (!document.getElementById('btn-next-page')?.disabled) {
        currentPage = Math.min(currentPage + 1, totalPages - 1);
        renderSection(currentPage);
      }
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      currentPage = Math.max(currentPage - 1, 0);
      renderSection(currentPage);
    }
  }

  // Cleanup on route change
  window.addEventListener('hashchange', () => {
    document.removeEventListener('keydown', handleKeyNav);
  }, { once: true });
}

// ── Course Complete View ──────────────────────────────────────────────────────
export async function renderCourseComplete(params) {
  const equipmentId = params[0];
  let equipment = null;
  try { equipment = await API.getEquipmentById(equipmentId); } catch (_) {}
  const name = I18n.lang === 'no' ? equipment?.nameNo : equipment?.name;
  const courseName = name || (I18n.lang === 'no' ? 'Kurset' : 'The course');
  return {
    html: `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-bg);padding:var(--space-8)">
        <div style="max-width:520px;width:100%;text-align:center" class="animate-scaleIn">
          <div style="font-size:5rem;margin-bottom:var(--space-4)">🎓</div>
          <h1 style="font-family:var(--font-heading);font-size:var(--text-3xl);font-weight:900;margin-bottom:var(--space-3)">${I18n.t('course.complete.title')}</h1>
          <p style="color:var(--color-text-secondary);font-size:var(--text-md);margin-bottom:var(--space-6)">${I18n.t('course.complete.desc').replace('{{name}}', courseName)}</p>
          <a href="#/sign/${equipmentId}" class="btn btn-gold btn-xl btn-block" style="margin-bottom:var(--space-3)">${I18n.t('course.complete.btn_sign')}</a>
          <a href="#/catalog" class="btn btn-ghost btn-block">${I18n.t('course.complete.btn_catalog')}</a>
        </div>
      </div>`,
    init: () => {}
  };
}

function notFoundHtml(msg, backHref) {
  return `<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">⚠️</div><h2 class="empty-state-title">${msg}</h2><a href="${backHref}" class="btn btn-primary" style="margin-top:1rem">${I18n.lang === 'no' ? '← Tilbake' : '← Back'}</a></div>`;
}
