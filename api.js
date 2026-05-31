import I18n from './i18n.js';
import { Modal, Store } from './utils.js';

/**
 * api.js — API Abstraction Layer
 * Typeopplæring.no Safety Training Platform
 * 
 * Wraps Google Apps Script Web App endpoints.
 * Designed for easy migration to Firebase.
 */

// ── Config ──────────────────────────────────────────────────────────────────
const API_CONFIG = {
  // Replace with your deployed Apps Script URL
  BASE_URL: 'https://script.google.com/macros/s/AKfycbzN1CdYD9PtQ1fCkWTywrBqnR8XlzU5gKIn18t9JbHzTpOE9ZrdOHUf0feWT8RbQq7L/exec',
  TIMEOUT: 15000,
  get USE_MOCK() {
    return localStorage.getItem('ol_use_mock') === 'true';
  },
  set USE_MOCK(val) {
    localStorage.setItem('ol_use_mock', String(val));
  }
};

// ── Mock Data Store ──────────────────────────────────────────────────────────
const MockData = {
  users: [
    {
      id: 'usr_001', email: 'admin@oslolift.no', name: 'Oslo Lift Admin',
      role: 'admin', company: 'Oslo Liftutleie', avatar: 'OA', verified: true
    },
    {
      id: 'usr_002', email: 'manager@buildcorp.no', name: 'Erik Johansen',
      role: 'manager', company: 'BuildCorp AS', companyId: 'comp_001', avatar: 'EJ', verified: true
    },
    {
      id: 'usr_003', email: 'operator@email.com', name: 'Lars Andersen',
      role: 'operator', company: 'BuildCorp AS', companyId: 'comp_001', avatar: 'LA', verified: true
    },
    {
      id: 'usr_004', email: 'solo@contractor.no', name: 'Bjørn Svensson',
      role: 'operator', company: null, independent: true, avatar: 'BS', verified: true
    },
  ],

  equipment: [
    {
      id: 'EQ-SAKS-001', name: 'Sakselifter 8m Electric', nameNo: 'Sakselifter 8m Elektrisk',
      category: 'Lifter', subcategory: 'Sakselifter',
      workHeight: '8m', weight: '2400 kg',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70',
      manualPages: 48, price: 29900, currency: 'NOK',
      videoId: 'dQw4w9WgXcQ',
      description: 'Elektrisk sakselifter for innendørs bruk. Ideell for lager, butikk og vedlikehold.',
      descriptionEn: 'Electric scissor lift for indoor use. Ideal for warehouses, retail and maintenance.',
      qrCode: 'OL-EQ-SAKS-001',
      tags: ['elektrisk', 'innendørs', 'sakselifter'],
    },
    {
      id: 'EQ-BOM-001', name: 'Bomlifter 20m Diesel', nameNo: 'Bomlifter 20m Diesel',
      category: 'Lifter', subcategory: 'Bomlifter',
      workHeight: '20m', weight: '7200 kg',
      image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=400&q=70',
      manualPages: 124, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Kraftig dieseldrevet bomlifter for utendørs arbeid i høyden.',
      descriptionEn: 'Powerful diesel boom lift for outdoor work at height.',
      qrCode: 'OL-EQ-BOM-001',
      tags: ['diesel', 'utendørs', 'bomlifter'],
    },
    {
      id: 'EQ-BIL-001', name: 'Bilmontert Lift 32m', nameNo: 'Billifter 32m',
      category: 'Lifter', subcategory: 'Billifter',
      workHeight: '32m', weight: '14000 kg',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70',
      manualPages: 210, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Bilmontert lift for ekstreme høyder. Krever spesialkompetanse.',
      descriptionEn: 'Vehicle-mounted lift for extreme heights. Requires special competence.',
      qrCode: 'OL-EQ-BIL-001',
      tags: ['bilmontert', 'stor', 'billifter'],
    },
    {
      id: 'EQ-TILH-001', name: 'Tilhengerlifter 12m', nameNo: 'Tilhengerlifter 12m',
      category: 'Lifter', subcategory: 'Tilhengerlifter',
      workHeight: '12m', weight: '1800 kg',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=70',
      manualPages: 72, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Kompakt tilhengerlifter som kan trekkes av personbil.',
      descriptionEn: 'Compact trailer lift that can be towed by a passenger car.',
      qrCode: 'OL-EQ-TILH-001',
      tags: ['tilhenger', 'kompakt', 'tilhengerlifter'],
    },
    {
      id: 'EQ-MINI-001', name: 'Minikran 3.2T', nameNo: 'Minikran 3.2T',
      category: 'Truck/Minikran', subcategory: 'Minikran',
      workHeight: 'N/A', weight: '3200 kg', liftCapacity: '3200 kg',
      image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=400&q=70',
      manualPages: 95, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Kompakt minikran med høy løftekapasitet for trange arbeidsplasser.',
      descriptionEn: 'Compact mini crane with high lift capacity for tight workplaces.',
      qrCode: 'OL-EQ-MINI-001',
      tags: ['minikran', 'truck', 'kran'],
    },
    {
      id: 'EQ-GRAV-001', name: 'Minigraver 1.8T', nameNo: 'Minigraver 1.8T',
      category: 'Maskiner', subcategory: 'Anleggsmaskiner',
      workHeight: 'N/A', weight: '1800 kg',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=70',
      manualPages: 88, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Liten og smidig gravemaskin egnet for hage og byggearbeid.',
      descriptionEn: 'Small and agile excavator suitable for garden and construction work.',
      qrCode: 'OL-EQ-GRAV-001',
      tags: ['graver', 'maskin', 'anlegg'],
    },
    {
      id: 'EQ-SAMS-001', name: 'Samferdsel Lift 8m', nameNo: 'Samferdselslift 8m',
      category: 'Lifter', subcategory: 'Samferdsel',
      workHeight: '8m', weight: '3100 kg',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70',
      manualPages: 64, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Lift beregnet på arbeid nær eller over vei og trafikk.',
      descriptionEn: 'Lift designed for work near or over roads and traffic.',
      qrCode: 'OL-EQ-SAMS-001',
      tags: ['samferdsel', 'vei', 'trafikk'],
    },
    {
      id: 'EQ-STIL-001', name: 'Rullestillas 7m', nameNo: 'Rullestillas 7m',
      category: 'Maskiner', subcategory: 'Stillas',
      workHeight: '7m', weight: '180 kg',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70',
      manualPages: 36, price: 29900, currency: 'NOK',
      videoId: null,
      description: 'Lett og mobilt rullestillas for innendørs og utendørs bruk.',
      descriptionEn: 'Light and mobile rolling scaffold for indoor and outdoor use.',
      qrCode: 'OL-EQ-STIL-001',
      tags: ['stillas', 'rullestillas', 'scaffold'],
    },
  ],

  enrollments: [
    {
      id: 'enr_001', userId: 'usr_003', equipmentId: 'EQ-SAKS-001',
      status: 'certified', paid: true, paymentRef: 'PAY-001',
      startedAt: '2024-01-15', completedAt: '2024-01-15',
      progress: 100, score: 92, certId: 'cert_001'
    },
    {
      id: 'enr_002', userId: 'usr_003', equipmentId: 'EQ-BOM-001',
      status: 'reading', paid: true, paymentRef: 'PAY-002',
      startedAt: '2024-01-20', completedAt: null,
      progress: 42, currentPage: 52, score: null, certId: null
    },
  ],

  certificates: [
    {
      id: 'cert_001', enrollmentId: 'enr_001',
      userId: 'usr_003', equipmentId: 'EQ-SAKS-001',
      issuedAt: '2024-01-15', certNumber: 'OL-2024-SAKS-00001',
      operatorName: 'Lars Andersen', courseName: 'Sakselifter 8m Electric',
      score: 92, signed: true, emailedAt: '2024-01-15',
      operatorSig: null, osloLiftSig: null, verifyUrl: null
    }
  ],

  companies: [
    {
      id: 'comp_001', name: 'BuildCorp AS', orgNo: '987654321',
      creditApproved: true, billingMethod: 'invoice',
      managers: ['usr_002'], operators: ['usr_003'],
      totalCerts: 12, pendingCerts: 2
    },
    {
      id: 'comp_002', name: 'Offshore Services AS', orgNo: '112233445',
      creditApproved: false, billingMethod: 'card',
      managers: [], operators: [],
      totalCerts: 0, pendingCerts: 0
    }
  ],

  pendingApprovals: [
    {
      id: 'pend_001', enrollmentId: 'enr_002', userId: 'usr_003',
      userName: 'Lars Andersen', equipmentId: 'EQ-BOM-001',
      equipmentName: 'Bomlifter 20m Diesel', score: 87,
      completedAt: '2024-01-22', awaitingSince: '2024-01-22'
    }
  ],

  manualContent: {
    'EQ-SAKS-001': {
      sections: [
        {
          id: 's1', title: '1. Introduksjon og Formål',
          titleEn: '1. Introduction and Purpose',
          content: `
            <h3>Brukermanual — Sakselifter 8m Elektrisk</h3>
            <p>Denne manualen gir deg nødvendig informasjon for å bruke sakselifteren på en trygg og effektiv måte. Les hele manualen nøye før bruk.</p>
            <div class="safety-alert">
              ⚠️ <strong>ADVARSEL:</strong> Denne maskinen skal kun betjenes av sertifiserte operatører som har fullført typeopplæring.
            </div>
            <h4>Formål med opplæringen</h4>
            <p>Opplæringen sikrer at du:</p>
            <ul>
              <li>Forstår maskinens egenskaper og begrensninger</li>
              <li>Kan gjennomføre daglig forhåndskontroll</li>
              <li>Vet hvordan du handler i nødsituasjoner</li>
              <li>Overholder norske arbeidsmiljølover</li>
            </ul>
          `
        },
        {
          id: 's2', title: '2. Tekniske Spesifikasjoner',
          titleEn: '2. Technical Specifications',
          content: `
            <h3>Tekniske Data</h3>
            <table class="spec-table">
              <tr><td>Arbeidshøyde</td><td>8,0 m</td></tr>
              <tr><td>Plattformhøyde</td><td>6,0 m</td></tr>
              <tr><td>Nyttelast</td><td>450 kg</td></tr>
              <tr><td>Plattformstørrelse</td><td>2,5 × 1,2 m</td></tr>
              <tr><td>Total maskinvekt</td><td>2 400 kg</td></tr>
              <tr><td>Drivlinje</td><td>Elektrisk, 24V</td></tr>
              <tr><td>Gulvtrykk</td><td>max 8 bar</td></tr>
            </table>
            <div class="safety-alert info">
              ℹ️ Maks tillatt sidekraft: 400 N. Overskrid ikke dette under høyde.
            </div>
          `
        },
        {
          id: 's3', title: '3. Sikkerhetsprosedyrer',
          titleEn: '3. Safety Procedures',
          content: `
            <h3>🦺 Obligatoriske Sikkerhetsprosedyrer</h3>
            <p>Følgende prosedyrer <strong>er påkrevd</strong> ved all bruk:</p>
            <ol>
              <li>Bruk godkjent fallsikringsutstyr (sele og tau) til ankerpunkt på plattformen</li>
              <li>Kontroller at arbeidsområdet er fritt for hindringer og personer</li>
              <li>Sjekk at gulv-/underlaget tåler maskinens vekt og trykk</li>
              <li>Aldri overskrid tillatt nyttelast på ${450} kg</li>
              <li>Hold alltid minst 3 meters avstand fra strømledninger</li>
              <li>Sikre alle verktøy og materialer mot å falle</li>
            </ol>
            <div class="safety-alert danger">
              🚫 <strong>FORBUD:</strong> Det er strengt forbudt å flytte maskinen med hevet plattform.
            </div>
          `
        },
        {
          id: 's4', title: '4. Forhåndskontroll',
          titleEn: '4. Pre-Use Inspection',
          content: `
            <h3>Daglig Forhåndskontroll</h3>
            <p>Utfør følgende kontroller <strong>hver dag</strong> før bruk:</p>
            <div class="checklist-preview">
              <div class="check-item">☐ Batterinivå tilstrekkelig (min. 25%)</div>
              <div class="check-item">☐ Hydraulikkvæskenivå OK</div>
              <div class="check-item">☐ Alle dekktrykk OK</div>
              <div class="check-item">☐ Nødstoppknapper fungerer</div>
              <div class="check-item">☐ Alarmer og indikatorer virker</div>
              <div class="check-item">☐ Rekkverk og låsemekanismer OK</div>
              <div class="check-item">☐ Ingen synlige skader på struktur</div>
              <div class="check-item">☐ Plattformgulv rent og fritt for olje</div>
            </div>
            <p>Rapporter eventuelle avvik umiddelbart til utleiefirmaet og bruk IKKE maskinen.</p>
          `
        },
      ]
    }
  },

  assessmentQuestions: {
    'EQ-SAKS-001': [
      {
        id: 'q1',
        question: 'Hva er maksimal nyttelast for denne sakselifteren?',
        questionEn: 'What is the maximum payload for this scissor lift?',
        options: ['250 kg', '350 kg', '450 kg', '550 kg'],
        correct: 2,
        image: null
      },
      {
        id: 'q2',
        question: 'Hva er minimum avstand til strømledninger ved bruk av maskinen?',
        questionEn: 'What is the minimum distance to power lines when using this machine?',
        options: ['1 meter', '2 meter', '3 meter', '5 meter'],
        correct: 2,
        image: null
      },
      {
        id: 'q3',
        question: 'Hva skal du gjøre hvis du oppdager en feil under forhåndskontrollen?',
        questionEn: 'What should you do if you discover a fault during the pre-use inspection?',
        options: [
          'Bruke maskinen hvis feilen ser liten ut',
          'Rapportere til utleier og ikke bruke maskinen',
          'Reparere selv',
          'Ignorere det og fullføre jobben'
        ],
        correct: 1,
        image: null
      },
      {
        id: 'q4',
        question: 'Er det tillatt å flytte maskinen mens plattformen er hevet?',
        questionEn: 'Is it permitted to move the machine while the platform is raised?',
        options: [
          'Ja, alltid',
          'Ja, men kun sakte',
          'Kun på flat mark',
          'Nei, dette er strengt forbudt'
        ],
        correct: 3,
        image: null
      }
    ]
  },

  payments: [
    {
      id: 'PAY-001', userId: 'usr_003', equipmentId: 'EQ-SAKS-001',
      amount: 29900, currency: 'NOK', method: 'card',
      status: 'completed', ref: 'stripe_abc123', createdAt: '2024-01-15'
    },
    {
      id: 'PAY-002', userId: 'usr_003', equipmentId: 'EQ-BOM-001',
      amount: 29900, currency: 'NOK', method: 'card',
      status: 'completed', ref: 'stripe_def456', createdAt: '2024-01-20'
    },
  ],
};

