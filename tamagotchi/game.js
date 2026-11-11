/* Terrarium — a tiny creature that remembers you.
   All state lives in localStorage; time passes while you are away. */
(() => {
"use strict";

const KEY = "terrarium-save-v1";
const $ = (id) => document.getElementById(id);
let S = null; // the creature's whole life

/* ---------- state ---------- */
function freshState() {
  return {
    name: null,          // null = still an egg
    hatch: null,         // timestamp of hatching
    lastSeen: Date.now(),
    food: 80, energy: 80, fun: 80, clean: 92,
    asleep: false,
    poops: [],           // [{x, y, t}]
    stars: 0,
    care: 100,
    streak: 0,
    lastVisitDay: null,
    unlocks: [],
    log: []
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { S = Object.assign(freshState(), JSON.parse(raw)); return true; }
  } catch (e) { /* corrupted save -> start over */ }
  S = freshState();
  return false;
}
function save() { S.lastSeen = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); }

/* ---------- time & decay ---------- */
const RATES = { food: 7, fun: 6, clean: 4 };        // points lost per hour
const ENERGY_SLEEP = 16, ENERGY_AWAKE = 5;          // per hour
const MAX_AWAY_H = 48;                              // kind cap on offline decay

function applyDecay(now) {
  let h = (now - S.lastSeen) / 3600e3;
  if (h <= 0) return 0;
  const capped = Math.min(h, MAX_AWAY_H);
  S.food = clamp(S.food - RATES.food * capped);
  S.fun = clamp(S.fun - RATES.fun * capped);
  S.clean = clamp(S.clean - RATES.clean * capped);
  S.energy = clamp(S.energy + (S.asleep ? ENERGY_SLEEP : -ENERGY_AWAKE) * capped);
  // poops while awake
  if (!S.asleep) {
    const expected = Math.floor(capped / 4);
    let added = 0;
    for (let i = 0; i < expected; i++)
      if (Math.random() < 0.45 && S.poops.length < 4) { addPoop(); added++; }
  }
  return h;
}

function clamp(v) { return Math.max(0, Math.min(100, v)); }

/* ---------- derived ---------- */
function ageHours() { return S.hatch ? (Date.now() - S.hatch) / 3600e3 : -1; }
function stage() {
  const a = ageHours();
  if (a < 0) return "egg";
  if (a < 24) return "baby";
  if (a < 72) return "child";
  return "adult";
}
function mood() {
  if (S.food < 10 || S.clean < 10) return "sick";
  const avg = (S.food + S.energy + S.fun + S.clean) / 4;
  if (avg >= 65) return "happy";
  if (avg >= 38) return "ok";
  return "sad";
}
function dayIndex(ts) { const d = new Date(ts); return Math.floor(d.getTime() / 864e5); }

/* ---------- rendering ---------- */
const el = {
  creature: $("creature"), face: $("face"), mouth: $("mouth"),
  zzz: $("zzz"), shadow: $("shadow"), bodyshape: $("bodyshape"),
  sun: $("sun"), moon: $("moon"), clouds: $("clouds"),
  skyday: $("skyday"), skynight: $("skynight"),
  fx: $("fx"), poops: $("poops"), bubble: $("bubble"),
  hat: $("hat"), bow: $("bow")
};

const MOUTHS = {
  happy: "M-8 13 Q 0 20 8 13",
  ok: "M-8 15 Q 0 17 8 15",
  sad: "M-8 19 Q 0 12 8 19",
  open: "M-7 13 Q 0 25 7 13",
  sick: "M-7 16 q 3 -3 6 0 q 3 3 6 0"
};

let blinkTimer = null;
function scheduleBlink() {
  clearTimeout(blinkTimer);
  blinkTimer = setTimeout(() => {
    if (!S.asleep) {
      el.creature.classList.add("blink");
      setTimeout(() => el.creature.classList.remove("blink"), 140);
    }
    scheduleBlink();
  }, 2600 + Math.random() * 2600);
}

function render() {
  const st = stage(), m = mood();
  const k = st === "baby" ? 0.72 : st === "child" ? 0.88 : 1;
  el.creature.style.setProperty("--k", k);
  document.documentElement.style.setProperty("--k", k);

  // egg form
  const isEgg = st === "egg";
  el.creature.classList.toggle("egg", isEgg);
  el.bodyshape.setAttribute("ry", isEgg ? 54 : 46);
  el.bodyshape.setAttribute("rx", isEgg ? 40 : 52);
  el.face.setAttribute("opacity", isEgg ? 0 : 1);
  el.creature.querySelector(".feet").setAttribute("opacity", isEgg ? 0 : 1);
  el.creature.querySelector(".moss").setAttribute("opacity", isEgg ? 0 : 0.55);
  el.creature.querySelector(".cheeks").setAttribute("opacity", isEgg ? 0 : 0.6);

  // growth features
  el.creature.querySelector(".ears").setAttribute("opacity", (st === "child" || st === "adult") && !isEgg ? 1 : 0);
  el.creature.querySelector(".sprout").setAttribute("opacity", st === "adult" && !isEgg ? 1 : 0);

  // sleep
  el.creature.classList.toggle("asleep", S.asleep);
  el.zzz.setAttribute("opacity", S.asleep ? 1 : 0);
  el.moon.setAttribute("opacity", S.asleep ? 1 : 0);
  el.sun.setAttribute("opacity", S.asleep ? 0 : 1);
  el.clouds.setAttribute("opacity", S.asleep ? 0.15 : 0.85);
  el.skyday.setAttribute("opacity", S.asleep ? 0 : 1);
  el.skynight.setAttribute("opacity", S.asleep ? 1 : 0);

  // mood face
  if (!isEgg) {
    el.mouth.setAttribute("d", S.asleep ? MOUTHS.ok : (MOUTHS[m] || MOUTHS.ok));
    el.creature.querySelector(".eyes").setAttribute("opacity", S.asleep ? 0 : 1);
    el.creature.querySelector(".eyes-shut").setAttribute("opacity", S.asleep ? 1 : 0);
    el.creature.querySelector(".sweat").setAttribute("opacity", m === "sick" ? 1 : 0);
    el.creature.querySelector(".dirt").setAttribute("opacity", S.clean < 35 ? 1 : 0);
    el.creature.querySelector(".cheeks").setAttribute("opacity", m === "happy" ? 0.75 : 0.3);
  }

  // accessories
  el.bow.setAttribute("opacity", S.unlocks.includes("bow") && !isEgg ? 1 : 0);
  el.hat.setAttribute("opacity", S.unlocks.includes("hat") && !isEgg ? 1 : 0);

  // stats bars
  setBar("s-food", S.food); setBar("s-energy", S.energy);
  setBar("s-fun", S.fun); setBar("s-clean", S.clean);

  // badges
  $("badge-stars").innerHTML = "★ <b>" + S.stars + "</b>";
  $("badge-streak").innerHTML = "🔥 <b>" + S.streak + "</b>";
  const a = ageHours();
  $("badge-age").innerHTML = "🌱 <b>" + (isEgg ? "an egg" :
    (st + " · " + (a < 48 ? Math.floor(a) + "h" : Math.floor(a / 24) + "d")) + "</b>");

  // care line
  const careWord = S.care >= 90 ? "impeccable" : S.care >= 70 ? "steady" : S.care >= 40 ? "a bit rocky" : "needs love";
  $("care-line").innerHTML = "Care score <b>" + S.care + "</b> · " + careWord + ".";
  renderUnlocks();
  renderPoops();
}

function setBar(id, v) {
  const f = $(id);
  f.style.width = Math.round(v) + "%";
  f.classList.toggle("low", v < 30);
}

function renderUnlocks() {
  const line = $("unlock-line");
  const st = stage();
  const wants = [];
  if (st === "adult" || st === "child") wants.push("bow");
  if (st === "adult") wants.push("hat");
  const missing = wants.filter(w => !S.unlocks.includes(w));
  line.innerHTML = missing.length
    ? "Next gift at <b>care 80+</b>: " + (missing[0] === "bow" ? "a little bow 🎀" : "a sun hat 👒") + "."
    : (wants.length ? "Every gift earned is worn with pride." : "Gifts arrive as your creature grows.");
}

/* poops */
const POOP_SLOTS = [[-95, 62], [95, 60], [-60, 78], [70, 82]];
function addPoop() {
  const used = S.poops.map(p => p.slot);
  const slot = POOP_SLOTS.findIndex((_, i) => !used.includes(i));
  if (slot === -1) return;
  S.poops.push({ slot, t: Date.now() });
}
function renderPoops() {
  el.poops.innerHTML = "";
  S.poops.forEach((p, i) => {
    const [dx, dy] = POOP_SLOTS[p.slot];
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "poop");
    g.setAttribute("transform", `translate(${300 + dx},${300 + dy})`);
    g.innerHTML = `<title>Poop — tap to clean</title>
      <ellipse cx="0" cy="4" rx="11" ry="7" fill="#8A6F4D" stroke="#4E7048" stroke-width="1.5"/>
      <ellipse cx="0" cy="-4" rx="7" ry="5" fill="#8A6F4D" stroke="#4E7048" stroke-width="1.5"/>`;
    g.addEventListener("click", () => { cleanUp(); });
    el.poops.appendChild(g);
  });
}

