/* Daily Three — three puzzles a day, same for everyone, state in localStorage. */
(() => {
"use strict";

const $ = (id) => document.getElementById(id);
const DAY0 = Date.UTC(2026, 0, 1); // puzzle #1 = 1 Jan 2026
const dayIndex = () => Math.floor((Date.now() - DAY0) / 864e5);
const KEY = "dailythree-v1";

/* seeded rng so everyone gets the same puzzle */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- riddle bank ---------- */
const RIDDLES = [
  ["What gets bigger the more you take away from it?", "hole"],
  ["What has keys but opens no locks?", "piano"],
  ["What runs but never walks, has a mouth but never talks?", "river"],
  ["Forward I am heavy, backward I am not. What am I?", "ton"],
  ["What can travel around the world while staying in a corner?", "stamp"],
  ["The more you have of it, the less you see. What is it?", "darkness", "dark"],
  ["What has a neck but no head?", "bottle"],
  ["What gets wet while it dries?", "towel"],
  ["What has one eye but cannot see?", "needle"],
  ["I speak without a mouth and hear without ears. I come alive with wind. What am I?", "echo"],
  ["What has many teeth but cannot bite?", "comb"],
  ["What goes up but never comes down?", "age", "your age"],
  ["What has a head and a tail but no body?", "coin"],
  ["What can you catch but never throw?", "cold"],
  ["What has hands but cannot clap?", "clock"],
  ["Some months have 31 days, some have 30. How many have 28?", "12", "twelve", "all of them"],
  ["A farmer has 17 sheep. All but 9 run away. How many are left?", "9", "nine"],
  ["Divide 30 by half, then add 10. What do you get?", "70", "seventy"],
  ["Two fathers and two sons each ate one egg, but only three eggs were eaten. How?", "3", "three", "3 people", "three people"],
  ["Lighter than a feather, yet the strongest cannot hold it for long. What is it?", "breath"],
  ["What invention lets you look right through a wall?", "window"],
  ["What five-letter word becomes shorter when you add two letters to it?", "short"],
  ["What belongs to you, but other people use it more than you do?", "name", "your name"],
  ["The one who makes it does not need it. The one who buys it never uses it. The one who uses it does not know it. What is it?", "coffin", "casket"],
  ["What word is spelled wrong in every dictionary?", "wrong"],
  ["I have cities but no houses, forests but no trees, water but no fish. What am I?", "map"],
  ["What can fill a room but takes up no space?", "light"],
  ["Drop me and I am sure to crack; smile at me and I will smile back. What am I?", "mirror"]
];

/* ---------- country bank: [name, alts, clues 1..5] ---------- */
const COUNTRIES = [
  ["Japan", [], ["Island nation off the eastern edge of Asia", "Capital: Tokyo", "White flag with a single red circle", "Mount Fuji and shinkansen bullet trains", "Sushi, sumo and cherry blossoms"]],
  ["Egypt", [], ["Northeast corner of Africa", "Capital: Cairo", "Red-white-black flag with a golden eagle", "The pyramids of Giza", "Arabic-speaking, home of the Nile"]],
  ["Brazil", [], ["The largest country in South America", "Capital: Brasília", "Green flag with a yellow diamond and a blue globe", "The Amazon rainforest and Christ the Redeemer", "Portuguese-speaking, famous for carnival"]],
  ["Iceland", [], ["Island in the North Atlantic, just south of the Arctic Circle", "Capital: Reykjavík", "Blue flag with a red-and-white cross", "Geysers, glaciers — and no mosquitoes", "Icelandic-speaking; sagas and hot springs"]],
  ["Kenya", [], ["East Africa, right on the equator", "Capital: Nairobi", "Black, red and green with a Maasai shield", "The Maasai Mara and the great wildebeest migration", "Swahili and English; world-class marathon runners"]],
  ["Canada", [], ["Second-largest country on Earth, north of its noisy neighbor", "Capital: Ottawa", "Red and white with a maple leaf", "Niagara Falls and ice hockey", "English and French; maple syrup capital of the world"]],
  ["Morocco", [], ["Northwest Africa, a short sea crossing from Spain", "Capital: Rabat", "Red flag with a green pentagram", "Marrakech medina and the Atlas mountains", "Tagine, mint tea and souks"]],
  ["Nepal", [], ["Wedged between two giants in the Himalayas", "Capital: Kathmandu", "The world's only non-rectangular national flag", "Eight of the ten highest peaks on Earth, Everest included", "Nepali-speaking; momos and prayer flags"]],
  ["Australia", [], ["A country that is also a continent", "Capital: Canberra", "Blue flag with the Union Jack and white stars", "Kangaroos, koalas and the Great Barrier Reef", "English-speaking; everything there wants to hurt you, allegedly"]],
  ["Peru", [], ["Pacific coast, heart of the old Inca empire", "Capital: Lima", "Red-white-red flag", "Machu Picchu and the Nazca lines", "Spanish and Quechua; ceviche and 4,000 potato varieties"]],
  ["Norway", [], ["Long Nordic country with a coastline full of fjords", "Capital: Oslo", "Red flag with a blue-and-white cross", "Northern lights and the midnight sun", "Norwegian-speaking; fjords and Viking ships"]],
  ["Argentina", [], ["Stretches from the subtropics almost to Antarctica", "Capital: Buenos Aires", "Light blue and white with a golden sun", "Tango, Patagonia and Tierra del Fuego", "Spanish-speaking; beef, mate and Maradona"]],
  ["Thailand", [], ["Southeast Asian kingdom, never colonized by Europe", "Capital: Bangkok", "Five horizontal stripes, red-white-blue-white-red", "Golden temples and floating markets", "Thai-speaking; pad thai and Songkran water fights"]],
  ["Greece", [], ["Balkan peninsula scattered with thousands of islands", "Capital: Athens", "Blue and white stripes", "The Parthenon — and democracy itself", "Greek-speaking; feta, olives and ouzo"]],
  ["Chile", [], ["A ribbon of land 4,300 km long but rarely 200 km wide", "Capital: Santiago", "White and red with a single star in a blue canton", "The Atacama, the driest desert on Earth", "Spanish-speaking; wine, copper and Easter Island statues"]],
  ["Portugal", [], ["Atlantic edge of the Iberian peninsula", "Capital: Lisbon", "Green and red with an armillary sphere", "Azulejo tiles and pastel de nata", "Portuguese-speaking; Vasco da Gama set sail from here"]],
  ["Vietnam", [], ["An S-shaped country along a long eastern coast", "Capital: Hanoi", "Red flag with a single yellow star", "Ha Long Bay's limestone towers", "Vietnamese-speaking; pho and street coffee"]],
  ["Switzerland", [], ["Landlocked, smack in the middle of the Alps", "Capital: Bern", "Red flag with a white cross — and it is square", "Banks, chocolate and pocket knives", "Four national languages; it stayed neutral through both world wars"]],
  ["New Zealand", ["nz"], ["Two main islands in the southwestern Pacific", "Capital: Wellington", "Blue with the Southern Cross and the Union Jack", "Kiwis, the haka and more sheep than people", "English and Māori; where The Lord of the Rings was filmed"]],
  ["Mexico", [], ["South of its giant northern neighbor", "Capital: Mexico City", "Green, white and red with an eagle on a cactus", "Maya pyramids and Chichén Itzá", "Spanish-speaking; tacos, mariachi and Day of the Dead"]],
  ["India", [], ["A subcontinent of 1.4 billion people", "Capital: New Delhi", "Saffron, white and green with a blue wheel", "The Taj Mahal", "Hindi and 20+ official languages; cricket and Bollywood"]],
  ["Senegal", [], ["Holds the westernmost point of mainland Africa", "Capital: Dakar", "Green, yellow and red with a green star", "Teranga hospitality and Laamb wrestling", "French and Wolof; thieboudienne is the national dish"]],
  ["Finland", [], ["Nordic country of 188,000 lakes", "Capital: Helsinki", "White with a blue Nordic cross", "Saunas — there are more of them than cars", "Finnish-speaking; officially the home of Santa Claus"]],
  ["Jamaica", [], ["Caribbean island, third largest of the Antilles", "Capital: Kingston", "Green, gold and black with a diagonal cross", "Reggae, Bob Marley and Usain Bolt", "English and Patois; jerk chicken and Blue Mountain coffee"]],
  ["Mongolia", [], ["Landlocked between Russia and China, one of the emptiest lands on Earth", "Capital: Ulaanbaatar", "Red and blue with the golden soyombo", "Genghis Khan's empire began here", "Mongolian-speaking; gers (yurts) and eagle hunters"]],
  ["Italy", [], ["A boot-shaped peninsula kicking the Mediterranean", "Capital: Rome", "Green, white and red", "The Colosseum and Venetian canals", "Italian-speaking; pizza, pasta and 60 UNESCO sites"]],
  ["South Africa", ["republic of south africa"], ["At the very tip of a continent, with three capital cities", "Executive capital: Pretoria", "Six colors, including a green horizontal Y", "Table Mountain and the Big Five", "Eleven official languages; the braai is sacred"]],
  ["Turkey", ["turkiye"], ["A country that sits on two continents at once", "Capital: Ankara", "Red with a white crescent and star", "Istanbul's Grand Bazaar and Cappadocia's balloons", "Turkish-speaking; kebabs and tea in tulip glasses"]],
  ["Madagascar", [], ["The fourth-largest island in the world, off Africa", "Capital: Antananarivo", "White, red and green", "Lemurs found nowhere else, and an avenue of baobabs", "Malagasy and French; most of the world's vanilla grows here"]],
  ["Colombia", [], ["Northwestern South America, the only one with both Caribbean and Pacific coasts", "Capital: Bogotá", "Yellow, blue and red — yellow takes the whole top half", "Coffee, emeralds and Gabriel García Márquez", "Spanish-speaking; cumbia and arepas"]]
];

/* ---------- state ---------- */
/* days: { "N": {L:stars, C:stars, G:stars} }  0 = unsolved */
function fresh() { return { days: {}, best: 0 }; }
let S;
function load() {
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch (e) { S = fresh(); }
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function today() {
  const d = dayIndex();
  if (!S.days[d]) S.days[d] = { L: 0, C: 0, G: 0 };
  return S.days[d];
}
function streak() {
  let n = 0, d = dayIndex();
  if (!(S.days[d] && S.days[d].L && S.days[d].C && S.days[d].G)) d--; // grace: today not finished yet
  while (S.days[d] && S.days[d].L && S.days[d].C && S.days[d].G) { n++; d--; }
  return n;
}
function totalStars() {
  return Object.values(S.days).reduce((s, d) => s + (d.L || 0) + (d.C || 0) + (d.G || 0), 0);
}

/* ---------- answer normalization ---------- */
function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
    .replace(/^(the|a|an) /, "").trim();
}

/* ---------- puzzle of the day ---------- */
const D = dayIndex();
const riddle = RIDDLES[D % RIDDLES.length];
const country = COUNTRIES[D % COUNTRIES.length];

function calcEval(a, o1, b, o2, c) {
  // standard precedence: * and / before + and -
  let x, y;
  const div = (p, q) => (q !== 0 && p % q === 0) ? p / q : null;
  if ((o2 === "*" || o2 === "/") && (o1 === "+" || o1 === "-")) {
    y = o2 === "*" ? b * c : div(b, c);
    if (y === null) return null;
    x = o1 === "+" ? a + y : a - y;
  } else {
    x = o1 === "+" ? a + b : o1 === "-" ? a - b : o1 === "*" ? a * b : div(a, b);
    if (x === null) return null;
    y = o2 === "+" ? x + c : o2 === "-" ? x - c : o2 === "*" ? x * c : div(x, c);
    if (y === null) return null;
  }
  return y;
}

function genCalc() {
  const rnd = mulberry32(D * 2654435761 + 7);
  const ops = ["+", "-", "×", "÷"];
  const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" };
  for (let i = 0; i < 500; i++) {
    const a = 2 + Math.floor(rnd() * 11), b = 2 + Math.floor(rnd() * 11), c = 2 + Math.floor(rnd() * 11);
    const o1 = ops[Math.floor(rnd() * 4)], o2 = ops[Math.floor(rnd() * 4)];
    const key = { "+": "+", "-": "-", "×": "*", "÷": "/" };
    const r = calcEval(a, key[o1], b, key[o2], c);
    if (r === null || r < 10 || r > 500) continue;
    let count = 0;
    for (const x of ops) for (const y of ops)
      if (calcEval(a, key[x], b, key[y], c) === r) count++;
    if (count === 1) return { a, b, c, o1: key[o1], o2: key[o2], target: r, sym };
  }
  return { a: 7, b: 4, c: 2, o1: "*", o2: "+", target: 30, sym }; // safe fallback
}
const calc = genCalc();

/* ---------- shared UI helpers ---------- */
let toastT;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600);
}
function stars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

