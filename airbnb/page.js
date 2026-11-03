// ---------- Live demo: tabs ----------

const demoTabs = [...document.querySelectorAll('.demo__tabs [role="tab"]')];
const demoPanels = [...document.querySelectorAll('.demo__panel')];

demoTabs.forEach((tab) =>
  tab.addEventListener('click', () => {
    demoTabs.forEach((other) => other.setAttribute('aria-selected', other === tab));
    demoPanels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tab.dataset.tab));
  })
);

// ---------- Live demo: the Wi-Fi password really gets copied ----------

const copyBtn = document.querySelector('.demo__copy');
const toast = document.querySelector('.demo__toast');
let toastTimer;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // older browsers, or pages opened straight from disk
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

copyBtn.addEventListener('click', async () => {
  const ok = await copyText(document.querySelector('.demo__pw').textContent.trim());
  toast.textContent = t(ok ? 'page.demo.copied' : 'page.demo.copyFail');
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2400);
});

document.addEventListener('langchange', () => toast.classList.remove('is-shown'));

// ---------- The inbox animation can be played again ----------

const inbox = document.querySelector('.inbox');

inbox.querySelector('.inbox__replay').addEventListener('click', () => {
  inbox.classList.remove('is-on');
  void inbox.offsetWidth; // restart the CSS animations
  inbox.classList.add('is-on');
  inbox.querySelectorAll('[data-count]').forEach(countUp);
});
