// R3w Automation page: the race between hand and automation, and the time calculator

const decimal = (n) => n.toFixed(1).replace('.', lang === 'en' ? '.' : ',');

// Hold the hero workflow still for visitors who prefer less motion
if (reduceMotion) document.querySelector('.flowcanvas__wires').pauseAnimations();

// ---------- By hand vs automatic ----------

const race = document.getElementById('race');
const lanes = [...race.querySelectorAll('.race__col')].map((col) => ({
  steps: [...col.querySelectorAll('.race__steps li')],
  clock: col.querySelector('[data-clock]'),
  bar: col.querySelector('.race__bar i'),
  // how long it takes on screen, and what the clock should read at the end
  manual: col.dataset.mode === 'manual',
}));
const STEP_AT = [0.14, 0.38, 0.62, 0.84, 1];
let raceFrame;

function showLane(lane, p) {
  lane.steps.forEach((li, i) => li.classList.toggle('is-done', p >= STEP_AT[i]));
  lane.bar.style.setProperty('--p', p);
  if (lane.manual) {
    const secs = Math.round(p * 12 * 60); // about 12 minutes by hand
    lane.clock.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  } else {
    lane.clock.textContent = `${decimal(p * 2.1)} s`; // about 2 seconds automated
  }
}

function runRace() {
  cancelAnimationFrame(raceFrame);
  if (reduceMotion) { lanes.forEach((lane) => showLane(lane, 1)); return; }
  const start = performance.now();
  const tick = (now) => {
    const elapsed = now - start;
    lanes.forEach((lane) => showLane(lane, Math.min(elapsed / (lane.manual ? 10000 : 1200), 1)));
    if (elapsed < 10000) raceFrame = requestAnimationFrame(tick);
  };
  raceFrame = requestAnimationFrame(tick);
}

lanes.forEach((lane) => showLane(lane, 0));
new IntersectionObserver((entries, obs) => {
  if (!entries[0].isIntersecting) return;
  runRace();
  obs.disconnect();
}, { threshold: 0.4 }).observe(race);
document.querySelector('.race__replay').addEventListener('click', runRace);

// ---------- Time calculator ----------

const calc = document.getElementById('calc');
const inputs = {
  min: calc.querySelector('[data-in="min"]'),
  days: calc.querySelector('[data-in="days"]'),
};
const out = (name) => calc.querySelector(`[data-out="${name}"]`);
const year = calc.querySelector('.calc__year');
const WEEKS = 48;
const cells = Array.from({ length: WEEKS * 5 }, (_, i) => {
  const cell = document.createElement('i');
  cell.style.transitionDelay = `${(i % 24) * 6}ms`;
  year.append(cell);
  return cell;
});
const shown = { hours: 0, workdays: 0 };

// Ease the big numbers toward their new value
function tween(name, target) {
  const from = shown[name];
  const start = performance.now();
  const step = (now) => {
    const p = reduceMotion ? 1 : Math.min((now - start) / 500, 1);
    shown[name] = from + (target - from) * (1 - Math.pow(1 - p, 3));
    out(name).textContent = Math.round(shown[name]);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function updateCalc() {
  const minutes = Number(inputs.min.value);
  const days = Number(inputs.days.value);
  const hours = (minutes * days * WEEKS) / 60;
  const workdays = hours / 8;

  out('min').textContent = minutes;
  out('days').textContent = days;
  Object.values(inputs).forEach((input) => {
    input.style.setProperty('--p', `${((input.value - input.min) / (input.max - input.min)) * 100}%`);
  });
  tween('hours', hours);
  tween('workdays', workdays);
  const lost = Math.min(Math.round(workdays), cells.length);
  cells.forEach((cell, i) => cell.classList.toggle('is-lost', i < lost));
}

Object.values(inputs).forEach((input) => input.addEventListener('input', updateCalc));
updateCalc();

// The automatic clock uses a decimal comma in Romanian and Hungarian
document.addEventListener('langchange', () => lanes.forEach((lane) => {
  if (!lane.manual) lane.clock.textContent = lane.clock.textContent.replace(/[.,]/, lang === 'en' ? '.' : ',');
}));