/* ---------- riddle ---------- */
function renderLogic() {
  $("logic-q").textContent = "\u201C" + riddle[0] + "\u201D";
  if (today().L > 0) solveLogicUI(today().L);
  $("logic-go").addEventListener("click", () => {
    const v = norm($("logic-in").value);
    if (!v) return;
    const ok = riddle.slice(1).some(a => norm(a) === v);
    if (ok) {
      today().L = 5; save(); solveLogicUI(5); finish();
    } else {
      const el = $("logic-v");
      el.textContent = "Not it — try again."; el.className = "verdict no";
    }
  });
  $("logic-in").addEventListener("keydown", e => { if (e.key === "Enter") $("logic-go").click(); });
}
function solveLogicUI(st) {
  $("logic-in").disabled = true; $("logic-go").disabled = true;
  $("logic-in").value = "";
  const el = $("logic-v");
  el.textContent = "Solved — " + riddle.slice(1)[0] + " · " + stars(st);
  el.className = "verdict ok";
  $("p-logic").classList.add("done");
}

/* ---------- calculation ---------- */
let pick1 = null, pick2 = null;
function renderCalc() {
  $("calc-line").innerHTML = calc.a + " ⬤ " + calc.b + " ⬤ " + calc.c + " = <b>" + calc.target + "</b>";
  const mk = (row, idx) => {
    ["+", "−", "×", "÷"].forEach(s => {
      const b = document.createElement("button");
      b.className = "op"; b.textContent = s;
      b.addEventListener("click", () => {
        if (today().C > 0) return;
        [...row.children].forEach(x => x.classList.remove("sel"));
        b.classList.add("sel");
        if (idx === 1) pick1 = s; else pick2 = s;
      });
      row.appendChild(b);
    });
  };
  mk($("ops1"), 1); mk($("ops2"), 2);
  if (today().C > 0) solveCalcUI(today().C);
  $("calc-go").addEventListener("click", () => {
    if (!pick1 || !pick2) { toast("Pick both operators first."); return; }
    const key = { "+": "+", "−": "-", "×": "*", "÷": "/" };
    const r = calcEval(calc.a, key[pick1], calc.b, key[pick2], calc.c);
    if (r === calc.target) {
      today().C = 5; save(); solveCalcUI(5); finish();
    } else {
      const el = $("calc-v");
      el.textContent = r === null ? "That breaks the rules (no fractions allowed)." :
        "= " + r + " — not " + calc.target + ". Try another pair.";
      el.className = "verdict no";
    }
  });
  $("calc-share-hint").addEventListener("click", () => {
    const el = $("calc-v");
    el.textContent = "Hint: the first operator is \u201C" + calc.sym[calc.o1] + "\u201D — but the second is up to you.";
    el.className = "verdict hint";
    today().C = 0; // hint costs nothing but no stars discount needed; keep simple
  });
}
function solveCalcUI(st) {
  [...$("ops1").children, ...$("ops2").children].forEach(b => b.disabled = true);
  const key = { "+": "+", "−": "-", "×": "*", "÷": "/" };
  [...$("ops1").children].find(b => b.textContent === calc.sym[calc.o1])?.classList.add("sel");
  [...$("ops2").children].find(b => b.textContent === calc.sym[calc.o2])?.classList.add("sel");
  $("calc-go").disabled = true;
  const el = $("calc-v");
  el.textContent = calc.a + " " + calc.sym[calc.o1] + " " + calc.b + " " + calc.sym[calc.o2] + " " + calc.c + " = " + calc.target + " · " + stars(st);
  el.className = "verdict ok";
  $("p-calc").classList.add("done");
}

