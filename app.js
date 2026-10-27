import { pick, weatherMood, describeWeather, MAX_SPINS, TYPES, MOODS, DEFAULT_MENU } from './picker.js';
import { loadWeather } from './weather.js';

const $ = (id) => document.getElementById(id);

// 메뉴판과 설정은 이 브라우저에만 저장한다 (서버, 로그인 없음).
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 못 해도 동작은 한다 */ }
  },
};

let menu = store.get('menu', DEFAULT_MENU);
let types = store.get('types', Object.keys(TYPES));
let cvsExtra = store.get('cvsExtra', '');
let mood = 'any';
let shown = []; // 이번에 이미 나온 메뉴 id
let rolling = false;

function renderTypes() {
  $('types').innerHTML = '';
  for (const [key, label] of Object.entries(TYPES)) {
    const el = document.createElement('label');
    el.innerHTML = `<input type="checkbox" value="${key}">${label}`;
    const box = el.querySelector('input');
    box.checked = types.includes(key);
    box.addEventListener('change', () => {
      types = Object.keys(TYPES).filter((k) => document.querySelector(`#types input[value="${k}"]`).checked);
      store.set('types', types);
    });
    $('types').append(el);
  }
}

function renderMenu() {
  $('menu').innerHTML = '';
  for (const item of menu) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="n"></span><span class="tag">${TYPES[item.type]} · ${MOODS[item.mood]}</span><button aria-label="삭제">×</button>`;
    li.querySelector('.n').textContent = item.name;
    li.querySelector('button').addEventListener('click', () => {
      menu = menu.filter((m) => m.id !== item.id);
      store.set('menu', menu);
      renderMenu();
    });
    $('menu').append(li);
  }
  $('menu-count').textContent = menu.length;
}

function renderSpinsLeft() {
  const left = MAX_SPINS - shown.length;
  if (shown.length === 0) $('spins-left').textContent = '';
  else if (left > 0) $('spins-left').textContent = `다시 돌리기 ${left}번 남았어요.`;
  else $('spins-left').textContent = '';
  $('spin').textContent = shown.length === 0 ? '골라줘' : '다시 돌리기';
  $('spin').disabled = left <= 0;
}

function showMessage(text) {
  $('result').innerHTML = `<div class="meta"></div>`;
  $('result').querySelector('.meta').textContent = text;
}

function showResult(item) {
  const isFinal = shown.length >= MAX_SPINS;
  $('result').innerHTML = `
    <div class="name"></div>
    <div class="meta">${TYPES[item.type]}</div>
    ${item.type === 'cvs' && cvsExtra ? '<div class="extra-note"></div>' : ''}
    ${isFinal ? '<div class="final">더 고민 금지. 이거 드세요!</div>' : ''}`;
  $('result').querySelector('.name').textContent = item.name;
  const note = $('result').querySelector('.extra-note');
  if (note) note.textContent = `${cvsExtra} 떨어졌으면 같이 사기`;
}

function spin() {
  if (rolling) return;
  if (types.length === 0) return showMessage('배달, 편의점, 집 중에 하나는 골라주세요.');
  const item = pick(menu, { types, mood, shown });
  if (!item) {
    return showMessage(shown.length
      ? '고른 종류에서 더 나올 메뉴가 없어요. 방금 나온 걸로 가요!'
      : '이 종류엔 메뉴가 없어요. 아래 메뉴판에서 추가해 주세요.');
  }
  shown.push(item.id);

  // 이름이 몇 번 바뀌다 멈추는 룰렛 연출
  rolling = true;
  $('spin').disabled = true;
  const pool = menu.filter((m) => types.includes(m.type));
  let ticks = 0;
  $('result').innerHTML = '<div class="name rolling"></div>';
  const timer = setInterval(() => {
    $('result').querySelector('.name').textContent = pool[ticks % pool.length].name;
    if (++ticks >= 12) {
      clearInterval(timer);
      rolling = false;
      showResult(item);
      renderSpinsLeft();
    }
  }, 70);
}

function setupForm() {
  for (const [k, v] of Object.entries(TYPES)) $('add-type').add(new Option(v, k));
  for (const [k, v] of Object.entries(MOODS)) $('add-mood').add(new Option(v, k));
  $('add-mood').value = 'any';

  $('add').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('add-name').value.trim();
    if (!name) return;
    menu = [...menu, { id: `u${Date.now()}`, name, type: $('add-type').value, mood: $('add-mood').value }];
    store.set('menu', menu);
    $('add-name').value = '';
    renderMenu();
  });

  $('cvs-extra').value = cvsExtra;
  $('cvs-extra').addEventListener('input', () => {
    cvsExtra = $('cvs-extra').value.trim();
    store.set('cvsExtra', cvsExtra);
  });

  $('reset-menu').addEventListener('click', () => {
    if (!confirm('지금 메뉴판을 지우고 기본 메뉴판으로 되돌릴까요?')) return;
    menu = DEFAULT_MENU;
    store.set('menu', menu);
    renderMenu();
  });
}

async function setupWeather() {
  const { weather, note } = await loadWeather();
  mood = weatherMood(weather);
  const desc = describeWeather(weather);
  const lean = { warm: '따뜻한 메뉴가 더 잘 나와요.', cool: '시원한 메뉴가 더 잘 나와요.', any: '날씨 상관없이 골라요.' }[mood];
  $('weather').textContent = [desc && `지금 ${desc}.`, weather && lean, note].filter(Boolean).join(' ');
}

renderTypes();
renderMenu();
setupForm();
renderSpinsLeft();
$('spin').addEventListener('click', spin);
setupWeather();
