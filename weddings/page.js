// R3w Weddings page: live countdown, the RSVP demo, the style studio and the QR code
{
  // ---------- Countdown to the next 14 June ----------

  const today = new Date();
  let weddingDay = new Date(today.getFullYear(), 5, 14, 16);
  if (weddingDay < today) weddingDay = new Date(today.getFullYear() + 1, 5, 14, 16);
  document.querySelectorAll('.wed-date').forEach((el) => { el.textContent = `14.06.${weddingDay.getFullYear()}`; });

  const tick = () => {
    const secs = Math.max(0, Math.floor((weddingDay - new Date()) / 1000));
    const parts = { d: Math.floor(secs / 86400), h: Math.floor(secs / 3600) % 24, m: Math.floor(secs / 60) % 60, s: secs % 60 };
    document.querySelectorAll('[data-cd]').forEach((el) => {
      el.textContent = String(parts[el.dataset.cd]).padStart(2, '0');
    });
  };
  setInterval(tick, 1000);
  tick();

  // ---------- RSVP demo ----------

  const card = document.querySelector('.rsvp-card');
  const live = { yes: 86, no: 9, veg: 7 };
  const liveEls = {};
  document.querySelectorAll('[data-live]').forEach((el) => { liveEls[el.dataset.live] = el; });
  let people = 2;
  let menu = 'classic';
  let last = null; // what the visitor's answer added, so it can be taken back

  const show = (key) => {
    const el = liveEls[key];
    el.textContent = live[key];
    el.classList.remove('bump');
    void el.offsetWidth; // restart the bump animation
    el.classList.add('bump');
  };

  const pickMenu = (value) => {
    menu = value;
    card.querySelectorAll('[data-menu]').forEach((chip) => chip.classList.toggle('is-picked', chip.dataset.menu === value));
  };

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.answer === 'yes') {
      card.dataset.step = 'details';
    } else if (btn.dataset.answer === 'no') {
      last = { no: 1 };
      live.no += 1;
      card.dataset.answer = 'no';
      card.dataset.step = 'done';
      show('no');
    } else if (btn.dataset.menu) {
      pickMenu(btn.dataset.menu);
    } else if (btn.dataset.people) {
      people = Math.min(6, Math.max(1, people + Number(btn.dataset.people)));
      card.querySelector('.rsvp-count').textContent = people;
    } else if (btn.classList.contains('rsvp-send')) {
      last = { yes: people, veg: menu === 'veg' ? people : 0 };
      live.yes += people;
      card.dataset.answer = 'yes';
      card.dataset.step = 'done';
      show('yes');
      if (last.veg) { live.veg += last.veg; show('veg'); }
    } else if (btn.classList.contains('rsvp-change')) {
      if (last) {
        Object.entries(last).forEach(([key, n]) => {
          if (!n) return;
          live[key] -= n;
          show(key);
        });
      }
      last = null;
      people = 2;
      card.querySelector('.rsvp-count').textContent = people;
      pickMenu('classic');
      card.removeAttribute('data-answer');
      card.dataset.step = 'ask';
    }
  });

  // ---------- Style studio ----------

  // The preview is a sample invitation, so its text follows the language picked here
  const PREVIEW = {
    ro: { invite: 'Vă invităm la nunta noastră', btn: 'Confirmă prezența' },
    hu: { invite: 'Szeretettel meghívunk az esküvőnkre', btn: 'Visszajelzés' },
    en: { invite: "You're invited to our wedding", btn: 'RSVP' },
  };
  const preview = document.querySelector('.studio__preview');
  const previewCard = preview.querySelector('.studio__card');
  const controls = document.querySelector('.studio__controls');
  let previewLangPicked = false;

  const swap = () => {
    previewCard.classList.remove('is-swapping');
    void previewCard.offsetWidth;
    previewCard.classList.add('is-swapping');
  };

  const setPreviewLang = (code) => {
    preview.querySelector('.studio__invite').textContent = PREVIEW[code].invite;
    preview.querySelector('.studio__btn').textContent = PREVIEW[code].btn;
    controls.querySelectorAll('[data-set-lang]').forEach((b) => b.classList.toggle('is-picked', b.dataset.setLang === code));
  };

  controls.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const group = btn.parentElement;
    if (btn.dataset.setPalette) preview.dataset.palette = btn.dataset.setPalette;
    if (btn.dataset.setFont) preview.dataset.font = btn.dataset.setFont;
    if (btn.dataset.setLang) {
      previewLangPicked = true;
      setPreviewLang(btn.dataset.setLang);
    }
    group.querySelectorAll('button').forEach((b) => b.classList.toggle('is-picked', b === btn));
    swap();
  });

  // Until the visitor picks one, the sample speaks the page's language
  setPreviewLang(lang);
  document.addEventListener('langchange', (e) => { if (!previewLangPicked) setPreviewLang(e.detail); });

  // ---------- A decorative QR code for the printed card ----------

  const qr = document.getElementById('qr');
  const N = 21;
  let seed = 11;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const corners = [[0, 0], [0, N - 7], [N - 7, 0]];

  // the three square markers every QR code has in its corners
  const marker = (r, c) => {
    for (const [cr, cc] of corners) {
      const y = r - cr;
      const x = c - cc;
      if (y >= -1 && y <= 7 && x >= -1 && x <= 7) {
        if (y < 0 || y > 6 || x < 0 || x > 6) return false;
        return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
      }
    }
    return null;
  };

  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const m = marker(r, c);
      const on = m === null ? rand() > 0.52 : m;
      cells.push(`<i${on ? ' class="on"' : ''}></i>`);
    }
  }
  qr.innerHTML = cells.join('');
}