// ── Connection Troubleshooter Modal ──────────────────────────────────────────
function showConnectionTroubleshooter() {
  if (document.getElementById('connection-troubleshoot-modal')) return;

  const isNo = I18n.lang === 'no';
  const title = isNo ? 'Tilkoblingsfeil (Google Sheets)' : 'Connection Error (Google Sheets)';
  
  const body = isNo ? `
    <div style="font-size:var(--text-sm);line-height:1.6;color:var(--color-text-secondary)">
      <p style="margin-bottom:1rem;font-weight:600;color:white">
        Appen klarte ikke å kommunisere med Google Apps Script-backend. Dette skyldes vanligvis en av følgende årsaker:
      </p>
      <ul style="padding-left:1.25rem;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:0.75rem;text-align:left">
        <li>
          <strong>1. Feil publiseringsinnstillinger:</strong><br>
          Når du distribuerer Google Apps Script som en nettapp, må du sette <strong>"Hvem som har tilgang"</strong> (Who has access) til <strong>"Alle"</strong> (Anyone). Hvis ikke, blokkerer Google forespørselen.
        </li>
        <li>
          <strong>2. Feil URL-type (/dev i stedet for /exec):</strong><br>
          Sørg for at <code>BASE_URL</code> i <code>api.js</code> slutter på <code>/exec</code> og IKKE <code>/dev</code>. Test-URLen (/dev) krever innlogging og er blokkert av CORS.
        </li>
        <li>
          <strong>3. Frittstående script (Standalone):</strong><br>
          Hvis du opprettet skriptet direkte i Google Drive, kan det ikke koble seg til regnearket automatisk. Åpne Google Sheet, velg <strong>Utvidelser &gt; Apps Script</strong>, og lim inn <code>Code.gs</code> koden der.
        </li>
        <li>
          <strong>4. Manglende autorisasjon:</strong><br>
          Åpne skriptet i Google Sheets og kjør en testfunksjon (f.eks. <code>initializeDatabaseSchema</code>) manuelt for å godkjenne Google-kontoens tilgang.
        </li>
      </ul>
      <p style="margin-bottom:1rem">
        For å utforske appen med en gang uten å fikse databasen først, kan du bytte til den lokale <strong>Frakoblede Demo-modusen</strong>. Alle funksjoner (kurs, quiz, betaling, signering og admin) fungerer perfekt med simulerte data lagret i nettleseren din!
      </p>
    </div>
  ` : `
    <div style="font-size:var(--text-sm);line-height:1.6;color:var(--color-text-secondary)">
      <p style="margin-bottom:1rem;font-weight:600;color:white">
        The application failed to communicate with your Google Apps Script backend. This is usually caused by:
      </p>
      <ul style="padding-left:1.25rem;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:0.75rem;text-align:left">
        <li>
          <strong>1. Incorrect Access Settings:</strong><br>
          When deploying your Apps Script as a Web App, you must set <strong>"Who has access"</strong> to <strong>"Anyone"</strong>. If set to restricted, Google will block the CORS request.
        </li>
        <li>
          <strong>2. Using Developer URL (/dev instead of /exec):</strong><br>
          Ensure that the <code>BASE_URL</code> in <code>api.js</code> ends with <code>/exec</code> and NOT <code>/dev</code>. The developer URL requires developer login and is blocked by CORS.
        </li>
        <li>
          <strong>3. Standalone Script Error:</strong><br>
          If you created the script standalone in Drive, it cannot auto-bind to a sheet. Open your Google Sheet, click <strong>Extensions &gt; Apps Script</strong>, and paste the <code>Code.gs</code> code there.
        </li>
        <li>
          <strong>4. Missing Authorization:</strong><br>
          Open the Apps Script editor and run any function (like <code>initializeDatabaseSchema</code>) manually to grant required Sheets and Email permissions.
        </li>
      </ul>
      <p style="margin-bottom:1rem">
        To explore the app immediately without configuring the database, you can switch to the local <strong>Offline Demo Mode</strong>. All modules (courses, assessments, Stripe/Vipps payments, digital signatures, and dashboards) are fully functional using locally simulated data!
      </p>
    </div>
  `;

  const footer = `
    <div style="display:flex;gap:0.75rem;justify-content:flex-end;width:100%">
      <button class="btn btn-ghost" onclick="document.getElementById('connection-troubleshoot-modal').classList.remove('open'); document.body.style.overflow=''">
        ${isNo ? 'Lukk' : 'Close'}
      </button>
      <button class="btn btn-gold" id="btn-switch-to-mock" style="font-weight:700">
        ${isNo ? '🔑 Bytt til Demo-modus (Mock)' : '🔑 Switch to Demo Mode (Mock)'}
      </button>
    </div>
  `;

  Modal.create({
    title,
    body,
    footer,
    id: 'connection-troubleshoot-modal'
  });

  const switchBtn = document.getElementById('btn-switch-to-mock');
  if (switchBtn) {
    switchBtn.onclick = () => {
      localStorage.setItem('ol_use_mock', 'true');
      document.getElementById('connection-troubleshoot-modal').classList.remove('open');
      document.body.style.overflow = '';
      window.location.reload();
    };
  }
}