/* ---------- fx ---------- */
function puff(svgMarkup, dx, dy) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "puff");
  g.setAttribute("transform", `translate(${dx},${dy})`);
  g.innerHTML = svgMarkup;
  el.fx.appendChild(g);
  setTimeout(() => g.remove(), 1100);
}
const HEART = '<path d="M0 4 C -6 -3 -12 2 0 12 C 12 2 6 -3 0 4" fill="#D98A80" stroke="#4E7048" stroke-width="1.4"/>';
const SPARK = '<path d="M0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#F6D26B" stroke="#4E7048" stroke-width="1"/>';
const CRUMB = '<circle cx="0" cy="0" r="3" fill="#D9805E" stroke="#4E7048" stroke-width="1"/>';

function jump() {
  el.creature.classList.remove("happy-jump"); void el.creature.getBBox();
  el.creature.classList.add("happy-jump");
  setTimeout(() => el.creature.classList.remove("happy-jump"), 1100);
}

/* ---------- log & toast ---------- */
function log(msg) {
  S.log.unshift({ t: Date.now(), msg });
  S.log = S.log.slice(0, 12);
  renderLog();
}
function renderLog() {
  $("log").innerHTML = S.log.map(e => {
    const d = new Date(e.t);
    const hh = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    return `<li><b>${hh}</b> — ${e.msg}</li>`;
  }).join("");
}
let toastTimer = null;
function toast(msg) {
  let t = $("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 3200);
}

/* ---------- bubble ---------- */
let bubbleTimer = null;
function speak(msg, hold) {
  el.bubble.textContent = msg;
  el.bubble.hidden = false;
  clearTimeout(bubbleTimer);
  if (!hold) bubbleTimer = setTimeout(() => { el.bubble.hidden = true; }, 5200);
}
function needBubble() {
  if (stage() === "egg") return;
  if (S.asleep) { speak("zzz…", true); return; }
  const m = mood();
  if (m === "sick") { speak("I feel sick… clean me up and feed me, please.", true); return; }
  if (S.food < 35) return speak("I'm hungry…");
  if (S.clean < 35) return speak("It's a bit messy here.");
  if (S.fun < 35) return speak("Play with me?");
  if (S.energy < 25) return speak("So sleepy… lights out?");
  if (m === "happy") speak("This is a good day.");
}

/* ---------- actions ---------- */
function wakeIfAsleep() {
  if (S.asleep) {
    S.asleep = false;
    log("Woke up.");
    return true;
  }
  return false;
}

const FOODS = {
  berry: { food: 18, fun: 4,  label: "berry" },
  meal:  { food: 34, fun: 0,  label: "meal" },
  cake:  { food: 10, fun: 16, label: "cake" }
};
function feed(kind) {
  if (stage() === "egg") return;
  wakeIfAsleep();
  const f = FOODS[kind];
  S.food = clamp(S.food + f.food);
  S.fun = clamp(S.fun + f.fun);
  el.mouth.setAttribute("d", MOUTHS.open);
  setTimeout(render, 700);
  puff(CRUMB, -18, 10); puff(CRUMB, 20, 16);
  log("Ate a " + f.label + ".");
  if (kind === "cake") { jump(); puff(SPARK, 0, -60); }
  $("foodpicker").hidden = true;
  save(); render(); needBubble();
}

function cleanUp() {
  if (stage() === "egg") return;
  wakeIfAsleep();
  if (!S.poops.length && S.clean > 85) { toast("Already spotless!"); return; }
  const n = S.poops.length;
  S.poops = [];
  S.clean = clamp(S.clean + 25 + n * 10);
  puff(SPARK, -40, 20); puff(SPARK, 40, 30); puff(SPARK, 0, 40);
  if (n) log("Cleaned up " + n + " mess" + (n > 1 ? "es" : "") + "."); else log("Freshened up.");
  save(); render(); needBubble();
}

function toggleLights() {
  if (stage() === "egg") return;
  S.asleep = !S.asleep;
  log(S.asleep ? "Lights out — sleeping." : "Good morning!");
  if (S.asleep) speak("zzz…", true);
  save(); render();
}

let petCooldown = 0;
function pet() {
  if (stage() === "egg") return;
  wakeIfAsleep();
  const now = Date.now();
  if (now - petCooldown < 1200) return;
  petCooldown = now;
  S.fun = clamp(S.fun + 3);
  puff(HEART, -30, -50); puff(HEART, 26, -62); puff(HEART, 0, -74);
  save(); render();
}

/* ---------- mini-game: star catch ---------- */
function play() {
  if (stage() === "egg") return;
  if (S.asleep) { wakeIfAsleep(); }
  if (S.energy < 15) { toast("Too tired to play — lights out first."); return; }
  const dlg = $("play-dialog"), field = $("playfield");
  let caught = 0, running = true;
  $("play-score").textContent = "0 stars";
  field.innerHTML = "";
  dlg.showModal();

  const spawn = setInterval(() => {
    if (!running) return;
    const s = document.createElement("div");
    s.className = "star";
    s.style.left = (4 + Math.random() * 86) + "%";
    s.style.top = (6 + Math.random() * 74) + "%";
    s.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2 l2.6 6.2 6.7.5 -5.1 4.4 1.6 6.6 -5.8 -3.6 -5.8 3.6 1.6 -6.6 -5.1 -4.4 6.7 -.5 z" fill="#F6D26B" stroke="#4E7048" stroke-width="1.4"/></svg>';
    s.addEventListener("pointerdown", () => {
      if (!running || s.dataset.got) return;
      s.dataset.got = 1; s.remove();
      caught++; $("play-score").textContent = caught + (caught === 1 ? " star" : " stars");
    });
    field.appendChild(s);
    setTimeout(() => s.remove(), 2300);
  }, 550);

  setTimeout(() => {
    running = false; clearInterval(spawn);
    field.innerHTML = "";
    S.fun = clamp(S.fun + Math.min(34, caught * 4));
    S.stars += caught;
    S.energy = clamp(S.energy - 6);
    log("Played star catch: " + caught + " star" + (caught === 1 ? "" : "s") + ".");
    if (caught >= 5) jump();
    save(); render(); needBubble();
  }, 10000);
}

/* ---------- daily streak & care score ---------- */
function dailyBookkeeping() {
  const today = dayIndex(Date.now());
  if (S.lastVisitDay !== today) {
    if (S.lastVisitDay === today - 1) S.streak += 1;
    else S.streak = 1;
    S.lastVisitDay = today;
    log("Day " + S.streak + " in a row — welcome back.");
    if (S.food > 50 && S.energy > 50 && S.fun > 50 && S.clean > 50)
      S.care = Math.min(100, S.care + 1);
  }
  const worst = Math.min(S.food, S.energy, S.fun, S.clean);
  if (worst < 20) S.care = Math.max(0, S.care - 3);
  // unlock gifts
  const st = stage();
  if ((st === "child" || st === "adult") && S.care >= 80 && !S.unlocks.includes("bow")) {
    S.unlocks.push("bow"); log("Unlocked a little bow 🎀"); toast("🎁 Your creature got a little bow!");
  }
  if (st === "adult" && S.care >= 85 && !S.unlocks.includes("hat")) {
    S.unlocks.push("hat"); log("Unlocked a sun hat 👒"); toast("🎁 Your creature got a sun hat!");
  }
}

/* ---------- away summary ---------- */
function awaySummary(hours) {
  const dlg = $("away-dialog");
  const h = hours < 1 ? Math.round(hours * 60) + " minutes" :
            hours < 48 ? Math.round(hours) + " hours" : "days";
  const bits = [];
  if (S.asleep) bits.push("It slept through most of it.");
  else {
    if (S.food < 40) bits.push("It got hungry.");
    if (S.fun < 40) bits.push("It got bored.");
    if (S.poops.length) bits.push("It made " + S.poops.length + " mess" + (S.poops.length > 1 ? "es" : "") + ".");
  }
  if (!bits.length) bits.push("It kept itself busy and missed you.");
  $("away-text").innerHTML = "You were away for about <b>" + h + "</b>. " + bits.join(" ");
  dlg.showModal();
}

/* ---------- hatch & name ---------- */
function setupEgg() {
  const dlg = $("name-dialog");
  dlg.showModal();
  $("name-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($("name-input").value.trim() || "Momo");
    S.name = name;
    S.hatch = Date.now();
    dlg.close();
    jump();
    puff(HEART, -26, -50); puff(SPARK, 28, -60); puff(HEART, 0, -70);
    log(name + " hatched! Take good care of it.");
    toast("🎉 " + name + " hatched!");
    save(); render();
  });
}

/* ---------- wiring ---------- */
$("a-feed").addEventListener("click", () => {
  if (stage() === "egg") return;
  const p = $("foodpicker");
  p.hidden = !p.hidden;
});
document.querySelectorAll("#foodpicker button").forEach(b =>
  b.addEventListener("click", () => feed(b.dataset.food)));

$("a-play").addEventListener("click", play);
$("a-clean").addEventListener("click", cleanUp);
$("a-lights").addEventListener("click", toggleLights);
$("a-pet").addEventListener("click", pet);

// petting by tapping the creature too
el.creature.addEventListener("pointerdown", pet);

// periodic life
setInterval(() => {
  applyDecay(Date.now());
  save(); render();
}, 30000);
setInterval(needBubble, 18000);

/* ---------- boot ---------- */
const had = load();
if (had && S.name) {
  const away = applyDecay(Date.now());
  dailyBookkeeping();
  save(); render(); scheduleBlink(); renderLog();
  needBubble();
  if (away > 0.75) awaySummary(away);
} else {
  // brand new visitor: an egg waits
  render(); scheduleBlink(); renderLog();
  setupEgg();
}
})();
