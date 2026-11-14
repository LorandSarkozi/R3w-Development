// Where contact form messages are sent
const CONTACT_EMAIL = 'lorand.sarkozi25@yahoo.com';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get: (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} },
};

// Opened straight from disk, folders don't open their index.html, so point links at it
if (location.protocol === 'file:') {
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
    if (href.endsWith('/')) a.setAttribute('href', `${href}index.html`);
    else if (href.includes('/#')) a.setAttribute('href', href.replace('/#', '/index.html#'));
  });
}

// ---------- Language ----------

const LANGS = ['ro', 'hu', 'en'];
const metaDesc = document.querySelector('meta[name="description"]');

// Romanian comes straight from the page, so read it once before anything is swapped
const ro = TRANSLATIONS.ro;
ro['meta.title'] = document.title;
ro['meta.desc'] = metaDesc.content;
document.querySelectorAll('[data-i18n]').forEach((el) => { ro[el.dataset.i18n] = el.innerHTML.trim(); });
document.querySelectorAll('[data-i18n-label]').forEach((el) => { ro[el.dataset.i18nLabel] = el.getAttribute('aria-label'); });

let lang = 'ro';
const t = (key) => TRANSLATIONS[lang][key] ?? ro[key];

function setLang(next) {
  lang = LANGS.includes(next) ? next : 'ro';
  root.lang = lang;
  document.title = t('meta.title');
  metaDesc.content = t('meta.desc');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
  document.querySelectorAll('[data-lang]').forEach((btn) => btn.setAttribute('aria-pressed', btn.dataset.lang === lang));
  updateMenuLabel();
  store.set('lang', lang);
  document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

document.querySelectorAll('[data-lang]').forEach((btn) =>
  btn.addEventListener('click', () => setLang(btn.dataset.lang))
);

// ---------- Theme ----------

const themeColor = document.querySelector('meta[name="theme-color"]');

function setTheme(theme) {
  root.dataset.theme = theme;
  themeColor.content = theme === 'light' ? '#EEF3FB' : '#040A18';
}

document.querySelectorAll('.theme-toggle').forEach((btn) =>
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    store.set('theme', next);
  })
);

setTheme(root.dataset.theme);

// ---------- Mobile menu ----------

const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('nav-menu');

function updateMenuLabel() {
  const open = menu.classList.contains('is-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', t(open ? 'ui.menuClose' : 'ui.menuOpen'));
  root.classList.toggle('menu-open', open); // stops the page scrolling behind the menu
}

const setMenu = (open) => {
  menu.classList.toggle('is-open', open);
  updateMenuLabel();
};

toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// ---------- Scroll effects ----------

// Nav background once the page is scrolled
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Highlight the nav link of the section in view
const links = [...menu.querySelectorAll('a[href^="#"]')];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

// Fade elements in as they scroll into view
const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Count a number up from 0: <b data-count="62">62</b>
function countUp(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = target; return; }
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Animated blocks start playing once they are on screen
const animateObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-on');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.3 }
);
document.querySelectorAll('[data-animate]').forEach((el) => animateObserver.observe(el));

// ---------- Hero reel (home page) ----------

const stage = document.querySelector('.stage');

if (stage) {
  const scenes = [...stage.querySelectorAll('.scene')];
  const tabs = [...stage.querySelectorAll('.reel__tab')];
  const caption = stage.querySelector('.reel__caption'); // scene name on phones
  let current = 0;
  let typing;

  // Position of an element inside its scene, ignoring transforms (the window tilts)
  const offsetIn = (el, scene) => {
    let x = 0, y = 0;
    while (el && el !== scene) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent;
    }
    return { x, y };
  };

  // Point the scene's cursor at the thing it should click
  const aimCursor = (scene) => {
    const cursor = scene.querySelector('.cursor');
    const target = scene.querySelector('[data-click]');
    if (!cursor || !target) return;
    const { x, y } = offsetIn(target, scene);
    cursor.style.setProperty('--sx', `${scene.offsetWidth * 0.86}px`);
    cursor.style.setProperty('--sy', `${scene.offsetHeight * 0.9}px`);
    cursor.style.setProperty('--tx', `${x + target.offsetWidth * 0.55}px`);
    cursor.style.setProperty('--ty', `${y + target.offsetHeight * 0.45}px`);
  };

  // Type the mini site's headline letter by letter
  const typeHeadline = (scene) => {
    const el = scene.querySelector('.type');
    if (!el) return;
    clearInterval(typing);
    if (reduceMotion) return;
    let i = -10; // short pause before the first letter
    el.textContent = '';
    typing = setInterval(() => {
      const full = t(el.dataset.i18n);
      i++;
      if (i > 0) el.textContent = full.slice(0, i);
      if (i >= full.length) clearInterval(typing);
    }, 55);
  };

  window.showScene = (n) => {
    current = (n + scenes.length) % scenes.length;
    const scene = scenes[current];

    scenes.forEach((s) => s.classList.toggle('is-active', s === scene));
    scene.classList.remove('is-playing');
    tabs.forEach((tab, i) => {
      tab.classList.remove('is-active');
      tab.classList.toggle('is-done', i < current);
    });
    void scene.offsetWidth; // restart the CSS animations
    scene.classList.add('is-playing');
    tabs[current].classList.add('is-active');
    if (caption) caption.textContent = `R3w ${tabs[current].textContent.trim()}`;

    aimCursor(scene);
    typeHeadline(scene);
  };

  tabs.forEach((tab, i) => tab.addEventListener('click', () => showScene(i)));

  // Swipe left or right on a phone to change scene
  let touchX = null;
  stage.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showScene(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  stage.querySelector('.reel').addEventListener('animationend', (e) => {
    if (e.animationName === 'reel-progress') showScene(current + 1);
  });
  window.addEventListener('resize', () => aimCursor(scenes[current]));

  // Wedding countdown to the next 14 June
  const now = new Date();
  let weddingDay = new Date(now.getFullYear(), 5, 14, 16);
  if (weddingDay < now) weddingDay = new Date(now.getFullYear() + 1, 5, 14, 16);
  stage.querySelector('.wed-date').textContent = `14.06.${weddingDay.getFullYear()}`;

  const tickCountdown = () => {
    const secs = Math.max(0, Math.floor((weddingDay - new Date()) / 1000));
    const parts = { d: Math.floor(secs / 86400), h: Math.floor(secs / 3600) % 24, m: Math.floor(secs / 60) % 60, s: secs % 60 };
    stage.querySelectorAll('[data-cd]').forEach((el) => {
      el.textContent = String(parts[el.dataset.cd]).padStart(2, '0');
    });
  };
  setInterval(tickCountdown, 1000);
  tickCountdown();

  // The window tilts a little toward the mouse
  if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
    const hero = document.querySelector('.hero');
    hero.addEventListener('mousemove', (e) => {
      stage.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5) * 2);
      stage.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5) * 2);
    });
    hero.addEventListener('mouseleave', () => {
      stage.style.setProperty('--mx', 0);
      stage.style.setProperty('--my', 0);
    });
  }

  showScene(0);
}