/* ---------- country ---------- */
let geoShown = 1;
function renderGeo() {
  const t = today();
  if (t.G > 0) { geoShown = 6; solveGeoUI(t.G); return; }
  drawClues();
  $("geo-go").addEventListener("click", () => {
    const v = norm($("geo-in").value);
    if (!v) return;
    const ok = norm(country[0]) === v || country[1].some(a => norm(a) === v);
    if (ok) {
      const st = 6 - geoShown;
      today().G = st; save(); solveGeoUI(st); finish();
    } else if (geoShown < 5) {
      geoShown++;
      drawClues();
      const el = $("geo-v");
      el.textContent = "No — here is another clue."; el.className = "verdict no";
    } else {
      const el = $("geo-v");
      el.textContent = "All five clues are out — one more guess, choose wisely."; el.className = "verdict no";
    }
  });
  $("geo-in").addEventListener("keydown", e => { if (e.key === "Enter") $("geo-go").click(); });
}
function drawClues() {
  $("geo-clues").innerHTML = country[2].slice(0, geoShown)
    .map((c, i) => `<li><span class="n">clue ${i + 1} —</span> ${c}</li>`).join("");
}
function solveGeoUI(st) {
  drawClues();
  $("geo-in").disabled = true; $("geo-go").disabled = true;
  const el = $("geo-v");
  el.textContent = "It was " + country[0] + " · " + stars(st);
  el.className = "verdict ok";
  $("p-geo").classList.add("done");
}

