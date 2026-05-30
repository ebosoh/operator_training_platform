/**
 * assessment.js — Safety Test / Quiz Engine (Phase 4)
 * Typeopplæring.no Safety Training Platform
 */

import API from './api.js';
import I18n from './i18n.js';
import { Auth } from './auth.js';
import { Store, Toast, launchConfetti } from './utils.js';

const PASS_THRESHOLD = 80; // percent
const MAX_ATTEMPTS = 3;

export async function renderAssessment(params) {
  const equipmentId = params[0];
  const t = (k) => I18n.t(k);
  const lang = I18n.lang;

  if (!equipmentId) {
    return { html: '<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">⚠️</div><h2>Kurs ikke funnet</h2></div>', init: () => {} };
  }

  let equipment = null, questions = [], enrollment = null;
  try {
    [equipment, questions] = await Promise.all([
      API.getEquipmentById(equipmentId),
      API.getAssessmentQuestions(equipmentId),
    ]);
    const userId = Auth.getUserId();
    if (userId) {
      const profile = await API.getProfile(userId);
      enrollment = profile.enrollments?.find(e => e.equipmentId === equipmentId) || null;
    }
  } catch (err) {
    console.warn('Assessment load error:', err);
  }

  if (!enrollment?.paid) {
    setTimeout(() => { window.location.hash = `#/payment/${equipmentId}`; }, 100);
    return { html: '<div class="empty-state" style="min-height:80vh"><div class="empty-state-icon">💳</div><h2>Omdirigerer...</h2></div>', init: () => {} };
  }

  const eqName = lang === 'no' ? equipment?.nameNo : equipment?.name;
  const attemptsUsed = Store.get(`assess_attempts_${equipmentId}`) || 0;

  return {
    html: `
      <div style="background:var(--color-bg);min-height:100vh" id="assessment-wrapper">

        <!-- Assessment Header -->
        <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:var(--space-4) 0;position:sticky;top:var(--nav-height);z-index:var(--z-sticky)">
          <div class="container-sm">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-3)">
              <div>
                <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:2px">${eqName}</div>
                <h2 style="font-family:var(--font-heading);font-weight:800;font-size:var(--text-lg)">🧪 ${t('assess.title')}</h2>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-4)">
                <!-- Timer -->
                <div style="text-align:center">
                  <div style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:900;color:var(--color-gold)" id="timer-display">--:--</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Tid</div>
                </div>
                <!-- Attempts -->
                <div style="text-align:center">
                  <div style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:900;color:${attemptsUsed >= MAX_ATTEMPTS - 1 ? 'var(--color-danger)' : 'var(--color-text-primary)'}" id="attempts-display">${MAX_ATTEMPTS - attemptsUsed}</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted)">${t('assess.attempts_left')}</div>
                </div>
              </div>
            </div>
            <!-- Progress bar for questions -->
            <div class="progress progress-sm" style="margin-top:var(--space-3)">
              <div class="progress-fill" id="quiz-progress-bar" style="width:0%"></div>
            </div>
          </div>
        </div>

        <div class="container-sm" style="padding-top:var(--space-8);padding-bottom:var(--space-16)">

          <!-- Questions Form -->
          <form id="assessment-form" novalidate>
            <div id="questions-container">
              ${questions.map((q, i) => renderQuestion(q, i, lang)).join('')}
            </div>

            <!-- Required notice -->
            <p style="color:var(--color-text-muted);font-size:var(--text-xs);margin:var(--space-4) 0">
              * Alle spørsmål må besvares. Du trenger ${PASS_THRESHOLD}% for å bestå.
            </p>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-quiz-btn" style="margin-top:var(--space-4)">
              🧪 ${t('assess.submit')}
            </button>
          </form>

          <!-- Result Panel (hidden until submitted) -->
          <div id="result-panel" class="card animate-scaleIn" style="display:none;margin-top:var(--space-6)">
            <div class="card-body" style="padding:var(--space-8);text-align:center">
              <div id="result-icon" style="font-size:4rem;margin-bottom:var(--space-4)"></div>
              <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:900;margin-bottom:var(--space-2)" id="result-title"></h2>
              <p id="result-message" style="color:var(--color-text-secondary);margin-bottom:var(--space-6)"></p>

              <!-- Score Display -->
              <div style="display:flex;justify-content:center;gap:var(--space-8);margin-bottom:var(--space-6)">
                <div style="text-align:center">
                  <div style="font-family:var(--font-heading);font-size:var(--text-4xl);font-weight:900" id="result-score-display">0%</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.06em">${t('assess.score')}</div>
                </div>
                <div style="text-align:center">
                  <div style="font-family:var(--font-heading);font-size:var(--text-4xl);font-weight:900;color:var(--color-gold)">${PASS_THRESHOLD}%</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.06em">${t('assess.pass_score')}</div>
                </div>
              </div>

              <!-- Score ring -->
              <div style="position:relative;width:120px;height:120px;margin:0 auto var(--space-6)" id="score-ring-container"></div>

              <div id="result-actions"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    init: () => initAssessmentHandlers({ questions, enrollment, equipmentId, eqName, attemptsUsed }),
  };
}

function renderQuestion(q, index, lang) {
  const question = lang === 'no' ? q.question : (q.questionEn || q.question);
  const options = q.options || [];

  return `
    <div class="card animate-fadeInUp" style="margin-bottom:var(--space-4);animation-delay:${index * 80}ms" id="question-card-${index}">
      <div class="card-body" style="padding:var(--space-6)">
        <div style="display:flex;align-items:flex-start;gap:var(--space-3);margin-bottom:var(--space-5)">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-gold));display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:900;font-size:0.8rem;color:#fff;flex-shrink:0">${index + 1}</div>
          <p style="font-weight:600;font-size:var(--text-md);line-height:1.5;margin:0;padding-top:4px">${question}</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--space-2)" id="options-${index}">
          ${options.map((opt, oi) => `
            <label class="answer-option" data-question="${index}" data-option="${oi}"
              style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);border:1.5px solid var(--color-border);cursor:pointer;transition:all 0.15s;background:transparent">
              <input type="radio" name="q${index}" value="${oi}" style="display:none" />
              <div class="option-dot" style="width:20px;height:20px;border-radius:50%;border:2px solid var(--color-border);flex-shrink:0;transition:all 0.15s;display:flex;align-items:center;justify-content:center"></div>
              <span style="font-size:var(--text-sm);line-height:1.5">${opt}</span>
            </label>
          `).join('')}
        </div>

        <div id="question-feedback-${index}" style="display:none;margin-top:var(--space-3);padding:var(--space-3);border-radius:var(--radius-md);font-size:var(--text-sm)"></div>
      </div>
    </div>
  `;
}

function initAssessmentHandlers({ questions, enrollment, equipmentId, eqName, attemptsUsed }) {
  const answers = new Array(questions.length).fill(null);
  let timerInterval = null;
  let secondsElapsed = 0;
  let submitted = false;

  // ── Timer ─────────────────────────────────────────────────────────────────
  const timerEl = document.getElementById('timer-display');
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);

  // ── Answer Selection ──────────────────────────────────────────────────────
  document.querySelectorAll('.answer-option').forEach(option => {
    option.addEventListener('click', () => {
      if (submitted) return;
      const qIndex = parseInt(option.dataset.question);
      const oIndex = parseInt(option.dataset.option);

      answers[qIndex] = oIndex;

      // Update radio
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      // Update visual state in this question group
      const qOptions = document.querySelectorAll(`[data-question="${qIndex}"]`);
      qOptions.forEach(opt => {
        const isSelected = parseInt(opt.dataset.option) === oIndex;
        opt.style.borderColor = isSelected ? 'var(--color-gold)' : 'var(--color-border)';
        opt.style.background = isSelected ? 'rgba(250,162,27,0.08)' : 'transparent';
        const dot = opt.querySelector('.option-dot');
        if (dot) {
          dot.style.borderColor = isSelected ? 'var(--color-gold)' : 'var(--color-border)';
          dot.style.background = isSelected ? 'var(--color-gold)' : 'transparent';
          dot.innerHTML = isSelected ? '<span style="color:#0B1623;font-size:10px;font-weight:900">✓</span>' : '';
        }
      });

      // Update progress bar
      const answered = answers.filter(a => a !== null).length;
      const bar = document.getElementById('quiz-progress-bar');
      if (bar) bar.style.width = `${(answered / questions.length) * 100}%`;
    });
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  document.getElementById('assessment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitted) return;

    // Validate all answered
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      Toast.warning(`${unanswered} spørsmål gjenstår. Besvar alle for å levere.`, 'Ufullstendig');
      // Highlight unanswered
      answers.forEach((ans, i) => {
        if (ans === null) {
          const card = document.getElementById(`question-card-${i}`);
          if (card) {
            card.style.borderColor = 'var(--color-danger)';
            card.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.2)';
            setTimeout(() => {
              card.style.borderColor = '';
              card.style.boxShadow = '';
            }, 2000);
          }
        }
      });
      return;
    }

    const btn = document.getElementById('submit-quiz-btn');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    try {
      const newAttempts = attemptsUsed + 1;
      Store.set(`assess_attempts_${equipmentId}`, newAttempts);

      const result = await API.submitAssessment(enrollment?.id || 'guest', answers);

      submitted = true;
      clearInterval(timerInterval);

      // Show per-question feedback
      questions.forEach((q, i) => {
        const isCorrect = answers[i] === q.correct;
        const card = document.getElementById(`question-card-${i}`);
        const feedback = document.getElementById(`question-feedback-${i}`);
        const options = document.querySelectorAll(`[data-question="${i}"]`);

        if (card) {
          card.style.borderColor = isCorrect ? 'var(--color-success)' : 'var(--color-danger)';
        }

        // Highlight correct and wrong answers
        options.forEach(opt => {
          const oIndex = parseInt(opt.dataset.option);
          if (oIndex === q.correct) {
            opt.style.borderColor = 'var(--color-success)';
            opt.style.background = 'rgba(34,197,94,0.1)';
          } else if (oIndex === answers[i] && !isCorrect) {
            opt.style.borderColor = 'var(--color-danger)';
            opt.style.background = 'rgba(239,68,68,0.1)';
          }
        });

        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.background = isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
          feedback.style.border = `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`;
          feedback.style.color = isCorrect ? '#4ade80' : '#f87171';
          feedback.textContent = isCorrect ? '✅ Riktig svar!' : `❌ Riktig svar: "${q.options[q.correct]}"`;
        }
      });

      // Show result panel
      showResult(result, newAttempts, equipmentId, eqName);

    } catch (err) {
      Toast.error('Feil ved levering av besvarelse. Prøv igjen.', 'Feil');
    } finally {
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    }
  });

  // Cleanup
  window.addEventListener('hashchange', () => {
    clearInterval(timerInterval);
  }, { once: true });
}

function showResult(result, attempts, equipmentId, eqName) {
  const { score, passed, correct, total } = result;
  const t = (k) => I18n.t(k);
  const panel = document.getElementById('result-panel');
  if (!panel) return;

  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Icons and colors
  document.getElementById('result-icon').textContent = passed ? '🎉' : '📚';
  document.getElementById('result-title').textContent = passed ? t('assess.pass') : t('assess.fail');
  document.getElementById('result-title').style.color = passed ? 'var(--color-success)' : 'var(--color-danger)';
  document.getElementById('result-message').textContent = passed ? t('assess.pass_msg') : t('assess.fail_msg');

  // Score display
  const scoreEl = document.getElementById('result-score-display');
  if (scoreEl) {
    scoreEl.textContent = `${score}%`;
    scoreEl.style.color = passed ? 'var(--color-success)' : 'var(--color-danger)';
  }

  // Score ring (SVG)
  const ringContainer = document.getElementById('score-ring-container');
  if (ringContainer) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    ringContainer.innerHTML = `
      <svg viewBox="0 0 100 100" style="width:120px;height:120px;transform:rotate(-90deg)">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
        <circle cx="50" cy="50" r="45" fill="none"
          stroke="${passed ? 'var(--color-success)' : 'var(--color-danger)'}"
          stroke-width="8"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          stroke-linecap="round"
          id="score-ring-arc"
          style="transition:stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
        <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:900;color:${passed ? 'var(--color-success)' : 'var(--color-danger)'}">${score}%</div>
        <div style="font-size:0.6rem;color:var(--color-text-muted)">${correct}/${total}</div>
      </div>
    `;
    // Animate arc
    requestAnimationFrame(() => {
      setTimeout(() => {
        const arc = document.getElementById('score-ring-arc');
        if (arc) arc.style.strokeDashoffset = `${offset}`;
      }, 100);
    });
  }

  // Actions
  const actionsEl = document.getElementById('result-actions');
  if (actionsEl) {
    if (passed) {
      // Celebrate!
      launchConfetti(4000);
      actionsEl.innerHTML = `
        <a href="#/sign/${equipmentId}" class="btn btn-gold btn-xl btn-block hover-glow-gold" style="margin-bottom:var(--space-3)">
          ✍️ Signer og få diplom →
        </a>
        <a href="#/catalog" class="btn btn-ghost btn-block" style="font-size:var(--text-sm)">← Tilbake til katalog</a>
      `;
    } else {
      const attemptsLeft = MAX_ATTEMPTS - attempts;
      if (attemptsLeft > 0) {
        actionsEl.innerHTML = `
          <div class="badge badge-red" style="display:inline-flex;margin-bottom:var(--space-4)">${attemptsLeft} forsøk igjen</div>
          <br/>
          <button class="btn btn-primary btn-lg btn-block" style="margin-bottom:var(--space-3)" onclick="window.location.hash='#/course/${equipmentId}'">
            📖 Les manualen på nytt
          </button>
          <button class="btn btn-outline btn-block" onclick="location.reload()">
            🔄 ${t('assess.retry')}
          </button>
        `;
      } else {
        actionsEl.innerHTML = `
          <div class="badge badge-red" style="display:inline-flex;margin-bottom:var(--space-4)">Ingen forsøk igjen</div>
          <p style="color:var(--color-text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4)">Ta kontakt med Oslo Liftutleie for ny tilgang.</p>
          <a href="#/catalog" class="btn btn-ghost btn-block">← Tilbake til katalog</a>
        `;
      }
    }
  }
}