// ── HTTP Helper ──────────────────────────────────────────────────────────────
async function appsScriptRequest(action, payload = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const res = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'API error');
    return data.data;
  } catch (err) {
    clearTimeout(timeout);
    
    // Catch fetch network errors or timeout aborts
    if (err.message === 'Failed to fetch' || err.name === 'AbortError' || err.message.includes('NetworkError') || err.message.includes('fetch')) {
      showConnectionTroubleshooter();
    }
    
    throw err;
  }
}

// ── Mock Helper ──────────────────────────────────────────────────────────────
function mockDelay(data, ms = 400) {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

// ── API Methods ──────────────────────────────────────────────────────────────
const API = {

  // ── Auth ────────────────────────────────────────────────────────────────
  async login(email, password) {
    if (API_CONFIG.USE_MOCK) {
      const user = MockData.users.find(u => u.email === email.toLowerCase());
      if (!user) throw new Error('User not found');
      // Mock: any password works
      const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 86400000 }));
      return mockDelay({ user, token });
    }
    return appsScriptRequest('login', { email, password });
  },

  async register(data) {
    if (API_CONFIG.USE_MOCK) {
      const newUser = {
        id: `usr_${Date.now()}`,
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        role: data.accountType === 'independent' ? 'operator' : 'operator',
        company: data.companyName || null,
        independent: data.accountType === 'independent',
        avatar: `${data.firstName[0]}${data.lastName[0]}`.toUpperCase(),
        verified: false
      };
      MockData.users.push(newUser);
      const token = btoa(JSON.stringify({ userId: newUser.id, exp: Date.now() + 86400000 }));
      return mockDelay({ user: newUser, token });
    }
    return appsScriptRequest('register', data);
  },

  async getProfile(userId) {
    if (API_CONFIG.USE_MOCK) {
      const user = MockData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      const enrollments = MockData.enrollments.filter(e => e.userId === userId);
      const certs = MockData.certificates.filter(c => c.userId === userId);
      return mockDelay({ user, enrollments, certificates: certs });
    }
    return appsScriptRequest('getProfile', { userId });
  },

  // ── Equipment ───────────────────────────────────────────────────────────
  async getEquipment(filters = {}) {
    if (API_CONFIG.USE_MOCK) {
      const added = Store.get('added_equipment', []);
      let items = [...MockData.equipment, ...added];
      
      if (filters.category && filters.category !== 'all') {
        items = items.filter(e => e.category === filters.category ||
          e.subcategory === filters.category);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(e =>
          e.name.toLowerCase().includes(q) ||
          e.nameNo.toLowerCase().includes(q) ||
          e.subcategory.toLowerCase().includes(q) ||
          (e.tags || []).some(t => t.includes(q))
        );
      }
      return mockDelay({ items, total: items.length });
    }
    return appsScriptRequest('getEquipment', filters);
  },

  async getEquipmentById(id) {
    if (API_CONFIG.USE_MOCK) {
      const added = Store.get('added_equipment', []);
      const item = [...MockData.equipment, ...added].find(e => e.id === id);
      if (!item) throw new Error('Equipment not found');
      return mockDelay(item);
    }
    return appsScriptRequest('getEquipmentById', { id });
  },

  async getEquipmentByQR(qrCode) {
    if (API_CONFIG.USE_MOCK) {
      const added = Store.get('added_equipment', []);
      const item = [...MockData.equipment, ...added].find(e => e.qrCode === qrCode);
      if (!item) throw new Error('Equipment not found for QR: ' + qrCode);
      return mockDelay(item);
    }
    return appsScriptRequest('validateQR', { qrCode });
  },

  async addEquipment(data) {
    if (API_CONFIG.USE_MOCK) {
      const added = Store.get('added_equipment', []);
      added.push(data);
      Store.set('added_equipment', added);
      return mockDelay({ success: true, id: data.id });
    }
    return appsScriptRequest('addEquipment', data);
  },

  // ── Course ──────────────────────────────────────────────────────────────
  async getCourseContent(equipmentId) {
    // Static training manuals are loaded locally from the PWA assets for instant offline speed
    const content = MockData.manualContent[equipmentId];
    if (!content) {
      const eq = MockData.equipment.find(e => e.id === equipmentId) || 
                 (await this.getEquipmentById(equipmentId).catch(() => null));
      const sectionCount = Math.min(5, Math.ceil((eq?.manualPages || 48) / 12));
      const sections = Array.from({ length: sectionCount }, (_, i) => ({
        id: `s${i+1}`,
        title: `${i+1}. Seksjon ${i+1}`,
        titleEn: `${i+1}. Section ${i+1}`,
        content: `<p>Innhold for seksjon ${i+1} pågår. Dette er en standard typeopplæringsside for Oslo Liftutleie.</p><p>Sørg for å følge alle sikkerhetsprosedyrer og fallsikringsinstrukser ved arbeid i høyden.</p>`
      }));
      return mockDelay({ sections });
    }
    return mockDelay(content);
  },

  async enroll(userId, equipmentId, paymentRef) {
    if (API_CONFIG.USE_MOCK) {
      const existing = MockData.enrollments.find(
        e => e.userId === userId && e.equipmentId === equipmentId
      );
      if (existing) return mockDelay(existing);
      const enrollment = {
        id: `enr_${Date.now()}`, userId, equipmentId,
        status: 'reading', paid: true, paymentRef,
        startedAt: new Date().toISOString(), completedAt: null,
        progress: 0, currentPage: 0, score: null, certId: null
      };
      MockData.enrollments.push(enrollment);
      return mockDelay(enrollment);
    }
    return appsScriptRequest('enrollCourse', { userId, equipmentId, paymentRef });
  },

  async updateProgress(enrollmentId, data) {
    if (API_CONFIG.USE_MOCK) {
      const enr = MockData.enrollments.find(e => e.id === enrollmentId);
      if (enr) Object.assign(enr, data);
      return mockDelay({ success: true });
    }
    return appsScriptRequest('updateProgress', { enrollmentId, ...data });
  },

  // ── Assessment ──────────────────────────────────────────────────────────
  async getAssessmentQuestions(equipmentId) {
    // Static safety questions are loaded locally from the PWA assets
    const questions = MockData.assessmentQuestions[equipmentId];
    if (!questions) {
      return mockDelay([
        {
          id: 'gq1',
          question: 'Hva er det første du skal gjøre før du bruker denne maskinen?',
          questionEn: 'What is the first thing you should do before using this machine?',
          options: ['Start motoren', 'Utføre forhåndskontroll', 'Sjekke mobilen', 'Hoppe på'],
          correct: 1
        },
        {
          id: 'gq2',
          question: 'Hva gjør du ved en nødsituasjon?',
          questionEn: 'What do you do in an emergency?',
          options: ['Ignorer det', 'Trykk nødstopp og varsle andre', 'Løp', 'Ingenting'],
          correct: 1
        },
        {
          id: 'gq3',
          question: 'Hvem har ansvar for sikkerheten ved bruk av maskinen?',
          questionEn: 'Who is responsible for safety when using the machine?',
          options: ['Utleier', 'Kollegaene', 'Operatøren selv', 'Ingen'],
          correct: 2
        },
      ]);
    }
    return mockDelay(questions);
  },

  async submitAssessment(enrollmentId, answers) {
    if (API_CONFIG.USE_MOCK) {
      const enr = MockData.enrollments.find(e => e.id === enrollmentId);
      if (!enr) throw new Error('Enrollment not found');

      const questions = MockData.assessmentQuestions[enr.equipmentId] || [];
      let correct = 0;
      answers.forEach((ans, i) => {
        if (questions[i] && ans === questions[i].correct) correct++;
      });
      const total = questions.length || answers.length;
      const score = Math.round((correct / total) * 100);
      const passed = score >= 80;

      if (passed) {
        enr.status = 'awaiting_signature';
        enr.score = score;
        enr.completedAt = new Date().toISOString();
        enr.progress = 100;
      }

      return mockDelay({ score, passed, correct, total, attempts: 1 });
    }
    return appsScriptRequest('submitAssessment', { enrollmentId, answers });
  },

  // ── Payment ─────────────────────────────────────────────────────────────
  async initiatePayment(userId, equipmentId, method) {
    if (API_CONFIG.USE_MOCK) {
      const payId = `PAY-${Date.now()}`;
      return mockDelay({
        paymentId: payId,
        amount: 29900,
        currency: 'NOK',
        method,
        // In prod: would return Stripe PaymentIntent or Vipps redirect URL
        mockSuccess: true,
        redirectUrl: null
      });
    }
    return appsScriptRequest('processPayment', { userId, equipmentId, method });
  },

  async confirmPayment(paymentId, userId, equipmentId) {
    if (API_CONFIG.USE_MOCK) {
      const payment = {
        id: paymentId, userId, equipmentId,
        amount: 29900, currency: 'NOK', method: 'card',
        status: 'completed', ref: `mock_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      MockData.payments.push(payment);
      return mockDelay({ payment, success: true });
    }
    return appsScriptRequest('confirmPayment', { paymentId, userId, equipmentId });
  },

  // ── Signature ───────────────────────────────────────────────────────────
  async saveOperatorSignature(enrollmentId, signatureBase64) {
    if (API_CONFIG.USE_MOCK) {
      const enr = MockData.enrollments.find(e => e.id === enrollmentId);
      if (enr) { enr.operatorSig = signatureBase64; enr.status = 'awaiting_oslo_sig'; }
      return mockDelay({ success: true, status: 'awaiting_oslo_sig' });
    }
    return appsScriptRequest('saveSignature', { enrollmentId, type: 'operator', signature: signatureBase64 });
  },

  async saveOsloLiftSignature(enrollmentId, signatureBase64, approvedBy) {
    if (API_CONFIG.USE_MOCK) {
      const enr = MockData.enrollments.find(e => e.id === enrollmentId);
      if (enr) {
        enr.osloLiftSig = signatureBase64;
        enr.status = 'certified';
        enr.approvedBy = approvedBy;
      }
      return mockDelay({ success: true, status: 'certified', certId: `cert_${Date.now()}` });
    }
    return appsScriptRequest('approveCourse', { enrollmentId, signature: signatureBase64, approvedBy });
  },

  // ── Certificate ─────────────────────────────────────────────────────────
  async issueCertificate(enrollmentId) {
    if (API_CONFIG.USE_MOCK) {
      const enr = MockData.enrollments.find(e => e.id === enrollmentId);
      if (!enr) throw new Error('Enrollment not found');
      const eq = MockData.equipment.find(e => e.id === enr.equipmentId);
      const user = MockData.users.find(u => u.id === enr.userId);
      const certNumber = `OL-${new Date().getFullYear()}-${eq?.subcategory?.toUpperCase().substring(0,4) || 'CERT'}-${String(MockData.certificates.length + 1).padStart(5, '0')}`;
      const cert = {
        id: `cert_${Date.now()}`,
        enrollmentId,
        userId: enr.userId,
        equipmentId: enr.equipmentId,
        issuedAt: new Date().toISOString(),
        certNumber,
        operatorName: user?.name || 'Unknown',
        courseName: eq?.name || 'Unknown Course',
        score: enr.score,
        signed: true,
        emailedAt: null,
        verifyUrl: `#/verify/${certNumber}`
      };
      MockData.certificates.push(cert);
      if (enr) { enr.certId = cert.id; enr.status = 'certified'; }
      return mockDelay(cert);
    }
    return appsScriptRequest('issueCertificate', { enrollmentId });
  },

  async getCertificate(certId) {
    if (API_CONFIG.USE_MOCK) {
      const cert = MockData.certificates.find(c => c.id === certId);
      if (!cert) throw new Error('Certificate not found');
      return mockDelay(cert);
    }
    return appsScriptRequest('getCertificate', { certId });
  },

  // ── Admin ───────────────────────────────────────────────────────────────
  async getAdminStats() {
    if (API_CONFIG.USE_MOCK) {
      return mockDelay({
        totalUsers: MockData.users.length,
        totalCerts: MockData.certificates.length,
        totalCompanies: MockData.companies.length,
        pendingApprovals: MockData.pendingApprovals.length,
        revenueThisMonth: 89700,
        passRate: 94,
        totalEnrollments: MockData.enrollments.length,
        recentCerts: MockData.certificates.slice(-5),
      });
    }
    return appsScriptRequest('getStats', {});
  },

  async getPendingApprovals() {
    if (API_CONFIG.USE_MOCK) {
      return mockDelay(MockData.pendingApprovals);
    }
    return appsScriptRequest('getPendingApprovals', {});
  },

  async getAllUsers() {
    if (API_CONFIG.USE_MOCK) {
      return mockDelay(MockData.users);
    }
    return appsScriptRequest('getAllUsers', {});
  },

  // ── Company ─────────────────────────────────────────────────────────────
  async getCompanyTeam(companyId) {
    if (API_CONFIG.USE_MOCK) {
      const company = MockData.companies.find(c => c.id === companyId);
      if (!company) throw new Error('Company not found');
      const operators = MockData.users.filter(u => u.companyId === companyId);
      const operatorsWithProgress = operators.map(op => {
        const enrollments = MockData.enrollments.filter(e => e.userId === op.id);
        const certs = MockData.certificates.filter(c => c.userId === op.id);
        return { ...op, enrollments, certificates: certs, totalCerts: certs.length };
      });
      return mockDelay({ company, operators: operatorsWithProgress });
    }
    return appsScriptRequest('getCompanyTeam', { companyId });
  },

  // ── Checklist ───────────────────────────────────────────────────────────
  async submitChecklist(data) {
    if (API_CONFIG.USE_MOCK) {
      const record = {
        id: `chk_${Date.now()}`,
        ...data,
        submittedAt: new Date().toISOString()
      };
      return mockDelay({ success: true, checklistId: record.id });
    }
    return appsScriptRequest('submitChecklist', data);
  },
};

export default API;
export { MockData };
