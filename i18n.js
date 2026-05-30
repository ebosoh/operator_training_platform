/**
 * i18n.js — Bilingual Translation Engine (EN / NO)
 * Typeopplæring.no Safety Training Platform
 */

const translations = {
  no: {
    // ── Navigation ──────────────────────────────────────────
    'nav.home':         'Hjem',
    'nav.catalog':      'Kurskataloget',
    'nav.my_courses':   'Mine Kurs',
    'nav.diplomas':     'Diplomer',
    'nav.profile':      'Profil',
    'nav.admin':        'Admin',
    'nav.company':      'Bedrift',
    'nav.logout':       'Logg ut',
    'nav.login':        'Logg inn',
    'nav.register':     'Registrer',

    // ── Auth ─────────────────────────────────────────────────
    'auth.login.title':         'Velkommen tilbake',
    'auth.login.subtitle':      'Logg inn for å fortsette opplæringen',
    'auth.login.email':         'E-postadresse',
    'auth.login.password':      'Passord',
    'auth.login.btn':           'Logg inn',
    'auth.login.forgot':        'Glemt passord?',
    'auth.login.no_account':    'Har ikke konto?',
    'auth.login.register_link': 'Registrer deg',
    'auth.login.or':            'eller',

    'auth.register.title':         'Opprett konto',
    'auth.register.subtitle':      'Start din sertifiseringsreise',
    'auth.register.step1':         'Personlig info',
    'auth.register.step2':         'Bedrift',
    'auth.register.step3':         'Konto',
    'auth.register.first_name':    'Fornavn',
    'auth.register.last_name':     'Etternavn',
    'auth.register.email':         'E-postadresse',
    'auth.register.phone':         'Telefonnummer',
    'auth.register.company_type':  'Kontotype',
    'auth.register.company_emp':   'Bedriftsansatt',
    'auth.register.independent':   'Selvstendig operatør',
    'auth.register.company_name':  'Bedriftsnavn',
    'auth.register.company_org':   'Organisasjonsnummer',
    'auth.register.password':      'Passord',
    'auth.register.confirm_pw':    'Bekreft passord',
    'auth.register.terms':         'Jeg godtar vilkårene og personvernerklæringen',
    'auth.register.btn':           'Opprett konto',
    'auth.register.has_account':   'Har allerede konto?',
    'auth.register.login_link':    'Logg inn',

    'auth.forgot.title':    'Tilbakestill passord',
    'auth.forgot.subtitle': 'Vi sender deg en lenke for å tilbakestille passordet ditt',
    'auth.forgot.email':    'E-postadresse',
    'auth.forgot.btn':      'Send tilbakestillingslenke',
    'auth.forgot.back':     'Tilbake til innlogging',
    'auth.forgot.sent':     'E-post sendt! Sjekk innboksen din.',

    // ── Home / Hero ──────────────────────────────────────────
    'home.hero.tag':         'Oslo Liftutleie',
    'home.hero.title':       'Sertifiser deg i\nSikkerhet & Opplæring',
    'home.hero.subtitle':    'Digital sikkerhetsopplæring for tungt maskineri — raskt, lovlig og anerkjent av Oslo Liftutleie.',
    'home.hero.cta':         'Start opplæring',
    'home.hero.cta2':        'Se maskinkataloget',
    'home.hero.badge1':      'Diplom på mobilen',
    'home.hero.badge2':      '299 NOK per godkjenning',
    'home.hero.badge3':      'GDPR-sikkert',
    'home.stats.courses':    'Typer maskiner',
    'home.stats.certs':      'Utstedte sertifikater',
    'home.stats.companies':  'Bedrifter',
    'home.stats.pass_rate':  'Bestått-prosent',

    // ── Catalog ───────────────────────────────────────────────
    'catalog.title':        'Maskinkataloget',
    'catalog.subtitle':     'Finn og fullfør opplæring for ditt utstyr',
    'catalog.search':       'Søk etter maskin eller kategori...',
    'catalog.all':          'Alle',
    'catalog.lifter':       'Lifter',
    'catalog.maskiner':     'Maskiner',
    'catalog.truck':        'Truck / Minikran',
    'catalog.enroll':       'Start kurs',
    'catalog.enrolled':     'Fortsett kurs',
    'catalog.completed':    'Fullført ✓',
    'catalog.locked':       '🔒 Betal for å låse opp',
    'catalog.pages':        'sider',
    'catalog.height':       'Arbeidshøyde',
    'catalog.price':        '299 NOK',

    // ── Course ────────────────────────────────────────────────
    'course.progress':         'Fremdrift',
    'course.page':             'Side',
    'course.of':               'av',
    'course.read_confirm':     'Jeg har lest og forstått dette avsnittet',
    'course.next':             'Neste side',
    'course.prev':             'Forrige side',
    'course.finish_reading':   'Fullfør lesing',
    'course.start_test':       'Start sikkerhetstest',
    'course.manual_label':     'Brukermanual',
    'course.video_label':      'Instruksjonsvideo',
    'course.notes_label':      'Mine notater',
    'course.notes_ph':         'Skriv notater her...',
    'course.offline_saved':    'Lagret offline',

    // ── Assessment ───────────────────────────────────────────
    'assess.title':         'Sikkerhetstest',
    'assess.subtitle':      'Besvar alle spørsmål for å fullføre kurset',
    'assess.question':      'Spørsmål',
    'assess.submit':        'Lever besvarelse',
    'assess.pass':          'Bestått! 🎉',
    'assess.fail':          'Ikke bestått',
    'assess.pass_msg':      'Flott jobbet! Du er nå klar for signering.',
    'assess.fail_msg':      'Du trenger 80 % for å bestå. Prøv igjen.',
    'assess.retry':         'Prøv igjen',
    'assess.score':         'Din score',
    'assess.pass_score':    'Krav',
    'assess.attempts_left': 'Forsøk igjen',

    // ── Payment ───────────────────────────────────────────────
    'payment.title':         'Betal for kurs',
    'payment.subtitle':      'Engangsbetaling – livstidstilgang til manualen',
    'payment.amount':        '299 NOK',
    'payment.incl_vat':      'inkl. 25% MVA',
    'payment.card':          'Kortbetaling',
    'payment.invoice':       'Faktura (bedriftskunder)',
    'payment.vipps':         'Betal med Vipps',
    'payment.proceed':       'Gå til betaling',
    'payment.success':       'Betaling vellykket!',
    'payment.fail':          'Betaling mislyktes',
    'payment.retry':         'Prøv igjen',

    // ── Signature ─────────────────────────────────────────────
    'sign.title':           'Signering',
    'sign.subtitle':        'Tegn signaturen din for å bekrefte fullføring',
    'sign.operator':        'Operatørsignatur',
    'sign.oslo_lift':       'Oslo Lift-signatur',
    'sign.clear':           'Slett',
    'sign.confirm':         'Bekreft signatur',
    'sign.awaiting':        'Venter på Oslo Lift-signatur...',
    'sign.approved':        'Godkjent og signert!',
    'sign.send_local':      'Send til lokal leder',

    // ── Certificate ───────────────────────────────────────────
    'cert.title':           'Ditt Diplom',
    'cert.subtitle':        'Offisielt typegodkjenningsbevis',
    'cert.name':            'Navn',
    'cert.course':          'Kurs',
    'cert.date':            'Dato',
    'cert.cert_no':         'Serienummer',
    'cert.download':        'Last ned PDF',
    'cert.email':           'Send på e-post',
    'cert.share':           'Del',
    'cert.verify':          'Verifiser',
    'cert.passed':          'BESTÅTT',
    'cert.oslo_lift_sig':   'Oslo Liftutleie',
    'cert.authorized_by':   'Godkjent av',

    // ── Admin ─────────────────────────────────────────────────
    'admin.dashboard':      'Dashbord',
    'admin.equipment':      'Utstyr & Manualer',
    'admin.users':          'Brukere',
    'admin.pending':        'Venter godkjenning',
    'admin.companies':      'Bedrifter',
    'admin.payments':       'Betalinger',
    'admin.qr':             'QR-koder',
    'admin.analytics':      'Statistikk',
    'admin.export_visma':   'Eksporter til Visma',

    // ── Company ───────────────────────────────────────────────
    'company.team':         'Mitt team',
    'company.invite':       'Inviter ansatt',
    'company.billing':      'Fakturering',
    'company.reports':      'Rapporter',
    'company.status_all':   'Alle statuser',
    'company.status_done':  'Fullført',
    'company.status_pend':  'Pågår',
    'company.status_new':   'Ikke påbegynt',

    // ── Profile ───────────────────────────────────────────────
    'profile.my_courses':   'Mine kurs',
    'profile.diplomas':     'Mine diplomer',
    'profile.settings':     'Innstillinger',
    'profile.payment_hist': 'Betalingshistorikk',
    'profile.edit':         'Rediger profil',
    'profile.cv_link':      'Del CV-side',

    // ── QR ────────────────────────────────────────────────────
    'qr.title':             'Maskininfo',
    'qr.completed_btn':     '✅ Kurs fullført',
    'qr.not_completed_btn': '❌ Kurs IKKE fullført',
    'qr.enroll':            'Start kurs for denne maskinen',
    'qr.login_required':    'Logg inn for å se opplæringsstatus',

    // ── Checklist ─────────────────────────────────────────────
    'check.title':          'Forhåndskontroll',
    'check.subtitle':       'Sjekk maskinen før bruk',
    'check.add_photo':      'Legg til foto',
    'check.submit':         'Send inn sjekkliste',
    'check.submitted':      'Sjekkliste sendt inn!',
    'check.issue_found':    'Avvik funnet',

    // ── Common ────────────────────────────────────────────────
    'common.save':          'Lagre',
    'common.cancel':        'Avbryt',
    'common.delete':        'Slett',
    'common.edit':          'Rediger',
    'common.view':          'Vis',
    'common.back':          'Tilbake',
    'common.next':          'Neste',
    'common.prev':          'Forrige',
    'common.loading':       'Laster...',
    'common.error':         'Noe gikk galt',
    'common.success':       'Vellykket!',
    'common.confirm':       'Bekreft',
    'common.search':        'Søk',
    'common.filter':        'Filter',
    'common.all':           'Alle',
    'common.yes':           'Ja',
    'common.no':            'Nei',
    'common.close':         'Lukk',
    'common.required':      'Påkrevd',
    'common.optional':      'Valgfritt',
    'common.or':            'eller',
    'common.and':           'og',
  },

  en: {
    // ── Navigation ──────────────────────────────────────────
    'nav.home':         'Home',
    'nav.catalog':      'Course Catalog',
    'nav.my_courses':   'My Courses',
    'nav.diplomas':     'Diplomas',
    'nav.profile':      'Profile',
    'nav.admin':        'Admin',
    'nav.company':      'Company',
    'nav.logout':       'Log Out',
    'nav.login':        'Log In',
    'nav.register':     'Register',

    // ── Auth ─────────────────────────────────────────────────
    'auth.login.title':         'Welcome Back',
    'auth.login.subtitle':      'Sign in to continue your training',
    'auth.login.email':         'Email address',
    'auth.login.password':      'Password',
    'auth.login.btn':           'Sign In',
    'auth.login.forgot':        'Forgot password?',
    'auth.login.no_account':    "Don't have an account?",
    'auth.login.register_link': 'Register',
    'auth.login.or':            'or',

    'auth.register.title':         'Create Account',
    'auth.register.subtitle':      'Start your certification journey',
    'auth.register.step1':         'Personal Info',
    'auth.register.step2':         'Company',
    'auth.register.step3':         'Account',
    'auth.register.first_name':    'First Name',
    'auth.register.last_name':     'Last Name',
    'auth.register.email':         'Email Address',
    'auth.register.phone':         'Phone Number',
    'auth.register.company_type':  'Account Type',
    'auth.register.company_emp':   'Company Employee',
    'auth.register.independent':   'Independent Operator',
    'auth.register.company_name':  'Company Name',
    'auth.register.company_org':   'Organization Number',
    'auth.register.password':      'Password',
    'auth.register.confirm_pw':    'Confirm Password',
    'auth.register.terms':         'I agree to the terms and privacy policy',
    'auth.register.btn':           'Create Account',
    'auth.register.has_account':   'Already have an account?',
    'auth.register.login_link':    'Sign In',

    'auth.forgot.title':    'Reset Password',
    'auth.forgot.subtitle': "We'll send you a link to reset your password",
    'auth.forgot.email':    'Email address',
    'auth.forgot.btn':      'Send Reset Link',
    'auth.forgot.back':     'Back to login',
    'auth.forgot.sent':     'Email sent! Check your inbox.',

    // ── Home / Hero ──────────────────────────────────────────
    'home.hero.tag':         'Oslo Liftutleie',
    'home.hero.title':       'Get Certified in\nSafety & Training',
    'home.hero.subtitle':    'Digital safety training for heavy machinery — fast, legal, and recognized by Oslo Liftutleie.',
    'home.hero.cta':         'Start Training',
    'home.hero.cta2':        'Browse Machines',
    'home.hero.badge1':      'Mobile Diploma',
    'home.hero.badge2':      '299 NOK per approval',
    'home.hero.badge3':      'GDPR Compliant',
    'home.stats.courses':    'Machine Types',
    'home.stats.certs':      'Certificates Issued',
    'home.stats.companies':  'Companies',
    'home.stats.pass_rate':  'Pass Rate',

    // ── Catalog ───────────────────────────────────────────────
    'catalog.title':        'Machine Catalog',
    'catalog.subtitle':     'Find and complete training for your equipment',
    'catalog.search':       'Search by machine or category...',
    'catalog.all':          'All',
    'catalog.lifter':       'Lifts',
    'catalog.maskiner':     'Machines',
    'catalog.truck':        'Truck / Mini Crane',
    'catalog.enroll':       'Start Course',
    'catalog.enrolled':     'Continue Course',
    'catalog.completed':    'Completed ✓',
    'catalog.locked':       '🔒 Pay to Unlock',
    'catalog.pages':        'pages',
    'catalog.height':       'Working Height',
    'catalog.price':        '299 NOK',

    // ── Course ────────────────────────────────────────────────
    'course.progress':         'Progress',
    'course.page':             'Page',
    'course.of':               'of',
    'course.read_confirm':     'I have read and understood this section',
    'course.next':             'Next Page',
    'course.prev':             'Previous Page',
    'course.finish_reading':   'Finish Reading',
    'course.start_test':       'Start Safety Test',
    'course.manual_label':     'User Manual',
    'course.video_label':      'Instructional Video',
    'course.notes_label':      'My Notes',
    'course.notes_ph':         'Write your notes here...',
    'course.offline_saved':    'Saved offline',

    // ── Assessment ───────────────────────────────────────────
    'assess.title':         'Safety Test',
    'assess.subtitle':      'Answer all questions to complete the course',
    'assess.question':      'Question',
    'assess.submit':        'Submit Answers',
    'assess.pass':          'Passed! 🎉',
    'assess.fail':          'Not Passed',
    'assess.pass_msg':      'Well done! You are now ready for signing.',
    'assess.fail_msg':      'You need 80% to pass. Please try again.',
    'assess.retry':         'Try Again',
    'assess.score':         'Your Score',
    'assess.pass_score':    'Required',
    'assess.attempts_left': 'Attempts Left',

    // ── Payment ───────────────────────────────────────────────
    'payment.title':         'Pay for Course',
    'payment.subtitle':      'One-time payment — lifetime access to the manual',
    'payment.amount':        '299 NOK',
    'payment.incl_vat':      'incl. 25% VAT',
    'payment.card':          'Card Payment',
    'payment.invoice':       'Invoice (Business Customers)',
    'payment.vipps':         'Pay with Vipps',
    'payment.proceed':       'Proceed to Payment',
    'payment.success':       'Payment Successful!',
    'payment.fail':          'Payment Failed',
    'payment.retry':         'Try Again',

    // ── Signature ─────────────────────────────────────────────
    'sign.title':           'Signature',
    'sign.subtitle':        'Draw your signature to confirm completion',
    'sign.operator':        'Operator Signature',
    'sign.oslo_lift':       'Oslo Lift Signature',
    'sign.clear':           'Clear',
    'sign.confirm':         'Confirm Signature',
    'sign.awaiting':        'Waiting for Oslo Lift signature...',
    'sign.approved':        'Approved and Signed!',
    'sign.send_local':      'Send to Local Supervisor',

    // ── Certificate ───────────────────────────────────────────
    'cert.title':           'Your Diploma',
    'cert.subtitle':        'Official Type Approval Certificate',
    'cert.name':            'Name',
    'cert.course':          'Course',
    'cert.date':            'Date',
    'cert.cert_no':         'Certificate No.',
    'cert.download':        'Download PDF',
    'cert.email':           'Send by Email',
    'cert.share':           'Share',
    'cert.verify':          'Verify',
    'cert.passed':          'PASSED',
    'cert.oslo_lift_sig':   'Oslo Liftutleie',
    'cert.authorized_by':   'Authorized by',

    // ── Admin ─────────────────────────────────────────────────
    'admin.dashboard':      'Dashboard',
    'admin.equipment':      'Equipment & Manuals',
    'admin.users':          'Users',
    'admin.pending':        'Pending Approvals',
    'admin.companies':      'Companies',
    'admin.payments':       'Payments',
    'admin.qr':             'QR Codes',
    'admin.analytics':      'Analytics',
    'admin.export_visma':   'Export to Visma',

    // ── Company ───────────────────────────────────────────────
    'company.team':         'My Team',
    'company.invite':       'Invite Employee',
    'company.billing':      'Billing',
    'company.reports':      'Reports',
    'company.status_all':   'All Statuses',
    'company.status_done':  'Completed',
    'company.status_pend':  'In Progress',
    'company.status_new':   'Not Started',

    // ── Profile ───────────────────────────────────────────────
    'profile.my_courses':   'My Courses',
    'profile.diplomas':     'My Diplomas',
    'profile.settings':     'Settings',
    'profile.payment_hist': 'Payment History',
    'profile.edit':         'Edit Profile',
    'profile.cv_link':      'Share CV Page',

    // ── QR ────────────────────────────────────────────────────
    'qr.title':             'Machine Info',
    'qr.completed_btn':     '✅ Course Completed',
    'qr.not_completed_btn': '❌ Course NOT Completed',
    'qr.enroll':            'Start course for this machine',
    'qr.login_required':    'Log in to view training status',

    // ── Checklist ─────────────────────────────────────────────
    'check.title':          'Pre-Use Inspection',
    'check.subtitle':       'Check the machine before use',
    'check.add_photo':      'Add Photo',
    'check.submit':         'Submit Checklist',
    'check.submitted':      'Checklist submitted!',
    'check.issue_found':    'Issue Found',

    // ── Common ────────────────────────────────────────────────
    'common.save':          'Save',
    'common.cancel':        'Cancel',
    'common.delete':        'Delete',
    'common.edit':          'Edit',
    'common.view':          'View',
    'common.back':          'Back',
    'common.next':          'Next',
    'common.prev':          'Previous',
    'common.loading':       'Loading...',
    'common.error':         'Something went wrong',
    'common.success':       'Success!',
    'common.confirm':       'Confirm',
    'common.search':        'Search',
    'common.filter':        'Filter',
    'common.all':           'All',
    'common.yes':           'Yes',
    'common.no':            'No',
    'common.close':         'Close',
    'common.required':      'Required',
    'common.optional':      'Optional',
    'common.or':            'or',
    'common.and':           'and',
  }
};

const I18n = {
  lang: localStorage.getItem('ol_lang') || 'no',

  t(key, vars = {}) {
    const dict = translations[this.lang] || translations.no;
    let str = dict[key] || translations.no[key] || key;
    // Variable interpolation {{varName}}
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    });
    return str;
  },

  setLang(lang) {
    if (!['no', 'en'].includes(lang)) return;
    this.lang = lang;
    localStorage.setItem('ol_lang', lang);
    this.applyAll();
    document.documentElement.lang = lang;
  },

  toggle() {
    this.setLang(this.lang === 'no' ? 'en' : 'no');
  },

  /** Apply translations to all [data-i18n] elements in the DOM */
  applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const target = el.dataset.i18nTarget || 'textContent';
      if (target === 'placeholder') {
        el.placeholder = this.t(key);
      } else if (target === 'title') {
        el.title = this.t(key);
      } else {
        el.textContent = this.t(key);
      }
    });
    // Update lang toggle button label
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = this.lang === 'no' ? '🇬🇧 EN' : '🇳🇴 NO';
  },

  getCurrentLang() {
    return this.lang;
  }
};

export default I18n;