/* ---------- summary, streak, share ---------- */
function finish() {
  const t = today();
  const done = [t.L, t.C, t.G].filter(x => x > 0).length;
  if (done === 3) {
    const s = streak();
    if (s > S.best) { S.best = s; }
    toast("Perfect day! 🔥 " + s + (s === 1 ? " day" : " days") + " streak");
  }
  save(); paintSummary(); paintBadges();
}
function paintBadges() {
  $("b-streak").textContent = streak();
  $("b-stars").textContent = totalStars();
  $("b-best").textContent = S.best;
}
function paintSummary() {
  const t = today();
  const cell = x => x > 0 ? "🟩" : "⬜";
  $("grid").textContent = cell(t.L) + cell(t.C) + cell(t.G);
  const done = [t.L, t.C, t.G].filter(x => x > 0).length;
  $("sum-note").textContent = done === 0 ? "Nothing solved yet — the riddle is the easiest way in." :
    done === 3 ? "Perfect day. Come back tomorrow for a fresh three." :
    done + " of 3 solved today.";
}
function shareText() {
  const t = today();
  const cell = x => x > 0 ? "🟩" : "⬜";
  const dt = new Date();
  const date = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return "Daily Three #" + (D + 1) + " — " + date + "\n" +
    "🧠 " + cell(t.L) + " 🔢 " + cell(t.C) + " 🌍 " + cell(t.G) + "\n" +
    "★ " + totalStars() + " all-time · 🔥 " + streak() + "-day streak\n" +
    location.origin;
}

/* ---------- boot ---------- */
function boot() {
  load();
  const dt = new Date();
  $("date-line").textContent = dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    + " — puzzle #" + (D + 1);
  renderLogic(); renderCalc(); renderGeo();
  paintBadges(); paintSummary();
  const midnight = new Date(); midnight.setUTCHours(24, 0, 0, 0);
  const mins = Math.round((midnight - Date.now()) / 60000);
  $("next-puzzle").textContent = "Next three in " + Math.floor(mins / 60) + "h " + (mins % 60) + "m.";
  $("share").addEventListener("click", async () => {
    const txt = shareText();
    try { await navigator.clipboard.writeText(txt); toast("Copied — go brag."); }
    catch (e) { toast(txt); }
  });
}
boot();
})();
