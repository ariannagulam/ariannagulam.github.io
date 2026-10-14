/* LifeOS — тестова версія: задачі, календар тижня і котик Мурчик.
   Усі дані зберігаються лише на цьому пристрої (localStorage). */
(function () {
  'use strict';

  // ---------- storage ----------
  const KEY = 'lifeos.v1';
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---------- dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayISO = () => iso(new Date());
  const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d + n); return iso(x); };
  const WD = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const WD_LONG = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
  const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  function niceDate(s) {
    const t = todayISO();
    if (s === t) return 'сьогодні';
    if (s === addDays(t, 1)) return 'завтра';
    if (s === addDays(t, -1)) return 'вчора';
    const d = parse(s);
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  // ---------- config ----------
  const CATS = {
    study: { name: 'Навчання', tint: '#ECE8F3', ink: '#7F7896' },
    work: { name: 'Робота', tint: '#F1EBE0', ink: '#8A7A62' },
    docs: { name: 'Бюрократія', tint: '#F4E7E3', ink: '#9A7B72' },
    money: { name: 'Фінанси', tint: '#E8EFE4', ink: '#7E9575' },
    home: { name: 'Побут', tint: '#E8EFE4', ink: '#7E9575' },
    health: { name: 'Здоровʼя', tint: '#F4E7E3', ink: '#9A7B72' },
    personal: { name: 'Особисте', tint: '#ECE8F3', ink: '#7F7896' },
    projects: { name: 'Проєкти', tint: '#F1EBE0', ink: '#8A7A62' }
  };
  const PR = {
    1: { name: 'Критично', dot: '#D9A898' },
    2: { name: 'Важливо', dot: '#D9C39E' },
    3: { name: 'Звичайно', dot: '#B9C6B2' }
  };
  const COLORS = ['#DDBFA3', '#C9C3BE', '#E8D2BF', '#C6BFCF'];

  const ICON = {
    study: '<path d="M4 6.5C4 5.7 4.7 5 5.5 5H11v14H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 6.5c0-.8-.7-1.5-1.5-1.5H13v14h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
    work: '<rect x="3.5" y="7.5" width="17" height="11.5" rx="3.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>',
    docs: '<path d="M7 3.5h6.5L18 8v10.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/><path d="M13 3.5V8h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>',
    money: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.3c-.5-.8-1.4-1.3-2.5-1.3-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.9 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.5-1.3"/><path d="M12 6.5V8M12 16v1.5"/>',
    home: '<path d="M12 20V11"/><path d="M12 13c-3.5 0-6-2.3-6-6 3.5 0 6 2.3 6 6z"/><path d="M12 15c0-3.3 2.2-5.5 5.5-5.5 0 3.3-2.2 5.5-5.5 5.5z"/><path d="M8 20h8"/>',
    health: '<path d="M12 19.5C6 15.5 3.5 12.5 3.5 9 3.5 6.5 5.4 4.8 7.7 4.8c1.8 0 3.3 1 4.3 2.6 1-1.6 2.5-2.6 4.3-2.6 2.3 0 4.2 1.7 4.2 4.2 0 3.5-2.5 6.5-8.5 10.5z"/><path d="M7 11h2.5l1.2-2 2 4 1.3-2H17"/>',
    personal: '<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5"/><path d="M14.5 15c.6-.4 1.3-.6 2-.6 2 0 3.6 1.6 4 4.1"/>',
    projects: '<path d="M12 3.5c3.2 1.8 5 5 5 8.5l-2.5 3.5h-5L7 12c0-3.5 1.8-6.7 5-8.5z"/><circle cx="12" cy="10" r="1.6"/><path d="M9.5 15.5 8 19.5l2.5-1.2M14.5 15.5l1.5 4-2.5-1.2"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3"/>',
    list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.5" cy="7" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17" r="1"/>',
    cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="4"/><path d="M8.5 3.5v4M15.5 3.5v4M4 10.5h16"/>',
    paw: '<ellipse cx="12" cy="15.5" rx="4.5" ry="3.8"/><circle cx="6.5" cy="10.5" r="1.8"/><circle cx="17.5" cy="10.5" r="1.8"/><circle cx="9.5" cy="6.8" r="1.8"/><circle cx="14.5" cy="6.8" r="1.8"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5"/><path d="M14 10V6.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6 7-2.5 0-4-1.2-5.2-3L4 13.6a1.4 1.4 0 0 1 2.3-1.6L8 14"/>',
    ball: '<circle cx="12" cy="12" r="8"/><path d="M4.5 10 Q12 14 19.5 10"/><path d="M5.5 15.5 Q12 19 18.5 15.5"/>'
  };
  const svgIcon = (name, color, size) =>
    '<svg width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';

  // ---------- state ----------
  function seed() {
    const t = todayISO();
    const mk = (title, cat, pr, date, time) => ({ id: uid(), title, cat, pr, date, time: time || '', done: false, doneAt: '' });
    return {
      name: 'Аріанна',
      color: COLORS[0],
      pets: 0,
      catches: 0,
      doneTotal: 0,
      tasks: [
        mk('Відповісти університету', 'study', 1, t, '12:00'),
        mk('Оплатити рахунок за телефон', 'money', 2, t, ''),
        mk('Розібрати лист зі страхової', 'docs', 2, addDays(t, 2), ''),
        mk('Полити рослини', 'home', 3, t, '19:00'),
        mk('Купити продукти на тиждень', 'home', 3, addDays(t, 1), '')
      ]
    };
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  let state = load() || seed();
  let ui = { tab: 'today', filter: 'all', day: todayISO(), petting: false, playing: false, playTick: 0, bounce: false, editing: null };
  let timers = {};

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- mascot ----------
  function todayTasks() {
    const t = todayISO();
    return state.tasks.filter((x) => x.date && ((x.date === t) || (x.date < t && !x.done) || (x.done && x.doneAt === t && x.date <= t)));
  }
  function moodOf(list) {
    if (!list.length) return 'calm';
    const d = list.filter((x) => x.done).length;
    if (d === 0) return 'sleepy';
    const r = d / list.length;
    return r < 0.5 ? 'calm' : r < 1 ? 'happy' : 'joy';
  }
  function catSVG(color, face) {
    const body =
      '<ellipse cx="90" cy="161" rx="52" ry="7" fill="#E6DED3"/>' +
      '<path d="M146 136 C174 130 176 96 160 90 C151 87 147 95 153 99 C163 106 158 124 142 128" stroke="' + color + '" stroke-width="13" stroke-linecap="round" fill="none"/>' +
      '<path d="M42 74 L46 28 C47 21 53 19 57 23 L84 48 Z" fill="' + color + '" stroke="' + color + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M138 74 L134 28 C133 21 127 19 123 23 L96 48 Z" fill="' + color + '" stroke="' + color + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M50 58 L53 35 L70 49 Z" fill="#EBC3BA" stroke="#EBC3BA" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M130 58 L127 35 L110 49 Z" fill="#EBC3BA" stroke="#EBC3BA" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M90 40 C136 40 160 70 160 108 C160 144 130 158 90 158 C50 158 20 144 20 108 C20 70 44 40 90 40 Z" fill="' + color + '"/>' +
      '<ellipse cx="90" cy="128" rx="40" ry="24" fill="#FFFFFF" fill-opacity="0.35"/>' +
      '<path d="M84 48 Q86 55 84 61 M90 46 L90 60 M96 48 Q94 55 96 61" stroke="#6E5444" stroke-opacity="0.22" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="68" cy="154" rx="15" ry="8.5" fill="' + color + '"/><ellipse cx="112" cy="154" rx="15" ry="8.5" fill="' + color + '"/>' +
      '<path d="M63 150 L63 156 M68 149 L68 157 M73 150 L73 156 M107 150 L107 156 M112 149 L112 157 M117 150 L117 156" stroke="#6E5444" stroke-opacity="0.18" stroke-width="1.6" stroke-linecap="round"/>';
    const cheekOp = face === 'sleepy' ? 0.5 : face === 'pet' || face === 'joy' ? 1 : 0.8;
    const common =
      '<ellipse cx="57" cy="104" rx="11" ry="7" fill="#E5B5A9" fill-opacity="' + cheekOp + '"/><ellipse cx="123" cy="104" rx="11" ry="7" fill="#E5B5A9" fill-opacity="' + cheekOp + '"/>' +
      '<path d="M38 98 L20 94 M38 105 L20 107 M142 98 L160 94 M142 105 L160 107" stroke="#7A6A60" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M86 97 Q90 101.5 94 97 Q90 94.5 86 97 Z" fill="#C98F86"/>';
    const ink = '#5A524B';
    const faces = {
      sleepy: '<path d="M62 91 Q69 96 76 91" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M104 91 Q111 96 118 91" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="90" cy="110" rx="3" ry="3.5" fill="#8E7268"/><text x="136" y="44" font-size="16" font-weight="800" fill="#A49CB2" font-family="Nunito, sans-serif">z</text><text x="148" y="30" font-size="12" font-weight="800" fill="#B9B2C6" font-family="Nunito, sans-serif">z</text>',
      calm: '<circle cx="69" cy="90" r="5.5" fill="' + ink + '"/><circle cx="111" cy="90" r="5.5" fill="' + ink + '"/><circle cx="71" cy="88" r="1.6" fill="#fff"/><circle cx="113" cy="88" r="1.6" fill="#fff"/><path d="M82 104 Q86 109 90 104 Q94 109 98 104" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" fill="none"/>',
      happy: '<circle cx="69" cy="89" r="7.5" fill="' + ink + '"/><circle cx="111" cy="89" r="7.5" fill="' + ink + '"/><circle cx="72" cy="86" r="2.6" fill="#fff"/><circle cx="114" cy="86" r="2.6" fill="#fff"/><circle cx="67" cy="92" r="1.2" fill="#fff"/><circle cx="109" cy="92" r="1.2" fill="#fff"/><path d="M81 104 Q90 116 99 104" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" fill="none"/>',
      joy: '<path d="M62 93 Q69 83 76 93" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M104 93 Q111 83 118 93" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M80 103 Q90 119 100 103 Z" fill="#8E7268"/><path d="M85 111 Q90 115 95 111" fill="#E2A79A"/>',
      pet: '<path d="M62 93 Q69 83 76 93" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M104 93 Q111 83 118 93" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M82 104 Q86 109 90 104 Q94 109 98 104" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round" fill="none"/>'
    };
    return '<svg viewBox="0 0 180 170" aria-hidden="true">' + body + common + faces[face] + '</svg>';
  }
  const HEART = '<path d="M12 20 C5 15 2 11.5 2 7.5 C2 4.5 4.3 2.5 7 2.5 C9 2.5 10.8 3.7 12 5.5 C13.2 3.7 15 2.5 17 2.5 C19.7 2.5 22 4.5 22 7.5 C22 11.5 19 15 12 20 Z"/>';
  const SPARKS = '<svg class="fx spark" viewBox="0 0 180 170" style="inset:0;width:100%;height:100%" aria-hidden="true"><path d="M24 40 Q26 48 34 50 Q26 52 24 60 Q22 52 14 50 Q22 48 24 40 Z" fill="#E2CBA2"/><path d="M156 54 Q157 59 162 60 Q157 61 156 66 Q155 61 150 60 Q155 59 156 54 Z" fill="#C9BEDA"/></svg>';

  // ---------- render helpers ----------
  function checkSVG(done) {
    return done
      ? '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="#AFC0A6"/><path d="M9.5 15.5 L13.2 19 L20.5 11.5" stroke="#FBF8F3" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" fill="none" stroke="#CFC6BA" stroke-width="2.2"/></svg>';
  }
  function taskRow(t, opts) {
    const c = CATS[t.cat] || CATS.personal;
    const today = todayISO();
    const late = t.date && t.date < today && !t.done;
    const bits = [];
    if (opts && opts.showDate && t.date) bits.push(niceDate(t.date));
    if (t.time && !(opts && opts.noTime)) bits.push(t.time);
    bits.push(c.name);
    const meta = (late ? '<span class="late">прострочено · </span>' : '') + esc(bits.join(' · '));
    return (
      '<div class="task' + (t.done ? ' done' : '') + '">' +
        '<div class="ic" style="background:' + c.tint + '">' + svgIcon(t.cat, c.ink) + '</div>' +
        '<button class="txt" data-edit="' + t.id + '" aria-label="Змінити: ' + esc(t.title) + '">' +
          '<span class="t">' + esc(t.title) + '</span>' +
          '<span class="m"><span class="dot" style="background:' + PR[t.pr].dot + '" title="' + PR[t.pr].name + '"></span>' + meta + '</span>' +
        '</button>' +
        '<button class="check" data-toggle="' + t.id + '" aria-label="' + (t.done ? 'Позначити як невиконане: ' : 'Виконано: ') + esc(t.title) + '">' + checkSVG(t.done) + '</button>' +
      '</div>'
    );
  }
  const sortTasks = (a, b) => (a.done - b.done) || ((a.date || '9999').localeCompare(b.date || '9999')) || (a.pr - b.pr) || ((a.time || '99').localeCompare(b.time || '99'));
  const emptyCat = (text) =>
    '<div class="empty"><svg width="72" height="68" viewBox="0 0 180 170">' + catSVG(state.color, 'calm').replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</svg>' + text + '</div>';

  // ---------- screens ----------
  function screenToday() {
    const list = todayTasks().sort(sortTasks);
    const total = list.length;
    const done = list.filter((x) => x.done).length;
    const mood = moodOf(list);
    const face = ui.petting ? 'pet' : mood;
    const now = new Date();
    const hr = now.getHours();
    const hello = hr < 5 ? 'Доброї ночі' : hr < 12 ? 'Доброго ранку' : hr < 18 ? 'Доброго дня' : 'Доброго вечора';
    const bubbles = {
      sleepy: 'Ще рано… Почнемо з чогось маленького?',
      calm: total ? 'Гарний старт. Я поруч, не поспішай.' : 'На сьогодні справ немає. Додамо щось чи просто відпочинемо?',
      happy: 'Ого, вже більше половини! Пишаюся тобою.',
      joy: 'Усе зроблено! Тепер можна відпочити разом.'
    };
    const labels = { sleepy: 'сонний', calm: 'спокійний', happy: 'радісний', joy: 'щасливий', pet: 'мурчить' };
    let bubble = bubbles[mood];
    if (ui.petting) bubble = state.pets % 5 === 0 ? 'Мрр… ти найкраща.' : 'Мрр… як приємно. Ще трішки?';
    if (ui.playing) bubble = 'Піймав! Це вже ' + state.catches + '-й раз.';
    const cls = ui.playing ? (ui.playTick % 2 ? 'hop' : 'hop2') : ui.bounce ? 'hop' : ui.petting ? 'wiggle' : 'breathe';
    const pct = total ? Math.round(done / total * 100) : 0;
    const name = state.name ? ', ' + esc(state.name) : '';

    return (
      '<header class="head"><div><small>' + WD_LONG[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + '</small><h1>' + hello + name + '</h1></div></header>' +
      '<section class="pet-card" aria-label="Мурчик">' +
        '<div class="pet-row">' +
          '<div class="pet-stage">' +
            '<button class="pet-btn" data-act="pet" aria-label="Погладити Мурчика"><div class="pet-body ' + cls + '">' + catSVG(state.color, face) + '</div></button>' +
            (face === 'joy' || face === 'pet' ? SPARKS : '') +
            (ui.petting ? '<svg class="fx heart" width="22" height="20" viewBox="0 0 24 22" style="left:70px;top:8px" fill="#E3B3AA" aria-hidden="true">' + HEART + '</svg><svg class="fx heart" width="16" height="15" viewBox="0 0 24 22" style="left:38px;top:30px;animation-delay:.2s" fill="#D9C2DE" aria-hidden="true">' + HEART + '</svg><svg class="fx heart" width="18" height="16" viewBox="0 0 24 22" style="left:112px;top:22px;animation-delay:.4s" fill="#EBC9B9" aria-hidden="true">' + HEART + '</svg>' : '') +
            (ui.playing ? '<svg class="fx ball" width="30" height="30" viewBox="0 0 30 30" style="left:70px;top:20px" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="#E8C7A8"/><path d="M4 12 Q15 18 26 12" stroke="#D3A985" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M6 20 Q15 25 24 20" stroke="#D3A985" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' : '') +
          '</div>' +
          '<div style="min-width:0"><div class="bubble">' + bubble + '</div><span class="pet-name">Мурчик · ' + labels[face] + '</span></div>' +
        '</div>' +
        '<div><div class="progress-top"><span>Справи на сьогодні</span><span>' + done + ' з ' + total + '</span></div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Виконано за сьогодні"><i style="width:' + pct + '%"></i></div></div>' +
        '<div class="pet-actions">' +
          '<button class="pill rose" data-act="pet">' + svgIcon('hand', '#9E7A70', 20) + 'Погладити</button>' +
          '<button class="pill sage" data-act="play">' + svgIcon('ball', '#7E9575', 20) + 'Кинути мʼячик</button>' +
        '</div>' +
      '</section>' +
      '<div class="h2row"><h2>Сьогодні</h2><button class="linkish" data-act="add-today">+ Додати</button></div>' +
      '<div class="list">' + (list.length ? list.map((t) => taskRow(t)).join('') : emptyCat('Порожньо. Натисни «+», щоб додати першу справу.')) + '</div>'
    );
  }

  function screenTasks() {
    const t = todayISO();
    const tm = addDays(t, 1);
    const f = ui.filter;
    const all = state.tasks.filter((x) => f === 'all' || x.cat === f).sort(sortTasks);
    const groups = [
      ['Прострочені', all.filter((x) => !x.done && x.date && x.date < t)],
      ['Сьогодні', all.filter((x) => !x.done && x.date === t)],
      ['Завтра', all.filter((x) => !x.done && x.date === tm)],
      ['Пізніше', all.filter((x) => !x.done && x.date && x.date > tm)],
      ['Без дати', all.filter((x) => !x.done && !x.date)],
      ['Виконані', all.filter((x) => x.done)]
    ].filter((g) => g[1].length);
    const chips = ['all'].concat(Object.keys(CATS)).map((k) =>
      '<button class="chip" data-filter="' + k + '" aria-pressed="' + (f === k) + '">' + (k === 'all' ? 'Усі' : CATS[k].name) + '</button>').join('');
    return (
      '<header class="head"><div><small>Усі справи</small><h1>Задачі</h1></div></header>' +
      '<div class="scroller" style="margin-top:14px" role="group" aria-label="Фільтр за категорією">' + chips + '</div>' +
      (groups.length
        ? groups.map((g) => '<div class="group-title">' + g[0] + ' · ' + g[1].length + '</div><div class="list">' + g[1].map((x) => taskRow(x, { showDate: g[0] !== 'Сьогодні' })).join('') + '</div>').join('')
        : emptyCat('Тут поки порожньо.'))
    );
  }

  function screenCalendar() {
    const t = todayISO();
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(t, i));
    if (days.indexOf(ui.day) < 0) ui.day = t;
    const strip = days.map((d) => {
      const n = state.tasks.filter((x) => x.date === d && !x.done).length;
      const dt = parse(d);
      return '<button class="day" data-day="' + d + '" aria-pressed="' + (ui.day === d) + '" aria-label="' + WD_LONG[dt.getDay()] + ' ' + dt.getDate() + ', справ: ' + n + '"><small>' + WD[dt.getDay()] + '</small><b>' + dt.getDate() + '</b><span class="dots">' + '<i></i>'.repeat(Math.min(n, 3)) + '</span></button>';
    }).join('');
    const list = state.tasks.filter((x) => x.date === ui.day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.pr - b.pr);
    const dsel = parse(ui.day);
    return (
      '<header class="head"><div><small>Найближчі 7 днів</small><h1>Календар</h1></div></header>' +
      '<div class="days">' + strip + '</div>' +
      '<div class="h2row"><h2>' + WD_LONG[dsel.getDay()] + ', ' + dsel.getDate() + ' ' + MONTHS[dsel.getMonth()] + '</h2><button class="linkish" data-act="add-day">+ Додати</button></div>' +
      '<div class="list">' + (list.length
        ? list.map((x) => '<div style="display:flex;align-items:center;gap:4px"><span class="time-col">' + (x.time || '—') + '</span><div style="flex:1;min-width:0">' + taskRow(x) + '</div></div>').join('')
        : emptyCat('Вільний день. Мурчик радить відпочити.')) + '</div>'
    );
  }

  function screenMore() {
    const swatches = COLORS.map((c, i) => '<button class="swatch" data-color="' + c + '" aria-pressed="' + (state.color === c) + '" aria-label="Колір ' + ['рудий', 'сірий', 'кремовий', 'димчастий'][i] + '" style="background:' + c + '"></button>').join('');
    return (
      '<header class="head"><div><small>Котик і налаштування</small><h1>Мурчик</h1></div></header>' +
      '<div class="card"><h3>Статистика</h3><div class="stats">' +
        '<div class="stat"><b>' + state.doneTotal + '</b><span>справ зроблено</span></div>' +
        '<div class="stat"><b>' + state.pets + '</b><span>погладжувань</span></div>' +
        '<div class="stat"><b>' + state.catches + '</b><span>мʼячиків</span></div>' +
      '</div></div>' +
      '<div class="card"><h3>Колір Мурчика</h3><div class="swatches">' + swatches + '</div></div>' +
      '<div class="card"><h3><label for="nameIn">Як до тебе звертатися</label></h3><input id="nameIn" class="textfield" maxlength="30" value="' + esc(state.name) + '"></div>' +
      '<div class="card"><h3>Поставити на айфон як застосунок</h3><ol><li>Відкрий цю сторінку в Safari.</li><li>Натисни «Поділитися» (квадрат зі стрілкою).</li><li>Вибери «На початковий екран» → «Додати».</li></ol></div>' +
      '<div class="card"><h3>Що зʼявиться далі</h3>' +
        '<div class="soon">Пошта: важливі листи й чернетки відповідей<span class="tag">скоро</span></div>' +
        '<div class="soon">Скан документів і строки<span class="tag">скоро</span></div>' +
        '<div class="soon">Google Calendar і «час виходити»<span class="tag">скоро</span></div>' +
        '<div class="soon">Фінанси й бюджет<span class="tag">скоро</span></div>' +
      '</div>' +
      '<div class="card"><h3>Дані</h3><p style="margin-bottom:12px">Усе зберігається лише на цьому телефоні.</p><div class="btn-row"><button class="btn ghost" data-act="clear-done">Прибрати виконані</button><button class="btn ghost danger" data-act="reset">Почати з чистого аркуша</button></div></div>'
    );
  }

  // ---------- render ----------
  const app = document.getElementById('app');
  function render() {
    const s = { today: screenToday, tasks: screenTasks, calendar: screenCalendar, more: screenMore }[ui.tab];
    app.innerHTML = s();
    document.querySelectorAll('.tab').forEach((b) => {
      const on = b.dataset.tab === ui.tab;
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const nameIn = document.getElementById('nameIn');
    if (nameIn) nameIn.addEventListener('change', () => { state.name = nameIn.value.trim(); save(); toast('Збережено'); });
  }

  function renderTabbar() {
    const labels = { today: ['sun', 'Сьогодні'], tasks: ['list', 'Задачі'], calendar: ['cal', 'Календар'], more: ['paw', 'Мурчик'] };
    document.querySelectorAll('.tab').forEach((b) => {
      const [ic, label] = labels[b.dataset.tab];
      b.innerHTML = svgIcon(ic, 'currentColor', 24) + '<span>' + label + '</span>';
    });
    document.getElementById('addBtn').innerHTML = svgIcon('plus', '#FBF8F3', 26).replace('stroke-width="1.8"', 'stroke-width="2.4"');
  }

  // ---------- actions ----------
  function toggle(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? todayISO() : '';
    state.doneTotal = Math.max(0, state.doneTotal + (t.done ? 1 : -1));
    save();
    if (t.done) {
      ui.bounce = true;
      clearTimeout(timers.bounce);
      timers.bounce = setTimeout(() => { ui.bounce = false; if (ui.tab === 'today') render(); }, 1400);
      const list = todayTasks();
      if (list.length && list.every((x) => x.done)) toast('Усе на сьогодні зроблено. Мурчик щасливий!');
    }
    render();
  }
  function pet() {
    state.pets++;
    save();
    ui.petting = true;
    clearTimeout(timers.pet);
    timers.pet = setTimeout(() => { ui.petting = false; if (ui.tab === 'today') render(); }, 1600);
    render();
  }
  function play() {
    state.catches++;
    save();
    ui.playing = true;
    ui.playTick++;
    clearTimeout(timers.play);
    timers.play = setTimeout(() => { ui.playing = false; if (ui.tab === 'today') render(); }, 1500);
    render();
  }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
  }

  // ---------- sheet ----------
  const sheet = document.getElementById('sheet');
  const backdrop = document.getElementById('backdrop');
  const form = document.getElementById('taskForm');
  const fTitle = document.getElementById('fTitle');
  const fDate = document.getElementById('fDate');
  const fTime = document.getElementById('fTime');
  const fDelete = document.getElementById('fDelete');
  let draft = null;

  function paintSheet() {
    document.getElementById('fCats').innerHTML = Object.keys(CATS).map((k) =>
      '<button type="button" class="chip" data-cat="' + k + '" aria-pressed="' + (draft.cat === k) + '">' + svgIcon(k, CATS[k].ink, 18) + CATS[k].name + '</button>').join('');
    document.getElementById('fPr').innerHTML = [1, 2, 3].map((p) =>
      '<button type="button" data-pr="' + p + '" aria-pressed="' + (draft.pr === p) + '"><span class="dot" style="width:9px;height:9px;border-radius:5px;background:' + PR[p].dot + '"></span>' + PR[p].name + '</button>').join('');
    const t = todayISO();
    const q = [['Сьогодні', t], ['Завтра', addDays(t, 1)], ['Без дати', '']];
    document.getElementById('fQuick').innerHTML = q.map(([l, v]) =>
      '<button type="button" class="chip" data-quick="' + v + '" aria-pressed="' + (fDate.value === v) + '">' + l + '</button>').join('');
  }
  function openSheet(task, presetDate) {
    ui.editing = task ? task.id : null;
    draft = task ? { cat: task.cat, pr: task.pr } : { cat: 'personal', pr: 2 };
    fTitle.value = task ? task.title : '';
    fDate.value = task ? task.date : (presetDate !== undefined ? presetDate : todayISO());
    fTime.value = task ? task.time : '';
    fDelete.hidden = !task;
    document.getElementById('sheetTitle').textContent = task ? 'Змінити справу' : 'Нова справа';
    paintSheet();
    sheet.hidden = false;
    backdrop.hidden = false;
    setTimeout(() => { if (!task) fTitle.focus(); }, 60);
  }
  function closeSheet() { sheet.hidden = true; backdrop.hidden = true; ui.editing = null; }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = fTitle.value.trim();
    if (!title) return;
    if (ui.editing) {
      const t = state.tasks.find((x) => x.id === ui.editing);
      Object.assign(t, { title, cat: draft.cat, pr: draft.pr, date: fDate.value, time: fTime.value });
      toast('Зміни збережено');
    } else {
      state.tasks.push({ id: uid(), title, cat: draft.cat, pr: draft.pr, date: fDate.value, time: fTime.value, done: false, doneAt: '' });
      toast('Справу додано');
    }
    save();
    closeSheet();
    render();
  });
  sheet.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    const p = e.target.closest('[data-pr]');
    const q = e.target.closest('[data-quick]');
    if (c) { draft.cat = c.dataset.cat; paintSheet(); }
    if (p) { draft.pr = Number(p.dataset.pr); paintSheet(); }
    if (q) { fDate.value = q.dataset.quick; paintSheet(); }
  });
  fDate.addEventListener('change', paintSheet);
  document.getElementById('fCancel').addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);
  fDelete.addEventListener('click', () => {
    state.tasks = state.tasks.filter((x) => x.id !== ui.editing);
    save();
    closeSheet();
    render();
    toast('Справу видалено');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  // ---------- global clicks ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button');
    if (!el || sheet.contains(el)) return;
    if (el.dataset.tab) { ui.tab = el.dataset.tab; render(); window.scrollTo(0, 0); return; }
    if (el.id === 'addBtn') { openSheet(null, ui.tab === 'calendar' ? ui.day : (ui.tab === 'tasks' ? '' : todayISO())); return; }
    if (el.dataset.toggle) { toggle(el.dataset.toggle); return; }
    if (el.dataset.edit) { openSheet(state.tasks.find((x) => x.id === el.dataset.edit)); return; }
    if (el.dataset.filter) { ui.filter = el.dataset.filter; render(); return; }
    if (el.dataset.day) { ui.day = el.dataset.day; render(); return; }
    if (el.dataset.color) { state.color = el.dataset.color; save(); render(); return; }
    const a = el.dataset.act;
    if (a === 'pet') pet();
    else if (a === 'play') play();
    else if (a === 'add-today') openSheet(null, todayISO());
    else if (a === 'add-day') openSheet(null, ui.day);
    else if (a === 'clear-done') {
      const n = state.tasks.filter((x) => x.done).length;
      state.tasks = state.tasks.filter((x) => !x.done); save(); render(); toast('Прибрано: ' + n);
    } else if (a === 'reset') {
      if (confirm('Видалити всі справи й почати спочатку? Статистику Мурчика теж буде скинуто.')) {
        state = { name: state.name, color: state.color, pets: 0, catches: 0, doneTotal: 0, tasks: [] };
        save(); ui.tab = 'today'; render(); toast('Чистий аркуш');
      }
    }
  });

  // re-render when the day changes while app stays open
  let lastDay = todayISO();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && todayISO() !== lastDay) { lastDay = todayISO(); ui.day = lastDay; render(); }
  });

  renderTabbar();
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
