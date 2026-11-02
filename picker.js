// 메뉴 고르기 규칙. 브라우저와 테스트(node)에서 같이 쓴다.

export const MAX_SPINS = 3; // 첫 결과 + 다시 돌리기 2번

export const TYPES = {
  delivery: '배달',
  cvs: '편의점',
  home: '집에서',
};

// 메뉴의 날씨 성향: warm(국물·따뜻한 것), cool(시원한 것), any(상관없음)
export const MOODS = {
  warm: '따뜻한 거',
  cool: '시원한 거',
  any: '상관없음',
};

// Open-Meteo 날씨 코드 중 비·눈·소나기
function isWet(code) {
  return (code >= 51 && code <= 67) || (code >= 71 && code <= 86) || code >= 95;
}

// 날씨를 보고 오늘 어울리는 성향을 정한다. 날씨를 모르면 'any'.
export function weatherMood(weather) {
  if (!weather) return 'any';
  const { temperature, weatherCode, precipitation } = weather;
  if (isWet(weatherCode) || precipitation > 0) return 'warm';
  if (temperature < 10) return 'warm';
  if (temperature >= 25) return 'cool';
  return 'any';
}

export function describeWeather(weather) {
  if (!weather) return null;
  const wet = isWet(weather.weatherCode) || weather.precipitation > 0;
  return `${Math.round(weather.temperature)}°C${wet ? ', 비/눈' : ''}`;
}

// 날씨에 맞는 메뉴는 3배, 상관없는 메뉴는 1배, 반대 성향은 0.5배로 뽑힌다.
export function weightFor(item, mood) {
  if (mood === 'any' || item.mood === 'any') return 1;
  return item.mood === mood ? 3 : 0.5;
}

// 고를 수 있는 후보: 선택한 종류이고, 이번에 이미 나온 메뉴는 뺀다.
export function candidates(menu, { types, shown = [] }) {
  return menu.filter((m) => types.includes(m.type) && !shown.includes(m.id));
}

// random은 0 이상 1 미만 숫자를 주는 함수 (테스트에서 고정값을 넣기 위해 받는다)
export function pick(menu, { types, mood = 'any', shown = [], random = Math.random }) {
  const pool = candidates(menu, { types, shown });
  if (pool.length === 0) return null;
  const weights = pool.map((m) => weightFor(m, mood));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// 메뉴 이름만 보고 종류와 날씨 성향을 짐작한다. 사용자가 고친 값이 우선이다.
const COOL_WORDS = ['냉면', '냉모밀', '밀면', '비빔면', '비빔국수', '모밀', '메밀', '소바', '물회', '콩국수', '샐러드', '빙수', '아이스', '샌드위치'];
const WARM_WORDS = ['국', '탕', '찌개', '전골', '라면', '짬뽕', '우동', '칼국수', '마라', '어묵', '수제비', '죽', '해장', '샤브'];
const NOT_WARM = ['탕수육', '비빔면'];
const CVS_WORDS = ['편의점', '삼각김밥', '도시락', '컵라면', '컵밥', '핫바', '롤케이크', '샌드위치'];
const HOME_WORDS = ['집', '라면', '짜파게티', '비빔면', '냉동', '햇반', '즉석'];

const has = (name, words) => words.some((w) => name.includes(w));

export function guessCategory(rawName) {
  const name = rawName.replace(/\s+/g, '');
  let mood = 'any';
  if (has(name, COOL_WORDS) || (name.includes('냉') && !name.includes('냉동'))) mood = 'cool';
  else if (has(name, WARM_WORDS) && !has(name, NOT_WARM)) mood = 'warm';

  let type = 'delivery';
  if (has(name, CVS_WORDS)) type = 'cvs';
  else if (has(name, HOME_WORDS)) type = 'home';
  return { type, mood };
}

const DEFAULT_NAMES = {
  delivery: ['국밥', '짬뽕', '냉면', '치킨', '돈까스', '김치찌개', '부대찌개', '마라탕', '쌀국수', '칼국수',
    '밀면', '떡볶이', '피자', '햄버거', '초밥', '제육덮밥', '짜장면', '족발', '탕수육', '우동'],
  cvs: ['삼각김밥 + 컵라면', '편의점 도시락', '샌드위치 + 롤케이크', '컵밥', '핫바 + 컵라면', '편의점 냉모밀'],
  home: ['라면', '짜파게티', '비빔면', '냉동만두'],
};

// 기본 메뉴판은 이름만 적고 종류·성향은 위 규칙으로 정한다.
export const DEFAULT_MENU = Object.entries(DEFAULT_NAMES).flatMap(([type, names]) =>
  names.map((name, i) => ({ id: `${type[0]}${i + 1}`, name, type, mood: guessCategory(name).mood }))
);