// ---------- Portfolio (home page) ----------

const projects = document.getElementById('projects');

if (projects) {
  // Arrows that move the row of projects
  const carouselBtns = [...document.querySelectorAll('[data-scroll]')];

  const updateCarouselNav = () => {
    const end = projects.scrollWidth - projects.clientWidth - 2;
    carouselBtns[0].disabled = projects.scrollLeft <= 2;
    carouselBtns[1].disabled = projects.scrollLeft >= end;
  };

  carouselBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      const step = projects.querySelector('.project').offsetWidth + 24;
      projects.scrollBy({ left: step * Number(btn.dataset.scroll) });
    })
  );
  projects.addEventListener('scroll', updateCarouselNav, { passive: true });
  window.addEventListener('resize', updateCarouselNav);
  updateCarouselNav();

  // Screenshot slider inside each project
  document.querySelectorAll('.shots').forEach((shots) => {
    const track = shots.querySelector('.shots__track');
    const slides = [...track.children];
    if (slides.length < 2) {
      shots.classList.add('is-single');
      return;
    }

    const prev = shots.querySelector('.shots__btn--prev');
    const next = shots.querySelector('.shots__btn--next');
    const url = shots.closest('.browser').querySelector('.browser__url');
    const addr = url.querySelector('.browser__addr');
    const site = url.href;
    const domain = addr.textContent;
    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = (i) => track.scrollTo({ left: i * track.clientWidth });

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `${i + 1} / ${slides.length}`);
      dot.addEventListener('click', () => go(i));
      shots.querySelector('.shots__dots').append(dot);
      return dot;
    });

    const update = () => {
      const i = current();
      dots.forEach((dot, k) => dot.classList.toggle('is-active', k === i));
      // the address bar follows the page on screen, like a real browser
      const path = slides[i].dataset.path || '';
      addr.textContent = domain + (path ? `/${path}` : '');
      url.href = site + path;
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };

    prev.addEventListener('click', () => go(current() - 1));
    next.addEventListener('click', () => go(current() + 1));
    track.addEventListener('scroll', update, { passive: true });
    update();
  });
}

// ---------- Quick contact button (phones) ----------

const quick = document.querySelector('.quick');

if (quick) {
  const quickBtn = quick.querySelector('.quick__btn');
  const contactSection = document.getElementById('contact');
  let contactInView = false;

  const setQuick = (open) => {
    quick.classList.toggle('is-open', open);
    quickBtn.setAttribute('aria-expanded', open);
  };
  quickBtn.addEventListener('click', () => setQuick(!quick.classList.contains('is-open')));
  quick.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setQuick(false)));
  // a tap anywhere else, including the dimmed page behind, closes it
  document.addEventListener('click', (e) => { if (!quick.contains(e.target) || e.target === quick) setQuick(false); });

  // Show it once the visitor starts scrolling, hide it where contact details are already on screen
  const updateQuick = () => {
    const show = window.scrollY > 500 && !contactInView && !menu.classList.contains('is-open');
    quick.classList.toggle('is-shown', show);
    if (!show) setQuick(false);
  };
  if (contactSection) {
    new IntersectionObserver(([entry]) => { contactInView = entry.isIntersecting; updateQuick(); }, { threshold: 0.15 })
      .observe(contactSection);
  }
  window.addEventListener('scroll', updateQuick, { passive: true });
  toggle.addEventListener('click', updateQuick);
  updateQuick();
}

// ---------- Contact (home page) ----------

const contactForm = document.getElementById('contact-form');

// Open the visitor's mail app with the form filled in
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const picked = e.target.querySelector('input[name="service"]:checked');
    const service = picked.value || picked.nextElementSibling.textContent.trim();
    const subject = `${service} (${data.get('name')})`;
    const body = `${data.get('message')}\n\n${data.get('name')}\n${data.get('email')}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.getElementById('year').textContent = new Date().getFullYear();

setLang(store.get('lang') || 'ro');
